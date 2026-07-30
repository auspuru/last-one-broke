import BootScene from '../scenes/BootScene.js';
import MainMenuScene from '../scenes/MainMenuScene.js';
import TempleScene from '../scenes/TempleScene.js';

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const BOARD_SCALE = 0.92;
const BOARD_X = 74;
const BOARD_Y = 50;
const DISPLAY_FONT = 'Georgia, Times New Roman, serif';
const UI_FONT = 'Trebuchet MS, Arial, sans-serif';
const LANDSCAPE_BACKDROP = 'landscape-chamber-one';

function installLandscapeGameConfig() {
  if (Phaser.Game.__emeraldLandscapeWrapper) return;

  const OriginalGame = Phaser.Game;

  function LandscapeGame(config = {}) {
    const upgradedConfig = {
      ...config,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: '#040b09',
      scale: {
        ...(config.scale || {}),
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT
      },
      render: {
        ...(config.render || {}),
        antialias: true,
        pixelArt: false,
        roundPixels: true,
        powerPreference: 'high-performance'
      }
    };

    return new OriginalGame(upgradedConfig);
  }

  LandscapeGame.prototype = OriginalGame.prototype;
  Object.setPrototypeOf(LandscapeGame, OriginalGame);
  LandscapeGame.__emeraldLandscapeWrapper = true;
  LandscapeGame.OriginalGame = OriginalGame;
  Phaser.Game = LandscapeGame;
}

function installLandscapePreload() {
  const originalPreload = BootScene.prototype.preload;

  BootScene.prototype.preload = function preloadLandscapeSlice(...args) {
    originalPreload?.apply(this, args);
    if (!this.textures.exists(LANDSCAPE_BACKDROP)) {
      this.load.svg(
        LANDSCAPE_BACKDROP,
        './assets/visual/landscape-chamber-1.svg',
        { width: GAME_WIDTH, height: GAME_HEIGHT }
      );
    }
  };
}

function addBronzePanel(scene, x, y, width, height, depth = 20, alpha = 0.97) {
  scene.add.rectangle(x + 3, y + 4, width, height, 0x000000, 0.46).setDepth(depth - 1);
  scene.add.rectangle(x, y, width, height, 0x0a1512, alpha)
    .setStrokeStyle(4, 0x6e4518, 1)
    .setDepth(depth);
  scene.add.rectangle(x, y, width - 10, height - 10, 0x111f1a, 0.94)
    .setStrokeStyle(2, 0xc18a36, 0.9)
    .setDepth(depth);
}

