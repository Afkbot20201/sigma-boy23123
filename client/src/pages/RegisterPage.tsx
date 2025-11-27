import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const { registerFn } = useAuth();
  const nav = useNavigate();
  const [u, setU] = useState('');
  const [e, setE] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErr('');
    try {
      await registerFn(u, e, p);
      nav('/');
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <form
        onSubmit={submit}
        className="w-full max-w-sm border border-slate-800 bg-slate-900/80 p-6 rounded-xl space-y-4"
      >
        <h1 className="text-xl font-semibold text-center">Create account</h1>
        {err && <div className="text-xs text-red-400">{err}</div>}
        <div>
          <label className="text-xs text-slate-400">Username</label>
          <input
            value={u}
            onChange={(e) => setU(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">Email</label>
          <input
            value={e}
            onChange={(ev) => setE(ev.target.value)}
            className="mt-1 w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">Password</label>
          <input
            type="password"
            value={p}
            onChange={(ev) => setP(ev.target.value)}
            className="mt-1 w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm"
          />
        </div>
        <button className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-sm">
          Register
        </button>
        <p className="text-xs text-slate-400 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-400">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
