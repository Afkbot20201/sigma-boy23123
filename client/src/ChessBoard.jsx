import React, { useMemo, useState } from 'react';
import { Chess } from 'chess.js';

const files = ['a','b','c','d','e','f','g','h'];

export default function ChessBoard({ fen, onMove }) {
  const [selected, setSelected] = useState(null);
  const chess = useMemo(() => new Chess(fen), [fen]);

  const squares = useMemo(() => {
    const board = chess.board();
    const arr = [];
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = files[f] + (8 - r);
        const piece = board[r][f];
        let char = null;
        if (piece) {
          const map = {
            pw: '♙', pb: '♟', nw: '♘', nb: '♞', bw: '♗', bb: '♝',
            rw: '♖', rb: '♜', qw: '♕', qb: '♛', kw: '♔', kb: '♚'
          };
          char = map[piece.type + piece.color];
        }
        arr.push({ sq, char, color: (r + f) % 2 === 0 ? 'light' : 'dark' });
      }
    }
    return arr;
  }, [chess]);

  const click = (sq) => {
    if (!selected) setSelected(sq);
    else if (selected === sq) setSelected(null);
    else {
      onMove(selected, sq);
      setSelected(null);
    }
  };

  return (
    <div className="grid grid-cols-8 border-4 border-slate-700 rounded-xl overflow-hidden">
      {squares.map(s => (
        <button
          key={s.sq}
          onClick={() => click(s.sq)}
          className={
            'aspect-square flex items-center justify-center text-2xl ' +
            (s.color === 'light' ? 'bg-slate-200 text-slate-900' : 'bg-slate-700 text-slate-100') +
            (selected === s.sq ? ' ring-4 ring-emerald-400' : '')
          }
        >
          {s.char}
        </button>
      ))}
    </div>
  );
}
