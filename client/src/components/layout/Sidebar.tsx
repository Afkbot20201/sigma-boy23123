import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const links = [
  { to: '/', label: 'Home' },
  { to: '/play', label: 'Play' },
  { to: '/ranked', label: 'Ranked' },
  { to: '/ai', label: 'AI Mode' },
  { to: '/profile', label: 'Profile' },
  { to: '/leaderboards', label: 'Leaderboards' },
  { to: '/settings', label: 'Settings' }
];

const Sidebar = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' && user.username === 'Gifty';

  return (
    <aside className="w-52 border-r border-slate-800 bg-slate-950/90 hidden md:flex flex-col">
      <div className="p-4 font-bold text-xl">♟️</div>
      <nav className="flex-1 flex flex-col gap-1 px-2 text-sm">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `px-3 py-2 rounded-md ${
                isActive ? 'bg-slate-800 text-emerald-300' : 'text-slate-300 hover:bg-slate-900'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `mt-4 px-3 py-2 rounded-md ${
                isActive ? 'bg-amber-800 text-amber-200' : 'text-amber-300 hover:bg-amber-900'
              }`
            }
          >
            Admin Panel
          </NavLink>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
