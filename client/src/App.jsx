import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Register from './Register';
import ChessBoard from './ChessBoard';
import { useSocket } from './useSocket';
import { api } from './api';

function Shell() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  useEffect(() => {
    if (!user) nav('/login');
  }, [user, nav]);
  if (!user) return null;
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      <aside className="w-52 border-r border-slate-800 bg-slate-950/90 hidden md:flex flex-col">
        <div className="p-4 font-bold text-xl">♟️ Chess Arena</div>
        <nav className="flex-1 flex flex-col gap-1 px-2 text-sm">
          <NavLink to="/" label="Home" />
          <NavLink to="/play" label="Play" />
          <NavLink to="/ranked" label="Ranked" />
          <NavLink to="/ai" label="AI Mode" />
          <NavLink to="/leaderboards" label="Leaderboards" />
          <NavLink to="/history" label="History" />
          {user.role === 'admin' && user.username === 'Gifty' && (
            <NavLink to="/admin" label="Admin" />
          )}
        </nav>
        <div className="p-3 text-xs text-slate-500">Logged as {user.username}</div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-12 border-b border-slate-800 flex items-center justify-between px-4">
          <div className="font-semibold text-sm capitalize">{loc.pathname === '/' ? 'Home' : loc.pathname.slice(1)}</div>
          <button onClick={logout} className="text-xs px-3 py-1 rounded-full bg-red-600">Logout</button>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/play" element={<Play />} />
              <Route path="/ranked" element={<Ranked />} />
              <Route path="/ai" element={<AiMode />} />
              <Route path="/leaderboards" element={<Leaderboards />} />
              <Route path="/history" element={<History />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavLink({ to, label }) {
  const loc = useLocation();
  const active = loc.pathname === to;
  return (
    <Link
      to={to}
      className={
        'px-3 py-2 rounded-md ' +
        (active ? 'bg-slate-800 text-emerald-300' : 'hover:bg-slate-900 text-slate-300')
      }
    >
      {label}
    </Link>
  );
}

function Home() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Welcome, {user.username}</h1>
      <p className="text-sm text-slate-300">
        Rating: <span className="text-emerald-400">{user.elo_rating}</span> ({user.rank_tier})
      </p>
      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <Card title="Quick Play" to="/play" desc="Play a casual game." />
        <Card title="Ranked Ladder" to="/ranked" desc="Climb from Bronze to Nemesis." />
        <Card title="Train vs AI" to="/ai" desc="Practice offline vs engine." />
      </div>
    </div>
  );
}

function Card({ title, desc, to }) {
  return (
    <div className="border border-slate-800 rounded-xl p-4">
      <h2 className="font-semibold mb-1">{title}</h2>
      <p className="text-slate-400 mb-2">{desc}</p>
      <Link to={to} className="inline-flex px-3 py-1 rounded bg-emerald-600 text-xs">Open</Link>
    </div>
  );
}

function Play() {
  const socket = useSocket('/queue');
  const nav = useNavigate();
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!socket) return;
    socket.on('queue:joined', () => setStatus('queued'));
    socket.on('queue:left', () => setStatus('idle'));
    socket.on('match:found', ({ gameId }) => {
      nav('/game/' + gameId);
    });
    return () => {
      socket.off('queue:joined');
      socket.off('queue:left');
      socket.off('match:found');
    };
  }, [socket, nav]);

  const join = (tc) => socket && socket.emit('queue:join', { mode: 'casual', timeControl: tc });
  const leave = () => socket && socket.emit('queue:leave');

  if (!socket) return <div>Connecting…</div>;

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-2xl font-bold">Casual Play</h1>
      {status === 'idle' && (
        <>
          <button onClick={() => join('5+0')} className="w-full py-2 rounded bg-emerald-600">Play 5+0</button>
          <button onClick={() => join('10+0')} className="w-full py-2 rounded bg-emerald-700">Play 10+0</button>
        </>
      )}
      {status === 'queued' && (
        <>
          <div className="text-emerald-300 animate-pulse text-sm">Searching opponent…</div>
          <button onClick={leave} className="w-full py-2 rounded bg-red-600 text-sm">Cancel</button>
        </>
      )}
    </div>
  );
}

