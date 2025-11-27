import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeGames, setActiveGames] = useState([]);

  useEffect(() => {
    if (user.username !== 'Gifty') return;
    const load = async () => {
      const u = await api.get('/api/admin/users');
      setUsers(u.data.users || []);
      const s = await api.get('/api/admin/server-stats');
      setStats(s.data.stats);
      const g = await api.get('/api/admin/active-games');
      setActiveGames(g.data.activeGames || []);
    };
    load();
  }, [user]);

  const ban = async (userId) => {
    await api.post('/api/admin/ban', { userId, reason: 'Manual ban' });
    const u = await api.get('/api/admin/users');
    setUsers(u.data.users || []);
  };

  const resetElo = async (userId) => {
    await api.post('/api/admin/reset-elo', { userId });
    const u = await api.get('/api/admin/users');
    setUsers(u.data.users || []);
  };

  if (user.username !== 'Gifty') {
    return <div className="text-sm text-red-400">Only the user Gifty can access the admin panel.</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Admin Panel</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 text-sm">
          <div className="text-xs text-slate-400 uppercase">Server Stats</div>
          {stats ? (
            <>
              <div>Active games: {stats.activeGames}</div>
              <div className="text-xs text-slate-500">
                Updated at {new Date(stats.timestamp).toLocaleString()}
              </div>
            </>
          ) : (
            <div className="text-slate-500 text-xs">Loading...</div>
          )}
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 text-sm">
          <div className="text-xs text-slate-400 uppercase">Active Games</div>
          {activeGames.length === 0 && (
            <div className="text-xs text-slate-500">No active games.</div>
          )}
          <ul className="space-y-1">
            {activeGames.map((g) => (
              <li key={g.id} className="text-xs">
                {g.white} vs {g.black} – {g.isRanked ? 'Ranked' : 'Casual'} ({g.timeControl})
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 text-sm overflow-x-auto">
        <div className="text-xs text-slate-400 uppercase">Users</div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-400">
              <th className="px-2 py-1 text-left">Username</th>
              <th className="px-2 py-1 text-left">Email</th>
              <th className="px-2 py-1 text-left">ELO</th>
              <th className="px-2 py-1 text-left">Role</th>
              <th className="px-2 py-1 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-800/60">
                <td className="px-2 py-1">{u.username}</td>
                <td className="px-2 py-1">{u.email}</td>
                <td className="px-2 py-1">{u.elo}</td>
                <td className="px-2 py-1">{u.role}</td>
                <td className="px-2 py-1 text-right space-x-2">
                  <button
                    onClick={() => resetElo(u.id)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700"
                  >
                    Reset ELO
                  </button>
                  {u.username !== 'Gifty' && (
                    <button
                      onClick={() => ban(u.id)}
                      className="px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600"
                    >
                      Ban
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" className="px-2 py-4 text-center text-slate-500">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
