export function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function updateElo(rating, expected, score, kFactor = 32) {
  return Math.round(rating + kFactor * (score - expected));
}

export function calculateRankTier(mm, tiers) {
  let tier = tiers[0].name;
  for (const t of tiers) {
    if (mm >= t.min) {
      tier = t.name;
    }
  }
  return tier;
}
