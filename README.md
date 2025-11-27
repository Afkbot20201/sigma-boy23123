# Arena Nemesis

Arena Nemesis is a file-backed, Render-ready, online multiplayer shooter built with:

- **Phaser 3** game client
- **Node.js + Express + Socket.IO** backend
- **lowdb (JSON file)** persistence
- Pure **file-based storage**, compatible with Render free tier ephemeral disks.

> This repo is designed to be dropped into GitHub and deployed to Render free tier as-is.

---

## Features

- JWT-based auth with bcrypt password hashing
- File-based profiles with stats, ELO, rank tiers (Bronze → Nemesis)
- Casual and Ranked queues
- Private lobbies
- Team Deathmatch core loop (plus hooks for FFA / Domination)
- AI bots in training/range modes
- Server-authoritative movement and shooting
- Simple lag compensation and client-side interpolation
- Anti-cheat heuristics:
  - Packet rate limiting
  - Speed-hack detection
  - Aimbot statistical suspicion
- Admin panel REST API for bans, rank reset and server logs
- In-game economy:
  - XP, leveling
  - Currency rewards
  - Local cosmetic store and battle pass data

The code is intentionally compact enough to run comfortably on a Render free instance while still showing full-stack patterns.

---

## Folder Structure

- `server/`
  - `index.js` – Express + Socket.IO entry point
  - `config.js` – configuration and rank tiers
  - `auth.js` – registration, login, JWT helpers
  - `persistence.js` – lowdb init, safe writes, corruption recovery
  - `elo.js` – ELO / rank tier math
  - `antiCheat.js` – speed + aimbot + packet heuristics
  - `matchmaking.js` – queues and private lobbies
  - `gameServer.js` – match loop, tick, scoring, XP, ELO updates
  - `ai.js` – simple bot behaviors
  - `routes/` – REST endpoints
  - `sockets/` – WebSocket wiring
  - `data/db.json` – JSON storage (created on first run or by seed)
- `client/`
  - `index.html`, `src/` – Phaser 3 client, UI, HUD and netcode
- `docs/`
  - `api.md` – REST documentation
  - `websocket-events.md` – realtime protocol
  - `data-schema.md` – persistent schema
- `seed/seed.js` – bootstraps JSON data
- `render.yaml` – Render service definition
- `Dockerfile` – container build

---

## Local Setup

Requirements:

- Node 18+
- npm

```bash
git clone <this-repo>
cd arena-nemesis
npm install
npm run seed
npm start
```

Then open `http://localhost:3000` in your browser.

Environment variables:

See `.env.example` for the full list:

- `PORT` – default 3000
- `JWT_SECRET` – secret for signing tokens
- `ADMIN_API_KEY` – admin REST access key
- `SESSION_TICK_RATE` – server tick rate (20 recommended)
- `DATA_DIR` – where the JSON database is stored

You can use `NODE_ENV=development` to keep things verbose.

---

## Render Deployment

1. Push this repository to GitHub.
2. Create a new **Web Service** on Render, connect it to the repo.
3. Render will automatically read `render.yaml` which sets:
   - `buildCommand: "npm install && npm run seed"`
   - `startCommand: "npm start"`
4. Make sure you keep the free tier plan.
5. Render uses an **ephemeral disk**:
   - `server/data/db.json` lives on that disk.
   - After restart the file may be gone.
   - On each cold start `persistence.js` re-creates defaults if the JSON is missing or corrupt.
   - `seed/seed.js` also provides initial cosmetics, battle pass, and a baseline meta block.

Because disk is ephemeral, long-term persistence is not guaranteed. The system is safe to restart and will always recover a valid JSON file.

---

## Matchmaking Logic

Matchmaking queues are kept in memory:

- Queues:
  - `casual`
  - `ranked`
  - `training`
  - `private`
- Every tick (`matchmakingTick` from `matchmaking.js`) the server:
  1. Sorts queued players by `joinedAt`.
  2. Batches them into matches of size up to `MAX_PLAYERS_PER_MATCH`.
  3. For ranked queues, players are sorted by ELO before splitting into teams, ensuring similar MMR on both sides.
  4. Creates a `MatchInstance` via `GameServer.createMatch`.

