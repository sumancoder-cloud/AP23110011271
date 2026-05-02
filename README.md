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

## Artifact generation

Run `node scripts/generateArtifacts.js` after setting either `EVALUATION_BEARER_TOKEN` or the auth credentials (`AUTH_EMAIL`, `AUTH_NAME`, `AUTH_ROLL_NO`, `AUTH_ACCESS_CODE`, `AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET`) to create JSON output files in `artifacts/`.

## Submission note

This workspace can build the protected-API flow and the artifact generator, but the external evaluation host is not reachable from the current sandbox, so live screenshots must be generated from your machine after the token-based endpoints respond there.
