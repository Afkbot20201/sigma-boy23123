import React from 'react';
import TimerBar from './TimerBar';
import RankBadge from './RankBadge';

export default function GameSidebar({ white, black, timers, turn, isRanked, onResign, onOfferDraw }) {
  return (
    <div className="flex flex-col h-full bg-slate-900/80 rounded-2xl border border-slate-800 p-3 gap-3">
      <div className="flex justify-between items-center">
        <div className="text-xs uppercase tracking-wide text-slate-400">
          {isRanked ? 'Ranked Match' : 'Casual Match'}
        </div>
      </div>
      <div className="space-y-3 text-sm">
        <div className={`p-2 rounded-xl ${turn === 'white' ? 'bg-slate-800' : 'bg-slate-900'}`}>
          <div className="flex justify-between items-center mb-1">
            <div className="font-medium">{white.username}</div>
            <RankBadge elo={white.elo} />
          </div>
          <TimerBar remainingMs={timers.white} isActive={turn === 'white'} />
        </div>
        <div className={`p-2 rounded-xl ${turn === 'black' ? 'bg-slate-800' : 'bg-slate-900'}`}>
          <div className="flex justify-between items-center mb-1">
            <div className="font-medium">{black.username}</div>
            <RankBadge elo={black.elo} />
          </div>
          <TimerBar remainingMs={timers.black} isActive={turn === 'black'} />
        </div>
      </div>
      <div className="mt-auto flex gap-2">
        <button
          onClick={onOfferDraw}
          className="flex-1 px-3 py-2 rounded-xl bg-slate-800 text-xs hover:bg-slate-700"
        >
          Offer Draw
        </button>
        <button
          onClick={onResign}
          className="flex-1 px-3 py-2 rounded-xl bg-red-500 text-xs text-white hover:bg-red-600"
        >
          Resign
        </button>
      </div>
    </div>
  );
}