Private lobbies are stored as early `matches[]` records with `isPrivateLobby = true`. Lobby codes are six-character IDs.

Live queue status is delivered to the client via WebSocket events (and the REST `queue` endpoints).

---

## Ranking System Math

ELO implementation (`elo.js`):

- Expected score:

  ```js
  expectedScore(ratingA, ratingB) {
    return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
  }
  ```

- Update:

  ```js
  updateElo(rating, expected, score, k = 32) {
    return Math.round(rating + k * (score - expected));
  }
  ```

- Rank tiers (`config.js`):

  ```js
  [
    { name: "Bronze", min: 0 },
    { name: "Silver", min: 800 },
    { name: "Gold", min: 1200 },
    { name: "Platinum", min: 1600 },
    { name: "Diamond", min: 2000 },
    { name: "Nemesis", min: 2400 }
  ];
  ```

On match end:

- Determine winner (team A, team B or draw).
- For each player:
  - Calculate `score` (1 / 0 / 0.5).
  - Update ELO using fixed K-factor.
  - Map new ELO to rank tier.
  - Update `wins`, `losses`, `kills`, `deaths`, `shotsFired`, `shotsHit`, `timePlayedSeconds`.
  - Add XP and perform level-up logic.

---

## AI System

AI bots are implemented in `ai.js` and integrated in `gameServer.js`:

- Each bot has:
  - `position`, `velocity`, `hp`
  - `difficulty`: `"easy" | "normal" | "hard"`
- Behavior loop (`botThink`):
  - Runs every server tick.
  - Selects the closest live human player as target.
  - Moves toward that player (different speeds for difficulty levels).
  - Has a difficulty-dependent chance to fire at the target.
- Bots use exactly the same damage rules and hit processing as human players (server-side only).

Bots are automatically added for:

- Training mode
- Practice range
- Undersized matches where minimum players are not met

---

## Anti-Cheat System

Anti-cheat heuristics live in `antiCheat.js`:

- **Packet-rate detection**:
  - Counts packets per player per second.
  - If packets exceed `MAX_PACKET_PER_SECOND`, flags a `packet_flood` suspicion.
- **Speed-hack detection**:
  - For each movement input, calculates `speedRatio = actualSpeed / maxSpeed`.
  - If `speedRatio > SPEED_HACK_THRESHOLD`, logs a `speed_hack` suspicion.
- **Aimbot suspicion**:
  - Tracks last 100 shots (`hit`, `headshot` flags).
  - If overall hit rate or headshot rate surpass a configured threshold, logs an `aimbot_suspect` event.

All cheat flags are pushed into `logs` via `logEvent` to be inspected from the admin panel endpoints (`/api/admin/logs`). Punishment is left to admin policy, but can easily be automated.

---

## Data Persistence and Recovery

`persistence.js` handles the JSON file lifecycle:

- Ensures `DATA_DIR` exists.
- On first run (or missing file), creates default structure with:
  - `meta`, `store`, `battlePass`, empty arrays.
- On load error (e.g., corrupted JSON):
  - Renames existing file to `db_corrupt_<timestamp>.json`.
  - Creates a fresh default file.
- `saveSafe(db)`:
  - Writes to `db.json.tmp` first.
  - Renames tmp → `db.json` only after successful write, preventing partial corruption.

This pattern is friendly to Render’s ephemeral filesystem while still being robust under crash scenarios.

---

## Security

- Passwords are never stored in plaintext (bcrypt hash with salt).
- JWT-based stateless sessions, 12-hour expiration.
- All state changes (movement, shooting, scoring) are validated on the server.
- Input events are rate-limited and analysed by the anti-cheat module.
- IP-level rate limiting via `express-rate-limit` middleware.
- Basic attack surface hardening through `helmet`.

---

## Notes

This repository focuses deliberately on:

- A working real-time loop and netcode.
- Clean separation of REST, WebSocket, persistence, and gameplay logic.
- A UI that is easy to extend with additional screens (store, loadouts, friends, clans, etc.).

You can fork and evolve it into a fuller production system, add more maps, controllers, mobile input, voice chat, and a full admin web UI, while keeping the Render free tier compatibility.
