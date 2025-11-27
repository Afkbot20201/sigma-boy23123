import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [username, setU] = useState('');
  const [email, setE] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await register(username, email, pw);
      nav('/');
    } catch {
      setErr('Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <form onSubmit={submit} className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-center">Register</h1>
        {err && <div className="text-xs text-red-400">{err}</div>}
        <div>
          <label className="text-xs text-slate-400">Username</label>
          <input className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            value={username} onChange={e => setU(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-400">Email</label>
          <input className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            value={email} onChange={e => setE(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-400">Password</label>
          <input type="password" className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            value={pw} onChange={e => setPw(e.target.value)} />
        </div>
        <button className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-sm">Register</button>
        <div className="text-xs text-slate-400 text-center">
          Already registered? <Link to="/login" className="text-emerald-400">Login</Link>
        </div>
      </form>
    </div>
  );
}
