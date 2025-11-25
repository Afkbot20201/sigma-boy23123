const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Chess } = require('chess.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

const games = {}; // roomId -> { chess: Chess, players: Set(socket.id), colors: {socketid: 'w'|'b'} }

function makeId(len=6){
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for(let i=0;i<len;i++) s += chars[Math.floor(Math.random()*chars.length)];
  return s;
}

io.on('connection', (socket) => {
  console.log('conn', socket.id);

  socket.on('create', (cb) => {
    let room = makeId();
    while(games[room]) room = makeId();
    const chess = new Chess();
    games[room] = { chess, players: new Set(), colors: {} };
    cb({ room });
  });

  socket.on('join', ({room}, cb) => {
    if(!games[room]) {
      const chess = new Chess();
      games[room] = { chess, players: new Set(), colors: {} };
    }
    const g = games[room];
    if(g.players.size >= 2 && !g.players.has(socket.id)) {
      cb({ ok: false, err: 'Room full' }); return;
    }
    socket.join(room);
    g.players.add(socket.id);
    // assign color if not assigned
    const assignedColors = Object.values(g.colors);
    if(!g.colors[socket.id]) {
      if(!assignedColors.includes('w')) g.colors[socket.id] = 'w';
      else if(!assignedColors.includes('b')) g.colors[socket.id] = 'b';
      else g.colors[socket.id] = 'w';
    }
    cb({ ok: true, fen: g.chess.fen(), pgn: g.chess.pgn(), color: g.colors[socket.id], turn: g.chess.turn(), players: g.players.size });
    // inform others
    io.to(room).emit('state', { fen: g.chess.fen(), pgn: g.chess.pgn(), turn: g.chess.turn(), players: g.players.size });
  });

  socket.on('move', ({room, from, to, promotion}, cb) => {
    const g = games[room];
    if(!g) { cb && cb({ ok:false, err:'No such room' }); return; }
    const chess = g.chess;
    const playerColor = g.colors[socket.id];
    if(!playerColor) { cb && cb({ ok:false, err:'Not in room' }); return; }
    // check turn: only allow if player's color matches chess.turn()
    if(playerColor !== chess.turn()) {
      cb && cb({ ok:false, err:'Not your turn' });
      return;
    }
    // try move
    const move = { from, to };
    if(promotion) move.promotion = promotion;
    const result = chess.move(move);
    if(result) {
      io.to(room).emit('state', { fen: chess.fen(), pgn: chess.pgn(), turn: chess.turn(), lastMove: result });
      cb && cb({ ok:true, move: result });
    } else {
      cb && cb({ ok:false, err:'Illegal move' });
    }
  });

  socket.on('reset', ({room}, cb) => {
    const g = games[room];
    if(!g) { cb && cb({ok:false}); return; }
    g.chess.reset();
    io.to(room).emit('state', { fen: g.chess.fen(), pgn: g.chess.pgn(), turn: g.chess.turn() });
    cb && cb({ok:true});
  });

  socket.on('leave', ({room}) => {
    const g = games[room];
    if(g) {
      g.players.delete(socket.id);
      delete g.colors[socket.id];
      io.to(room).emit('state', { fen: g.chess.fen(), pgn: g.chess.pgn(), turn: g.chess.turn(), players: g.players.size });
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
        delete g.colors[socket.id];
        io.to(room).emit('state', { fen: g.chess.fen(), pgn: g.chess.pgn(), turn: g.chess.turn(), players: g.players.size });
        if(g.players.size === 0) delete games[room];
      }
    }
    console.log('disc', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port', PORT));
