import React from 'react';

export default function RankBadge({ elo }) {
  let tier = 'Bronze';
  let color = 'bg-amber-500';
  if (elo >= 1000 && elo < 1200) {
    tier = 'Silver'; color = 'bg-slate-300 text-slate-900';
  } else if (elo >= 1200 && elo < 1500) {
    tier = 'Gold'; color = 'bg-yellow-400 text-yellow-950';
  } else if (elo >= 1500 && elo < 1800) {
    tier = 'Platinum'; color = 'bg-cyan-400 text-cyan-950';
  } else if (elo >= 1800 && elo < 2100) {
    tier = 'Diamond'; color = 'bg-blue-400 text-blue-950';
  } else if (elo >= 2100) {
    tier = 'Nemesis'; color = 'bg-purple-500';
  }
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold ${color}`}>
      {tier}
    </span>
  );
}
