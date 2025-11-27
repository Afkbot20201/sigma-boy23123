export function calcRank(elo) {
  if (elo < 900) return 'Bronze';
  if (elo < 1200) return 'Silver';
  if (elo < 1500) return 'Gold';
  if (elo < 1800) return 'Platinum';
  if (elo < 2100) return 'Diamond';
  return 'Nemesis';
}

export function calcElo(a, b, scoreA, k = 32) {
  const expectedA = 1 / (1 + Math.pow(10, (b - a) / 400));
  const newA = Math.round(a + k * (scoreA - expectedA));
  const newB = Math.round(b + k * ((1 - scoreA) - (1 - expectedA)));
  return { newA, newB };
}
