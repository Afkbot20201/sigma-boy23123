
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Chess } = require("chess.js");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static("public"));

const games = {};
const elo = {};
const rankedQueue = [];

function makeId(len = 6) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function getElo(name) {
  if (!name) name = "Player";
  if (!elo[name]) elo[name] = 1000;
  return elo[name];
}

function updateElo(winnerName, loserName) {
  if (!winnerName || !loserName) return;
  getElo(winnerName);
  getElo(loserName);
  elo[winnerName] += 20;
  elo[loserName] -= 10;
}

function coordsValid(sq) {
  return typeof sq === "string" && /^[a-h][1-8]$/.test(sq);
}

io.on("connection", (socket) => {
  socket.on("eloSelf", ({ name }, cb) => {
    try {
      cb && cb({ ok: true, elo: getElo(name) });
    } catch {
      cb && cb({ ok: false });
    }
  });

  socket.on("rankedQueue", ({ name }) => {
    name = name || "Player";
    rankedQueue.push({ socket, name });

    if (rankedQueue.length >= 2) {
      const a = rankedQueue.shift();
      const b = rankedQueue.shift();
      const room = makeId();
      const chess = new Chess();

      games[room] = {
        chess,
        players: new Map([[a.socket.id, a.name], [b.socket.id, b.name]]),
        colors: new Map([[a.socket.id, "w"], [b.socket.id, "b"]]),
        ranked: true,
        ai: false
      };

      a.socket.join(room);
      b.socket.join(room);

      const playersArr = [
        { name: a.name, color: "w", elo: getElo(a.name) },
        { name: b.name, color: "b", elo: getElo(b.name) }
      ];

      const payload = {
        room,
        fen: chess.fen(),
        turn: chess.turn(),
        players: playersArr,
        pgn: chess.pgn()
      };

      a.socket.emit("rankedFound", { ...payload, asColor: "w" });
      b.socket.emit("rankedFound", { ...payload, asColor: "b" });
    }
  });

  socket.on("create", ({ name }, cb) => {
    name = name || "Player";
    let room = makeId();
    while (games[room]) room = makeId();

    games[room] = {
      chess: new Chess(),
      players: new Map(),
      colors: new Map(),
      ranked: false,
      ai: false
    };

    cb && cb({ ok: true, room });
  });

  socket.on("join", ({ room, name }, cb) => {
    name = name || "Player";

    if (!games[room]) {
      games[room] = {
        chess: new Chess(),
        players: new Map(),
        colors: new Map(),
        ranked: false,
        ai: false
      };
    }

    const g = games[room];

    if (!g.ai && g.players.size >= 2 && !g.players.has(socket.id)) {
      cb && cb({ ok: false, err: "Room full" });
      return;
    }

    socket.join(room);
    g.players.set(socket.id, name);

    if (!g.colors.has(socket.id)) {
      const used = Array.from(g.colors.values());
      g.colors.set(socket.id, used.includes("w") ? "b" : "w");
    }

    const playersArr = [];
    for (const [id, nm] of g.players.entries()) {
      playersArr.push({ name: nm, color: g.colors.get(id), elo: getElo(nm) });
    }

    cb && cb({
      ok: true,
      room,
      fen: g.chess.fen(),
      color: g.colors.get(socket.id),
      turn: g.chess.turn(),
      players: playersArr,
      ranked: g.ranked,
      ai: g.ai,
      pgn: g.chess.pgn()
    });

    io.to(room).emit("state", {
      fen: g.chess.fen(),
      turn: g.chess.turn(),
      players: playersArr,
      pgn: g.chess.pgn()
    });
  });

  socket.on("aiGame", ({ name }, cb) => {
    name = name || "Player";
    const room = makeId();
    const chess = new Chess();

    games[room] = {
      chess,
      players: new Map([[socket.id, name]]),
      colors: new Map([[socket.id, "w"]]),
      ranked: false,
      ai: true
    };

    socket.join(room);

    const playersArr = [
      { name, color: "w", elo: getElo(name) },
      { name: "AI", color: "b", elo: 0 }
    ];

    cb && cb({
      ok: true,
      room,
      fen: chess.fen(),
      color: "w",
      turn: chess.turn(),
      players: playersArr,
      ranked: false,
      ai: true,
      pgn: chess.pgn()
    });

    io.to(room).emit("state", {
      fen: chess.fen(),
      turn: chess.turn(),
      players: playersArr,
      pgn: chess.pgn()
    });
  });

  socket.on("move", ({ room, from, to }, cb) => {
    try {
      const g = games[room];
      if (!g || !coordsValid(from) || !coordsValid(to)) {
        cb && cb({ ok: false });
        return;
      }

      const playerColor = g.colors.get(socket.id);
      if (!playerColor || playerColor !== g.chess.turn()) {
        cb && cb({ ok: false });
        return;
      }

      const result = g.chess.move({ from, to });
      if (!result) {
        cb && cb({ ok: false });
        return;
      }

      const playersArr = [];
      for (const [id, nm] of g.players.entries()) {
        playersArr.push({ name: nm, color: g.colors.get(id), elo: getElo(nm) });
      }

      io.to(room).emit("state", {
        fen: g.chess.fen(),
        turn: g.chess.turn(),
        lastMove: result,
        players: playersArr,
        pgn: g.chess.pgn()
      });

      if (g.ai && g.chess.turn() === "b") {
        const moves = g.chess.moves({ verbose: true });
        if (moves.length) {
          const m = moves[Math.floor(Math.random() * moves.length)];
          const aiRes = g.chess.move({ from: m.from, to: m.to, promotion: m.promotion });
          io.to(room).emit("state", {
            fen: g.chess.fen(),
            turn: g.chess.turn(),
            lastMove: aiRes,
            players: playersArr,
            pgn: g.chess.pgn()
          });
        }
      }

      cb && cb({ ok: true });
    } catch {
      cb && cb({ ok: false });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server on", PORT));
