import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-2 rounded-xl text-sm font-medium transition
         ${isActive ? 'bg-emerald-500 text-slate-900' : 'text-slate-300 hover:bg-slate-700'}`
      }
    >
      {label}
    </NavLink>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-emerald-500 flex items-center justify-center font-black text-slate-900">
            ♟
          </div>
          <div>
            <div className="font-semibold tracking-tight">Gifty Chess</div>
            <div className="text-xs text-slate-400">Multiplayer Ranked Chess</div>
          </div>
        </div>
        <nav className="flex-1 flex justify-center">
          <div className="flex gap-1 bg-slate-900/80 px-2 py-1 rounded-2xl">
            <NavItem to="/" label="Home" />
            <NavItem to="/play" label="Play" />
            <NavItem to="/ranked" label="Ranked" />
            <NavItem to="/ai" label="AI Mode" />
            <NavItem to="/leaderboard" label="Leaderboards" />
            <NavItem to="/friends" label="Friends" />
            <NavItem to="/history" label="Game History" />
            <NavItem to="/profile" label="Profile" />
            <NavItem to="/settings" label="Settings" />
            {user?.username === 'Gifty' && <NavItem to="/admin" label="Admin" />}
          </div>
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {user && (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-sm font-medium">{user.username}</div>
                <div className="text-[11px] text-slate-400">ELO {user.elo}</div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1 rounded-xl text-xs bg-red-500 text-white hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
