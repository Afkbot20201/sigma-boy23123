import { Server, Socket } from 'socket.io';
import { liveGames } from './state.js';
import { pool } from '../config/db.js';
import { calculateElo } from '../utils/rating.js';
import { getRankTier } from '../utils/rank.js';

export function registerGameNamespace(io: Server) {
  const nsp = io.of('/game');

  nsp.on('connection', (socket: Socket) => {
    const user = (socket as any).user;

    socket.on('game:join', ({ gameId }) => {
      const game = liveGames.get(gameId);
      if (!game) return;
      socket.join(gameId);
      socket.emit('game:state', {
        gameId,
        fen: game.chess.fen(),
        clocks: { whiteMs: game.clocks.white, blackMs: game.clocks.black }
      });
    });

    socket.on('game:move', async ({ gameId, from, to }) => {
      const game = liveGames.get(gameId);
      if (!game) return;
      const now = Date.now();
      const delta = now - game.lastMoveAt;
      const turn = game.chess.turn();
      if (turn === 'w') game.clocks.white -= delta;
      else game.clocks.black -= delta;

      const move = game.chess.move({ from, to, promotion: 'q' });
      if (!move) return;
      if (turn === 'w') game.clocks.white += game.incrementMs;
      else game.clocks.black += game.incrementMs;
      game.lastMoveAt = now;

      await pool.query(
        'INSERT INTO game_moves (game_id, move_number, san, from_sq, to_sq, fen_after) VALUES ($1,$2,$3,$4,$5,$6)',
        [gameId, game.chess.history().length, move.san, from, to, game.chess.fen()]
      );

      nsp.to(gameId).emit('game:move', {
        fen: game.chess.fen(),
        clocks: { whiteMs: game.clocks.white, blackMs: game.clocks.black }
      });

      if (game.chess.isGameOver()) {
        const result =
          game.chess.isCheckmate() ? (turn === 'w' ? 'black' : 'white') : 'draw';

        if (game.isRated) {
          const r = await pool.query(
            'SELECT id,elo_rating FROM users WHERE id IN ($1,$2) ORDER BY id=$1 DESC',
            [game.whiteId, game.blackId]
          );
          const whiteR = r.rows[0].elo_rating;
          const blackR = r.rows[1].elo_rating;
          const score = result === 'white' ? 1 : result === 'black' ? 0 : 0.5;
          const { newRatingA, newRatingB } = calculateElo(whiteR, blackR, score);
          await pool.query(
            'UPDATE users SET elo_rating=$1,rank_tier=$2 WHERE id=$3',
            [newRatingA, getRankTier(newRatingA), game.whiteId]
          );
          await pool.query(
            'UPDATE users SET elo_rating=$1,rank_tier=$2 WHERE id=$3',
            [newRatingB, getRankTier(newRatingB), game.blackId]
          );
        }

        await pool.query(
          'UPDATE games SET result=$1,ended_at=NOW() WHERE id=$2',
          [result, gameId]
        );
        liveGames.delete(gameId);
        nsp.to(gameId).emit('game:over', { result });
      }
    });

    socket.on('chat:message', async ({ gameId, message }) => {
      if (!message?.trim()) return;
      const game = liveGames.get(gameId);
      if (!game) return;
      await pool.query(
        'INSERT INTO game_chat_messages (game_id,sender_id,message) VALUES ($1,$2,$3)',
        [gameId, user.id, message]
      );
      nsp.to(gameId).emit('chat:message', {
        sender: { username: user.username },
        message
      });
    });
  });
}
