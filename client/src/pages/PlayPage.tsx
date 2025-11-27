import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchmaking } from '../hooks/useMatchmaking';

const PlayPage = () => {
  const nav = useNavigate();
  const { status, gameId, joinQueue, leaveQueue } = useMatchmaking('casual');

  useEffect(() => {
    if (gameId) nav(`/game/${gameId}`);
  }, [gameId, nav]);

  return (
    <div className="max-w-md mx-auto space-y-4 text-center">
      <h1 className="text-2xl font-bold">Casual Matchmaking</h1>
      {status === 'idle' && (
        <>
          <button
            onClick={() => joinQueue('5+0')}
            className="w-full py-3 rounded bg-emerald-600 hover:bg-emerald-500"
          >
            Play 5+0
          </button>
          <button
            onClick={() => joinQueue('10+0')}
            className="w-full py-3 rounded bg-emerald-700 hover:bg-emerald-600"
          >
            Play 10+0
          </button>
        </>
      )}
      {status === 'queued' && (
        <>
          <div className="text-emerald-300 animate-pulse">Searching for opponent…</div>
          <button onClick={leaveQueue} className="mt-3 px-4 py-2 rounded bg-red-600">
            Cancel
          </button>
        </>
      )}
      {status === 'matched' && <div>Match found! Redirecting…</div>}
    </div>
  );
};

export default PlayPage;
