import api from './apiClient';

export async function adminListUsers(limit = 50, offset = 0) {
  const res = await api.get('/admin/users', { params: { limit, offset } });
  return res.data;
}

export async function adminBanUser(id: string) {
  const res = await api.post(`/admin/users/${id}/ban`);
  return res.data;
}

export async function adminUnbanUser(id: string) {
  const res = await api.post(`/admin/users/${id}/unban`);
  return res.data;
}

export async function adminResetElo(id: string, newRating = 1200) {
  const res = await api.post(`/admin/users/${id}/reset-elo`, { newRating });
  return res.data;
}
