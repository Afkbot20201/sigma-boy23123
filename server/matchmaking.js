import { nanoid } from "nanoid";
import { QUEUE_TYPES, GAME_MODES, MAX_PLAYERS_PER_MATCH } from "./config.js";
import { getDb, saveSafe, logEvent } from "./persistence.js";

const queues = {
  [QUEUE_TYPES.CASUAL]: [],
  [QUEUE_TYPES.RANKED]: [],
  [QUEUE_TYPES.TRAINING]: [],
  [QUEUE_TYPES.PRIVATE]: []
};

export function getQueues() {
  return queues;
}

export async function enqueuePlayer({ userId, queueType, mode, partyId }) {
  const entry = {
    id: nanoid(),
    userId,
    queueType,
    mode,
    partyId: partyId || null,
    joinedAt: Date.now()
  };
  queues[queueType].push(entry);
  return entry;
}

export function removeFromQueues(userId) {
  for (const type of Object.keys(queues)) {
    const q = queues[type];
    const idx = q.findIndex(e => e.userId === userId);
    if (idx !== -1) q.splice(idx, 1);
  }
}

export async function matchmakingTick(gameServer) {
  await handleQueue(QUEUE_TYPES.CASUAL, GAME_MODES.TDM, gameServer);
  await handleQueue(QUEUE_TYPES.RANKED, GAME_MODES.TDM, gameServer, true);
}

async function handleQueue(queueType, defaultMode, gameServer, ranked = false) {
  const db = await getDb();
  const q = queues[queueType];
  if (q.length === 0) return;
  q.sort((a, b) => a.joinedAt - b.joinedAt);

  while (q.length >= 2) {
    const batch = q.splice(0, Math.min(MAX_PLAYERS_PER_MATCH, q.length));
    const users = batch.map(e =>
      db.data.users.find(u => u.id === e.userId)
    ).filter(Boolean);

    if (ranked) {
      users.sort((a, b) => a.elo - b.elo);
    }

    const teamA = [];
    const teamB = [];
    users.forEach((u, idx) => {
      if (idx % 2 === 0) teamA.push(u.id);
      else teamB.push(u.id);
    });

    const matchId = await gameServer.createMatch({
      mode: defaultMode,
      ranked,
      players: users.map(u => u.id),
      teams: { A: teamA, B: teamB }
    });

    await logEvent("matchmaking_match", "Match created from queue", {
      matchId,
      queueType,
      ranked,
      playerCount: users.length
    });
  }
}

export async function createPrivateLobby(ownerId, mode = GAME_MODES.TDM) {
  const lobbyCode = nanoid(6);
  const db = await getDb();
  db.data.matches.push({
    id: lobbyCode,
    isPrivateLobby: true,
    ownerId,
    players: [ownerId],
    mode,
    ranked: false,
    state: "lobby",
    createdAt: new Date().toISOString()
  });
  await saveSafe(db);
  return lobbyCode;
}

export async function joinPrivateLobby(code, userId) {
  const db = await getDb();
  const lobby = db.data.matches.find(m => m.id === code && m.isPrivateLobby);
  if (!lobby) {
    throw new Error("Lobby not found");
  }
  if (!lobby.players.includes(userId)) {
    lobby.players.push(userId);
  }
  await saveSafe(db);
  return lobby;
}
