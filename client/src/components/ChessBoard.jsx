import React from 'react';

const files = ['a','b','c','d','e','f','g','h'];
const ranks = [8,7,6,5,4,3,2,1];

const pieceUnicode = {
  'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
  'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔'
};

function parseFEN(fen) {
  const [placement] = fen.split(' ');
  const rows = placement.split('/');
  const board = [];
  for (let r = 0; r < 8; r++) {
    const row = [];
    for (const ch of rows[r]) {
      if (/[1-8]/.test(ch)) {
        const empty = parseInt(ch, 10);
        for (let i = 0; i < empty; i++) row.push(null);
      } else {
        row.push(ch);
      }
    }
    board.push(row);
  }
  return board;
}

export default function ChessBoard({ fen, perspective = 'white', onMove }) {
  const board = parseFEN(fen);
  const [selected, setSelected] = React.useState(null);

  const handleSquareClick = (sq) => {
    if (!selected) {
      setSelected(sq);
    } else {
      if (selected === sq) {
        setSelected(null);
      } else {
        onMove && onMove({ from: selected, to: sq });
        setSelected(null);
      }
    }
  };

  const squares = [];
  const ranksView = perspective === 'white' ? ranks : [...ranks].reverse();
  const filesView = perspective === 'white' ? files : [...files].reverse();

  for (const rank of ranksView) {
    for (const file of filesView) {
      const rowIndex = 8 - rank;
      const colIndex = files.indexOf(file);
      const piece = board[rowIndex][colIndex];
      const sq = file + rank;
      const dark = (files.indexOf(file) + ranks.indexOf(rank)) % 2 === 1;
      const isSelected = selected === sq;
      squares.push(
        <button
          key={sq}
          onClick={() => handleSquareClick(sq)}
          className={`w-10 h-10 md:w-14 md:h-14 flex items-center justify-center text-2xl
            ${dark ? 'bg-slate-700' : 'bg-slate-300 text-slate-900'}
            ${isSelected ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900' : ''}`}
        >
          {piece ? pieceUnicode[piece] : ''}
        </button>
      );
    }
  }

  return (
    <div className="grid grid-cols-8 gap-[2px] bg-slate-900 p-[2px] rounded-2xl shadow-xl">
      {squares}
    </div>
  );
}
