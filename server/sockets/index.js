import { removeFromQueues } from "../matchmaking.js";
import { GameServer } from "../gameServer.js";
import { verifyJwt } from "../auth.js";
import { registerPacket } from "../antiCheat.js";

export function setupSockets(io) {
  const gameServer = new GameServer(io);
  gameServer.start();

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Missing token"));
    try {
      const payload = verifyJwt(token);
      socket.user = { id: payload.sub, username: payload.username };
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", socket => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);

    socket.on("queue:status", () => {
      socket.emit("queue:status", { ok: true });
    });

    socket.on("match:join", ({ matchId }) => {
      socket.join(matchId);
      socket.emit("match:joined", { matchId });
    });

    socket.on("input", ({ matchId, seq, input }) => {
      registerPacket(userId);
      const match = gameServer.getMatch(matchId);
      if (!match) return;
      match.applyInput(userId, input);
    });

    socket.on("match:forfeit", ({ matchId }) => {
      const match = gameServer.getMatch(matchId);
      if (match && match.players[userId]) {
        match.players[userId].disconnected = true;
      }
    });

    socket.on("disconnect", reason => {
      removeFromQueues(userId);
    });
  });

  return gameServer;
}
