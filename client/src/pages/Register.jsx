import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
      <div className="w-full max-w-md bg-slate-950 rounded-2xl shadow-xl border border-slate-800 p-6 space-y-4">
        <h1 className="text-xl font-semibold">Create your Gifty Chess account</h1>
        <p className="text-xs text-slate-400">
          The username <span className="text-emerald-400 font-semibold">Gifty</span> is reserved for the only admin.
        </p>
        {error && <div className="text-sm text-red-400">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-400">Username</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
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
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>
        <div className="text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-400">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
