import BootScene from '../scenes/BootScene.js';
import MainMenuScene from '../scenes/MainMenuScene.js';
import TempleScene from '../scenes/TempleScene.js';

const GAME_HEIGHT = 540;
const VIEWPORT_RATIO = Math.max(16 / 9, Math.min(3, window.innerWidth / Math.max(1, window.innerHeight)));
const GAME_WIDTH = Math.round(GAME_HEIGHT * VIEWPORT_RATIO);
const TILE_SIZE = 40;
const DISPLAY_FONT = 'Georgia, Times New Roman, serif';
const UI_FONT = 'Trebuchet MS, Arial, sans-serif';
const LANDSCAPE_BACKDROP = 'landscape-chamber-one';

const WIDE_LEVELS = [
  {
    name: 'THE BURIED APPROACH',
    objective: 'Dig through the ruins, collect every crystal and recover the key.',
    par: 54,
    hints: [
      'Loose boulders fall after you clear the tile beneath them.',
      'Explore both wings of the chamber before heading for the exit.',
      'The exit opens only after every crystal and the key are collected.'
    ],
    map: [
      '########################',
      '#P....DDDD....#.....G.E#',
      '#.####....###.#.#####..#',
      '#....#..G.....#.....#..#',
      '#.DD.#.######.###D..#..#',
      '#....#....R.#.....D.#..#',
      '#.######....#.#####.#..#',
      '#......#..G.#.....#.#..#',
      '#.R....#.####.DDD.#.#..#',
      '#...K..#..........#....#',
      '#......##########......#',
      '########################'
    ]
  },
  {
    name: 'THE SENTINEL GALLERY',
    objective: 'Open the emerald seals and cross the guardian gallery.',
    par: 62,
    hints: [
      'The switch opens every emerald seal in the chamber.',
      'Spikes change state after each completed move.',
      'Guardians patrol clear corridors and reverse at obstacles.'
    ],
    map: [
      '########################',
      '#P....#...G...#....#..E#',
      '#..S..#.......#....#.G.#',
      '#.......#######....#...#',
      '#.....#.......X....#...#',
      '#.#####.......#..^.X...#',
      '#..R..#.......######...#',
      '#........G....#..M.#...#',
      '#.....#######......#...#',
      '#.............#..^.#.K.#',
      '#.............#....#...#',
      '########################'
    ]
  },
  {
    name: 'THE EMERALD VAULT',
    objective: 'Master every mechanism and recover the ancient relic.',
    par: 70,
    hints: [
      'The relic is optional, but it awards a large score bonus.',
      'The vault key is beyond the sealed eastern wall.',
      'Plan a safe route before digging beneath suspended boulders.'
    ],
    map: [
      '########################',
      '#P.DD..#...G...#....#..#',
      '#...DS.........#....#.E#',
      '#....D.#..R....######..#',
      '#.######............#..#',
      '#..DD..#...G...#..M.#..#',
      '#........#######....X..#',
      '#......#..D....#..^.#..#',
      '#...R..#..D.A.....G.#..#',
      '#..####....DDD.#..^.#.K#',
      '#......#.......#....#..#',
      '########################'
    ]
  }
];

function boardLayout(scene) {
  const width = scene.scale.width;
  const height = scene.scale.height;
  const columns = scene.map?.[0]?.length || 24;
  const rows = scene.map?.length || 12;
  const worldWidth = columns * TILE_SIZE;
  const worldHeight = rows * TILE_SIZE;
  const top = 57;
  const bottom = 34;
  const scale = Math.min(0.95, (height - top - bottom) / worldHeight, (width - 16) / worldWidth);
  const displayWidth = worldWidth * scale;
  const displayHeight = worldHeight * scale;

  return {
    width,
    height,
    worldWidth,
    worldHeight,
    scale,
    x: (width - displayWidth) / 2,
    y: top,
    displayWidth,
    displayHeight
  };
}

function installGameConfig() {
  if (Phaser.Game.__emeraldResponsiveWrapper) return;
  const OriginalGame = Phaser.Game;

  function ResponsiveGame(config = {}) {
    return new OriginalGame({
      ...config,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: '#06100c',
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
    });
  }

  ResponsiveGame.prototype = OriginalGame.prototype;
  Object.setPrototypeOf(ResponsiveGame, OriginalGame);
  ResponsiveGame.__emeraldResponsiveWrapper = true;
  ResponsiveGame.OriginalGame = OriginalGame;
  Phaser.Game = ResponsiveGame;
}

