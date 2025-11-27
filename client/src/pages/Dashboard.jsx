import React from 'react';
import { useAuth } from '../context/AuthContext';
import RankBadge from '../components/RankBadge';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome, {user.username}</h1>
          <p className="text-sm text-slate-400">
            Jump back into ranked, play a casual game, or warm up against the AI.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400">ELO</div>
            <div className="text-xl font-semibold">{user.elo}</div>
          </div>
          <RankBadge elo={user.elo} />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="text-xs text-slate-400 uppercase">Record</div>
          <div className="text-lg font-semibold">
            {user.wins}W / {user.losses}L / {user.draws}D
          </div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="text-xs text-slate-400 uppercase">Rank</div>
          <RankBadge elo={user.elo} />
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="text-xs text-slate-400 uppercase">Tips</div>
          <p className="text-sm text-slate-300">
            Queue ranked to climb the ladder, or use AI mode to try new openings without risking ELO.
          </p>
        </div>
      </div>
    </div>
  );
}
