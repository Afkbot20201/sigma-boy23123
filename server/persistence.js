import { JSONFilePreset } from "lowdb/node";
import fs from "fs";
import path from "path";
import { DATA_DIR } from "./config.js";

const dbPath = path.join(DATA_DIR, "db.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function recoverCorruptFile() {
  if (!fs.existsSync(dbPath)) return;
  const backupName = `db_corrupt_${Date.now()}.json`;
  const backupPath = path.join(DATA_DIR, backupName);
  fs.renameSync(dbPath, backupPath);
}

async function createDefault() {
  return {
    meta: {
      version: 1,
      createdAt: new Date().toISOString(),
      lastSeasonReset: new Date().toISOString()
    },
    users: [],
    sessions: [],
    matches: [],
    leaderboards: {
      ranked: [],
      casual: []
    },
    bans: [],
    cheats: [],
    store: {
      currencyPerKill: 10,
      cosmetics: [
        { id: "skin_default", name: "Recruit Armor", rarity: "common" },
        { id: "skin_shadow", name: "Shadow Operative", rarity: "rare" },
        { id: "skin_nemesis", name: "Nemesis Prime", rarity: "legendary" }
      ]
    },
    battlePass: {
      season: 1,
      tiers: Array.from({ length: 30 }).map((_, i) => ({
        level: i + 1,
        reward: i % 5 === 0 ? "skin_shadow" : "currency"
      }))
    },
    logs: []
  };
}

export async function getDb() {
  ensureDir();
  let db;
  try {
    db = await JSONFilePreset(dbPath, await createDefault());
  } catch (e) {
    recoverCorruptFile();
    db = await JSONFilePreset(dbPath, await createDefault());
  }
  return db;
}

export async function saveSafe(db) {
  const tmpPath = `${dbPath}.tmp`;
  await fs.promises.writeFile(tmpPath, JSON.stringify(db.data, null, 2), "utf-8");
  await fs.promises.rename(tmpPath, dbPath);
}

export async function logEvent(type, message, extra = {}) {
  const db = await getDb();
  db.data.logs.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    time: new Date().toISOString(),
    type,
    message,
    ...extra
  });
  if (db.data.logs.length > 1000) {
    db.data.logs.splice(0, db.data.logs.length - 1000);
  }
  await saveSafe(db);
}
