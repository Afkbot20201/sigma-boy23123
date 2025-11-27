import http from 'http';
import { app } from './app.js';
import { ENV } from './config/env.js';
import { Server } from 'socket.io';
import { verifyToken } from './utils/jwt.js';
import { pool } from './config/db.js';
import { registerSockets } from './sockets/index.js';

const server = http.createServer(app);

export const io = new Server(server, {
  cors: { origin: ENV.CLIENT_URL }
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Unauthorized'));
    const { userId } = verifyToken(token);
    const r = await pool.query('SELECT * FROM users WHERE id=$1', [userId]);
    if (!r.rows.length || r.rows[0].is_banned) return next(new Error('Unauthorized'));
    (socket as any).user = r.rows[0];
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

registerSockets(io);

server.listen(ENV.PORT, () => {
  console.log(`Server listening on ${ENV.PORT}`);
});
