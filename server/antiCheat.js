import { SPEED_HACK_THRESHOLD, MAX_PACKET_PER_SECOND } from "./config.js";
import { logEvent } from "./persistence.js";

const playerStats = new Map();

export function registerPacket(playerId) {
  const now = Date.now();
  let stats = playerStats.get(playerId);
  if (!stats) {
    stats = {
      lastPacketTime: now,
      packetCount: 0,
      windowStart: now,
      movementSamples: [],
      aimSamples: []
    };
    playerStats.set(playerId, stats);
  }
  stats.packetCount += 1;
  if (now - stats.windowStart >= 1000) {
    if (stats.packetCount > MAX_PACKET_PER_SECOND) {
      flagCheat(playerId, "packet_flood", {
        packets: stats.packetCount
      });
    }
    stats.packetCount = 0;
    stats.windowStart = now;
  }
}

export function registerMovement(playerId, speedRatio) {
  const stats = playerStats.get(playerId);
  if (!stats) return;
  stats.movementSamples.push({
    time: Date.now(),
    speedRatio
  });
  if (speedRatio > SPEED_HACK_THRESHOLD) {
    flagCheat(playerId, "speed_hack", { speedRatio });
  }
  if (stats.movementSamples.length > 200) {
    stats.movementSamples.shift();
  }
}

export function registerShot(playerId, isHit, headshot) {
  const stats = playerStats.get(playerId) || {
    lastPacketTime: Date.now(),
    packetCount: 0,
    windowStart: Date.now(),
    movementSamples: [],
    aimSamples: []
  };
  stats.aimSamples.push({
    time: Date.now(),
    isHit,
    headshot
  });
  if (stats.aimSamples.length > 200) {
    stats.aimSamples.shift();
  }
  playerStats.set(playerId, stats);

  const last100 = stats.aimSamples.slice(-100);
  const hits = last100.filter(s => s.isHit).length;
  const headshots = last100.filter(s => s.headshot).length;

  if (last100.length >= 40) {
    const hitRate = hits / last100.length;
    const headshotRate = hits > 0 ? headshots / hits : 0;

    if (hitRate > 0.95 || headshotRate > 0.85) {
      flagCheat(playerId, "aimbot_suspect", {
        hitRate,
        headshotRate,
        sampleSize: last100.length
      });
    }
  }
}

async function flagCheat(playerId, type, extra = {}) {
  await logEvent("cheat_flag", `Cheat suspicion on player ${playerId}`, {
    playerId,
    cheatType: type,
    ...extra
  });
}
