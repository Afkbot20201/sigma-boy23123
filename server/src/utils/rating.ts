export function calculateElo(ratingA: number, ratingB: number, scoreA: 0 | 0.5 | 1, kFactor = 32) {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const newRatingA = Math.round(ratingA + kFactor * (scoreA - expectedA));
  const newRatingB = Math.round(ratingB + kFactor * ((1 - scoreA) - (1 - expectedA)));
  return { newRatingA, newRatingB };
}
