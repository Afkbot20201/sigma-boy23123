import { io } from "socket.io-client";

let socket;
let seq = 0;
let currentMatchId = null;

export function connectSocket(token) {
  socket = io("/", { auth: { token } });
  return socket;
}

export function joinMatch(matchId) {
  currentMatchId = matchId;
  socket.emit("match:join", { matchId });
}

export function sendInput(matchId, input) {
  if (!socket) return;
  seq += 1;
  socket.emit("input", { matchId, seq, input });
}

export function onMatchEvents({ onStart, onState, onEnd }) {
  if (!socket) return;
  socket.on("match:start", onStart);
  socket.on("match:state", onState);
  socket.on("match:end", onEnd);
}

export function offMatchEvents() {
  if (!socket) return;
  socket.off("match:start");
  socket.off("match:state");
  socket.off("match:end");
}
