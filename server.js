const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Chess } = require('chess.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

const games = {}; // roomId -> { chess, players: Map(socketId->name), colors: Map(socketid->'w'|'b') }

function makeId(len=6){
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for(let i=0;i<len;i++) s += chars[Math.floor(Math.random()*chars.length)];
  return s;
}

io.on('connection', (socket) => {
  console.log('conn', socket.id);

  socket.on('create', ({name}, cb) => {
    let room = makeId();
    while(games[room]) room = makeId();
    const chess = new Chess();
    games[room] = { chess, players: new Map(), colors: new Map() };
    cb({ room });
  });

  socket.on('join', ({room, name}, cb) => {
    if(!games[room]) {
      const chess = new Chess();
      games[room] = { chess, players: new Map(), colors: new Map() };
    }
    const g = games[room];
    if(g.players.size >= 2 && !g.players.has(socket.id)) {
      cb({ ok: false, err: 'Room full' }); return;
    }
    socket.join(room);
    g.players.set(socket.id, name || 'Guest');
    // assign color if not assigned
    const assignedColors = Array.from(g.colors.values());
    if(!g.colors.has(socket.id)) {
      if(!assignedColors.includes('w')) g.colors.set(socket.id, 'w');
      else if(!assignedColors.includes('b')) g.colors.set(socket.id, 'b');
      else g.colors.set(socket.id, 'w');
    }
    // prepare players array
    const playersArr = [];
    for(const [id, nm] of g.players.entries()){
      playersArr.push({id, name: nm, color: g.colors.get(id)});
    }
    cb({ ok: true, fen: g.chess.fen(), pgn: g.chess.pgn(), color: g.colors.get(socket.id), turn: g.chess.turn(), players: playersArr });
    // inform others
    io.to(room).emit('state', { fen: g.chess.fen(), pgn: g.chess.pgn(), turn: g.chess.turn(), players: playersArr });
  });

  socket.on('move', ({room, from, to, promotion}, cb) => {
    const g = games[room];
    if(!g) { cb && cb({ ok:false, err:'No such room' }); return; }
    const chess = g.chess;
    const playerColor = g.colors.get(socket.id);
    if(!playerColor) { cb && cb({ ok:false, err:'Not in room' }); return; }
    // check turn: only allow if player's color matches chess.turn()
    if(playerColor !== chess.turn()) {
      cb && cb({ ok:false, err:'Not your turn' });
      return;
    }
    const move = { from, to };
    if(promotion) move.promotion = promotion;
    const result = chess.move(move);
    if(result) {
      const playersArr = [];
      for(const [id, nm] of g.players.entries()){
        playersArr.push({id, name: nm, color: g.colors.get(id)});
      }
      io.to(room).emit('state', { fen: chess.fen(), pgn: chess.pgn(), turn: chess.turn(), lastMove: result, players: playersArr });
      cb && cb({ ok:true, move: result });
    } else {
      cb && cb({ ok:false, err:'Illegal move' });
    }
  });

  socket.on('reset', ({room}, cb) => {
    const g = games[room];
    if(!g) { cb && cb({ok:false}); return; }
    g.chess.reset();
    const playersArr = [];
    for(const [id, nm] of g.players.entries()){
      playersArr.push({id, name: nm, color: g.colors.get(id)});
    }
    io.to(room).emit('state', { fen: g.chess.fen(), pgn: g.chess.pgn(), turn: g.chess.turn(), players: playersArr });
    cb && cb({ok:true});
  });

  socket.on('leave', ({room}) => {
    const g = games[room];
    if(g) {
      g.players.delete(socket.id);
      g.colors.delete(socket.id);
      const playersArr = [];
      for(const [id, nm] of g.players.entries()){
        playersArr.push({id, name: nm, color: g.colors.get(id)});
      }
      io.to(room).emit('state', { fen: g.chess.fen(), pgn: g.chess.pgn(), turn: g.chess.turn(), players: playersArr });
      if(g.players.size === 0) delete games[room]; // cleanup
    }
    socket.leave(room);
  });

  socket.on('disconnect', () => {
    // remove from any rooms
    for(const room of Object.keys(games)) {
      const g = games[room];
      if(g.players.has(socket.id)) {
        g.players.delete(socket.id);
        g.colors.delete(socket.id);
        const playersArr = [];
        for(const [id, nm] of g.players.entries()){
          playersArr.push({id, name: nm, color: g.colors.get(id)});
        }
        io.to(room).emit('state', { fen: g.chess.fen(), pgn: g.chess.pgn(), turn: g.chess.turn(), players: playersArr });
        if(g.players.size === 0) delete games[room];
      }
    }
    console.log('disc', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port', PORT));
