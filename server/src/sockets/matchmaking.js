const { v4: uuidv4 } = require('uuid');
const { createInitialGameState } = require('../utils/chessEngine');
const { createGameRecord } = require('../models/gameModel');
const { registerGame } = require('./gameManager');

const queues = {
  casual: [],
  ranked: []
};

function findMatch(queueName, player) {
  const queue = queues[queueName];
  for (let i = 0; i < queue.length; i++) {
    const candidate = queue[i];
    if (candidate.userId === player.userId) continue;
    if (queueName === 'ranked') {
      const diff = Math.abs(candidate.elo - player.elo);
      if (diff > 400) continue;
    }
    queue.splice(i, 1);
    return candidate;
  }
  return null;
}

async function enqueuePlayer(io, socket, { mode, ranked, timeControl }) {
  const queueName = ranked ? 'ranked' : 'casual';
  const player = {
    socketId: socket.id,
    userId: socket.user.id,
    username: socket.user.username,
    elo: socket.user.elo || 1200,
    timeControl
  };
  const match = findMatch(queueName, player);
  if (!match) {
    queues[queueName].push(player);
    socket.join('queue');
    io.to(socket.id).emit('queueUpdate', { status: 'queued', queue: queueName });
    return;
  }

  const gameId = uuidv4();
  const whitePlayer = Math.random() > 0.5 ? player : match;
  const blackPlayer = whitePlayer === player ? match : player;
  const isRanked = ranked;

  const state = createInitialGameState();
  await createGameRecord({
    id: gameId,
    whiteId: whitePlayer.userId,
    blackId: blackPlayer.userId,
    isRanked,
    timeControl,
    mode: 'pvp'
  });

  registerGame(io, {
    id: gameId,
    isRanked,
    timeControl,
    white: whitePlayer,
    black: blackPlayer,
    state
  });

  io.to(whitePlayer.socketId).emit('gameFound', {
    gameId,
    color: 'white',
    opponent: { username: blackPlayer.username, elo: blackPlayer.elo },
    timeControl,
    isRanked
  });
  io.to(blackPlayer.socketId).emit('gameFound', {
    gameId,
    color: 'black',
    opponent: { username: whitePlayer.username, elo: whitePlayer.elo },
    timeControl,
    isRanked
  });
}

function leaveQueue(socket) {
  Object.values(queues).forEach((q) => {
    const idx = q.findIndex((p) => p.socketId === socket.id);
    if (idx !== -1) q.splice(idx, 1);
  });
}

module.exports = {
  enqueuePlayer,
  leaveQueue
};
