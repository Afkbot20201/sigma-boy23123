import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function History() {
  const [games, setGames] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await api.get('/api/games/my');
      setGames(res.data.games || []);
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Game History</h2>
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Result</th>
              <th className="px-3 py-2 text-left">Mode</th>
              <th className="px-3 py-2 text-left">Ranked</th>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-right">Ended</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => (
              <tr key={g.id} className="border-t border-slate-800/60">
                <td className="px-3 py-2">{g.result || '-'}</td>
                <td className="px-3 py-2">{g.mode}</td>
                <td className="px-3 py-2">{g.is_ranked ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2">{g.time_control}</td>
                <td className="px-3 py-2 text-right">
                  {g.ended_at ? new Date(g.ended_at).toLocaleString() : '-'}
                </td>
              </tr>
            ))}
            {games.length === 0 && (
              <tr>
                <td colSpan="5" className="px-3 py-4 text-center text-slate-500">
                  No games yet. Play a match to build your history.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
