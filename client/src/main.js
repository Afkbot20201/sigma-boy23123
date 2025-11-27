import { bootUi } from "./ui/screens.js";
import { GameScene } from "./game/scenes/GameScene.js";

const canvas = document.getElementById("game-canvas");

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  canvas,
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [GameScene]
};

export const game = new Phaser.Game(config);

bootUi();
