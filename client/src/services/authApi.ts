import api from './apiClient';

export async function login(emailOrUsername: string, password: string) {
  const res = await api.post('/auth/login', { emailOrUsername, password });
  return res.data;
}

export async function register(username: string, email: string, password: string) {
  const res = await api.post('/auth/register', { username, email, password });
  return res.data;
}

export async function getMe(token: string) {
  const res = await api.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.user;
}
