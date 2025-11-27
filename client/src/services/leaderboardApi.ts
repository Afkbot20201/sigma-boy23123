import api from './apiClient';

export async function getGlobalLeaderboard(limit = 100, offset = 0) {
  const res = await api.get('/leaderboard/global', { params: { limit, offset } });
  return res.data;
}
