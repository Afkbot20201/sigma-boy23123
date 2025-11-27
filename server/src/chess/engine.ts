import { Chess } from 'chess.js';

export function createInitialFen() {
  const c = new Chess();
  return c.fen();
}

export function applyMove(fen: string, from: string, to: string, promotion: string | undefined) {
  const c = new Chess(fen);
  const move = c.move({ from, to, promotion: promotion as any });
  if (!move) return null;
  return { san: move.san, fen: c.fen(), gameOver: c.isGameOver(), isCheckmate: c.isCheckmate() };
}
