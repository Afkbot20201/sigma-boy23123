import express from "express";
import { authMiddleware } from "../auth.js";
import { getDb, saveSafe } from "../persistence.js";

const router = express.Router();

router.get("/catalog", async (req, res) => {
  const db = await getDb();
  res.json({
    cosmetics: db.data.store.cosmetics,
    battlePass: db.data.battlePass
  });
});

router.post("/purchase", authMiddleware, async (req, res) => {
  const { cosmeticId } = req.body;
  const db = await getDb();
  const user = db.data.users.find(u => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: "Not found" });
  const cosmetic = db.data.store.cosmetics.find(c => c.id === cosmeticId);
  if (!cosmetic) return res.status(404).json({ error: "Not found" });
  const price = cosmetic.rarity === "legendary" ? 2000 :
    cosmetic.rarity === "rare" ? 800 : 200;
  if (user.currency < price) {
    return res.status(400).json({ error: "Not enough currency" });
  }
  if (!user.cosmeticsOwned.includes(cosmeticId)) {
    user.cosmeticsOwned.push(cosmeticId);
  }
  user.currency -= price;
  await saveSafe(db);
  res.json({ ok: true, currency: user.currency, cosmeticsOwned: user.cosmeticsOwned });
});

export default router;
