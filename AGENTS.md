# AGENTS.md

## Purpose

GameOn is a sports-game discovery and participation app. Agents may modify the web app, REST API, database migrations, and MCP transport.

## Source of truth

- REST: `/api/v1`
- OpenAPI: `GET /api/v1/openapi`
- MCP: `/mcp`
- Agent guidance: `/llms.txt`
- API docs: `docs/API.md`
- Database: `supabase/migrations/`

Read OpenAPI before changing or consuming the API. Do not guess fields.

## Architecture

- Next.js App Router frontend/API.
- Supabase Auth for identity.
- Supabase/Postgres + RLS for persistence/authorization.
- Database functions own concurrency-sensitive game invariants.
- `lib/api/v1/` contains API auth, validation, errors, security, types, and game services.
- `lib/api/v1/client.ts` is the browser REST client.
- `app/mcp/route.ts` exposes MCP tools by delegating to REST.
- Do not duplicate business rules across frontend, REST, and MCP.

## REST

Base: `https://gameonsite.com/api/v1`

Public:
- `GET /games` — discover public upcoming games.
- `GET /games/:id` — game detail.
- `GET /games/:id/participants` — visible roster.

Authenticated:
- `GET /me` — current identity.
- `GET /me/games` — user's games.
- `POST /games` — create.
- `PATCH /games/:id` — update hosted game.
- `DELETE /games/:id` — cancel.
- `POST /games/:id/join` — join/request.
- `DELETE /games/:id/join` — leave/withdraw.
- `GET /games/:id/join-requests` — host requests.
- `POST /games/:id/join-requests/:requestId/approve`
- `POST /games/:id/join-requests/:requestId/reject`

Auth: `Authorization: Bearer <Supabase access token>`. Never put credentials in URLs.

## Agent workflow

1. Read `/api/v1/openapi`.
2. Call `GET /me` before user-specific actions.
3. Discover with `GET /games`; use `lat/lng/radiusKm` for location search.
4. Use `GET /me/games` for the user's games.
5. Confirm `GET /games/:id` before consequential actions when intent is ambiguous.
6. Send `Idempotency-Key` on POST/PATCH mutations.
7. Follow `pagination.nextCursor` until `hasMore=false`.
8. Branch on stable `error.code`, not error messages.
9. Respect HTTP 429 and `Retry-After`.
10. Never invent games, availability, participants, or identity.

## Mutation safety

Treat cancellation, leaving, and rejection as consequential/destructive. Do not perform them from ambiguous instructions.

Idempotency keys expire after 24 hours. Same key + same body replays the result; same key + different body returns `409 IDEMPOTENCY_CONFLICT`.

## Security invariants

- RLS is part of authorization.
- Service-role/secret credentials are server-only.
- Private games never appear in public discovery.
- Share tokens and host contact details are not public data.
- Never bypass API authorization with protected-table browser queries.
- Preserve database-level capacity/concurrency protections.
- Validate all external input at the API boundary.
- Never log access tokens, share tokens, contact values, or other secrets.

## Frontend

- Use `lib/api/v1/client.ts` for game API calls.
- Do not add direct browser writes to game/participant/join-request tables.
- Preserve anonymous discovery.
- Preserve fill-your-spot, private games, auto-approval, waitlist, and join-request semantics.
- Keep UI state derived from API responses where possible.

## MCP

`/mcp` is a stateless Streamable HTTP MCP transport backed by the same REST API.

Supported protocol versions:
- `2026-07-28`
- `2025-11-25`

Do not implement separate business logic in MCP.

## Database changes

1. Prefer existing database functions/RLS over duplicated TypeScript invariants.
2. Add migrations under `supabase/migrations/`.
3. Make concurrency-sensitive operations atomic.
4. Regenerate Supabase database types after schema changes.
5. Review grants for every new security-definer function.
6. Never weaken RLS to make a feature work.

## Testing

Before merging:

```bash
npm test
npm run lint
npm run build
supabase test db
```

For API changes test auth, private visibility, idempotency, rate limits, concurrent joins/capacity, pagination, RLS/security-definer permissions, and MCP calls.

If tests cannot run, say so explicitly. Never claim they passed.

## Change discipline

- Keep changes focused and production-oriented.
- Prefer small atomic commits.
- Update OpenAPI, `docs/API.md`, and `llms.txt` when the public API changes.
- Preserve backward compatibility unless a breaking change is explicitly requested.
- Never commit secrets, tokens, credentials, or local generated state.

<!-- BEGIN:nextjs-agent-rules -->
## Next.js

This repository may use a newer Next.js version than your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code, and heed deprecation notices.
<!-- END:nextjs-agent-rules -->
