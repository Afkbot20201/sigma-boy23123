const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Chess } = require('chess.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static('public'));

const games = {};
const elo = {}; // name -> rating
const rankedQueue = [];

function makeId(len=6){
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s=''; for(let i=0;i<len;i++) s+=chars[Math.floor(Math.random()*chars.length)];
  return s;
}

function getElo(name){
  if(!elo[name]) elo[name] = 1000;
  return elo[name];
}

function updateElo(winner, loser){
  elo[winner] += 25;
  elo[loser] -= 15;
}

io.on('connection', (socket) => {

  socket.on('rankedQueue', ({name})=>{
    socket.playerName = name;
    rankedQueue.push(socket);
    if(rankedQueue.length >= 2){
      const p1 = rankedQueue.shift();
      const p2 = rankedQueue.shift();
      let room = makeId();
      games[room] = { chess:new Chess(), players:new Map(), colors:new Map(), ranked:true };
      p1.join(room); p2.join(room);
      games[room].players.set(p1.id, p1.playerName);
      games[room].players.set(p2.id, p2.playerName);
      games[room].colors.set(p1.id,'w');
      games[room].colors.set(p2.id,'b');

      p1.emit('rankedFound',{room});
      p2.emit('rankedFound',{room});
    }
  });

  socket.on('create', ({name}, cb) => {
    let room = makeId();
    games[room] = { chess:new Chess(), players:new Map(), colors:new Map() };
    cb({room});
  });

  socket.on('join', ({room, name}, cb) => {
    if(!games[room]) games[room]={ chess:new Chess(), players:new Map(), colors:new Map() };
    const g = games[room];

    if(g.players.size>=2 && !g.players.has(socket.id)){
      cb({ok:false,err:'Room full'}); return;
    }
    socket.join(room);
    g.players.set(socket.id,name);
    if(!Array.from(g.colors.values()).includes('w')) g.colors.set(socket.id,'w');
    else g.colors.set(socket.id,'b');

    const players=[];
    for(const [id,nm] of g.players.entries())
      players.push({name:nm,color:g.colors.get(id),elo:getElo(nm)});

    cb({ok:true,fen:g.chess.fen(),color:g.colors.get(socket.id),turn:g.chess.turn(),players});
    io.to(room).emit('state',{fen:g.chess.fen(),turn:g.chess.turn(),players});
  });

  socket.on('aiGame', ({name}, cb)=>{
    let room = makeId();
    const chess = new Chess();
    games[room] = { chess, players:new Map(), colors:new Map(), ai:true };
    games[room].players.set(socket.id,name);
    games[room].colors.set(socket.id,'w');
    socket.join(room);
    cb({room});
    io.to(room).emit('state',{fen:chess.fen(),turn:chess.turn()});
  });

  socket.on('move', ({room,from,to}, cb) => {
    const g = games[room];
    if(!g) return;

    const pc = g.colors.get(socket.id);
    if(pc !== g.chess.turn()){
      cb && cb({ok:false}); return;
    }

    const res = g.chess.move({from,to});
    if(!res){ cb&&cb({ok:false}); return; }

    io.to(room).emit('state',{fen:g.chess.fen(),turn:g.chess.turn(),lastMove:res});

    if(g.ai){
      setTimeout(()=>{
        const moves = g.chess.moves();
        if(moves.length){
          g.chess.move(moves[Math.floor(Math.random()*moves.length)]);
          io.to(room).emit('state',{fen:g.chess.fen(),turn:g.chess.turn()});
        }
      },500);
    }

    cb&&cb({ok:true});
  });

  socket.on('chat', ({room,name,msg})=>{
    io.to(room).emit('chat',{name,msg});
  });
});

server.listen(process.env.PORT||3000);
