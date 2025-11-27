import api from './apiClient';

export async function getProfile() {
  const res = await api.get('/users/me');
  return res.data;
}

export async function updateProfile(avatarUrl: string | null) {
  const res = await api.put('/users/me', { avatarUrl });
  return res.data;
}
