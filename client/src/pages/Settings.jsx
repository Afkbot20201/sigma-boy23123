import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Settings</h2>
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Theme</div>
            <div className="text-xs text-slate-400">Switch between light and dark modes.</div>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs"
          >
            {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>
      </div>
    </div>
  );
}
