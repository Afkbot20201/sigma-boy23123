import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import RankBadge from '../components/RankBadge';

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await api.get('/api/users/leaderboard');
      setPlayers(res.data.leaderboard || []);
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Global Leaderboard</h2>
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Player</th>
              <th className="px-3 py-2 text-right">ELO</th>
              <th className="px-3 py-2 text-right">W / L / D</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, idx) => (
              <tr key={p.id} className="border-t border-slate-800/60">
                <td className="px-3 py-2">{idx + 1}</td>
                <td className="px-3 py-2 flex items-center gap-2">
                  <span>{p.username}</span>
                  <RankBadge elo={p.elo} />
                </td>
                <td className="px-3 py-2 text-right font-semibold">{p.elo}</td>
                <td className="px-3 py-2 text-right text-slate-300">
                  {p.wins} / {p.losses} / {p.draws}
                </td>
              </tr>
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan="4" className="px-3 py-4 text-center text-slate-500">
                  No players yet. Be the first to play a ranked game!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
