import { nanoid } from "nanoid";
import { GAME_MODES, SESSION_TICK_RATE, MAX_PLAYERS_PER_MATCH } from "./config.js";
import { getDb, saveSafe, logEvent } from "./persistence.js";
import { updateElo, expectedScore, calculateRankTier } from "./elo.js";
import { RANK_TIERS } from "./config.js";
import { registerMovement, registerShot } from "./antiCheat.js";
import { botThink, createBot } from "./ai.js";

const matches = new Map();

class MatchInstance {
  constructor({ id, mode, ranked, players, teams }) {
    this.id = id;
    this.mode = mode;
    this.ranked = ranked;
    this.players = {};
    this.teams = teams || { A: [], B: [] };
    this.state = "playing";
    this.startedAt = Date.now();
    this.updatedAt = Date.now();
    this.score = { A: 0, B: 0 };
    this.shots = [];
    this.domination = {
      zones: [
        { id: "alpha", owner: null },
        { id: "bravo", owner: null },
        { id: "charlie", owner: null }
      ]
    };
    this.tickInterval = null;
    players.forEach(pid => {
      this.players[pid] = this.createPlayerState(pid);
    });
  }

  createPlayerState(id) {
    return {
      id,
      isBot: id.startsWith("bot_"),
      team: this.teams.A.includes(id) ? "A" : this.teams.B.includes(id) ? "B" : "FFA",
      position: { x: Math.random() * 800, y: Math.random() * 600 },
      velocity: { x: 0, y: 0 },
      hp: 100,
      kills: 0,
      deaths: 0,
      shotsFired: 0,
      shotsHit: 0,
      disconnected: false,
      lastInputSeq: 0,
      lastUpdate: Date.now()
    };
  }

  queueShot(shooterId, targetId, headshot = false) {
    this.shots.push({
      shooterId,
      targetId,
      time: Date.now(),
      headshot
    });
  }

  applyInput(playerId, input) {
    const p = this.players[playerId];
    if (!p) return;
    const now = Date.now();
    const dt = (now - p.lastUpdate) / 1000;
    p.lastUpdate = now;

    const maxSpeed = 260;
    const vx = (input.moveX || 0) * maxSpeed;
    const vy = (input.moveY || 0) * maxSpeed;
    const speed = Math.sqrt(vx * vx + vy * vy);
    const speedRatio = speed / maxSpeed;

    registerMovement(playerId, speedRatio);

    p.velocity.x = vx;
    p.velocity.y = vy;

    p.position.x += p.velocity.x * dt;
    p.position.y += p.velocity.y * dt;
    p.position.x = Math.max(0, Math.min(1024, p.position.x));
    p.position.y = Math.max(0, Math.min(768, p.position.y));

    if (input.shoot && input.targetId) {
      this.queueShot(playerId, input.targetId, input.headshot === true);
      p.shotsFired += 1;
    }
  }

  tick(deltaMs) {
    this.updatedAt = Date.now();

    Object.values(this.players).forEach(p => {
      const dt = deltaMs / 1000;
      p.position.x += p.velocity.x * dt;
      p.position.y += p.velocity.y * dt;
      p.position.x = Math.max(0, Math.min(1024, p.position.x));
      p.position.y = Math.max(0, Math.min(768, p.position.y));
    });

    botThink(this, deltaMs);

    const shotsToProcess = this.shots.splice(0, this.shots.length);
    shotsToProcess.forEach(shot => {
      const shooter = this.players[shot.shooterId];
      const target = this.players[shot.targetId];
      if (!shooter || !target || target.hp <= 0) return;

      const dx = target.position.x - shooter.position.x;
      const dy = target.position.y - shooter.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1000) return;

      const hitChance = shot.headshot ? 0.9 : 0.6;
      const hit = Math.random() < hitChance;
      registerShot(shot.shooterId, hit, shot.headshot);

      if (!hit) return;

      const dmg = shot.headshot ? 100 : 34;
      target.hp -= dmg;
      shooter.shotsHit += 1;

      if (target.hp <= 0) {
        target.deaths += 1;
        shooter.kills += 1;
        const team = shooter.team;
        if (team === "A" || team === "B") {
          this.score[team] += 1;
        }
        target.hp = 100;
        target.position = { x: Math.random() * 800, y: Math.random() * 600 };
      }
    });

