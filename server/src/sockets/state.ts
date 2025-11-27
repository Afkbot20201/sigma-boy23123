import { Chess } from 'chess.js';

export interface LiveGame {
  gameId: string;
  whiteId: string;
  blackId: string;
  chess: Chess;
  timeControlMs: number;
  incrementMs: number;
  clocks: { white: number; black: number };
  lastMoveAt: number;
  isRated: boolean;
}

export const liveGames = new Map<string, LiveGame>();
export const rankedQueue: any[] = [];
export const casualQueue: any[] = [];
