# GameOn API v1

Base URL: https://gameonsite.com/api/v1

OpenAPI: GET /api/v1/openapi

## Authentication
Mutating endpoints require a Supabase Auth access token:
Authorization: Bearer <access-token>

The authentication boundary is isolated from game services so a future OAuth/API-key/agent credential can be added without changing resource semantics.

## Endpoints
- GET /games — discover public games
- GET /me/games — list games related to the authenticated user
- POST /games — create a game
- GET /games/:id — get a game
- PATCH /games/:id — update a hosted game
- DELETE /games/:id — cancel a hosted game
- POST /games/:id/join — join/request to join
- DELETE /games/:id/join — leave
- GET /games/:id/participants — visible roster
- GET /games/:id/join-requests — host-only requests
- POST /games/:id/join-requests/:requestId/approve
- POST /games/:id/join-requests/:requestId/reject

## Discovery
GET /games supports sport, skill, from, to, lat, lng, radiusKm, limit, and cursor.
Results use cursor pagination and are capped at 100 items per page.

## Reliability
Mutating POST operations accept Idempotency-Key. Keys expire after 24 hours. Reusing a key with the same request body returns the original response; reusing it with a different body returns 409 IDEMPOTENCY_CONFLICT. A failed operation releases its key so the client can retry safely.

## Errors
Every error includes a stable error.code and requestId. Clients should branch on error.code, not error.message.

## Security
The API does not expose share tokens or host contact information in normal public game responses. Private games are excluded from discovery. Capacity and membership transitions remain enforced by database functions/RLS.

## Agent compatibility
Agents should discover capabilities from OpenAPI, search with GET /games, inspect user-owned/current games with GET /me/games, confirm with GET /games/:id, and perform writes with Idempotency-Key.
