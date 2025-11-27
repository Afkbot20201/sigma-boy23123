import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PORT = process.env.PORT || 3000;
export const JWT_SECRET = process.env.JWT_SECRET || "devsecretchangeme";
export const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "changeme-admin-key";
export const SESSION_TICK_RATE = Number(process.env.SESSION_TICK_RATE || 20);
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, "data");

export const RANK_TIERS = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 800 },
  { name: "Gold", min: 1200 },
  { name: "Platinum", min: 1600 },
  { name: "Diamond", min: 2000 },
  { name: "Nemesis", min: 2400 }
];

export const QUEUE_TYPES = {
  CASUAL: "casual",
  RANKED: "ranked",
  TRAINING: "training",
  PRIVATE: "private"
};

export const GAME_MODES = {
  TDM: "tdm",
  FFA: "ffa",
  DOMINATION: "domination",
  TRAINING: "training",
  RANGE: "range"
};

export const MAX_PLAYERS_PER_MATCH = 8;

export const SPEED_HACK_THRESHOLD = 1.8; // multiplier of max speed
export const MAX_PACKET_PER_SECOND = 60;
