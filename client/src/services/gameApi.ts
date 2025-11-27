import api from './apiClient';

export async function getGame(gameId: string) {
  const res = await api.get(`/games/${gameId}`);
  return res.data;
}

export async function getGameMoves(gameId: string) {
  const res = await api.get(`/games/${gameId}/moves`);
  return res.data;
}
