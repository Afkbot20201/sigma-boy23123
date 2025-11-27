# Chess Arena

Full-stack multiplayer chess platform.

## Quick start (local)

1. Create Postgres DB and set `DATABASE_URL` in `server/.env` (see `server/.env.example`).
2. Run migrations:

```bash
cd server
npm install
npm run migrate
```

3. Start backend:

```bash
npm run dev
```

4. Start frontend:

```bash
cd ../client
npm install
cp .env.example .env
npm run dev
```

Login with seeded admin:

- Username: `Gifty`
- Password: (bcrypt hash seeded; set manually by updating DB if needed).

Deploy to Render using `render.yaml`.
