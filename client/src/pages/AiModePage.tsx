import { useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from '../components/chess/ChessBoard';
import { findBestMove } from '../services/aiEngine';

const AiModePage = () => {
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [depth, setDepth] = useState(2);
  const [thinking, setThinking] = useState(false);

  const onPlayerMove = (from: string, to: string) => {
    try {
      const m = chess.move({ from, to, promotion: 'q' });
      if (!m) return;
      setFen(chess.fen());
      setThinking(true);
    } catch {}
  };

  useEffect(() => {
    if (!thinking) return;
    const id = setTimeout(() => {
      const best = findBestMove(chess.fen(), depth);
      if (best) {
        chess.move(best);
        setFen(chess.fen());
      }
      setThinking(false);
    }, 300);
    return () => clearTimeout(id);
  }, [thinking, depth, chess]);

  const reset = () => {
    chess.reset();
    setFen(chess.fen());
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1 flex items-center justify-center">
        <ChessBoard fen={fen} onMove={onPlayerMove} />
      </div>
      <div className="w-full md:w-64 border border-slate-800 rounded-xl p-4 text-sm space-y-3">
        <h1 className="text-lg font-semibold">AI Mode</h1>
        <p className="text-slate-300">
          Play against a simple engine that runs entirely in your browser.
        </p>
        <div>
          <label className="text-xs text-slate-400">Difficulty (search depth)</label>
          <input
            type="range"
            min={1}
            max={4}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-slate-400 mt-1">Depth: {depth}</div>
        </div>
        <button onClick={reset} className="w-full py-2 rounded bg-slate-800">
          New Game
        </button>
      </div>
    </div>
  );
};

export default AiModePage;
