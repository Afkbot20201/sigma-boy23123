import { useAuth } from '../hooks/useAuth';

const HomePage = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Welcome, {user?.username}</h1>
      <p className="text-sm text-slate-300">
        Rating: <span className="text-emerald-400">{user?.elo_rating}</span> ({user?.rank_tier})
      </p>
      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <a href="/play" className="border border-slate-800 rounded-xl p-4 hover:bg-slate-900">
          <h2 className="font-semibold mb-1">Quick Play</h2>
          <p className="text-slate-400">Play a casual game against another human.</p>
        </a>
        <a href="/ranked" className="border border-slate-800 rounded-xl p-4 hover:bg-slate-900">
          <h2 className="font-semibold mb-1">Ranked Ladder</h2>
          <p className="text-slate-400">Climb from Bronze to Nemesis.</p>
        </a>
        <a href="/ai" className="border border-slate-800 rounded-xl p-4 hover:bg-slate-900">
          <h2 className="font-semibold mb-1">Train vs AI</h2>
          <p className="text-slate-400">Practice offline against a local engine.</p>
        </a>
      </div>
    </div>
  );
};

export default HomePage;
