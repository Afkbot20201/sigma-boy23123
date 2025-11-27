const { Chess } = require('chess.js');

function createInitialGameState() {
  const chess = new Chess();
  return {
    chess,
    fen: chess.fen(),
    moves: [],
    status: 'playing',
    winner: null,
    drawReason: null
  };
}

function applyMove(gameState, moveObj) {
  const { chess } = gameState;
  const move = chess.move({
    from: moveObj.from,
    to: moveObj.to,
    promotion: moveObj.promotion || 'q'
  });

  if (!move) {
    return { valid: false, reason: 'Illegal move' };
  }

  gameState.fen = chess.fen();
  gameState.moves.push(move.san);

  if (chess.isCheckmate()) {
    gameState.status = 'finished';
    gameState.winner = chess.turn() === 'w' ? 'black' : 'white';
  } else if (chess.isStalemate()) {
    gameState.status = 'finished';
    gameState.drawReason = 'stalemate';
  } else if (chess.isThreefoldRepetition()) {
    gameState.status = 'finished';
    gameState.drawReason = 'threefold_repetition';
  } else if (chess.isInsufficientMaterial()) {
    gameState.status = 'finished';
    gameState.drawReason = 'insufficient_material';
  } else if (chess.isDraw()) {
    gameState.status = 'finished';
    gameState.drawReason = 'draw';
  }

  return { valid: true, move, gameState };
}

module.exports = {
  createInitialGameState,
  applyMove
};
