import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import ChessBoard from '../components/ChessBoard';
import GameSidebar from '../components/GameSidebar';
import ChatPanel from '../components/ChatPanel';

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function Play() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [status, setStatus] = useState('idle');
  const [timeControl, setTimeControl] = useState('blitz');
  const [activeGame, setActiveGame] = useState(null);

  useEffect(() => {
    if (!socket) return;
    const onQueueUpdate = (payload) => setStatus(payload.status);
    const onGameFound = (payload) => {
      setStatus('in-game');
      setActiveGame({
        id: payload.gameId,
        color: payload.color,
        opponent: payload.opponent,
        timeControl: payload.timeControl,
        isRanked: payload.isRanked,
        fen: START_FEN,
        moves: [],
        timers: { white: 10 * 60 * 1000, black: 10 * 60 * 1000 },
        turn: 'white'
      });
    };
    const onGameState = (payload) => {
      setActiveGame((prev) => (prev ? { ...prev, ...payload } : payload));
    };
    const onMoveMade = (payload) => {
      setActiveGame((prev) =>
        prev
          ? {
              ...prev,
              fen: payload.fen,
              moves: [...(prev.moves || []), payload.san],
              timers: payload.timers,
              turn: payload.turn
            }
          : prev
      );
    };
    const onGameOver = () => {
      setStatus('finished');
    };

    socket.on('queueUpdate', onQueueUpdate);
    socket.on('gameFound', onGameFound);
    socket.on('gameState', onGameState);
    socket.on('moveMade', onMoveMade);
    socket.on('gameOver', onGameOver);

    return () => {
      socket.off('queueUpdate', onQueueUpdate);
      socket.off('gameFound', onGameFound);
      socket.off('gameState', onGameState);
      socket.off('moveMade', onMoveMade);
      socket.off('gameOver', onGameOver);
    };
  }, [socket]);

  const joinQueue = () => {
    socket.emit('joinQueue', { mode: 'casual', ranked: false, timeControl });
  };

  const leaveQueue = () => {
    socket.emit('leaveQueue');
    setStatus('idle');
  };

  const onMove = ({ from, to }) => {
    if (!activeGame) return;
    socket.emit('move', { gameId: activeGame.id, from, to });
  };

  const onResign = () => {
    if (!activeGame) return;
    socket.emit('resign', { gameId: activeGame.id });
  };

  const onOfferDraw = () => {
    if (!activeGame) return;
    socket.emit('offerDraw', { gameId: activeGame.id });
  };

  return (
    <div className="grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-4 h-[calc(100vh-112px)]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Casual Matchmaking</h2>
          <select
            className="px-3 py-1 rounded-xl bg-slate-800 text-xs"
            value={timeControl}
            onChange={(e) => setTimeControl(e.target.value)}
          >
            <option value="bullet">Bullet 1+0</option>
            <option value="blitz">Blitz 5+0</option>
            <option value="rapid">Rapid 10+0</option>
          </select>
        </div>
        <div className="flex gap-2 mb-2">
          {status !== 'queued' && status !== 'in-game' && (
            <button
              onClick={joinQueue}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400"
            >
              Join Queue
            </button>
          )}
          {status === 'queued' && (
            <button
              onClick={leaveQueue}
              className="px-4 py-2 rounded-xl bg-slate-800 text-sm hover:bg-slate-700"
            >
              Leave Queue
            </button>
          )}
          <div className="text-xs text-slate-400 flex items-center">
            Status: <span className="ml-1 text-emerald-300">{status}</span>
          </div>
        </div>
        {activeGame ? (
          <div className="flex-1 flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex items-center justify-center">
              <ChessBoard
                fen={activeGame.fen || START_FEN}
                perspective={activeGame.color}
                onMove={onMove}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
            Join the queue to get matched with another player.
          </div>
        )}
      </div>
      <div className="grid grid-rows-[minmax(0,0.5fr)_minmax(0,0.5fr)] gap-3">
        {activeGame ? (
          <>
            <GameSidebar
              white={{ username: user.username, elo: user.elo }}
              black={activeGame.opponent || { username: 'Opponent', elo: 1200 }}
              timers={activeGame.timers || { white: 600000, black: 600000 }}
              turn={activeGame.turn || 'white'}
              isRanked={false}
              onResign={onResign}
              onOfferDraw={onOfferDraw}
            />
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
              <ChatPanel gameId={activeGame.id} />
            </div>
          </>
        ) : (
          <div className="col-span-1 flex items-center justify-center text-sm text-slate-400">
            Game sidebar will appear once you are matched.
          </div>
        )}
      </div>
    </div>
  );
}
