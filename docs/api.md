# REST API

Base URL: `/api`

Authentication: Bearer JWT in `Authorization` header for protected endpoints.

## Auth

### POST /auth/register

Body:
- `username`: string
- `password`: string

Response:
- `token`: JWT
- `user`: `{ id, username }`

### POST /auth/login

Body:
- `username`: string
- `password`: string

Response:
- `token`
- `user`

## Profile

### GET /profile/me

Auth required.

Response:
- `id`, `username`, `level`, `xp`, `elo`, `rank`, `stats`, `currency`, `cosmeticsOwned`, `loadout`

### GET /profile/:id

Auth required.

Response:
- Public profile subset.

## Leaderboard

### GET /leaderboard/ranked

Top ranked players.

### GET /leaderboard/casual

Casual stats ranking by kills.

## Matchmaking

### POST /matchmaking/queue

Auth required.

Body:
- `queueType`: `"casual" | "ranked" | "training" | "private"`
- `mode`: `"tdm" | "ffa" | "domination" | "training" | "range"`
- `partyId`: string | null

Response:
- Queue entry info.

### POST /matchmaking/leave

Leave all queues.

## Store

### GET /store/catalog

Returns cosmetics and battle pass.

### POST /store/purchase

Auth required.

Body:
- `cosmeticId`

## Admin

Requires `x-admin-key` header matching `ADMIN_API_KEY`.

### GET /admin/players
### POST /admin/ban/:id
### POST /admin/unban/:id
### POST /admin/reset-ranks
### GET /admin/logs

## Stats

### GET /stats/history

Auth required. Returns match history for authenticated player.
