import { Chess } from 'chess.js';

export const liveGames = new Map();  // gameId -> { chess, clocks, players, rated, incMs }
export const queues = {
  casual: [],
  ranked: []
};