    if (this.mode === GAME_MODES.DOMINATION) {
      this.domination.zones.forEach(zone => {
        const center = {
          alpha: { x: 200, y: 200 },
          bravo: { x: 512, y: 384 },
          charlie: { x: 824, y: 560 }
        }[zone.id];
        const contestRadius = 160;
        const inA = Object.values(this.players).filter(
          p => p.team === "A" && distance(p.position, center) < contestRadius
        ).length;
        const inB = Object.values(this.players).filter(
          p => p.team === "B" && distance(p.position, center) < contestRadius
        ).length;
        if (inA > 0 && inB === 0) zone.owner = "A";
        if (inB > 0 && inA === 0) zone.owner = "B";
        if (zone.owner) {
          this.score[zone.owner] += 0.5;
        }
      });
    }
  }

  snapshot() {
    return {
      id: this.id,
      mode: this.mode,
      ranked: this.ranked,
      state: this.state,
      score: this.score,
      players: Object.values(this.players).map(p => ({
        id: p.id,
        team: p.team,
        position: p.position,
        hp: p.hp,
        kills: p.kills,
        deaths: p.deaths,
        isBot: p.isBot,
        disconnected: p.disconnected
      })),
      domination: this.domination
    };
  }
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export class GameServer {
  constructor(io) {
    this.io = io;
    this.tickInterval = null;
  }

  async createMatch({ mode, ranked, players, teams }) {
    const id = nanoid();
    const allPlayers = [...players];
    if (mode === GAME_MODES.TRAINING || mode === GAME_MODES.RANGE) {
      while (allPlayers.length < 2) {
        const bot = createBot("normal", "A");
        allPlayers.push(bot.id);
      }
    }
    const match = new MatchInstance({ id, mode, ranked, players: allPlayers, teams });
    matches.set(id, match);
    this.io.to(id).emit("match:start", { matchId: id, snapshot: match.snapshot() });
    return id;
  }

  getMatch(id) {
    return matches.get(id);
  }

  start() {
    const tickMs = 1000 / SESSION_TICK_RATE;
    this.tickInterval = setInterval(() => {
      const now = Date.now();
      for (const match of matches.values()) {
        const delta = now - match.updatedAt;
        match.tick(delta);
        this.io.to(match.id).emit("match:state", match.snapshot());
      }
    }, tickMs);
  }

  stop() {
    if (this.tickInterval) clearInterval(this.tickInterval);
  }

  async endMatch(matchId, reason = "completed") {
    const match = matches.get(matchId);
    if (!match) return;
    match.state = "ended";
    matches.delete(matchId);
    this.io.to(matchId).emit("match:end", { matchId, reason, score: match.score });
    const db = await getDb();
    for (const playerId of Object.keys(match.players)) {
      const state = match.players[playerId];
      const user = db.data.users.find(u => u.id === playerId);
      if (!user) continue;
      user.stats.kills += state.kills;
      user.stats.deaths += state.deaths;
      user.stats.shotsFired += state.shotsFired;
      user.stats.shotsHit += state.shotsHit;
      user.stats.timePlayedSeconds += Math.floor((Date.now() - match.startedAt) / 1000);

      const winTeam = match.score.A > match.score.B ? "A" :
        match.score.B > match.score.A ? "B" : null;
      const score = winTeam === state.team ? 1 : winTeam ? 0 : 0.5;

      if (match.ranked) {
        const expected = expectedScore(user.elo, 1000);
        user.elo = updateElo(user.elo, expected, score);
        user.rank = calculateRankTier(user.elo, RANK_TIERS);
      }

      if (score === 1) user.stats.wins += 1;
      else if (score === 0) user.stats.losses += 1;

      user.xp += 50 + state.kills * 10;
      while (user.xp >= user.level * 100) {
        user.xp -= user.level * 100;
        user.level += 1;
      }
    }
    await saveSafe(db);
    await logEvent("match_end", "Match ended", {
      matchId,
      reason,
      score: match.score
    });
  }
}
