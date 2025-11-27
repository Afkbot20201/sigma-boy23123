# Gifty Chess – Multiplayer Chess Platform

Production-ready multiplayer chess platform with:

- Node.js + Express + Socket.IO backend
- PostgreSQL database
- React + Vite + TailwindCSS frontend
- JWT authentication
- Ranked ELO system
- Real-time matchmaking and gameplay

**IMPORTANT**: The only possible admin account is the user with username `Gifty`.

---

## Project Structure

```bash
chess-multiplayer/
  README.md
  server/
    package.json
    .env.example
    src/
      index.js
      config/
        db.js
        auth.js
      models/
        userModel.js
        gameModel.js
        banModel.js
        reportModel.js
        friendModel.js
      utils/
        elo.js
        validation.js
        security.js
        chessEngine.js
      middleware/
        authMiddleware.js
        rateLimit.js
      routes/
        authRoutes.js
        userRoutes.js
        gameRoutes.js
        adminRoutes.js
        friendRoutes.js
      sockets/
        index.js
        matchmaking.js
        gameManager.js
      db/
        schema.sql
  client/
    index.html
    package.json
    vite.config.js
    postcss.config.cjs
    tailwind.config.cjs
    src/
      main.jsx
      App.jsx
      router.jsx
      api/
        axios.js
      context/
        AuthContext.jsx
        SocketContext.jsx
        ThemeContext.jsx
      components/
        Layout.jsx
        Navbar.jsx
        ProtectedRoute.jsx
        ChessBoard.jsx
        GameSidebar.jsx
        ChatPanel.jsx
        TimerBar.jsx
        RankBadge.jsx
      pages/
        Dashboard.jsx
        Play.jsx
        Ranked.jsx
        AiMode.jsx
        Leaderboard.jsx
        Friends.jsx
        History.jsx
        Profile.jsx
        Settings.jsx
        AdminPanel.jsx
        Login.jsx
        Register.jsx
```

---

## Environment Variables

### Server (`server/.env`)

```env
PORT=4000
NODE_ENV=production
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DBNAME
JWT_SECRET=super-secret-jwt-key
CORS_ORIGIN=https://your-frontend-domain.com
```

### Client (`client/.env`)

```env
VITE_API_URL=https://your-backend-service.onrender.com
```

---

## Database Setup (PostgreSQL)

On Render, create a PostgreSQL instance and set `DATABASE_URL` to the provided connection string.

Locally, you can run:

```bash
createdb gifty_chess
psql gifty_chess < server/db/schema.sql
```

---

## Local Development

### Backend

```bash
cd server
npm install
npm run dev
```

This starts the backend on `http://localhost:4000`.

### Frontend

```bash
cd client
npm install
npm run dev
```

This starts the frontend on `http://localhost:5173` by default.

Set `VITE_API_URL` in `client/.env`:

```env
VITE_API_URL=http://localhost:4000
```

---

## Render Deployment

### Backend (Web Service)

- **Environment**: Node
- **Build Command**: `cd server && npm install`
- **Start Command**: `cd server && npm start`
- **Environment variables**:
  - `DATABASE_URL` (from Render PostgreSQL)
  - `JWT_SECRET` (generate a secret)
  - `CORS_ORIGIN` (your frontend URL, e.g. `https://gifty-chess.onrender.com`)

### Frontend (Static Site)

- **Build Command**: `cd client && npm install && npm run build`
- **Publish Directory**: `client/dist`

Set `VITE_API_URL` environment variable in Render to your backend URL.

---

## API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Users / Leaderboard

- `GET /api/users/me`
- `GET /api/users/:id`
- `GET /api/users/:id/stats`
- `GET /api/users/leaderboard`

### Games

- `GET /api/games/my`
- `GET /api/games/:id`

### Friends

- `GET /api/friends`
- `POST /api/friends`
- `POST /api/friends/accept`
- `DELETE /api/friends/:id`

### Admin (only username `Gifty`)

- `GET /api/admin/users`
- `POST /api/admin/ban`
- `POST /api/admin/reset-elo`
- `GET /api/admin/active-games`
- `GET /api/admin/server-stats`

---

## WebSocket Events (Socket.IO)

### Client → Server

- `auth` – authenticate socket with JWT
- `joinQueue` – join matchmaking queue
- `leaveQueue` – leave queue
- `createPrivateRoom`
- `joinPrivateRoom`
- `startAIGame`
- `move`
- `resign`
- `offerDraw`
- `respondDraw`
- `requestRematch`
- `sendChat`
- `typing`
- `joinSpectate`

### Server → Client

- `authSuccess` / `authError`
- `queueUpdate`
- `gameFound`
- `gameState`
- `moveMade`
- `timerUpdate`
- `gameOver`
- `chatMessage`
- `typing`
- `spectateUpdate`
- `error`

---

## Start Commands for Render

**Backend**

- Build: `cd server && npm install`
- Start: `cd server && npm start`

**Frontend**

- Build: `cd client && npm install && npm run build`
- Publish directory: `client/dist`

---
