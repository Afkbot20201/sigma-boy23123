import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { adminBanUser, adminListUsers, adminResetElo, adminUnbanUser } from '../services/adminApi';
import { useSocket } from '../hooks/useSocket';

const AdminPanelPage = () => {
  const { user } = useAuth();
  const socket = useSocket('/admin');
  const [stats, setStats] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  const loadUsers = async () => {
    const u = await adminListUsers();
    setUsers(u);
  };

  useEffect(() => {
    if (!user || user.username !== 'Gifty' || user.role !== 'admin') return;
    loadUsers();
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('admin:stats');
    socket.on('admin:stats', (s: any) => setStats(s));
    const id = setInterval(() => socket.emit('admin:stats'), 5000);
    return () => {
      clearInterval(id);
      socket.off('admin:stats');
    };
  }, [socket]);

  if (!user || user.username !== 'Gifty' || user.role !== 'admin') {
    return <div>Access denied. Only Gifty can view the admin panel.</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-amber-400">Admin Panel</h1>
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="border border-slate-800 rounded-lg p-3">
            <div className="text-slate-400">Active Users</div>
            <div className="text-lg">{stats.activeUsers}</div>
          </div>
          <div className="border border-slate-800 rounded-lg p-3">
            <div className="text-slate-400">Active Games</div>
            <div className="text-lg">{stats.activeGames}</div>
          </div>
          <div className="border border-slate-800 rounded-lg p-3">
            <div className="text-slate-400">Ranked Queue</div>
            <div className="text-lg">{stats.rankedQueueSize}</div>
          </div>
          <div className="border border-slate-800 rounded-lg p-3">
            <div className="text-slate-400">Uptime (s)</div>
            <div className="text-lg">{Math.round(stats.serverUptimeSec)}</div>
          </div>
        </div>
      )}

      <section className="space-y-2 text-xs">
        <h2 className="font-semibold">Users</h2>
        <div className="border border-slate-800 rounded-xl max-h-64 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-slate-900/80">
              <tr>
                <th className="px-2 py-1 text-left">Username</th>
                <th className="px-2 py-1 text-right">ELO</th>
                <th className="px-2 py-1 text-right">Tier</th>
                <th className="px-2 py-1 text-right">Banned</th>
                <th className="px-2 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="odd:bg-slate-900/40">
                  <td className="px-2 py-1">{u.username}</td>
                  <td className="px-2 py-1 text-right">{u.elo_rating}</td>
                  <td className="px-2 py-1 text-right">{u.rank_tier}</td>
                  <td className="px-2 py-1 text-right">{u.is_banned ? 'Yes' : 'No'}</td>
                  <td className="px-2 py-1 text-right space-x-1">
                    <button
                      onClick={async () => {
                        await adminResetElo(u.id, 1200);
                        loadUsers();
                      }}
                      className="px-2 py-1 rounded bg-slate-800"
                    >
                      Reset ELO
                    </button>
                    {u.is_banned ? (
                      <button
                        onClick={async () => {
                          await adminUnbanUser(u.id);
                          loadUsers();
                        }}
                        className="px-2 py-1 rounded bg-emerald-700"
                      >
                        Unban
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          await adminBanUser(u.id);
                          loadUsers();
                        }}
                        className="px-2 py-1 rounded bg-red-700"
                      >
                        Ban
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td colSpan={5} className="px-2 py-3 text-center text-slate-500">
                    No users loaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminPanelPage;
