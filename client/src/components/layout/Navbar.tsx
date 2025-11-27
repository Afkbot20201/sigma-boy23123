import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();
  return (
    <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950/80">
      <div className="font-semibold text-lg">Chess Arena</div>
      <div className="flex items-center gap-3 text-sm">
        <span>
          {user?.username} <span className="text-emerald-400">({user?.elo_rating})</span>
        </span>
        <button
          onClick={logout}
          className="px-3 py-1 rounded-full bg-red-600 hover:bg-red-500 text-xs"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
