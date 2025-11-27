import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { pool } from './db.js';
import { authMiddleware, login, register, signToken } from './auth.js';
import { liveGames, queues } from './state.js';
import { Chess } from 'chess.js';
import jwt from 'jsonwebtoken';
import { calcElo, calcRank } from './elo.js';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/me', authMiddleware, (req, res) => res.json({ user: req.user }));

app.get('/api/users/me', authMiddleware, async (req, res) => {
  const r = await pool.query('SELECT id,username,email,elo_rating,rank_tier,games_played,wins,losses,draws,avatar_url FROM users WHERE id=$1', [req.user.id]);
  res.json(r.rows[0]);
});

app.put('/api/users/me', authMiddleware, async (req, res) => {
  const { avatarUrl } = req.body;
  const r = await pool.query(
    'UPDATE users SET avatar_url=COALESCE($1,avatar_url),updated_at=NOW() WHERE id=$2 RETURNING id,username,email,elo_rating,rank_tier,games_played,wins,losses,draws,avatar_url',
    [avatarUrl || null, req.user.id]
  );
  res.json(r.rows[0]);
});

app.get('/api/leaderboard/global', authMiddleware, async (req, res) => {
  const r = await pool.query('SELECT id,username,elo_rating,rank_tier,games_played,wins,losses,draws FROM users WHERE is_banned=false ORDER BY elo_rating DESC LIMIT 100');
  res.json(r.rows);
});

app.post('/api/users/:id/report', authMiddleware, async (req, res) => {
  const { reason, gameId } = req.body;
  await pool.query(
    'INSERT INTO reports (reporter_id,reported_id,game_id,reason) VALUES ($1,$2,$3,$4)',
    [req.user.id, req.params.id, gameId || null, reason]
  );
  res.json({ ok: true });
});

