import React, { useEffect, useState } from 'react';
import ChessBoard from '../components/ChessBoard';
import RankBadge from '../components/RankBadge';
import { useAuth } from '../context/AuthContext';
import { Chess } from 'chess.js';

function evaluateBoard(chess) {
  const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let score = 0;
  const fen = chess.fen().split(' ')[0];
  for (const ch of fen) {
    if (ch === '/' || ch === ' ') continue;
    if (/[1-8]/.test(ch)) continue;
    const val = values[ch.toLowerCase()] || 0;
    score += ch === ch.toLowerCase() ? -val : val;
  }
  return score;
}

function minimax(chess, depth, maximizing) {
  if (depth === 0 || chess.game_over()) {
    return { score: evaluateBoard(chess) };
  }
  const moves = chess.moves();
  if (maximizing) {
    let best = { score: -Infinity };
    for (const m of moves) {
      chess.move(m);
      const res = minimax(chess, depth - 1, false);
      chess.undo();
      if (res.score > best.score) {
        best = { score: res.score, move: m };
      }
    }
    return best;
  } else {
    let best = { score: Infinity };
    for (const m of moves) {
      chess.move(m);
      const res = minimax(chess, depth - 1, true);
      chess.undo();
      if (res.score < best.score) {
        best = { score: res.score, move: m };
      }
    }
    return best;
  }
}

export default function AiMode() {
  const { user } = useAuth();
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [difficulty, setDifficulty] = useState(2);
  const [status, setStatus] = useState('Your move');

  useEffect(() => {
    if (chess.game_over()) {
      if (chess.in_checkmate()) {
        setStatus(chess.turn() === 'w' ? 'Checkmate – Black wins' : 'Checkmate – White wins');
      } else {
        setStatus('Game over');
      }
    }
  }, [fen, chess]);

  const handleMove = ({ from, to }) => {
    try {
      const move = chess.move({ from, to, promotion: 'q' });
      if (!move) return;
      setFen(chess.fen());
      if (chess.game_over()) return;
      setTimeout(() => {
        const depth = difficulty;
        const best = minimax(chess, depth, false);
        if (best.move) {
          chess.move(best.move);
          setFen(chess.fen());
          setStatus('Your move');
        }
      }, 300);
    } catch (err) {
      console.error(err);
    }
  };

  const reset = () => {
    chess.reset();
    setFen(chess.fen());
    setStatus('Your move');
  };

  return (
    <div className="grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-4">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-between w-full">
          <h2 className="font-semibold">AI Training Board</h2>
          <div className="flex items-center gap-2 text-xs">
            <span>Difficulty</span>
            <select
              className="px-2 py-1 rounded-xl bg-slate-800"
              value={difficulty}
              onChange={(e) => setDifficulty(parseInt(e.target.value, 10))}
            >
              <option value={1}>Easy</option>
              <option value={2}>Medium</option>
              <option value={3}>Hard</option>
            </select>
          </div>
        </div>
        <ChessBoard fen={fen} perspective="white" onMove={handleMove} />
        <div className="flex items-center justify-between w-full text-sm">
          <div className="text-slate-300">{status}</div>
          <button
            onClick={reset}
            className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs"
          >
            New Game
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="text-xs text-slate-400 uppercase">Training Profile</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{user.username}</div>
              <div className="text-xs text-slate-400">Practice without risking ELO</div>
            </div>
            <RankBadge elo={user.elo} />
          </div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 text-sm text-slate-300">
          <div className="text-xs text-slate-400 uppercase">How this AI works</div>
          <p>
            The engine runs locally in your browser using a minimax search with a basic material
            evaluation. Higher difficulty means deeper lookahead, but the AI never has hidden
            information and does not cheat.
          </p>
        </div>
      </div>
    </div>
  );
}
