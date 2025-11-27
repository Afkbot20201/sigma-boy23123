import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchmaking } from '../hooks/useMatchmaking';

const RankedQueuePage = () => {
  const nav = useNavigate();
  const { status, gameId, joinQueue, leaveQueue } = useMatchmaking('ranked');

  useEffect(() => {
    if (gameId) nav(`/game/${gameId}`);
  }, [gameId, nav]);

  return (
    <div className="max-w-md mx-auto space-y-4 text-center">
      <h1 className="text-2xl font-bold text-amber-400">Ranked Queue</h1>
      {status === 'idle' && (
        <>
          <button
            onClick={() => joinQueue('3+2')}
            className="w-full py-3 rounded bg-amber-600 hover:bg-amber-500"
          >
            Blitz 3+2
          </button>
          <button
            onClick={() => joinQueue('5+0')}
            className="w-full py-3 rounded bg-amber-700 hover:bg-amber-600"
          >
            Blitz 5+0
          </button>
        </>
      )}
      {status === 'queued' && (
        <>
          <div className="text-amber-300 animate-pulse">Searching ranked opponent…</div>
          <button onClick={leaveQueue} className="mt-3 px-4 py-2 rounded bg-red-600">
            Cancel
          </button>
        </>
      )}
      {status === 'matched' && <div>Match found! Redirecting…</div>}
    </div>
  );
};

export default RankedQueuePage;
