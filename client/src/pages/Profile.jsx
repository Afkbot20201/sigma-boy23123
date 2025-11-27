import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import RankBadge from '../components/RankBadge';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setAvatarUrl(user.avatar_url || '');
  }, [user]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    const res = await api.put('/api/users/me', { avatarUrl });
    setSaving(false);
    setSaved(true);
    if (setUser) {
      setUser(res.data.user);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Profile</h2>
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center text-3xl">
            {user.username[0].toUpperCase()}
          </div>
          <div className="text-sm font-medium">{user.username}</div>
          <RankBadge elo={user.elo} />
        </div>
        <div className="flex-1 space-y-3 text-sm">
          <div>
            <div className="text-xs text-slate-400">Email</div>
            <div>{user.email}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Avatar URL</div>
            <input
              className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          {saved && <div className="text-xs text-emerald-400">Profile updated</div>}
        </div>
      </div>
    </div>
  );
}
