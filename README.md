# Modernized Multiplayer Chess

This is an improved version of the minimal multiplayer chess demo:
- Fixed move-turn validation on the server (server enforces turns and rejects out-of-turn moves).
- Frontend prevents out-of-turn selection and handles illegal moves gracefully.
- Modern UI with animations, lobby panel, room creation/join, flip button, sounds via WebAudio.
- No authentication — intended as a demo. Improve for production use.

## Run locally
```bash
npm install
npm start
```
Open `http://localhost:3000` in two browsers/windows. Create a game, share room code (or use a tunnel/cloudflare).
