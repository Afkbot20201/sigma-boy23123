
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Chess } = require("chess.js");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static("public"));

const games = {}; // roomId -> { chess, players: Map(socketId->name), colors: Map(socketId->"w"/"b"), ranked?:bool, ai?:bool }
const elo = {};   // name -> rating
const rankedQueue = []; // { socket, name }

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

io.on("connection", (socket) => {
  console.log("connected", socket.id);

  socket.on("eloSelf", ({ name }, cb) => {
    cb && cb({ elo: getElo(name) });
  });

  socket.on("rankedQueue", ({ name }) => {
    if (!name) name = "Player";
    socket.playerName = name;
    rankedQueue.push({ socket, name });
    if (rankedQueue.length >= 2) {
      const a = rankedQueue.shift();
      const b = rankedQueue.shift();
      const room = makeId();
      const chess = new Chess();
      games[room] = {
        chess,
        players: new Map(),
        colors: new Map(),
        ranked: true,
        ai: false
      };
      games[room].players.set(a.socket.id, a.name);
      games[room].players.set(b.socket.id, b.name);
      games[room].colors.set(a.socket.id, "w");
      games[room].colors.set(b.socket.id, "b");
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
    if (!name) name = "Player";
    let room = makeId();
    while (games[room]) room = makeId();
    const chess = new Chess();
    games[room] = {
      chess,
      players: new Map(),
      colors: new Map(),
      ranked: false,
      ai: false
    };
    cb && cb({ room });
  });

  socket.on("join", ({ room, name }, cb) => {
    if (!name) name = "Player";
    if (!games[room]) {
      const chess = new Chess();
      games[room] = {
        chess,
        players: new Map(),
        colors: new Map(),
        ranked: false,
        ai: false
      };
    }
    const g = games[room];
    if (g.players.size >= 2 && !g.players.has(socket.id) && !g.ai) {
      cb && cb({ ok: false, err: "Room full" });
      return;
    }
    socket.join(room);
    g.players.set(socket.id, name);
    if (!g.colors.has(socket.id)) {
      const used = Array.from(g.colors.values());
      if (!used.includes("w")) g.colors.set(socket.id, "w");
      else g.colors.set(socket.id, "b");
    }
    const playersArr = [];
    for (const [id, nm] of g.players.entries()) {
      playersArr.push({ name: nm, color: g.colors.get(id), elo: getElo(nm) });
    }
    const chess = g.chess;
    cb &&
      cb({
        ok: true,
        room,
        fen: chess.fen(),
        color: g.colors.get(socket.id),
        turn: chess.turn(),
        players: playersArr,
        ranked: !!g.ranked,
        ai: !!g.ai,
        pgn: chess.pgn()
      });
    io.to(room).emit("state", {
      fen: chess.fen(),
      turn: chess.turn(),
      players: playersArr,
      pgn: chess.pgn()
    });
  });

  socket.on("aiGame", ({ name }, cb) => {
    if (!name) name = "Player";
    let room = makeId();
    const chess = new Chess();
    games[room] = {
      chess,
      players: new Map(),
      colors: new Map(),
      ranked: false,
      ai: true
    };
    games[room].players.set(socket.id, name);
    games[room].colors.set(socket.id, "w");
    socket.join(room);
    const playersArr = [
      { name, color: "w", elo: getElo(name) },
      { name: "AI", color: "b", elo: 0 }
    ];
    cb &&
      cb({
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
    const g = games[room];
    if (!g) {
      cb && cb({ ok: false, err: "No such room" });
      return;
    }
    const chess = g.chess;
    const playerColor = g.colors.get(socket.id);
    if (!playerColor) {
      cb && cb({ ok: false, err: "Not in room" });
      return;
    }
    if (playerColor !== chess.turn()) {
      cb && cb({ ok: false, err: "Not your turn" });
      return;
    }
    const result = chess.move({ from, to });
    if (!result) {
      cb && cb({ ok: false, err: "Illegal move" });
      return;
    }

    const playersArr = [];
    for (const [id, nm] of g.players.entries()) {
      playersArr.push({ name: nm, color: g.colors.get(id), elo: getElo(nm) });
    }

    io.to(room).emit("state", {
      fen: chess.fen(),
      turn: chess.turn(),
      lastMove: result,
      players: playersArr,
      pgn: chess.pgn()
    });

    // Ranked Elo update on game over
    if (chess.isGameOver() && g.ranked) {
      const winnerColor = result.color;
      let winnerName = null;
      let loserName = null;
      for (const [id, nm] of g.players.entries()) {
        if (g.colors.get(id) === winnerColor) winnerName = nm;
        else loserName = nm;
      }
      updateElo(winnerName, loserName);
    }

    cb && cb({ ok: true });

    // AI reply if needed
    if (g.ai && !chess.isGameOver()) {
      if (chess.turn() === "b") {
        const moves = chess.moves({ verbose: true });
        if (moves.length) {
          const m = moves[Math.floor(Math.random() * moves.length)];
          const aiRes = chess.move({ from: m.from, to: m.to, promotion: m.promotion });
          io.to(room).emit("state", {
            fen: chess.fen(),
            turn: chess.turn(),
            lastMove: aiRes,
            players: playersArr,
            pgn: chess.pgn()
          });
        }
      }
    }
  });

  socket.on("reset", ({ room }) => {
    const g = games[room];
    if (!g) return;
    const chess = g.chess;
    chess.reset();
    const playersArr = [];
    for (const [id, nm] of g.players.entries()) {
      playersArr.push({ name: nm, color: g.colors.get(id), elo: getElo(nm) });
    }
    io.to(room).emit("state", {
      fen: chess.fen(),
      turn: chess.turn(),
      players: playersArr,
      pgn: chess.pgn()
    });
  });

  socket.on("chat", ({ room, name, msg }) => {
    if (!room || !msg) return;
    io.to(room).emit("chat", {
      name: name || "Player",
      msg: String(msg).slice(0, 200),
      ts: Date.now()
    });
  });

  socket.on("disconnect", () => {
    for (let i = rankedQueue.length - 1; i >= 0; i--) {
      if (rankedQueue[i].socket.id === socket.id) {
        rankedQueue.splice(i, 1);
      }
    }
    for (const room of Object.keys(games)) {
      const g = games[room];
      if (g.players.has(socket.id)) {
        g.players.delete(socket.id);
        g.colors.delete(socket.id);
        if (g.players.size === 0) delete games[room];
      }
    }
    console.log("disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server listening on", PORT));
