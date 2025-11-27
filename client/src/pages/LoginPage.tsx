import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const { loginFn } = useAuth();
  const nav = useNavigate();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      await loginFn(id, pw);
      nav('/');
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <form
        onSubmit={submit}
        className="w-full max-w-sm border border-slate-800 bg-slate-900/80 p-6 rounded-xl space-y-4"
      >
        <h1 className="text-xl font-semibold text-center">Login</h1>
        {err && <div className="text-xs text-red-400">{err}</div>}
        <div>
          <label className="text-xs text-slate-400">Email or Username</label>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">Password</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm"
          />
        </div>
        <button className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-sm">
          Login
        </button>
        <p className="text-xs text-slate-400 text-center">
          No account?{' '}
          <Link to="/register" className="text-emerald-400">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