function Ranked() {
  const socket = useSocket('/queue');
  const nav = useNavigate();
  const [status, setStatus] = useState('idle');
  useEffect(() => {
    if (!socket) return;
    socket.on('queue:joined', () => setStatus('queued'));
    socket.on('queue:left', () => setStatus('idle'));
    socket.on('match:found', ({ gameId }) => nav('/game/' + gameId));
    return () => {
      socket.off('queue:joined'); socket.off('queue:left'); socket.off('match:found');
    };
  }, [socket, nav]);
  const join = (tc) => socket && socket.emit('queue:join', { mode: 'ranked', timeControl: tc });
  const leave = () => socket && socket.emit('queue:leave');
  if (!socket) return <div>Connecting…</div>;
  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-2xl font-bold text-amber-400">Ranked Queue</h1>
      {status === 'idle' && (
        <>
          <button onClick={() => join('3+2')} className="w-full py-2 rounded bg-amber-600">Blitz 3+2</button>
          <button onClick={() => join('5+0')} className="w-full py-2 rounded bg-amber-700">Blitz 5+0</button>
        </>
      )}
      {status === 'queued' && (
        <>
          <div className="text-amber-300 animate-pulse text-sm">Searching ranked opponent…</div>
          <button onClick={leave} className="w-full py-2 rounded bg-red-600 text-sm">Cancel</button>
        </>
      )}
    </div>
  );
}

function AiMode() {
  const [fen, setFen] = useState(new Chess().fen());
  const [chess] = useState(() => new Chess());

  const move = (from, to) => {
    try {
      const m = chess.move({ from, to, promotion: 'q' });
      if (!m) return;
      setFen(chess.fen());
    } catch {}
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1 flex items-center justify-center">
        <ChessBoard fen={fen} onMove={move} />
      </div>
      <div className="w-full md:w-64 border border-slate-800 rounded-xl p-4 text-sm space-y-3">
        <h1 className="text-lg font-semibold">AI Mode (simple)</h1>
        <p className="text-slate-300 text-xs">
          Local human-vs-human board using chess.js. You can extend this to use a stronger engine.
        </p>
        <button
          onClick={() => { chess.reset(); setFen(chess.fen()); }}
          className="w-full py-2 rounded bg-slate-800 text-xs"
        >
          New Game
        </button>
      </div>
    </div>
  );
}

function Leaderboards() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get('/leaderboard/global').then(r => setRows(r.data));
  }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Leaderboards</h1>
      <div className="border border-slate-800 rounded-xl overflow-x-auto text-sm">
        <table className="w-full">
          <thead className="bg-slate-900/80">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Player</th>
              <th className="px-3 py-2 text-right">ELO</th>
              <th className="px-3 py-2 text-right">Rank</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u, i) => (
              <tr key={u.id} className="odd:bg-slate-900/40">
                <td className="px-3 py-2">{i+1}</td>
                <td className="px-3 py-2">{u.username}</td>
                <td className="px-3 py-2 text-right">{u.elo_rating}</td>
                <td className="px-3 py-2 text-right">{u.rank_tier}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan="4" className="px-3 py-4 text-center text-slate-500 text-xs">No players yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function History() {
  return <div className="text-sm text-slate-300">Game history UI can be extended here (DB already stores moves).</div>;
}

function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const socket = useSocket('/admin');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user || user.username !== 'Gifty' || user.role !== 'admin') return;
    api.get('/admin/users').then(r => setUsers(r.data));
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('admin:stats');
    socket.on('admin:stats', s => setStats(s));
    const id = setInterval(() => socket.emit('admin:stats'), 5000);
    return () => { clearInterval(id); socket.off('admin:stats'); };
  }, [socket]);

  if (!user || user.username !== 'Gifty' || user.role !== 'admin') return <div>Admin only.</div>;

  return (
    <div className="space-y-4 text-sm">
      <h1 className="text-2xl font-bold text-amber-400">Admin Panel</h1>
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <Box label="Active Users" value={stats.activeUsers} />
          <Box label="Active Games" value={stats.activeGames} />
          <Box label="Ranked Queue" value={stats.rankedQueueSize} />
          <Box label="Uptime (s)" value={Math.round(stats.serverUptimeSec)} />
        </div>
      )}
      <div className="border border-slate-800 rounded-xl max-h-64 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-900/80">
            <tr>
              <th className="px-2 py-1 text-left">User</th>
              <th className="px-2 py-1 text-right">ELO</th>
              <th className="px-2 py-1 text-right">Rank</th>
              <th className="px-2 py-1 text-right">Banned</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="odd:bg-slate-900/40">
                <td className="px-2 py-1">{u.username}</td>
                <td className="px-2 py-1 text-right">{u.elo_rating}</td>
                <td className="px-2 py-1 text-right">{u.rank_tier}</td>
                <td className="px-2 py-1 text-right">{u.is_banned ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Box({ label, value }) {
  return (
    <div className="border border-slate-800 rounded-lg p-3">
      <div className="text-slate-400 text-xs">{label}</div>
      <div className="text-lg">{value}</div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={<Shell />} />
      </Routes>
    </AuthProvider>
  );
}
