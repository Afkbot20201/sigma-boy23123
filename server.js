const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Chess } = require('chess.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

const games = {};
function makeId(len=6){
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s=''; for(let i=0;i<len;i++) s+=chars[Math.floor(Math.random()*chars.length)];
  return s;
}

io.on('connection',(socket)=>{
  socket.on('create',({name},cb)=>{
    let room=makeId(); while(games[room]) room=makeId();
    games[room]={ chess:new Chess(), players:new Map(), colors:new Map() };
    cb({room});
  });

  socket.on('join',({room,name},cb)=>{
    if(!games[room]) games[room]={ chess:new Chess(), players:new Map(), colors:new Map() };
    const g=games[room];
    if(g.players.size>=2 && !g.players.has(socket.id)){
      cb({ok:false,err:'Room full'}); return;
    }
    socket.join(room);
    g.players.set(socket.id,name||'Player');
    if(!g.colors.has(socket.id)){
      if(!Array.from(g.colors.values()).includes('w')) g.colors.set(socket.id,'w');
      else g.colors.set(socket.id,'b');
    }
    const playersArr=[];
    for(const [id,nm] of g.players.entries())
      playersArr.push({name:nm,color:g.colors.get(id)});

    cb({ok:true,fen:g.chess.fen(),pgn:g.chess.pgn(),color:g.colors.get(socket.id),turn:g.chess.turn(),players:playersArr});
    io.to(room).emit('state',{fen:g.chess.fen(),pgn:g.chess.pgn(),turn:g.chess.turn(),players:playersArr});
  });

  socket.on('move',({room,from,to},cb)=>{
    const g=games[room];
    if(!g) return;
    if(g.colors.get(socket.id)!==g.chess.turn()){
      cb&&cb({ok:false,err:'Not your turn'}); return;
    }
    const res=g.chess.move({from,to});
    if(!res){ cb&&cb({ok:false,err:'Illegal'}); return; }

    const playersArr=[];
    for(const [id,nm] of g.players.entries())
      playersArr.push({name:nm,color:g.colors.get(id)});

    io.to(room).emit('state',{fen:g.chess.fen(),pgn:g.chess.pgn(),turn:g.chess.turn(),lastMove:res,players:playersArr});
    cb&&cb({ok:true});
  });
});

const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log("Server on",PORT));