const { applyMove } = require('../utils/chessEngine');
const { calculateNewRatings } = require('../utils/elo');
const { finishGameRecord } = require('../models/gameModel');
const { updateStatsAfterGame, findUserById } = require('../models/userModel');
const { antiCheatTracker } = require('../utils/security');

const activeGames = new Map();

function registerGame(io, game) {
  const { id, white, black, state, isRanked, timeControl } = game;
  activeGames.set(id, {
    id,
    isRanked,
    timeControl,
    white,
    black,
    state,
    timers: {
      white: timeControlToMs(timeControl),
      black: timeControlToMs(timeControl)
    },
    lastMoveAt: Date.now(),
    turn: 'white',
    chat: [],
    drawOffer: null,
    rematchRequested: []
  });

  io.to(white.socketId).socketsJoin(id);
  io.to(black.socketId).socketsJoin(id);

  io.to(id).emit('gameState', {
    gameId: id,
    fen: state.fen,
    moves: state.moves,
    turn: 'white',
    timers: { white: timeControlToMs(timeControl), black: timeControlToMs(timeControl) }
  });
}

function timeControlToMs(timeControl) {
  if (timeControl === 'bullet') return 60 * 1000;
  if (timeControl === 'blitz') return 5 * 60 * 1000;
  return 10 * 60 * 1000;
}

async function handleMove(io, socket, { gameId, from, to, promotion }) {
  const game = activeGames.get(gameId);
  if (!game) {
    io.to(socket.id).emit('error', { message: 'Game not found' });
    return;
  }
  const playerColor = socket.user.id === game.white.userId ? 'white' :
                      socket.user.id === game.black.userId ? 'black' : null;
  if (!playerColor) {
    io.to(socket.id).emit('error', { message: 'You are not a player in this game' });
    return;
  }
  if (playerColor !== game.turn) {
    io.to(socket.id).emit('error', { message: 'Not your turn' });
    return;
  }

  if (!antiCheatTracker.registerMove(socket.user.id)) {
    io.to(socket.id).emit('error', { message: 'Move rate too high, possible automation detected' });
    return;
  }

  const elapsed = Date.now() - game.lastMoveAt;
  game.timers[game.turn] -= elapsed;
  game.lastMoveAt = Date.now();
  if (game.timers[game.turn] <= 0) {
    await endGameOnTimeout(io, game, playerColor);
    return;
  }

  const result = applyMove(game.state, { from, to, promotion });
  if (!result.valid) {
    io.to(socket.id).emit('error', { message: result.reason || 'Illegal move' });
    return;
  }
  game.turn = game.turn === 'white' ? 'black' : 'white';

  io.to(gameId).emit('moveMade', {
    gameId,
    from,
    to,
    promotion: promotion || 'q',
    fen: game.state.fen,
    san: result.move.san,
    timers: game.timers,
    turn: game.turn
  });

  if (game.state.status === 'finished') {
    await finalizeGame(io, game, {
      result: game.state.winner ? (game.state.winner === 'white' ? 'white_win' : 'black_win') : 'draw',
      reason: game.state.drawReason || 'checkmate'
    });
  }
}

async function endGameOnTimeout(io, game, loserColor) {
  await finalizeGame(io, game, {
    result: loserColor === 'white' ? 'black_win' : 'white_win',
    reason: 'timeout'
  });
}

async function handleResign(io, socket, { gameId }) {
  const game = activeGames.get(gameId);
  if (!game) return;
  const playerColor = socket.user.id === game.white.userId ? 'white' :
                      socket.user.id === game.black.userId ? 'black' : null;
  if (!playerColor) return;
  await finalizeGame(io, game, {
    result: playerColor === 'white' ? 'black_win' : 'white_win',
    reason: 'resign'
  });
}

