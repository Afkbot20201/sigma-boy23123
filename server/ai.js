import { nanoid } from "nanoid";

export function createBot(difficulty = "normal", team = "A") {
  const id = `bot_${nanoid(6)}`;
  const base = {
    id,
    username: difficulty === "hard" ? "Nemesis Bot" : "Training Bot",
    isBot: true,
    team,
    difficulty,
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    hp: 100,
    lastThink: Date.now(),
    targetId: null
  };
  return base;
}

export function botThink(match, deltaMs) {
  const players = Object.values(match.players);
  const bots = players.filter(p => p.isBot);
  const liveHumans = players.filter(p => !p.isBot && !p.disconnected);

  bots.forEach(bot => {
    const now = Date.now();
    if (now - bot.lastThink < 200) {
      return;
    }
    bot.lastThink = now;

    let target = liveHumans.find(h => h.id === bot.targetId);
    if (!target) {
      target = liveHumans[Math.floor(Math.random() * liveHumans.length)];
      bot.targetId = target ? target.id : null;
    }
    if (!target) return;

    const dx = target.position.x - bot.position.x;
    const dy = target.position.y - bot.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 10) {
      const desiredSpeed = bot.difficulty === "hard" ? 280 : 220;
      bot.velocity.x = (dx / dist) * desiredSpeed;
      bot.velocity.y = (dy / dist) * desiredSpeed;
    } else {
      bot.velocity.x = 0;
      bot.velocity.y = 0;
    }

    const fireChance =
      bot.difficulty === "hard" ? 0.7 :
      bot.difficulty === "normal" ? 0.4 : 0.2;

    if (Math.random() < fireChance) {
      match.queueShot(bot.id, target.id, dist < 120);
    }
  });
}
