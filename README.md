# AP23110011271

Backend submission for the campus hiring evaluation.

## Stack

- Node.js
- Express
- JavaScript
- MongoDB

## Structure

- `src/` application server
- `src/logger/` reusable logging client
- `src/middleware/` request logging middleware
- `src/services/` evaluation API and scheduling services
- `logging_middleware/` assignment deliverable folder
- `vehicle_maintenance_scheduler/` assignment deliverable folder
- `notification_app_be/` assignment deliverable folder

## Run

1. Copy `.env.example` to `.env`.
2. Set `EVALUATION_BEARER_TOKEN` to your bearer token.
3. Run `npm install`.
4. Start with `npm start`.
5. Open `GET /api/vehicle-schedule` to verify the protected API integration.
