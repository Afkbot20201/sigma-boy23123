import express from "express";
import { registerUser, authenticateUser, signJwt } from "../auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }
    const user = await registerUser(username, password);
    const token = signJwt(user);
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }
    const user = await authenticateUser(username, password);
    const token = signJwt(user);
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
