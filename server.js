
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Chess } = require("chess.js");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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
function getElo(name) { if (!elo[name]) elo[name] = 1000; return elo[name]; }
function updateElo(w, l){ if(!w||!l)return; elo[w]+=20; elo[l]-=10; }
function coordsValid(sq){ return /^[a-h][1-8]$/.test(sq); }

io.on("connection", socket => {

  socket.on("eloSelf", ({name}, cb) => cb({ok:true, elo:getElo(name)}));

  socket.on("rankedQueue", ({name}) => {
    rankedQueue.push({socket, name});
    if(rankedQueue.length>=2){
      const a = rankedQueue.shift();
      const b = rankedQueue.shift();
      const room = makeId();
      const chess = new Chess();
      games[room] = { chess, players:new Map(), colors:new Map(), ranked:true, ai:false };
      games[room].players.set(a.socket.id,a.name);
      games[room].players.set(b.socket.id,b.name);
      games[room].colors.set(a.socket.id,"w");
      games[room].colors.set(b.socket.id,"b");
      a.socket.join(room); b.socket.join(room);
      const players=[{name:a.name,color:"w",elo:getElo(a.name)},{name:b.name,color:"b",elo:getElo(b.name)}];
      a.socket.emit("rankedFound",{room,fen:chess.fen(),turn:chess.turn(),players,pgn:chess.pgn(),asColor:"w"});
      b.socket.emit("rankedFound",{room,fen:chess.fen(),turn:chess.turn(),players,pgn:chess.pgn(),asColor:"b"});
    }
  });

  socket.on("create", ({name}, cb)=>{
    const room = makeId();
    games[room]={ chess:new Chess(), players:new Map(), colors:new Map(), ranked:false, ai:false };
    cb({ok:true,room});
  });

  socket.on("join", ({room,name}, cb)=>{
    if(!games[room]){
      games[room]={ chess:new Chess(), players:new Map(), colors:new Map(), ranked:false, ai:false };
    }
    const g=games[room];
    if(g.players.size>=2 && !g.ai){ cb({ok:false,err:"Room full"}); return; }
    socket.join(room);
    g.players.set(socket.id,name);
    if(!g.colors.has(socket.id)){
      g.colors.set(socket.id, g.colors.size===0?"w":"b");
    }
    const players=[];
    for(const [id,nm] of g.players.entries()){
      players.push({name:nm,color:g.colors.get(id),elo:getElo(nm)});
    }
    cb({ok:true,room,fen:g.chess.fen(),color:g.colors.get(socket.id),turn:g.chess.turn(),players,ranked:g.ranked,ai:g.ai,pgn:g.chess.pgn()});
    io.to(room).emit("state",{fen:g.chess.fen(),turn:g.chess.turn(),players,pgn:g.chess.pgn()});
  });

  socket.on("aiGame",({name},cb)=>{
    const room=makeId();
    const chess=new Chess();
    games[room]={ chess, players:new Map([[socket.id,name]]), colors:new Map([[socket.id,"w"]]), ranked:false, ai:true };
    socket.join(room);
    const players=[{name,color:"w",elo:getElo(name)},{name:"AI",color:"b",elo:0}];
    cb({ok:true,room,fen:chess.fen(),color:"w",turn:chess.turn(),players,ranked:false,ai:true,pgn:chess.pgn()});
    io.to(room).emit("state",{fen:chess.fen(),turn:chess.turn(),players,pgn:chess.pgn()});
  });

  socket.on("move",({room,from,to},cb)=>{
    const g=games[room]; if(!g||!coordsValid(from)||!coordsValid(to)) return cb({ok:false});
    if(g.colors.get(socket.id)!==g.chess.turn()) return cb({ok:false});
    const res=g.chess.move({from,to}); if(!res) return cb({ok:false});
    const players=[]; for(const [id,nm] of g.players.entries()) players.push({name:nm,color:g.colors.get(id),elo:getElo(nm)});
    io.to(room).emit("state",{fen:g.chess.fen(),turn:g.chess.turn(),lastMove:res,players,pgn:g.chess.pgn()});
    if(g.ai && g.chess.turn()==="b"){
      const m=g.chess.moves({verbose:true});
      if(m.length){ const ai=m[Math.floor(Math.random()*m.length)];
        const r=g.chess.move({from:ai.from,to:ai.to,promotion:ai.promotion});
        io.to(room).emit("state",{fen:g.chess.fen(),turn:g.chess.turn(),lastMove:r,players,pgn:g.chess.pgn()});
      }
    }
    cb({ok:true});
  });

  socket.on("chat",({room,name,msg})=>{
    if(!games[room])return;
    io.to(room).emit("chat",{name,msg,ts:Date.now()});
  });
});

const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log("Server on",PORT));
