import BootScene from './scenes/BootScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import TempleScene from './scenes/TempleScene.js';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 640;

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#10261e',
  scene: [BootScene, MainMenuScene, TempleScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
  },
  input: {
    activePointers: 2,
    touch: {
      capture: true,
    },
  },
};

window.addEventListener('load', () => {
  const game = new Phaser.Game(config);
  window.emeraldQuest = game;
});