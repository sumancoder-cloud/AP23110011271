# Stage 1

Define a small REST contract for notifications with predictable resource names.

Suggested endpoints:

- `GET /notifications?unread=true`
- `PATCH /notifications/:id/read`
- `POST /notifications`
- `GET /notifications/stream`

Suggested payloads:

```json
{
  "type": "Placement",
  "message": "CSX Corporation hiring",
  "recipientId": "student_1042",
  "priority": 3,
  "createdAt": "2026-04-22T17:51:18Z"
}
```

Real-time delivery can be handled with Server-Sent Events or WebSockets depending on whether the application needs one-way updates or full duplex interaction.

# Stage 2

Use PostgreSQL for relational integrity if the data is already modeled with students, notifications, and delivery receipts. A normalized schema keeps query logic simple and preserves foreign-key constraints.

Core tables:

- `students(id, roll_no, email, name, ...)`
- `notifications(id, recipient_id, type, message, is_read, created_at, priority, ...)`
- `notification_deliveries(id, notification_id, channel, status, sent_at, retry_count, ...)`

Example SQL:

```sql
SELECT id, recipient_id, type, message, created_at
FROM notifications
WHERE recipient_id = $1 AND is_read = false
ORDER BY created_at DESC;
```

If traffic grows, indexing should be selective, not blanket-based. Index columns that appear in filters, joins, and ordering together, such as `(recipient_id, is_read, created_at DESC)`.

# Stage 3

The slow query needs support from a composite index because it filters on `studentID` and `isRead` and then sorts by `createdAt DESC`.

Recommended index:

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications (studentID, isRead, createdAt DESC);
```

Why the original query is slow:

- It scans many rows if the table is large.
- Sorting after filtering costs more without an index that matches the order.
- Selecting `*` increases row width and network cost.

Adding indexes on every column is not effective because each insert and update becomes slower, storage grows, and the planner may not use the indexes that do not match real access patterns.

Query for placement notifications in the last 7 days:

```sql
SELECT id, studentID, notificationType, message, createdAt
FROM notifications
WHERE notificationType = 'Placement'
  AND createdAt >= NOW() - INTERVAL '7 days'
ORDER BY createdAt DESC;
```

# Stage 4

Fetching notifications on every page load does not scale well. A better design is a hybrid approach:

- Serve the first page from the database with pagination.
- Cache unread counts and recent notifications in Redis.
- Use push updates for new notifications so the UI stays live without polling aggressively.

Tradeoffs:

- Database-only reads are simple but expensive at scale.
- Redis improves latency but adds cache invalidation work.
- WebSockets or SSE improve UX but need connection management.

# Stage 5

The pseudocode is not reliable because it does three expensive operations in a tight loop and has no retry or failure isolation:

- email send
- database insert
- app push

These should not all be coupled in one synchronous flow. The better pattern is:

1. Persist the notification once.
2. Publish an event or enqueue a job.
3. Deliver email and app push asynchronously with retries.
4. Track delivery status separately.

Revised approach:

```text
function notify_all(student_ids, message):
  save notification batch
  enqueue one job per student
  workers send email and push independently
  retry failures with backoff
  record final delivery state
```

# Stage 6

For a priority inbox, keep the top `n` unread notifications in a min-heap keyed by score.

Score formula:

- Placement: 3
- Result: 2
- Event: 1
- Recency bonus: based on timestamp

As new notifications arrive, compute the score and compare it with the heap root. If the heap is full and the new score is higher, replace the smallest entry. That keeps insertion efficient and avoids sorting the full dataset repeatedly.

Complexity:

- Insert/update: `O(log n)`
- Retrieve top `n`: `O(n log n)` if needed in sorted order
