import React from 'react';

export default function TimerBar({ remainingMs, isActive }) {
  const total = 10 * 60 * 1000;
  const pct = Math.max(0, Math.min(100, (remainingMs / total) * 100));
  return (
    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${isActive ? 'bg-emerald-400' : 'bg-slate-600'} transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
