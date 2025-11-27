import { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../services/userApi';

const ProfilePage = () => {
  const [profile, setProfile] = useState<any | null>(null);
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    (async () => {
      const p = await getProfile();
      setProfile(p);
      setAvatar(p.avatar_url || '');
    })();
  }, []);

  const save = async () => {
    const p = await updateProfile(avatar || null);
    setProfile(p);
  };

  if (!profile) return <div>Loading…</div>;

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-2xl font-bold">Profile</h1>
      <div className="border border-slate-800 rounded-xl p-4 space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl">
            {profile.username[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold">{profile.username}</div>
            <div className="text-xs text-slate-400">{profile.email}</div>
          </div>
        </div>
        <div>
          Rating: <span className="text-emerald-400">{profile.elo_rating}</span> ({profile.rank_tier})
        </div>
        <div className="text-xs text-slate-400">
          W/L/D: {profile.wins} / {profile.losses} / {profile.draws}
        </div>
        <div className="pt-3 border-t border-slate-800">
          <label className="text-xs text-slate-400">Avatar URL</label>
          <input
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
          />
          <button onClick={save} className="mt-2 px-3 py-1 rounded bg-emerald-600 text-xs">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
