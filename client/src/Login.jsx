import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await login(id, pw);
      nav('/');
    } catch (e) {
      setErr('Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <form onSubmit={submit} className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-center">Login</h1>
        {err && <div className="text-xs text-red-400">{err}</div>}
        <div>
          <label className="text-xs text-slate-400">Email or username</label>
          <input className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            value={id} onChange={e => setId(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-400">Password</label>
          <input type="password" className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            value={pw} onChange={e => setPw(e.target.value)} />
        </div>
        <button className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-sm">Login</button>
        <div className="text-xs text-slate-400 text-center">
          No account? <Link to="/register" className="text-emerald-400">Register</Link>
        </div>
      </form>
    </div>
  );
}
