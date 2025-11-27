import { sendInput } from "../../netcode.js";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("Game");
    this.matchId = null;
    this.playerId = null;
    this.entities = new Map();
    this.keys = null;
  }

  init(data) {
    this.matchId = data.matchId;
    this.playerId = data.playerId;
    this.snapshot = data.snapshot;
  }

  preload() {
    this.load.image("player", "https://dummyimage.com/24x24/4ade80/050816.png&text=P");
    this.load.image("enemy", "https://dummyimage.com/24x24/f97373/050816.png&text=E");
    this.load.image("bot", "https://dummyimage.com/24x24/facc15/050816.png&text=B");
    this.load.image("map", "https://dummyimage.com/1024x768/020617/0f172a.png&text=ARENA");
  }

  create() {
    this.add.image(512, 384, "map");
    this.keys = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => this.sendInputTick()
    });

    this.updateFromSnapshot(this.snapshot);
  }

  updateFromSnapshot(snapshot) {
    if (!snapshot) return;
    snapshot.players.forEach(p => {
      let sprite = this.entities.get(p.id);
      const isSelf = p.id === this.playerId;
      const key = p.isBot ? "bot" : isSelf ? "player" : "enemy";
      if (!sprite) {
        sprite = this.add.sprite(p.position.x, p.position.y, key);
        this.entities.set(p.id, sprite);
      }
      this.tweens.add({
        targets: sprite,
        x: p.position.x,
        y: p.position.y,
        duration: 60,
        ease: "linear"
      });
      sprite.setAlpha(p.hp <= 0 ? 0.3 : 1);
    });
  }

  sendInputTick() {
    const moveX = (this.keys.D.isDown ? 1 : 0) - (this.keys.A.isDown ? 1 : 0);
    const moveY = (this.keys.S.isDown ? 1 : 0) - (this.keys.W.isDown ? 1 : 0);
    const shoot = this.keys.SPACE.isDown;
    const pointer = this.input.activePointer;
    const targetId = null;

    sendInput(this.matchId, {
      moveX,
      moveY,
      shoot,
      targetId,
      headshot: false
    });
  }
}
