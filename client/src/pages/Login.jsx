import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
      <div className="w-full max-w-md bg-slate-950 rounded-2xl shadow-xl border border-slate-800 p-6 space-y-4">
        <h1 className="text-xl font-semibold">Welcome back to Gifty Chess</h1>
        {error && <div className="text-sm text-red-400">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-400">Email</label>
            <input
              type="email"
              className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Password</label>
            <input
              type="password"
              className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button
            disabled={loading}
            className="w-full mt-2 px-3 py-2 rounded-xl bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="text-xs text-slate-400">
          Need an account?{' '}
          <Link to="/register" className="text-emerald-400">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