app.get('/api/games/:id', authMiddleware, async (req, res) => {
  const r = await pool.query('SELECT * FROM games WHERE id=$1', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
});

app.get('/api/games/:id/moves', authMiddleware, async (req, res) => {
  const r = await pool.query('SELECT move_number,san,from_sq,to_sq,fen_after FROM game_moves WHERE game_id=$1 ORDER BY move_number ASC', [req.params.id]);
  res.json(r.rows);
});

// Admin HTTP (only username Gifty & role admin)
async function requireAdmin(req, res, next) {
  const user = req.user;
  if (!user || user.role !== 'admin' || user.username !== 'Gifty') return res.status(403).json({ error: 'Admin only' });
  next();
}

app.get('/api/admin/users', authMiddleware, requireAdmin, async (req, res) => {
  const r = await pool.query('SELECT id,username,email,elo_rating,rank_tier,games_played,wins,losses,draws,is_banned,role FROM users ORDER BY created_at DESC LIMIT 100');
  res.json(r.rows);
});

app.post('/api/admin/users/:id/ban', authMiddleware, requireAdmin, async (req, res) => {
  await pool.query('UPDATE users SET is_banned=true WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

app.post('/api/admin/users/:id/unban', authMiddleware, requireAdmin, async (req, res) => {
  await pool.query('UPDATE users SET is_banned=false WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

app.post('/api/admin/users/:id/reset-elo', authMiddleware, requireAdmin, async (req, res) => {
  const rating = req.body.newRating || 1200;
  await pool.query(
    'UPDATE users SET elo_rating=$1,rank_tier=$2,wins=0,losses=0,draws=0 WHERE id=$3',
    [rating, calcRank(rating), req.params.id]
  );
  res.json({ ok: true });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }
});

// Socket auth
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const r = await pool.query('SELECT * FROM users WHERE id=$1', [userId]);
    if (!r.rows.length || r.rows[0].is_banned) return next(new Error('Unauthorized'));
    socket.user = r.rows[0];
    next();
  } catch (e) {
    next(new Error('Unauthorized'));
  }
});

const queueNsp = io.of('/queue');
const gameNsp = io.of('/game');
const adminNsp = io.of('/admin');

// Matchmaking
queueNsp.on('connection', (socket) => {
  const user = socket.user;
  socket.on('queue:join', async ({ mode, timeControl }) => {
    const q = mode === 'ranked' ? queues.ranked : queues.casual;
    if (q.find(e => e.userId === user.id)) return;
    q.push({ userId: user.id, socketId: socket.id, timeControl, elo: user.elo_rating });
    socket.emit('queue:joined', { mode, timeControl });

    if (q.length >= 2) {
      const a = q.shift();
      const b = q.shift();
      const players = [a, b].sort((x, y) => x.elo - y.elo);
      const white = players[0];
      const black = players[1];

      const [baseStr, incStr] = white.timeControl.split('+');
      const baseMs = (parseInt(baseStr) || 5) * 60 * 1000;
      const incMs = (parseInt(incStr) || 0) * 1000;

      const { v4: uuidv4 } = await import('uuid');
      const gameId = uuidv4();
      const chess = new Chess();

      liveGames.set(gameId, {
        chess,
        whiteId: white.userId,
        blackId: black.userId,
        clocks: { white: baseMs, black: baseMs },
        lastUpdate: Date.now(),
        incMs,
        rated: mode === 'ranked',
        timeControl: white.timeControl
      });

      await pool.query(
        'INSERT INTO games (id,white_id,black_id,is_rated,time_control,result,white_rating_before,black_rating_before,white_time_ms_remaining,black_time_ms_remaining) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
        [gameId, white.userId, black.userId, mode === 'ranked', white.timeControl, 'ongoing', white.elo, black.elo, baseMs, baseMs]
      );

      queueNsp.to(white.socketId).emit('match:found', { gameId });
      queueNsp.to(black.socketId).emit('match:found', { gameId });
    }
  });

  socket.on('queue:leave', () => {
    queues.casual = queues.casual.filter(e => e.socketId !== socket.id);
    queues.ranked = queues.ranked.filter(e => e.socketId !== socket.id);
    socket.emit('queue:left');
  });

  socket.on('disconnect', () => {
    queues.casual = queues.casual.filter(e => e.socketId !== socket.id);
    queues.ranked = queues.ranked.filter(e => e.socketId !== socket.id);
  });
});

// Game namespace
gameNsp.on('connection', (socket) => {
  const user = socket.user;

  socket.on('game:join', async ({ gameId }) => {
    const lg = liveGames.get(gameId);
    socket.join(gameId);
    if (!lg) {
      // load last FEN from DB or default
      const moves = await pool.query('SELECT fen_after FROM game_moves WHERE game_id=$1 ORDER BY move_number DESC LIMIT 1', [gameId]);
      const fen = moves.rows.length ? moves.rows[0].fen_after : new Chess().fen();
      const game = await pool.query('SELECT white_time_ms_remaining,black_time_ms_remaining FROM games WHERE id=$1', [gameId]);
      socket.emit('game:state', {
        gameId,
        fen,
        clocks: {
          whiteMs: game.rows[0]?.white_time_ms_remaining || 0,
          blackMs: game.rows[0]?.black_time_ms_remaining || 0
        }
      });
      return;
    }
    socket.emit('game:state', {
      gameId,
      fen: lg.chess.fen(),
      clocks: { whiteMs: lg.clocks.white, blackMs: lg.clocks.black }
    });
  });

  socket.on('game:move', async ({ gameId, from, to }) => {
    const lg = liveGames.get(gameId);
    if (!lg) return;
    const now = Date.now();
    const dt = now - (lg.lastUpdate || now);
    const turn = lg.chess.turn(); // 'w' or 'b'
    if (turn === 'w' && lg.whiteId === user.id) lg.clocks.white -= dt;
    if (turn === 'b' && lg.blackId === user.id) lg.clocks.black -= dt;
    lg.lastUpdate = now;

    let move;
    try {
      move = lg.chess.move({ from, to, promotion: 'q' });
    } catch {
      return;
    }
    if (!move) return;

    if (turn === 'w') lg.clocks.white += lg.incMs;
    else lg.clocks.black += lg.incMs;

    const historyLen = lg.chess.history().length;
    await pool.query(
      'INSERT INTO game_moves (game_id,move_number,san,from_sq,to_sq,fen_after) VALUES ($1,$2,$3,$4,$5,$6)',
      [gameId, historyLen, move.san, from, to, lg.chess.fen()]
    );

    gameNsp.to(gameId).emit('game:move', {
      gameId,
      fen: lg.chess.fen(),
      clocks: { whiteMs: lg.clocks.white, blackMs: lg.clocks.black }
    });

    if (lg.chess.isGameOver()) {
      let result = 'draw';
      if (lg.chess.isCheckmate()) {
        result = turn === 'w' ? 'black' : 'white';
      }
      // update ratings
      const gRow = await pool.query('SELECT white_rating_before,black_rating_before FROM games WHERE id=$1', [gameId]);
      const whiteBefore = gRow.rows[0].white_rating_before;
      const blackBefore = gRow.rows[0].black_rating_before;
      if (lg.rated) {
        const score = result === 'white' ? 1 : result === 'black' ? 0 : 0.5;
        const { newA, newB } = calcElo(whiteBefore, blackBefore, score);
        await pool.query('UPDATE users SET elo_rating=$1,rank_tier=$2 WHERE id=$3', [newA, calcRank(newA), lg.whiteId]);
        await pool.query('UPDATE users SET elo_rating=$1,rank_tier=$2 WHERE id=$3', [newB, calcRank(newB), lg.blackId]);
      }
      await pool.query(
        'UPDATE games SET result=$1,ended_at=NOW(),white_time_ms_remaining=$2,black_time_ms_remaining=$3 WHERE id=$4',
        [result, lg.clocks.white, lg.clocks.black, gameId]
      );
      liveGames.delete(gameId);
      gameNsp.to(gameId).emit('game:over', { gameId, result });
    }
  });

  socket.on('chat:message', async ({ gameId, message }) => {
    if (!message?.trim()) return;
    await pool.query(
      'INSERT INTO game_chat_messages (game_id,sender_id,message) VALUES ($1,$2,$3)',
      [gameId, user.id, message]
    );
    gameNsp.to(gameId).emit('chat:message', {
      gameId,
      sender: { id: user.id, username: user.username },
      message,
      createdAt: new Date().toISOString()
    });
  });
});

// Admin namespace
adminNsp.on('connection', (socket) => {
  const user = socket.user;
  if (user.username !== 'Gifty' || user.role !== 'admin') {
    socket.disconnect();
    return;
  }
  socket.on('admin:stats', async () => {
    const activeGames = liveGames.size;
    const usersCount = await pool.query('SELECT COUNT(*) FROM users WHERE is_banned=false');
    socket.emit('admin:stats', {
      activeUsers: parseInt(usersCount.rows[0].count, 10),
      activeGames,
      rankedQueueSize: queues.ranked.length,
      casualQueueSize: queues.casual.length,
      serverUptimeSec: process.uptime()
    });
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log('Server listening on', port);
});
