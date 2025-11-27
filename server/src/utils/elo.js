// Basic ELO implementation
const K_FACTOR = 32;

function expectedScore(rating, opponentRating) {
  return 1 / (1 + Math.pow(10, (opponentRating - rating) / 400));
}

function calculateNewRatings(ratingA, ratingB, scoreA) {
  const expectedA = expectedScore(ratingA, ratingB);
  const expectedB = expectedScore(ratingB, ratingA);
  const scoreB = 1 - scoreA;
  const newRatingA = Math.round(ratingA + K_FACTOR * (scoreA - expectedA));
  const newRatingB = Math.round(ratingB + K_FACTOR * (scoreB - expectedB));
  return { newRatingA, newRatingB };
}

function getRankTier(elo) {
  if (elo < 1000) return 'Bronze';
  if (elo < 1200) return 'Silver';
  if (elo < 1500) return 'Gold';
  if (elo < 1800) return 'Platinum';
  if (elo < 2100) return 'Diamond';
  return 'Nemesis';
}

module.exports = {
  expectedScore,
  calculateNewRatings,
  getRankTier
};
