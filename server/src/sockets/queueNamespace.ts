import { Server, Socket } from 'socket.io';
import { rankedQueue, casualQueue, liveGames } from './state.js';
import { v4 as uuidv4 } from 'uuid';
import { Chess } from 'chess.js';
import { pool } from '../config/db.js';

export function registerQueueNamespace(io: Server) {
  const nsp = io.of('/queue');

  nsp.on('connection', (socket: Socket) => {
    const user = (socket as any).user;

    socket.on('queue:join', async ({ mode, timeControl }) => {
      const queue = mode === 'ranked' ? rankedQueue : casualQueue;
      if (queue.find((q) => q.userId === user.id)) return;
      queue.push({ socketId: socket.id, userId: user.id, timeControl, mode });
      socket.emit('queue:joined');

      if (queue.length >= 2) {
        const p1 = queue.shift()!;
        const p2 = queue.shift()!;
        const gameId = uuidv4();
        const [m, inc] = String(p1.timeControl).split('+').map(Number);
        const base = (m || 5) * 60 * 1000;
        const increment = (inc || 0) * 1000;
        const chess = new Chess();
        const whiteId = Math.random() > 0.5 ? p1.userId : p2.userId;
        const blackId = whiteId === p1.userId ? p2.userId : p1.userId;

        liveGames.set(gameId, {
          gameId,
          whiteId,
          blackId,
          chess,
          timeControlMs: base,
          incrementMs: increment,
          clocks: { white: base, black: base },
          lastMoveAt: Date.now(),
          isRated: mode === 'ranked'
        });

        await pool.query(
          'INSERT INTO games (id, white_id, black_id, is_rated, time_control) VALUES ($1,$2,$3,$4,$5)',
          [gameId, whiteId, blackId, mode === 'ranked', p1.timeControl]
        );

        nsp.to(p1.socketId).emit('match:found', { gameId });
        nsp.to(p2.socketId).emit('match:found', { gameId });
      }
    });

    socket.on('queue:leave', () => {
      const i1 = rankedQueue.findIndex((q) => q.socketId === socket.id);
      if (i1 !== -1) rankedQueue.splice(i1, 1);
      const i2 = casualQueue.findIndex((q) => q.socketId === socket.id);
      if (i2 !== -1) casualQueue.splice(i2, 1);
      socket.emit('queue:left');
    });

    socket.on('disconnect', () => {
      const i1 = rankedQueue.findIndex((q) => q.socketId === socket.id);
      if (i1 !== -1) rankedQueue.splice(i1, 1);
      const i2 = casualQueue.findIndex((q) => q.socketId === socket.id);
      if (i2 !== -1) casualQueue.splice(i2, 1);
    });
  });
}
