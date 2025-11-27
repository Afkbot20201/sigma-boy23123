// Basic anti-cheat helpers
const moveRateWindowMs = 5000;
const maxMovesPerWindow = 15;

class AntiCheatTracker {
  constructor() {
    this.playerMoves = new Map();
  }

  registerMove(playerId) {
    const now = Date.now();
    const info = this.playerMoves.get(playerId) || { moves: [] };
    info.moves = info.moves.filter((t) => now - t < moveRateWindowMs);
    info.moves.push(now);
    this.playerMoves.set(playerId, info);
    if (info.moves.length > maxMovesPerWindow) {
      return false;
    }
    return true;
  }
}

const antiCheatTracker = new AntiCheatTracker();

module.exports = { antiCheatTracker };