function installPreload() {
  const originalPreload = BootScene.prototype.preload;
  BootScene.prototype.preload = function preloadWideSlice(...args) {
    originalPreload?.apply(this, args);
    if (!this.textures.exists(LANDSCAPE_BACKDROP)) {
      this.load.svg(LANDSCAPE_BACKDROP, './assets/visual/landscape-chamber-1.svg', {
        width: 960,
        height: GAME_HEIGHT
      });
    }
  };
}

function installWideLevels() {
  const originalFindLevelObjects = TempleScene.prototype.findLevelObjects;
  if (originalFindLevelObjects.__wideLevelsWrapped) return;

  function findWideLevelObjects() {
    const design = WIDE_LEVELS[this.levelIndex] || WIDE_LEVELS[0];
    this.level = { ...this.level, ...design };
    this.map = design.map.map((row) => row.split(''));
    return originalFindLevelObjects.call(this);
  }

  findWideLevelObjects.__wideLevelsWrapped = true;
  TempleScene.prototype.findLevelObjects = findWideLevelObjects;
}

function addTorch(scene, x, y, depth = 6) {
  const glow = scene.add.circle(x, y, 43, 0xff9f33, 0.09).setDepth(depth - 1);
  const inner = scene.add.circle(x, y, 18, 0xffc85b, 0.14).setDepth(depth);
  scene.add.rectangle(x, y + 18, 8, 29, 0x4a2c14, 1)
    .setStrokeStyle(2, 0xb77b2d, 0.9)
    .setDepth(depth + 1);
  const flame = scene.add.triangle(x, y - 3, 0, 18, 8, 0, 16, 18, 0xffbd38, 0.96).setDepth(depth + 2);
  const core = scene.add.triangle(x, y, 3, 13, 8, 3, 13, 13, 0xfff0a8, 0.95).setDepth(depth + 3);

  scene.tweens.add({
    targets: [glow, inner, flame, core],
    alpha: { from: 0.45, to: 1 },
    scaleX: { from: 0.9, to: 1.1 },
    scaleY: { from: 0.86, to: 1.08 },
    duration: Phaser.Math.Between(360, 520),
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });
}

function makePlate(scene, x, y, width, height, label, handler, options = {}) {
  const depth = options.depth || 34;
  const plate = scene.add.rectangle(x, y, width, height, options.fill || 0x101b16, options.alpha ?? 0.92)
    .setStrokeStyle(options.strokeWidth || 2, options.stroke || 0xb0782e, 0.95)
    .setDepth(depth)
    .setInteractive({ useHandCursor: true });
  const text = scene.add.text(x, y, label, {
    fontFamily: options.fontFamily || UI_FONT,
    fontSize: `${options.fontSize || 11}px`,
    fontStyle: 'bold',
    color: options.color || '#f1d58c',
    stroke: '#070a07',
    strokeThickness: 2,
    letterSpacing: options.letterSpacing || 0.4,
    align: 'center'
  }).setOrigin(0.5).setDepth(depth + 1).setInteractive({ useHandCursor: true });

  const press = () => {
    scene.ensureAudioContext?.();
    scene.playTone?.('button');
    scene.tweens.add({ targets: [plate, text], scale: 0.92, duration: 60, yoyo: true, ease: 'Quad.easeOut' });
    handler();
  };

  plate.on('pointerdown', press);
  text.on('pointerdown', press);
  return { plate, text };
}

function makeDirection(scene, x, y, label, dr, dc) {
  const plate = scene.add.circle(x, y, 23, 0x13231c, 0.88)
    .setStrokeStyle(2, 0xc28a39, 0.92)
    .setDepth(36)
    .setInteractive({ useHandCursor: true });
  const text = scene.add.text(x, y - 1, label, {
    fontFamily: UI_FONT,
    fontSize: '20px',
    fontStyle: 'bold',
    color: '#f4dc96',
    stroke: '#050806',
    strokeThickness: 3
  }).setOrigin(0.5).setDepth(37).setInteractive({ useHandCursor: true });

  const move = () => {
    scene.ensureAudioContext?.();
    scene.tweens.add({ targets: [plate, text], scale: 0.86, duration: 55, yoyo: true });
    scene.movePlayer(dr, dc);
  };

  plate.on('pointerdown', move);
  text.on('pointerdown', move);
}