function addTorch(scene, x, y, depth = 5) {
  const bracket = scene.add.rectangle(x, y + 14, 9, 28, 0x3a2715, 1)
    .setStrokeStyle(2, 0xa86c25, 0.8)
    .setDepth(depth);
  const outerGlow = scene.add.circle(x, y - 3, 45, 0xff9d2e, 0.08).setDepth(depth - 1);
  const innerGlow = scene.add.circle(x, y - 3, 20, 0xffc44f, 0.12).setDepth(depth - 1);
  const flame = scene.add.triangle(x, y - 10, 0, 18, 8, 0, 16, 18, 0xffc33f, 0.96).setDepth(depth + 1);
  const core = scene.add.triangle(x, y - 7, 2, 13, 8, 2, 14, 13, 0xfff0a0, 0.95).setDepth(depth + 2);

  scene.tweens.add({
    targets: [outerGlow, innerGlow, flame, core],
    alpha: { from: 0.45, to: 1 },
    scaleX: { from: 0.9, to: 1.12 },
    scaleY: { from: 0.86, to: 1.08 },
    duration: Phaser.Math.Between(360, 520),
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  return [bracket, outerGlow, innerGlow, flame, core];
}

function installLandscapeMenu() {
  MainMenuScene.prototype.create = function createLandscapeMenu() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#040b09');

    if (this.textures.exists(LANDSCAPE_BACKDROP)) {
      this.add.image(width / 2, height / 2, LANDSCAPE_BACKDROP).setAlpha(0.72);
    } else {
      this.add.rectangle(width / 2, height / 2, width, height, 0x081912);
    }

    this.add.rectangle(width / 2, height / 2, width, height, 0x020604, 0.28);
    this.add.rectangle(width / 2, 118, width, 236, 0x03100c, 0.72);

    addTorch(this, 95, 292, 5);
    addTorch(this, 865, 292, 5);

    this.add.text(width / 2, 74, 'EMERALD QUEST', {
      fontFamily: DISPLAY_FONT,
      fontSize: '54px',
      fontStyle: 'bold',
      color: '#f5d17b',
      stroke: '#241205',
      strokeThickness: 7,
      letterSpacing: 4
    }).setOrigin(0.5).setDepth(10);

    this.add.text(width / 2, 125, 'THE SUNKEN TEMPLE', {
      fontFamily: UI_FONT,
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#76edc0',
      stroke: '#09241b',
      strokeThickness: 4,
      letterSpacing: 4
    }).setOrigin(0.5).setDepth(10);

    this.add.text(width / 2, 164, 'A THREE-CHAMBER PUZZLE EXPEDITION', {
      fontFamily: UI_FONT,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#b8d6c9',
      letterSpacing: 1.8
    }).setOrigin(0.5).setDepth(10);

    addBronzePanel(this, width / 2, 397, 430, 190, 12, 0.94);

    this.add.text(width / 2, 331, 'ENTER THE RUINS', {
      fontFamily: DISPLAY_FONT,
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#f7dea0',
      letterSpacing: 1.5
    }).setOrigin(0.5).setDepth(14);

    this.add.text(width / 2, 365, 'Collect the crystals • Recover the key • Escape alive', {
      fontFamily: UI_FONT,
      fontSize: '12px',
      color: '#b9d2c8'
    }).setOrigin(0.5).setDepth(14);

    const start = this.add.text(width / 2, 423, 'START EXPEDITION', {
      fontFamily: UI_FONT,
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#241303',
      backgroundColor: '#e7b84e',
      stroke: '#fff1ae',
      strokeThickness: 1,
      padding: { x: 42, y: 15 }
    }).setOrigin(0.5).setDepth(15).setInteractive({ useHandCursor: true });

    this.add.text(width / 2, 474, 'SWIPE • TAP • WASD • ARROW KEYS • ON-SCREEN CONTROLS', {
      fontFamily: UI_FONT,
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#7fa596',
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(14);

    start.on('pointerover', () => start.setScale(1.04).setStyle({ backgroundColor: '#f2cd6c' }));
    start.on('pointerout', () => start.setScale(1).setStyle({ backgroundColor: '#e7b84e' }));
    start.on('pointerdown', () => {
      start.disableInteractive();
      this.cameras.main.flash(120, 246, 203, 102);
      this.cameras.main.fadeOut(320, 4, 12, 9);
      this.time.delayedCall(320, () => this.scene.start('TempleScene'));
    });

    for (let index = 0; index < 28; index += 1) {
      const mote = this.add.circle(
        Phaser.Math.Between(45, width - 45),
        Phaser.Math.Between(185, height - 18),
        Phaser.Math.FloatBetween(0.8, 2.2),
        index % 4 === 0 ? 0xffce69 : 0x6fe8ba,
        Phaser.Math.FloatBetween(0.06, 0.24)
      ).setDepth(8);

      this.tweens.add({
        targets: mote,
        y: mote.y - Phaser.Math.Between(28, 78),
        x: mote.x + Phaser.Math.Between(-14, 14),
        alpha: 0,
        duration: Phaser.Math.Between(1900, 3600),
        delay: Phaser.Math.Between(0, 1800),
        repeat: -1,
        ease: 'Sine.easeOut'
      });
    }
  };
}

function makeHudButton(scene, x, y, label, width, handler, fontSize = 12) {
  const shadow = scene.add.rectangle(x + 2, y + 3, width, 38, 0x000000, 0.45).setDepth(34);
  const plate = scene.add.rectangle(x, y, width, 38, 0x151b17, 0.98)
    .setStrokeStyle(2, 0xa86c24, 1)
    .setDepth(35)
    .setInteractive({ useHandCursor: true });
  const text = scene.add.text(x, y, label, {
    fontFamily: UI_FONT,
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    color: '#f4d88e',
    stroke: '#090804',
    strokeThickness: 2,
    letterSpacing: 0.6
  }).setOrigin(0.5).setDepth(36);

  const press = () => {
    scene.playTone('button');
    scene.tweens.add({ targets: [plate, text], scale: 0.95, duration: 65, yoyo: true });
    handler();
  };

  plate.on('pointerdown', press);
  text.setInteractive({ useHandCursor: true }).on('pointerdown', press);
  plate.on('pointerover', () => plate.setFillStyle(0x26372f, 1));
  plate.on('pointerout', () => plate.setFillStyle(0x151b17, 0.98));
  return { shadow, plate, text };
}

function makeDirectionButton(scene, x, y, label, dr, dc) {
  const plate = scene.add.circle(x, y, 25, 0x15221d, 0.94)
    .setStrokeStyle(2, 0xb47b2d, 0.95)
    .setDepth(35)
    .setInteractive({ useHandCursor: true });
  const text = scene.add.text(x, y - 1, label, {
    fontFamily: UI_FONT,
    fontSize: '22px',
    fontStyle: 'bold',
    color: '#f1d58c',
    stroke: '#080a07',
    strokeThickness: 3
  }).setOrigin(0.5).setDepth(36).setInteractive({ useHandCursor: true });

  const move = () => {
    scene.ensureAudioContext();
    scene.tweens.add({ targets: [plate, text], scale: 0.9, duration: 55, yoyo: true });
    scene.movePlayer(dr, dc);
  };

  plate.on('pointerdown', move);
  text.on('pointerdown', move);
  return { plate, text };
}

function shiftNewPanel(scene, before, offsetX, minDepth, maxDepth) {
  scene.children.list.forEach((child) => {
    if (before.has(child)) return;
    const depth = Number(child.depth) || 0;
    if (depth < minDepth || depth > maxDepth) return;
    if (!Number.isFinite(child.x) || child.x > 390) return;
    child.x += offsetX;
  });
}

function installLandscapeTemple() {
  TempleScene.prototype.drawBackground = function drawLandscapeBackground() {
    this.cameras.main.setBackgroundColor('#030806');

    if (this.textures.exists(LANDSCAPE_BACKDROP)) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, LANDSCAPE_BACKDROP).setDepth(-30);
    } else {
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x081811).setDepth(-30);
    }

    this.add.rectangle(GAME_WIDTH / 2, 40, GAME_WIDTH, 80, 0x030807, 0.9).setDepth(25);
    this.add.rectangle(GAME_WIDTH / 2, 505, GAME_WIDTH, 70, 0x030807, 0.84).setDepth(24);
    this.add.rectangle(290, 287, 426, 458, 0x020604, 0.5)
      .setStrokeStyle(5, 0x4d3115, 0.95)
      .setDepth(1);
    this.add.rectangle(290, 287, 414, 446, 0x07100d, 0.2)
      .setStrokeStyle(2, 0xb17a2d, 0.72)
      .setDepth(2);

    this.add.text(480, 18, 'EMERALD QUEST', {
      fontFamily: DISPLAY_FONT,
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#f5d27d',
      stroke: '#1f1004',
      strokeThickness: 4,
      letterSpacing: 2.4
    }).setOrigin(0.5).setDepth(30);

    this.subtitle = this.add.text(480, 53, '', {
      fontFamily: UI_FONT,
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#a9d6c5',
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(30);

    addTorch(this, 43, 276, 7);
    addTorch(this, 522, 276, 7);
    addTorch(this, 921, 276, 7);
  };

  TempleScene.prototype.drawHud = function drawLandscapeHud() {
    this.hud = [];

    const panels = [
      { x: 126, w: 118 },
      { x: 254, w: 120 },
      { x: 650, w: 126 },
      { x: 790, w: 130 }
    ];

    panels.forEach(({ x, w }) => {
      this.add.rectangle(x + 2, 53, w, 50, 0x000000, 0.45).setDepth(27);
      this.add.rectangle(x, 50, w, 50, 0x101914, 0.98)
        .setStrokeStyle(3, 0x754819, 1)
        .setDepth(28);
      this.add.rectangle(x, 50, w - 8, 42, 0x19231e, 0.96)
        .setStrokeStyle(1, 0xc18b38, 0.82)
        .setDepth(28);
    });

    const common = {
      fontFamily: UI_FONT,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#f5dea0',
      stroke: '#070804',
      strokeThickness: 2
    };

    this.hud.push(this.add.text(126, 50, '', { ...common, color: '#8df5d4' }).setOrigin(0.5).setDepth(30));
    this.hud.push(this.add.text(254, 50, '', common).setOrigin(0.5).setDepth(30));
    this.hud.push(this.add.text(650, 50, '', common).setOrigin(0.5).setDepth(30));
    this.hud.push(this.add.text(790, 50, '', { ...common, color: '#ff7771', fontSize: '16px' }).setOrigin(0.5).setDepth(30));

    addBronzePanel(this, 728, 260, 356, 322, 16, 0.94);
    this.add.text(728, 123, `CHAMBER ${this.levelIndex + 1}`, {
      fontFamily: UI_FONT,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#6fefbf',
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(19);
    this.add.text(728, 150, this.level.name, {
      fontFamily: DISPLAY_FONT,
      fontSize: '21px',
      fontStyle: 'bold',
      color: '#f3d68a',
      stroke: '#261506',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(19);
    this.add.text(728, 181, 'CURRENT OBJECTIVE', {
      fontFamily: UI_FONT,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#839f94',
      letterSpacing: 1.5
    }).setOrigin(0.5).setDepth(19);

    this.message = this.add.text(728, 224, '', {
      fontFamily: UI_FONT,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#e6eee9',
      align: 'center',
      wordWrap: { width: 292 },
      lineSpacing: 5
    }).setOrigin(0.5).setDepth(19);

    this.add.text(728, 289, 'MOVEMENT', {
      fontFamily: UI_FONT,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#839f94',
      letterSpacing: 1.5
    }).setOrigin(0.5).setDepth(19);

    this.add.circle(626, 388, 82, 0x08110e, 0.78)
      .setStrokeStyle(3, 0x8b5c24, 0.9)
      .setDepth(33);
    this.add.circle(626, 388, 57, 0x14221c, 0.68)
      .setStrokeStyle(1, 0xd2a04b, 0.56)
      .setDepth(34);

    makeDirectionButton(this, 626, 331, '▲', -1, 0);
    makeDirectionButton(this, 626, 445, '▼', 1, 0);
    makeDirectionButton(this, 569, 388, '◀', 0, -1);
    makeDirectionButton(this, 683, 388, '▶', 0, 1);

    const action = this.add.circle(827, 388, 67, 0x111b17, 0.96)
      .setStrokeStyle(4, 0x9f6725, 1)
      .setDepth(34)
      .setInteractive({ useHandCursor: true });
    this.add.circle(827, 388, 55, 0x20342a, 0.9)
      .setStrokeStyle(2, 0xe0ad50, 0.62)
      .setDepth(35);
    const actionIcon = this.add.text(827, 370, '✦', {
      fontFamily: DISPLAY_FONT,
      fontSize: '35px',
      fontStyle: 'bold',
      color: '#78efc2',
      stroke: '#07110d',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(36);
    const actionLabel = this.add.text(827, 414, 'HINT / INTERACT', {
      fontFamily: UI_FONT,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#f3d98f',
      letterSpacing: 0.8
    }).setOrigin(0.5).setDepth(36);

    const useAction = () => {
      this.ensureAudioContext();
      this.tweens.add({ targets: [action, actionIcon, actionLabel], scale: 0.92, duration: 70, yoyo: true });
      this.showHint();
    };
    action.on('pointerdown', useAction);
    actionIcon.setInteractive({ useHandCursor: true }).on('pointerdown', useAction);
    actionLabel.setInteractive({ useHandCursor: true }).on('pointerdown', useAction);

    makeHudButton(this, 53, 50, 'Ⅱ', 60, () => this.scene.start('MainMenuScene'), 20);
    const hint = makeHudButton(this, 892, 50, 'HINT', 82, () => this.showHint(), 11);
    this.hintButton = hint.text;
    const sound = makeHudButton(this, 892, 99, this.audioEnabled ? 'SOUND ON' : 'SOUND OFF', 82, () => this.toggleAudio(), 8);
    this.audioButton = sound.text;
    makeHudButton(this, 827, 494, 'RESTART', 126, () => this.restartLevel(), 12);

    this.add.text(312, 514, 'COLLECT EVERY CRYSTAL • RECOVER THE KEY • REACH THE EXIT', {
      fontFamily: DISPLAY_FONT,
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#f4d98e',
      stroke: '#1b1005',
      strokeThickness: 4,
      letterSpacing: 0.7
    }).setOrigin(0.5).setDepth(26);
  };

  const originalDrawBoard = TempleScene.prototype.drawBoard;
  TempleScene.prototype.drawBoard = function drawLandscapeBoard(...args) {
    const result = originalDrawBoard.apply(this, args);
    this.board?.setPosition(BOARD_X, BOARD_Y).setScale(BOARD_SCALE).setDepth(6);

    if (this.hero) {
      this.hero.setDisplaySize(52, 52);
      this.heroShadow?.setScale(1.16, 0.82).setAlpha(0.7);
    }

    this.entities?.forEach((sprite) => {
      if (sprite.texture?.key === 'premium-diamond') sprite.setDisplaySize(51, 51);
      if (sprite.texture?.key === 'premium-guardian-idle') sprite.setDisplaySize(54, 54);
    });

    return result;
  };

  const originalShowLevelIntro = TempleScene.prototype.showLevelIntro;
  TempleScene.prototype.showLevelIntro = function showLandscapeIntro(...args) {
    const before = new Set(this.children.list);
    const result = originalShowLevelIntro.apply(this, args);
    shiftNewPanel(this, before, 280, 40, 45);
    return result;
  };

  const originalCompleteLevel = TempleScene.prototype.completeLevel;
  TempleScene.prototype.completeLevel = function completeLandscapeLevel(...args) {
    const before = new Set(this.children.list);
    const result = originalCompleteLevel.apply(this, args);
    shiftNewPanel(this, before, 280, 20, 32);
    return result;
  };

  const originalShowGameOver = TempleScene.prototype.showGameOver;
  TempleScene.prototype.showGameOver = function showLandscapeGameOver(...args) {
    const before = new Set(this.children.list);
    const result = originalShowGameOver.apply(this, args);
    shiftNewPanel(this, before, 280, 30, 36);
    return result;
  };
}

installLandscapeGameConfig();
installLandscapePreload();
installLandscapeMenu();
installLandscapeTemple();

window.emeraldLandscapeSlice = Object.freeze({
  version: '1.0.0',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  board: { x: BOARD_X, y: BOARD_Y, scale: BOARD_SCALE }
});
