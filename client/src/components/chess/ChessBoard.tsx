import { Chess } from 'chess.js';
import { useMemo, useState } from 'react';

const files = ['a','b','c','d','e','f','g','h'];

type Props = { fen: string; onMove: (from: string, to: string) => void; };

const ChessBoard: React.FC<Props> = ({ fen, onMove }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const chess = useMemo(() => new Chess(fen), [fen]);

  const squares = useMemo(() => {
    const board = chess.board();
    const arr: { sq: string; piece: string | null; dark: boolean }[] = [];
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = files[f] + (8 - r);
        const p = board[r][f];
        let piece: string | null = null;
        if (p) {
          const map: Record<string, string> = {
            pw: '♙', pb: '♟', nw: '♘', nb: '♞', bw: '♗', bb: '♝', rw: '♖', rb: '♜', qw: '♕', qb: '♛', kw: '♔', kb: '♚'
          };
          piece = map[p.type + p.color] || null;
        }
        arr.push({ sq, piece, dark: (r + f) % 2 === 1 });
      }
    }
    return arr;
  }, [chess]);

  const handleClick = (sq: string) => {
    if (!selected) setSelected(sq);
    else if (selected === sq) setSelected(null);
    else {
      onMove(selected, sq);
      setSelected(null);
    }
  };

  return (
    <div className="grid grid-cols-8 border-4 border-slate-700 rounded-xl overflow-hidden">
      {squares.map(({ sq, piece, dark }) => (
        <button
          key={sq}
          onClick={() => handleClick(sq)}
          className={`aspect-square flex items-center justify-center text-2xl ${
            dark ? 'bg-slate-700' : 'bg-slate-200 text-slate-900'
          } ${selected === sq ? 'ring-4 ring-emerald-400' : ''}`}
        >
          {piece}
        </button>
      ))}
    </div>
  );
};

export default ChessBoard;
