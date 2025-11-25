# Multiplayer Chess — minimal demo

## Requirements
- Node.js (16+)
- npm

## Install & run
```bash
cd project-multiplayer-chess
npm install
npm start
```

Open http://localhost:3000 in two browser windows. Use "Create Game" to create a room and share the room ID with the opponent who uses "Join".

This is a minimal demo: server validates moves using chess.js; no authentication, no reconnection logic, no persistent storage. Feel free to improve!
