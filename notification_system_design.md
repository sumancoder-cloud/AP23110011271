# Stage 1

Define the notification contract with stable resource names and predictable JSON.

Endpoints:

- `GET /notifications?unread=true`
- `POST /notifications`
- `PATCH /notifications/:id/read`
- `GET /notifications/stream`

Request example:

```json
{
  "type": "Placement",
  "message": "CSX Corporation hiring",
  "recipientId": "student_1042",
  "priority": 3,
  "createdAt": "2026-04-22T17:51:18Z"
}
```

Use Server-Sent Events for simple one-way updates, or WebSockets if the client also needs interactive acknowledgements.

# Stage 2

PostgreSQL is the safer choice here because the model is relational: students have many notifications, notifications have many delivery events, and those relations benefit from foreign keys and indexed joins.

Tables:

- `students(id, roll_no, email, name)`
- `notifications(id, recipient_id, type, message, is_read, priority, created_at)`
- `notification_deliveries(id, notification_id, channel, status, sent_at, retry_count)`

Query example:

```sql
SELECT id, recipient_id, type, message, created_at
FROM notifications
WHERE recipient_id = $1
  AND is_read = false
ORDER BY created_at DESC;
```

The useful index is a composite one that matches the filter and sort order:

```sql
CREATE INDEX idx_notifications_recipient_read_created
ON notifications (recipient_id, is_read, created_at DESC);
```

# Stage 3

The original query is slow because it filters and sorts large ranges without a supporting index.

Original query:

```sql
SELECT *
FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

Why it is slow:

- It can scan many rows before finding the target student.
- The `ORDER BY` needs extra work if the index does not match the sort.
- `SELECT *` reads columns that are not needed for the API response.

Better version:

```sql
SELECT id, studentID, notificationType, message, createdAt
FROM notifications
WHERE studentID = 1042
  AND isRead = false
ORDER BY createdAt DESC;
```

Recommended index:

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications (studentID, isRead, createdAt DESC);
```

For placement notifications in the last 7 days:

```sql
SELECT id, studentID, notificationType, message, createdAt
FROM notifications
WHERE notificationType = 'Placement'
  AND createdAt >= NOW() - INTERVAL '7 days'
ORDER BY createdAt DESC;
```

Adding indexes on every column is not a good strategy because each insert/update becomes more expensive and many indexes will never be used.

# Stage 4

Fetching notifications on every page load does not scale. A better design is:

- page the list from the database
- cache unread counts in Redis
- push new notifications with SSE or WebSockets

Tradeoffs:

- Database-only reads are simple, but the cost grows quickly.
- Redis lowers latency, but cache invalidation must be handled carefully.
- Push delivery improves UX, but persistent connections need lifecycle management.

# Stage 5

The given pseudocode is not reliable because it does email, database, and push work in one synchronous loop.

Problems:

- one failure can slow or break the rest of the batch
- retries are hard
- partial progress is not tracked cleanly

Better flow:

1. store the notification batch once
2. queue a job per student
3. let workers send email and app push independently
4. retry failures with backoff
5. store delivery status per channel

Pseudo-implementation:

```text
function notify_all(student_ids, message):
  save notification batch
  for each student_id:
    enqueue delivery job
  workers process jobs asynchronously
  each worker retries failures and records status
```

# Stage 6

For the priority inbox, keep the top `n` unread notifications in a min-heap.

Priority order:

- Placement: highest
- Result: medium
- Event: lowest

Recency can be added as a secondary score so newer notifications of the same type rank higher.

Approach:

- compute a numeric score for each notification
- insert into a min-heap of size `n`
- if the heap is full and the new item scores higher than the root, replace the root

Complexity:

- insert: `O(log n)`
- maintain top `n`: `O(log n)` per incoming notification
- final ordering for display: `O(n log n)` if needed
