import { useEffect, useState } from 'react';
import { getGlobalLeaderboard } from '../services/leaderboardApi';

const LeaderboardsPage = () => {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const r = await getGlobalLeaderboard();
      setRows(r);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Global Leaderboard</h1>
      <div className="border border-slate-800 rounded-xl overflow-x-auto text-sm">
        <table className="w-full">
          <thead className="bg-slate-900/80">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Player</th>
              <th className="px-3 py-2 text-right">ELO</th>
              <th className="px-3 py-2 text-right">Tier</th>
              <th className="px-3 py-2 text-right">W/L/D</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u, i) => (
              <tr key={u.id} className="odd:bg-slate-900/40">
                <td className="px-3 py-2">{i + 1}</td>
                <td className="px-3 py-2">{u.username}</td>
                <td className="px-3 py-2 text-right">{u.elo_rating}</td>
                <td className="px-3 py-2 text-right">{u.rank_tier}</td>
                <td className="px-3 py-2 text-right">
                  {u.wins} / {u.losses} / {u.draws}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                  No players yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardsPage;