function installMenu() {
  MainMenuScene.prototype.create = function createResponsiveMenu() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#06100c');

    if (this.textures.exists(LANDSCAPE_BACKDROP)) {
      this.add.image(width / 2, height / 2, LANDSCAPE_BACKDROP)
        .setDisplaySize(width, height)
        .setAlpha(0.86);
    } else {
      this.add.rectangle(width / 2, height / 2, width, height, 0x0c241a);
    }

    this.add.rectangle(width / 2, height / 2, width, height, 0x020706, 0.22);
    this.add.rectangle(width / 2, 86, width, 172, 0x020806, 0.72);

    addTorch(this, Math.max(52, width * 0.08), height * 0.55, 5);
    addTorch(this, Math.min(width - 52, width * 0.92), height * 0.55, 5);

    this.add.text(width / 2, 62, 'EMERALD QUEST', {
      fontFamily: DISPLAY_FONT,
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#f6d67e',
      stroke: '#241405',
      strokeThickness: 7,
      letterSpacing: 4
    }).setOrigin(0.5).setDepth(10);

    this.add.text(width / 2, 115, 'THE SUNKEN TEMPLE', {
      fontFamily: UI_FONT,
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#78efc2',
      stroke: '#082219',
      strokeThickness: 4,
      letterSpacing: 4
    }).setOrigin(0.5).setDepth(10);

    this.add.rectangle(width / 2 + 3, 387, 390, 164, 0x000000, 0.38).setDepth(11);
    this.add.rectangle(width / 2, 383, 390, 164, 0x0c1d17, 0.94)
      .setStrokeStyle(3, 0xb17a2e, 0.94)
      .setDepth(12);

    this.add.text(width / 2, 336, 'THREE CHAMBERS. ONE EXPEDITION.', {
      fontFamily: UI_FONT,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#b9d4c9',
      letterSpacing: 1.4
    }).setOrigin(0.5).setDepth(13);

    const start = this.add.text(width / 2, 392, 'ENTER THE TEMPLE', {
      fontFamily: UI_FONT,
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#241303',
      backgroundColor: '#e8bc57',
      stroke: '#fff0aa',
      strokeThickness: 1,
      padding: { x: 42, y: 14 }
    }).setOrigin(0.5).setDepth(14).setInteractive({ useHandCursor: true });

    this.add.text(width / 2, 445, 'SWIPE • TAP • WASD • ARROW KEYS • ON-SCREEN CONTROLS', {
      fontFamily: UI_FONT,
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#89ad9e',
      letterSpacing: 0.9
    }).setOrigin(0.5).setDepth(13);

    start.on('pointerover', () => start.setScale(1.04).setStyle({ backgroundColor: '#f3d476' }));
    start.on('pointerout', () => start.setScale(1).setStyle({ backgroundColor: '#e8bc57' }));
    start.on('pointerdown', () => {
      start.disableInteractive();
      this.cameras.main.fadeOut(260, 4, 12, 9);
      this.time.delayedCall(260, () => this.scene.start('TempleScene'));
    });
  };
}

function shiftNewPanel(scene, before, minDepth, maxDepth) {
  const offsetX = scene.scale.width / 2 - 200;
  scene.children.list.forEach((child) => {
    if (before.has(child)) return;
    const depth = Number(child.depth) || 0;
    if (depth < minDepth || depth > maxDepth) return;
    if (!Number.isFinite(child.x) || child.x > 390) return;
    child.x += offsetX;
  });
}

