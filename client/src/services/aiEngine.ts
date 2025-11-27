import { Chess, Move } from 'chess.js';

function evaluateBoard(chess: Chess) {
  const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let score = 0;
  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece) continue;
      const val = values[piece.type] || 0;
      score += piece.color === 'w' ? val : -val;
    }
  }
  return score;
}

function minimax(chess: Chess, depth: number, maximizing: boolean): number {
  if (depth === 0 || chess.isGameOver()) return evaluateBoard(chess);
  const moves = chess.moves({ verbose: true }) as Move[];
  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      chess.move(m);
      best = Math.max(best, minimax(chess, depth - 1, false));
      chess.undo();
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      chess.move(m);
      best = Math.min(best, minimax(chess, depth - 1, true));
      chess.undo();
    }
    return best;
  }
}

export function findBestMove(fen: string, depth = 2): Move | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true }) as Move[];
  let bestMove: Move | null = null;
  let bestScore = -Infinity;
  for (const m of moves) {
    chess.move(m);
    const score = minimax(chess, depth - 1, false);
    chess.undo();
    if (score > bestScore) {
      bestScore = score;
      bestMove = m;
    }
  }
  return bestMove;
}