async function handleOfferDraw(io, socket, { gameId }) {
  const game = activeGames.get(gameId);
  if (!game) return;
  game.drawOffer = socket.user.id;
  io.to(gameId).emit('drawOffered', { fromUserId: socket.user.id });
}

async function handleRespondDraw(io, socket, { gameId, accept }) {
  const game = activeGames.get(gameId);
  if (!game || !game.drawOffer) return;
  if (!accept) {
    game.drawOffer = null;
    io.to(gameId).emit('drawDeclined');
    return;
  }
  await finalizeGame(io, game, {
    result: 'draw',
    reason: 'mutual_draw'
  });
}

async function handleRematchRequest(io, socket, { gameId }) {
  const game = activeGames.get(gameId);
  if (!game) return;
  if (!game.rematchRequested.includes(socket.user.id)) {
    game.rematchRequested.push(socket.user.id);
  }
  io.to(gameId).emit('rematchRequested', { fromUserId: socket.user.id });
}

async function finalizeGame(io, game, { result, reason }) {
  const { white, black, state } = game;

  const whiteUser = await findUserById(white.userId);
  const blackUser = await findUserById(black.userId);
  const whiteElo = whiteUser.elo || 1200;
  const blackElo = blackUser.elo || 1200;

  let scoreWhite, scoreBlack;
  if (result === 'white_win') {
    scoreWhite = 1; scoreBlack = 0;
  } else if (result === 'black_win') {
    scoreWhite = 0; scoreBlack = 1;
  } else {
    scoreWhite = 0.5; scoreBlack = 0.5;
  }

  let whiteNew = whiteElo;
  let blackNew = blackElo;

  if (game.isRanked) {
    const { newRatingA, newRatingB } = calculateNewRatings(whiteElo, blackElo, scoreWhite);
    whiteNew = newRatingA;
    blackNew = newRatingB;

    await updateStatsAfterGame({
      userId: white.userId,
      result: result === 'white_win' ? 'win' : result === 'black_win' ? 'loss' : 'draw',
      newElo: whiteNew
    });

    await updateStatsAfterGame({
      userId: black.userId,
      result: result === 'black_win' ? 'win' : result === 'white_win' ? 'loss' : 'draw',
      newElo: blackNew
    });
  }

  await finishGameRecord({
    id: game.id,
    result,
    pgn: state.moves.join(' '),
    movesJson: state.moves,
    whiteEloBefore: whiteElo,
    blackEloBefore: blackElo,
    whiteEloAfter: whiteNew,
    blackEloAfter: blackNew,
    endedBy: reason
  });

  io.to(game.id).emit('gameOver', {
    gameId: game.id,
    result,
    reason,
    whiteEloBefore: whiteElo,
    blackEloBefore: blackElo,
    whiteEloAfter: whiteNew,
    blackEloAfter: blackNew
  });

  activeGames.delete(game.id);
}

function handleChat(io, socket, { gameId, message }) {
  const game = activeGames.get(gameId);
  if (!game) return;
  const payload = {
    gameId,
    from: {
      id: socket.user.id,
      username: socket.user.username
    },
    message,
    createdAt: new Date().toISOString()
  };
  game.chat.push(payload);
  io.to(gameId).emit('chatMessage', payload);
}

function handleTyping(io, socket, { gameId, typing }) {
  io.to(gameId).emit('typing', {
    gameId,
    userId: socket.user.id,
    typing
  });
}

function getActiveGamesSummary() {
  const result = [];
  activeGames.forEach((g) => {
    result.push({
      id: g.id,
      white: g.white.username,
      black: g.black.username,
      isRanked: g.isRanked,
      timeControl: g.timeControl
    });
  });
  return result;
}

function getServerStats() {
  return {
    activeGames: activeGames.size,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  registerGame,
  handleMove,
  handleResign,
  handleOfferDraw,
  handleRespondDraw,
  handleRematchRequest,
  handleChat,
  handleTyping,
  getActiveGamesSummary,
  getServerStats
};
