import { getDb, saveSafe } from "../server/persistence.js";

const run = async () => {
  const db = await getDb();
  if (!db.data.meta || !db.data.meta.version) {
    db.data.meta = {
      version: 1,
      createdAt: new Date().toISOString(),
      lastSeasonReset: new Date().toISOString()
    };
  }
  await saveSafe(db);
  console.log("Seed completed");
};

run();
