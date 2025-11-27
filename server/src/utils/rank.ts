export function getRankTier(elo: number): string {
  if (elo < 900) return 'Bronze';
  if (elo < 1200) return 'Silver';
  if (elo < 1500) return 'Gold';
  if (elo < 1800) return 'Platinum';
  if (elo < 2100) return 'Diamond';
  return 'Nemesis';
}
