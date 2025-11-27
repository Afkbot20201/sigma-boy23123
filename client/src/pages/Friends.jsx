import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);

  const load = async () => {
    const res = await api.get('/api/friends');
    setFriends(res.data.friends || []);
  };

  useEffect(() => {
    load();
  }, []);

  const sendRequest = async () => {
    try {
      setStatus(null);
      await api.post('/api/friends', { email });
      setEmail('');
      setStatus('Friend request sent');
      load();
    } catch (err) {
      setStatus(err.response?.data?.message || 'Failed to send request');
    }
  };

  const accept = async (id) => {
    await api.post('/api/friends/accept', { id });
    load();
  };

  const remove = async (id) => {
    await api.delete(`/api/friends/${id}`);
    load();
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Friends</h2>
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 rounded-xl bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Invite by email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={sendRequest}
            className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400"
          >
            Add
          </button>
        </div>
        {status && <div className="text-xs text-slate-400">{status}</div>}
      </div>
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Friend</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {friends.map((f) => (
              <tr key={f.id} className="border-t border-slate-800/60">
                <td className="px-3 py-2">{f.username}</td>
                <td className="px-3 py-2 text-slate-300">{f.status}</td>
                <td className="px-3 py-2 text-right">
                  {f.status === 'pending' ? (
                    <button
                      onClick={() => accept(f.id)}
                      className="px-2 py-1 rounded-lg bg-emerald-500 text-xs text-slate-900 mr-2"
                    >
                      Accept
                    </button>
                  ) : null}
                  <button
                    onClick={() => remove(f.id)}
                    className="px-2 py-1 rounded-lg bg-slate-800 text-xs hover:bg-slate-700"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {friends.length === 0 && (
              <tr>
                <td colSpan="3" className="px-3 py-4 text-center text-slate-500">
                  No friends yet. Invite someone by email.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