function installTemple() {
  TempleScene.prototype.drawBackground = function drawResponsiveBackground() {
    const layout = boardLayout(this);
    this.cameras.main.setBackgroundColor('#06100c');

    if (this.textures.exists(LANDSCAPE_BACKDROP)) {
      this.add.image(layout.width / 2, layout.height / 2, LANDSCAPE_BACKDROP)
        .setDisplaySize(layout.width, layout.height)
        .setDepth(-30);
    } else {
      this.add.rectangle(layout.width / 2, layout.height / 2, layout.width, layout.height, 0x0c241a).setDepth(-30);
    }

    this.add.rectangle(layout.width / 2, 27, layout.width, 54, 0x020706, 0.9).setDepth(25);
    this.add.rectangle(layout.width / 2, layout.height - 17, layout.width, 34, 0x020706, 0.86).setDepth(25);

    this.add.rectangle(
      layout.x + layout.displayWidth / 2,
      layout.y + layout.displayHeight / 2,
      layout.displayWidth + 14,
      layout.displayHeight + 14,
      0x020705,
      0.52
    ).setStrokeStyle(4, 0x6f451c, 0.98).setDepth(1);

    this.add.rectangle(
      layout.x + layout.displayWidth / 2,
      layout.y + layout.displayHeight / 2,
      layout.displayWidth + 4,
      layout.displayHeight + 4,
      0x07100d,
      0.16
    ).setStrokeStyle(2, 0xc08a39, 0.74).setDepth(2);

    const leftTorchX = Math.max(28, layout.x - 22);
    const rightTorchX = Math.min(layout.width - 28, layout.x + layout.displayWidth + 22);
    addTorch(this, leftTorchX, layout.height * 0.53, 7);
    addTorch(this, rightTorchX, layout.height * 0.53, 7);

    this.add.text(layout.width / 2, 14, 'EMERALD QUEST', {
      fontFamily: DISPLAY_FONT,
      fontSize: '19px',
      fontStyle: 'bold',
      color: '#f5d27f',
      stroke: '#1e1004',
      strokeThickness: 4,
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(31);

    this.subtitle = this.add.text(layout.width / 2, 38, '', {
      fontFamily: UI_FONT,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#a5d2c1',
      letterSpacing: 0.8
    }).setOrigin(0.5).setDepth(31);
  };

  TempleScene.prototype.drawHud = function drawResponsiveHud() {
    const layout = boardLayout(this);
    const { width, height } = layout;
    this.hud = [];

    const statStyle = {
      fontFamily: UI_FONT,
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#f2d999',
      stroke: '#050806',
      strokeThickness: 2
    };

    const leftOne = Math.min(150, width * 0.13);
    const leftTwo = Math.min(275, width * 0.24);
    const rightTwo = width - leftTwo;
    const rightOne = width - leftOne;

    [leftOne, leftTwo, rightTwo, rightOne].forEach((x, index) => {
      const cardWidth = index === 1 || index === 2 ? 112 : 104;
      this.add.rectangle(x, 27, cardWidth, 42, 0x101a16, 0.95)
        .setStrokeStyle(2, index === 0 ? 0x4ec49a : 0x9d6827, 0.95)
        .setDepth(28);
    });

    this.hud.push(this.add.text(leftOne, 27, '', { ...statStyle, color: '#8cf4d2' }).setOrigin(0.5).setDepth(30));
    this.hud.push(this.add.text(leftTwo, 27, '', statStyle).setOrigin(0.5).setDepth(30));
    this.hud.push(this.add.text(rightTwo, 27, '', statStyle).setOrigin(0.5).setDepth(30));
    this.hud.push(this.add.text(rightOne, 27, '', { ...statStyle, color: '#ff7771', fontSize: '15px' }).setOrigin(0.5).setDepth(30));

    makePlate(this, 32, 27, 46, 42, 'Ⅱ', () => this.scene.start('MainMenuScene'), { fontSize: 18, depth: 34 });
    const sound = makePlate(this, width - 38, 27, 58, 42, this.audioEnabled ? 'SOUND' : 'MUTED', () => this.toggleAudio(), { fontSize: 8, depth: 34 });
    this.audioButton = sound.text;

    this.add.rectangle(width / 2, height - 17, Math.min(width - 180, 760), 30, 0x07120e, 0.9)
      .setStrokeStyle(1, 0x8d632c, 0.86)
      .setDepth(29);
    this.message = this.add.text(width / 2, height - 17, '', {
      fontFamily: UI_FONT,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#e4eee9',
      align: 'center',
      wordWrap: { width: Math.min(width - 240, 700) }
    }).setOrigin(0.5).setDepth(30);

    const leftControlX = 76;
    const rightControlX = width - 76;
    const controlY = height - 103;

    this.add.circle(leftControlX, controlY, 59, 0x07100d, 0.55)
      .setStrokeStyle(2, 0xb17b31, 0.8)
      .setDepth(35);
    this.add.circle(leftControlX, controlY, 43, 0x13241d, 0.44)
      .setStrokeStyle(1, 0xd2a04d, 0.52)
      .setDepth(35);
    makeDirection(this, leftControlX, controlY - 39, '▲', -1, 0);
    makeDirection(this, leftControlX, controlY + 39, '▼', 1, 0);
    makeDirection(this, leftControlX - 39, controlY, '◀', 0, -1);
    makeDirection(this, leftControlX + 39, controlY, '▶', 0, 1);

    const action = this.add.circle(rightControlX, controlY, 52, 0x10211a, 0.82)
      .setStrokeStyle(3, 0xc18a38, 0.94)
      .setDepth(35)
      .setInteractive({ useHandCursor: true });
    const actionIcon = this.add.text(rightControlX, controlY - 8, '✦', {
      fontFamily: DISPLAY_FONT,
      fontSize: '29px',
      fontStyle: 'bold',
      color: '#75efc0',
      stroke: '#06100c',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(36).setInteractive({ useHandCursor: true });
    const actionLabel = this.add.text(rightControlX, controlY + 25, 'HINT', {
      fontFamily: UI_FONT,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#f3da94',
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(36).setInteractive({ useHandCursor: true });

    const useAction = () => {
      this.ensureAudioContext();
      this.tweens.add({ targets: [action, actionIcon, actionLabel], scale: 0.9, duration: 65, yoyo: true });
      this.showHint();
    };
    action.on('pointerdown', useAction);
    actionIcon.on('pointerdown', useAction);
    actionLabel.on('pointerdown', useAction);
    this.hintButton = actionLabel;

    makePlate(this, rightControlX, height - 34, 102, 27, 'RESTART', () => this.restartLevel(), {
      fontSize: 9,
      depth: 35,
      alpha: 0.88
    });
  };

  const originalDrawBoard = TempleScene.prototype.drawBoard;
  TempleScene.prototype.drawBoard = function drawWideBoard(...args) {
    const result = originalDrawBoard.apply(this, args);
    const layout = boardLayout(this);

    if (this.board) {
      this.board.setPosition(layout.x, layout.y).setScale(layout.scale).setDepth(6);

      const base = this.add.rectangle(
        layout.worldWidth / 2,
        layout.worldHeight / 2,
        layout.worldWidth,
        layout.worldHeight,
        0x07120e,
        0.72
      ).setDepth(-10);
      this.board.add(base);

      const lift = this.add.rectangle(
        layout.worldWidth / 2,
        layout.worldHeight / 2,
        layout.worldWidth,
        layout.worldHeight,
        0x476b58,
        0.16
      ).setDepth(3).setBlendMode(Phaser.BlendModes.SCREEN);
      this.board.add(lift);

      this.board.list.forEach((child) => {
        if (child.texture?.key === 'premium-jungle-frame') {
          child.setPosition(layout.worldWidth / 2, layout.worldHeight / 2)
            .setDisplaySize(layout.worldWidth, layout.worldHeight)
            .setAlpha(0.58);
        }
      });
    }

    if (this.hero) {
      this.hero.setDisplaySize(54, 54);
      this.heroShadow?.setScale(1.18, 0.82).setAlpha(0.72);
    }

    this.entities?.forEach((sprite) => {
      if (sprite.texture?.key === 'premium-diamond') sprite.setDisplaySize(52, 52);
      if (sprite.texture?.key === 'premium-guardian-idle') sprite.setDisplaySize(56, 56);
    });

    return result;
  };

  const originalShowLevelIntro = TempleScene.prototype.showLevelIntro;
  TempleScene.prototype.showLevelIntro = function showCenteredIntro(...args) {
    const before = new Set(this.children.list);
    const result = originalShowLevelIntro.apply(this, args);
    shiftNewPanel(this, before, 40, 45);
    return result;
  };

  const originalCompleteLevel = TempleScene.prototype.completeLevel;
  TempleScene.prototype.completeLevel = function showCenteredCompletion(...args) {
    const before = new Set(this.children.list);
    const result = originalCompleteLevel.apply(this, args);
    shiftNewPanel(this, before, 20, 32);
    return result;
  };

  const originalShowGameOver = TempleScene.prototype.showGameOver;
  TempleScene.prototype.showGameOver = function showCenteredGameOver(...args) {
    const before = new Set(this.children.list);
    const result = originalShowGameOver.apply(this, args);
    shiftNewPanel(this, before, 30, 36);
    return result;
  };
}

installGameConfig();
installPreload();
installWideLevels();
installMenu();
installTemple();

window.emeraldLandscapeSlice = Object.freeze({
  version: '2.0.0',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  levelColumns: 24,
  viewportRatio: VIEWPORT_RATIO
});