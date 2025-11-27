import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import ChessBoard from '../components/chess/ChessBoard';

const GamePage = () => {
  const { id } = useParams();
  const socket = useSocket('/game');
  const [fen, setFen] = useState('rn1qkbnr/ppp1pppp/3p4/8/2BP4/8/PPP2PPP/RNBQK1NR b KQkq - 0 4');
  const [clocks, setClocks] = useState({ whiteMs: 0, blackMs: 0 });
  const [chat, setChat] = useState<{ sender: { username: string }; message: string }[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('game:join', { gameId: id });
    socket.on('game:state', (data: any) => {
      setFen(data.fen);
      setClocks(data.clocks);
    });
    socket.on('game:move', (data: any) => {
      setFen(data.fen);
      setClocks(data.clocks);
    });
    socket.on('game:over', (data: any) => {
      alert(`Game over: ${data.result}`);
    });
    socket.on('chat:message', (m: any) => setChat((c) => [...c, m]));
    return () => {
      socket.off('game:state');
      socket.off('game:move');
      socket.off('game:over');
      socket.off('chat:message');
    };
  }, [socket, id]);

  const onMove = (from: string, to: string) => {
    socket?.emit('game:move', { gameId: id, from, to });
  };

  const send = () => {
    if (!msg.trim()) return;
    socket?.emit('chat:message', { gameId: id, message: msg });
    setMsg('');
  };

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2 flex flex-col items-center gap-3">
        <div className="flex justify-between w-full max-w-md text-xs text-slate-400">
          <span>White: {Math.floor(clocks.whiteMs / 1000)}s</span>
          <span>Black: {Math.floor(clocks.blackMs / 1000)}s</span>
        </div>
        <ChessBoard fen={fen} onMove={onMove} />
      </div>
      <div className="border border-slate-800 rounded-xl p-3 flex flex-col">
        <div className="flex-1 overflow-y-auto text-xs space-y-1">
          {chat.map((m, i) => (
            <div key={i}>
              <span className="text-emerald-400">{m.sender.username}: </span>
              {m.message}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
          />
          <button onClick={send} className="px-3 py-1 rounded bg-emerald-600 text-xs">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
