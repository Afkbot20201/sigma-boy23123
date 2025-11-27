import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { JWT_SECRET } from "./config.js";
import { getDb, saveSafe, logEvent } from "./persistence.js";
import { nanoid } from "nanoid";

export async function registerUser(username, password) {
  const db = await getDb();
  if (db.data.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Username already taken");
  }
  const hash = await bcrypt.hash(password, 10);
  const id = nanoid();
  const user = {
    id,
    username,
    passwordHash: hash,
    createdAt: new Date().toISOString(),
    level: 1,
    xp: 0,
    currency: 0,
    elo: 1000,
    rank: "Bronze",
    stats: {
      kills: 0,
      deaths: 0,
      wins: 0,
      losses: 0,
      shotsFired: 0,
      shotsHit: 0,
      timePlayedSeconds: 0
    },
    matches: [],
    cosmeticsOwned: ["skin_default"],
    loadout: {
      primary: "ar",
      secondary: "pistol",
      melee: "knife",
      grenade: "frag"
    },
    friends: [],
    partyId: null,
    mute: false,
    banned: false
  };
  db.data.users.push(user);
  await saveSafe(db);
  await logEvent("user_register", `User registered: ${username}`, { userId: id });
  return user;
}

export async function authenticateUser(username, password) {
  const db = await getDb();
  const user = db.data.users.find(
    u => u.username.toLowerCase() === username.toLowerCase()
  );
  if (!user) {
    throw new Error("Invalid credentials");
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new Error("Invalid credentials");
  }
  if (user.banned) {
    throw new Error("Account banned");
  }
  return user;
}

export function signJwt(user) {
  const payload = {
    sub: user.id,
    username: user.username
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

export function verifyJwt(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }
  try {
    const decoded = verifyJwt(token);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
