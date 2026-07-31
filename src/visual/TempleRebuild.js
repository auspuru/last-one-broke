import { gameState } from '../Game.js';
import TempleScene from '../scenes/TempleScene.js';

const TILE_SIZE = 40;
const UI_FONT = 'Trebuchet MS, Arial, sans-serif';
const DISPLAY_FONT = 'Georgia, Times New Roman, serif';

const REBUILT_LEVELS = [
  {
    name: 'THE BURIED APPROACH',
    objective: 'Read the chamber, cross brittle floors, and secure the vault route.',
    par: 42,
    hints: [
      'Cracked gold tiles collapse after you leave them.',
      'The turquoise shrine suppresses spike traps for five turns.',
      'Chain crystal pickups within six moves for bonus score.'
    ],
    map: [
      '##################',
      '#P...DD...G.....E#',
      '#..####....###...#',
      '#..B..#..R...#...#',
      '#..##.#......#...#',
      '#G....#..D...#...#',
      '###.###..###.#...#',
      '#..T....G....#...#',
      '#..R...####..#K..#',
      '#.......B........#',
      '##################'
    ]
  },
  {
    name: 'THE SENTINEL GALLERY',
    objective: 'Break the seal, control the spikes, and outmanoeuvre the sentinel.',
    par: 48,
    hints: [
      'The emerald switch removes every sealed gate.',
      'Sentinels pursue when they see you along a clear corridor.',
      'Use the shrine before crossing the spike lane.'
    ],
    map: [
      '##################',
      '#P....#..G......E#',
      '#.S...#.....###..#',
      '#.....X.....#....#',
      '###.#####...#.^..#',
      '#...#....M..#....#',
      '#.G.#.B.....###..#',
      '#...#....T.......#',
      '#.R.#####..G..#K.#',
      '#.............#..#',
      '##################'
    ]
  },
  {
    name: 'THE EMERALD VAULT',
    objective: 'Master every mechanism and recover the ancient relic.',
    par: 56,
    hints: [
      'The relic is optional, but it is worth a large score bonus.',
      'Do not strand yourself behind a collapsed bridge tile.',
      'Use the shrine window to cross the eastern spike corridor.'
    ],
    map: [
      '##################',
      '#P.D..#..G......E#',
      '#..D.S#......##..#',
      '#..R..X..M...#...#',
      '###.#####....#.^.#',
      '#...#..A.....#...#',
      '#.G.#.B..D...###.#',
      '#...#....T.......#',
      '#.R.#####..G..#K.#',
      '#.............#..#',
      '##################'
    ]
  }
];

function layoutFor(scene) {
  const width = scene.scale.width;
  const height = scene.scale.height;
  const columns = scene.map?.[0]?.length || 18;
  const rows = scene.map?.length || 11;
  const worldWidth = columns * TILE_SIZE;
  const worldHeight = rows * TILE_SIZE;
  const top = 57;
  const bottom = 34;
  const sideReserve = width < 1020 ? 184 : 210;
  const scale = Math.min(1.08, (height - top - bottom) / worldHeight, (width - sideReserve) / worldWidth);
  const displayWidth = worldWidth * scale;
  const displayHeight = worldHeight * scale;
  return {
    width,
    height,
    worldWidth,
    worldHeight,
    scale,
    displayWidth,
    displayHeight,
    x: (width - displayWidth) / 2,
    y: top + Math.max(0, (height - top - bottom - displayHeight) / 2)
  };
}

function removeTexture(scene, key) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
}

function installLevelDefinitions() {
  TempleScene.prototype.findLevelObjects = function findRebuiltLevelObjects() {
    const design = REBUILT_LEVELS[this.levelIndex] || REBUILT_LEVELS[0];
    this.level = { ...this.level, ...design };
    this.map = design.map.map((row) => row.split(''));
    this.totalGems = 0;
    this.playerPosition = { row: 1, col: 1 };
    this.brittleSprites = new Map();
    this.shrineSprites = new Map();
    this.torchShieldTurns = 0;
    this.gemCombo = 0;
    this.lastGemMove = -Infinity;

    for (let row = 0; row < this.map.length; row += 1) {
      for (let col = 0; col < this.map[row].length; col += 1) {
        const tile = this.map[row][col];
        if (tile === 'P') {
          this.playerPosition = { row, col };
          this.map[row][col] = '.';
        }
        if (tile === 'G') this.totalGems += 1;
      }
    }
  };
}

function installPolishedTextures() {
  const originalCreateTextures = TempleScene.prototype.createTextures;
  TempleScene.prototype.createTextures = function createRebuiltTextures(...args) {
    originalCreateTextures?.apply(this, args);
    if (this.textures.exists('rebuild-floor-a')) return;

    const g = this.add.graphics();
    const save = (key, width = 40, height = 40) => {
      g.generateTexture(key, width, height);
      g.clear();
    };
    const bevel = (base, inset, highlight, shadow) => {
      g.fillStyle(shadow).fillRect(0, 0, 40, 40);
      g.fillStyle(base).fillRoundedRect(1, 1, 38, 38, 4);
      g.fillStyle(inset).fillRoundedRect(4, 4, 32, 32, 3);
      g.fillStyle(highlight, 0.62).fillRect(5, 5, 29, 2).fillRect(5, 7, 2, 27);
      g.fillStyle(shadow, 0.72).fillRect(5, 33, 30, 2).fillRect(33, 6, 2, 29);
    };

    const floors = [
      [0x1d4437, 0x285a49, 0x91baa0, 0x071713],
      [0x254b3d, 0x326451, 0xa4c8ae, 0x081a15],
      [0x193d31, 0x235343, 0x79a98e, 0x061510]
    ];
    floors.forEach(([base, inset, highlight, shadow], index) => {
      bevel(base, inset, highlight, shadow);
      g.lineStyle(1, 0x0b2a21, 0.72).strokeRect(9 + index, 9, 22, 22);
      g.fillStyle(0x82d6ae, 0.12).fillCircle(9, 29, 3).fillCircle(31, 11, 2);
      save(`rebuild-floor-${String.fromCharCode(97 + index)}`);
    });

    const walls = [
      [0x344d40, 0x496756, 0xb8c7ad, 0x0a1612],
      [0x3d5648, 0x526f5e, 0xc8d2b7, 0x0b1813],
      [0x2c473a, 0x405f4e, 0xa9bfa4, 0x081510]
    ];
    walls.forEach(([base, inset, highlight, shadow], index) => {
      bevel(base, inset, highlight, shadow);
      g.lineStyle(2, 0x162d25, 0.85).strokeRect(index === 1 ? 6 : 8, 8, index === 1 ? 28 : 24, 24);
      g.fillStyle(0x1a5c42, 0.68).fillCircle(5, 7, index === 2 ? 7 : 4).fillCircle(35, 34, 5);
      save(`rebuild-wall-${String.fromCharCode(97 + index)}`);
    });

    const earths = [
      [0x805b36, 0xb07d45],
      [0x6f4b2d, 0x9c6c3b]
    ];
    earths.forEach(([base, light], index) => {
      g.fillStyle(0x2c1b11).fillRoundedRect(0, 0, 40, 40, 3);
      g.fillStyle(base).fillRoundedRect(2, 2, 36, 36, 3);
      g.fillStyle(light, 0.82).fillCircle(8, 9, 5).fillCircle(27, 8, 4).fillCircle(32, 27, 6).fillCircle(14, 31, 5);
      g.fillStyle(0x3d2818, 0.72).fillCircle(18, 18, 3).fillCircle(6, 29, 2).fillCircle(30, 35, 3);
      g.lineStyle(2, 0x3b2516, 0.92).strokeRoundedRect(1, 1, 38, 38, 3);
      save(`rebuild-earth-${String.fromCharCode(97 + index)}`);
    });

    g.fillStyle(0x14251f).fillRect(0, 0, 40, 40);
    g.fillStyle(0x9d7338).fillRoundedRect(2, 2, 36, 36, 4);
    g.fillStyle(0xcaa35f).fillRoundedRect(5, 5, 30, 30, 3);
    g.lineStyle(2, 0x4d351b).beginPath().moveTo(6, 8).lineTo(17, 17).lineTo(10, 29).moveTo(33, 8).lineTo(24, 18).lineTo(31, 32).moveTo(17, 17).lineTo(24, 18).strokePath();
    g.lineStyle(2, 0xf2d783, 0.38).strokeRoundedRect(5, 5, 30, 30, 3);
    save('rebuild-brittle');

    g.fillStyle(0x07100d).fillRect(0, 0, 40, 40);
    g.fillStyle(0x010403).fillEllipse(20, 23, 34, 25);
    g.lineStyle(3, 0x49351e, 0.85).strokeEllipse(20, 23, 34, 25);
    g.fillStyle(0x10271f, 0.7).fillEllipse(17, 18, 19, 8);
    save('rebuild-pit');

    g.fillStyle(0x08130f, 0.5).fillEllipse(20, 34, 34, 8);
    g.fillStyle(0x27473a).fillRoundedRect(4, 17, 32, 18, 6);
    g.fillStyle(0x3d7159).fillRoundedRect(7, 19, 26, 13, 5);
    g.lineStyle(2, 0xd6aa4f).strokeRoundedRect(5, 17, 30, 18, 6);
    g.fillStyle(0x45e8b0, 0.2).fillCircle(20, 15, 13);
    g.fillStyle(0x63f0bd).fillTriangle(20, 3, 30, 17, 20, 28).fillTriangle(20, 3, 10, 17, 20, 28);
    g.fillStyle(0xe1fff3, 0.82).fillTriangle(20, 7, 17, 15, 23, 14);
    save('rebuild-shrine');

    ['emerald-rock', 'emerald-key', 'emerald-door', 'emerald-gate', 'emerald-switch', 'emerald-spikes', 'emerald-relic'].forEach((key) => removeTexture(this, key));

    g.fillStyle(0x000000, 0.36).fillEllipse(21, 33, 31, 10);
    g.fillStyle(0x524c43).fillCircle(20, 21, 17);
    g.fillStyle(0x796f60).fillCircle(18, 18, 14);
    g.fillStyle(0xa69a84).fillCircle(13, 13, 7);
    g.fillStyle(0x332f2a).fillCircle(28, 27, 7);
    g.lineStyle(2, 0x211d19).strokeCircle(20, 21, 17);
    g.lineStyle(2, 0xc4b79f, 0.52).beginPath().moveTo(9, 24).lineTo(17, 18).lineTo(26, 23).strokePath();
    save('emerald-rock');

    g.fillStyle(0xffdd69, 0.18).fillCircle(20, 20, 18);
    g.fillStyle(0xf2c44f).fillCircle(12, 20, 9);
    g.fillStyle(0xffe27a).fillCircle(12, 20, 6);
    g.fillStyle(0x6f4813).fillCircle(12, 20, 3);
    g.fillStyle(0xf0bb42).fillRoundedRect(19, 17, 18, 7, 2).fillRect(30, 22, 4, 8).fillRect(24, 22, 4, 5);
    g.fillStyle(0xfff0ad, 0.9).fillRect(20, 18, 13, 2);
    save('emerald-key');

    g.fillStyle(0x000000, 0.38).fillEllipse(20, 36, 34, 7);
    g.fillStyle(0x382015).fillRoundedRect(3, 2, 34, 38, 15);
    g.fillStyle(0x794925).fillRoundedRect(7, 5, 26, 35, 12);
    g.fillStyle(0xa96b33).fillRoundedRect(11, 8, 18, 32, 8);
    g.lineStyle(2, 0x1b0e08).strokeRoundedRect(3, 2, 34, 38, 15);
    g.lineStyle(2, 0xd8a858, 0.72).strokeRoundedRect(11, 8, 18, 32, 8);
    g.fillStyle(0x65f0bd, 0.24).fillCircle(20, 22, 9);
    g.fillStyle(0x71f5c5).fillCircle(20, 22, 3);
    save('emerald-door');

    g.fillStyle(0x10231d).fillRoundedRect(2, 1, 36, 38, 5);
    g.fillStyle(0x526c58).fillRect(5, 3, 6, 34).fillRect(29, 3, 6, 34);
    g.lineStyle(2, 0xe1b556).strokeRect(5, 3, 6, 34).strokeRect(29, 3, 6, 34);
    g.fillStyle(0x26c28f, 0.55).fillRect(15, 4, 10, 32);
    g.lineStyle(2, 0x7df6cc).beginPath().moveTo(20, 6).lineTo(26, 14).lineTo(20, 21).lineTo(14, 28).lineTo(20, 35).strokePath();
    save('emerald-gate');

    g.fillStyle(0x081611, 0.4).fillEllipse(20, 33, 34, 8);
    g.fillStyle(0x284c3c).fillRoundedRect(3, 13, 34, 20, 7);
    g.fillStyle(0x3f7c5e).fillRoundedRect(7, 15, 26, 15, 5);
    g.lineStyle(2, 0xe1b95e).strokeRoundedRect(4, 13, 32, 20, 7);
    g.fillStyle(0x5bf2b9, 0.26).fillCircle(20, 21, 12);
    g.fillStyle(0x6df7c4).fillCircle(20, 21, 7);
    g.fillStyle(0xe6fff5).fillCircle(18, 19, 2);
    save('emerald-switch');

    g.fillStyle(0x121c18).fillRoundedRect(2, 30, 36, 8, 3);
    g.lineStyle(1, 0x7d867f).strokeRoundedRect(2, 30, 36, 8, 3);
    g.fillStyle(0xb7c0ba).fillTriangle(4, 31, 9, 7, 14, 31);
    g.fillStyle(0xf1f4ef).fillTriangle(12, 31, 19, 3, 26, 31);
    g.fillStyle(0xc7d0ca).fillTriangle(24, 31, 31, 8, 36, 31);
    g.fillStyle(0xffffff, 0.55).fillTriangle(15, 27, 19, 7, 21, 27);
    save('emerald-spikes');

    g.fillStyle(0x62f1be, 0.18).fillCircle(20, 20, 18);
    g.fillStyle(0xa67a29).fillCircle(20, 20, 13);
    g.fillStyle(0xf2d16d).fillCircle(20, 20, 10);
    g.fillStyle(0x66efbd).fillTriangle(20, 5, 31, 20, 20, 35).fillTriangle(20, 5, 9, 20, 20, 35);
    g.fillStyle(0xe2fff4, 0.88).fillTriangle(20, 9, 17, 18, 23, 17);
    g.lineStyle(2, 0x714f17).strokeCircle(20, 20, 13);
    save('emerald-relic');

    g.destroy();
  };
}

function addTorch(scene, x, y, depth = 8) {
  const glow = scene.add.circle(x, y, 38, 0xffa33a, 0.075).setDepth(depth - 1);
  const coreGlow = scene.add.circle(x, y, 14, 0xffd06c, 0.14).setDepth(depth);
  scene.add.rectangle(x, y + 16, 7, 26, 0x4a2b14, 1).setStrokeStyle(2, 0xc08331, 0.9).setDepth(depth + 1);
  const flame = scene.add.triangle(x, y - 4, 0, 18, 8, 0, 16, 18, 0xffbe38, 0.96).setDepth(depth + 2);
  const inner = scene.add.triangle(x, y - 1, 3, 13, 8, 3, 13, 13, 0xfff0a8, 0.95).setDepth(depth + 3);
  scene.tweens.add({
    targets: [glow, coreGlow, flame, inner],
    alpha: { from: 0.45, to: 1 },
    scaleX: { from: 0.9, to: 1.1 },
    scaleY: { from: 0.86, to: 1.08 },
    duration: Phaser.Math.Between(360, 520),
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });
}

function makeButton(scene, x, y, width, height, label, handler, options = {}) {
  const depth = options.depth || 36;
  const plate = scene.add.rectangle(x, y, width, height, options.fill || 0x102019, options.alpha ?? 0.92)
    .setStrokeStyle(2, options.stroke || 0xb77d31, 0.96)
    .setDepth(depth)
    .setInteractive({ useHandCursor: true });
  const text = scene.add.text(x, y, label, {
    fontFamily: UI_FONT,
    fontSize: `${options.fontSize || 10}px`,
    fontStyle: 'bold',
    color: options.color || '#f4dc96',
    stroke: '#050806',
    strokeThickness: 2,
    letterSpacing: options.letterSpacing || 0.5,
    align: 'center'
  }).setOrigin(0.5).setDepth(depth + 1).setInteractive({ useHandCursor: true });
  const press = () => {
    scene.ensureAudioContext?.();
    scene.playTone?.('button');
    scene.tweens.add({ targets: [plate, text], scale: 0.9, duration: 60, yoyo: true, ease: 'Quad.easeOut' });
    handler();
  };
  plate.on('pointerdown', press);
  text.on('pointerdown', press);
  return { plate, text };
}

function makeDirection(scene, x, y, label, dr, dc) {
  return makeButton(scene, x, y, 38, 38, label, () => scene.movePlayer(dr, dc), {
    fontSize: 18,
    depth: 38,
    fill: 0x13251d,
    stroke: 0xd09a45,
    alpha: 0.9
  });
}

function scanObjectives(scene) {
  const targets = [];
  scene.entities?.forEach((sprite) => {
    const key = sprite.texture?.key;
    if (['premium-diamond', 'emerald-key', 'emerald-door', 'emerald-switch', 'emerald-relic'].includes(key)) targets.push(sprite);
  });
  scene.shrineSprites?.forEach((sprite) => targets.push(sprite));
  targets.forEach((target, index) => {
    scene.time.delayedCall(index * 45, () => {
      if (!target?.active) return;
      scene.tweens.add({ targets: target, scale: target.scale * 1.18, duration: 130, yoyo: true, ease: 'Back.easeOut' });
    });
  });
  scene.refreshDangerMarkers?.();
  scene.showHint();
}

function installPresentation() {
  TempleScene.prototype.drawBackground = function drawRebuiltBackground() {
    const layout = layoutFor(this);
    this.cameras.main.setBackgroundColor('#07130f');
    this.add.rectangle(layout.width / 2, layout.height / 2, layout.width, layout.height, 0x07130f).setDepth(-30);

    for (let index = 0; index < 18; index += 1) {
      const side = index % 2 === 0 ? 1 : -1;
      const x = side > 0 ? Phaser.Math.Between(0, Math.max(20, layout.x - 10)) : Phaser.Math.Between(layout.x + layout.displayWidth + 10, layout.width);
      const y = Phaser.Math.Between(70, layout.height - 38);
      this.add.circle(x, y, Phaser.Math.Between(14, 42), index % 3 ? 0x184b35 : 0x245c40, Phaser.Math.FloatBetween(0.12, 0.3)).setDepth(-20);
    }

    this.add.rectangle(layout.width / 2, 27, layout.width, 54, 0x020705, 0.94).setDepth(26);
    this.add.rectangle(layout.width / 2, layout.height - 17, layout.width, 34, 0x020705, 0.92).setDepth(26);

    this.add.rectangle(layout.x + layout.displayWidth / 2 + 4, layout.y + layout.displayHeight / 2 + 5, layout.displayWidth + 18, layout.displayHeight + 18, 0x000000, 0.52).setDepth(1);
    this.add.rectangle(layout.x + layout.displayWidth / 2, layout.y + layout.displayHeight / 2, layout.displayWidth + 12, layout.displayHeight + 12, 0x12251d, 0.96)
      .setStrokeStyle(3, 0xb98437, 0.96)
      .setDepth(2);
    this.add.rectangle(layout.x + layout.displayWidth / 2, layout.y + layout.displayHeight / 2, layout.displayWidth + 4, layout.displayHeight + 4, 0x07120e, 0.96)
      .setStrokeStyle(1, 0xecd18a, 0.44)
      .setDepth(3);

    const torchOffset = Math.max(28, Math.min(52, layout.x * 0.46));
    addTorch(this, Math.max(26, layout.x - torchOffset), layout.height * 0.52, 8);
    addTorch(this, Math.min(layout.width - 26, layout.x + layout.displayWidth + torchOffset), layout.height * 0.52, 8);

    this.add.text(layout.width / 2, 13, 'EMERALD QUEST', {
      fontFamily: DISPLAY_FONT,
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#f5d687',
      stroke: '#211104',
      strokeThickness: 4,
      letterSpacing: 2.2
    }).setOrigin(0.5).setDepth(31);

    this.subtitle = this.add.text(layout.width / 2, 39, '', {
      fontFamily: UI_FONT,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#a8d8c5',
      letterSpacing: 0.8
    }).setOrigin(0.5).setDepth(31);
  };

  TempleScene.prototype.drawHud = function drawRebuiltHud() {
    const layout = layoutFor(this);
    const { width, height } = layout;
    this.hud = [];
    const cardY = 27;
    const cardWidth = 110;
    const statStyle = {
      fontFamily: UI_FONT,
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#f4dda0',
      stroke: '#050806',
      strokeThickness: 2
    };
    const positions = [138, 258, width - 258, width - 138];
    positions.forEach((x, index) => {
      this.add.rectangle(x, cardY, cardWidth, 40, 0x13231c, 0.98)
        .setStrokeStyle(2, index === 0 ? 0x55dbac : 0xa7742d, 0.96)
        .setDepth(29);
    });
    this.hud.push(this.add.text(positions[0], cardY, '', { ...statStyle, color: '#90f7d5' }).setOrigin(0.5).setDepth(31));
    this.hud.push(this.add.text(positions[1], cardY, '', statStyle).setOrigin(0.5).setDepth(31));
    this.hud.push(this.add.text(positions[2], cardY, '', statStyle).setOrigin(0.5).setDepth(31));
    this.hud.push(this.add.text(positions[3], cardY, '', { ...statStyle, color: '#ff7f79', fontSize: '15px' }).setOrigin(0.5).setDepth(31));

    makeButton(this, 35, cardY, 50, 40, 'Ⅱ', () => this.scene.start('MainMenuScene'), { fontSize: 18, depth: 35 });
    const sound = makeButton(this, width - 39, cardY, 62, 40, this.audioEnabled ? 'SOUND' : 'MUTED', () => this.toggleAudio(), { fontSize: 8, depth: 35 });
    this.audioButton = sound.text;

    this.add.rectangle(width / 2, height - 17, Math.min(720, width - 250), 28, 0x07120e, 0.96)
      .setStrokeStyle(1, 0x9b6e31, 0.9)
      .setDepth(29);
    this.message = this.add.text(width / 2, height - 17, '', {
      fontFamily: UI_FONT,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#e9f1ed',
      align: 'center',
      wordWrap: { width: Math.min(650, width - 290) }
    }).setOrigin(0.5).setDepth(31);

    this.mechanicBadge = this.add.text(width / 2, 55, '', {
      fontFamily: UI_FONT,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#80efc2',
      backgroundColor: '#0b2018',
      padding: { x: 8, y: 4 },
      stroke: '#04100b',
      strokeThickness: 2
    }).setOrigin(0.5, 0).setDepth(33).setAlpha(0);

    const leftX = Math.max(52, layout.x / 2);
    const rightX = width - leftX;
    const controlY = height - 82;
    this.add.circle(leftX, controlY, 48, 0x07110d, 0.68).setStrokeStyle(2, 0xc08a38, 0.9).setDepth(36);
    makeDirection(this, leftX, controlY - 31, '▲', -1, 0);
    makeDirection(this, leftX, controlY + 31, '▼', 1, 0);
    makeDirection(this, leftX - 31, controlY, '◀', 0, -1);
    makeDirection(this, leftX + 31, controlY, '▶', 0, 1);

    const scan = makeButton(this, rightX, controlY - 12, 82, 54, '✦  SCAN', () => scanObjectives(this), {
      fontSize: 11,
      depth: 37,
      fill: 0x10271e,
      stroke: 0x5be2b3,
      color: '#9ff8d8'
    });
    this.hintButton = scan.text;
    makeButton(this, rightX, controlY + 36, 82, 27, 'RESTART', () => this.restartLevel(), { fontSize: 8, depth: 37, alpha: 0.9 });
  };

  TempleScene.prototype.drawBoard = function drawRebuiltBoard() {
    const layout = layoutFor(this);
    this.board = this.add.container(layout.x, layout.y).setScale(layout.scale).setDepth(6);
    const floors = ['rebuild-floor-a', 'rebuild-floor-b', 'rebuild-floor-c'];
    const walls = ['rebuild-wall-a', 'rebuild-wall-b', 'rebuild-wall-c'];
    const earths = ['rebuild-earth-a', 'rebuild-earth-b'];

    const base = this.add.rectangle(layout.worldWidth / 2, layout.worldHeight / 2, layout.worldWidth, layout.worldHeight, 0x07120e, 1);
    this.board.add(base);

    for (let row = 0; row < this.map.length; row += 1) {
      for (let col = 0; col < this.map[row].length; col += 1) {
        const tile = this.map[row][col];
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;
        const seed = row * 19 + col * 31 + this.levelIndex * 17;
        const floor = this.add.image(x, y, tile === '#' ? walls[seed % walls.length] : floors[seed % floors.length]);
        this.board.add(floor);
        if (tile !== '#') {
          floor.setInteractive();
          floor.on('pointerdown', () => this.handleTap(row, col));
        }
        if (tile === 'D') {
          const earth = this.add.image(x, y, earths[seed % earths.length]).setDepth(2);
          this.terrain.set(`${row},${col}`, earth);
          this.board.add(earth);
        }
        if (tile === 'B') {
          const brittle = this.add.image(x, y, 'rebuild-brittle').setDepth(2);
          this.brittleSprites.set(`${row},${col}`, brittle);
          this.board.add(brittle);
        }
        if (tile === 'T') {
          const shrine = this.add.image(x, y, 'rebuild-shrine').setDepth(5);
          this.shrineSprites.set(`${row},${col}`, shrine);
          this.board.add(shrine);
          this.tweens.add({ targets: shrine, y: y - 2, scale: 1.07, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
        if (tile === 'G') this.addEntity(row, col, 'emerald-gem');
        if (tile === 'R') this.addEntity(row, col, 'emerald-rock');
        if (tile === 'K') this.addEntity(row, col, 'emerald-key');
        if (tile === 'E') this.addEntity(row, col, 'emerald-door');
        if (tile === 'S') this.addEntity(row, col, 'emerald-switch');
        if (tile === 'X') this.addGate(row, col);
        if (tile === '^') this.addSpike(row, col);
        if (tile === 'M') this.addGuardian(row, col);
        if (tile === 'A') this.addEntity(row, col, 'emerald-relic');
      }
    }

    const heroTexture = this.textures.exists('premium-hero-idle') ? 'premium-hero-idle' : 'emerald-hero';
    this.heroShadow = this.add.image(this.playerPosition.col * TILE_SIZE + 20, this.playerPosition.row * TILE_SIZE + 34, 'emerald-shadow').setDepth(7).setAlpha(0.7);
    this.hero = this.add.image(this.playerPosition.col * TILE_SIZE + 20, this.playerPosition.row * TILE_SIZE + 20, heroTexture).setDepth(8).setDisplaySize(54, 54);
    this.board.add([this.heroShadow, this.hero]);
    this.tweens.add({ targets: this.hero, y: this.hero.y - 1.5, scaleY: 1.025, scaleX: 0.99, duration: 560, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    for (let index = 0; index < 15; index += 1) {
      const mote = this.add.circle(Phaser.Math.Between(25, layout.worldWidth - 25), Phaser.Math.Between(25, layout.worldHeight - 25), Phaser.Math.FloatBetween(0.8, 1.8), index % 4 === 0 ? 0xffd477 : 0x7ce9bd, Phaser.Math.FloatBetween(0.08, 0.22)).setDepth(12);
      this.board.add(mote);
      this.tweens.add({ targets: mote, y: mote.y - Phaser.Math.Between(18, 42), alpha: 0, duration: Phaser.Math.Between(1800, 3000), delay: Phaser.Math.Between(0, 1400), repeat: -1, ease: 'Sine.easeOut' });
    }
  };
}

function collapseBrittle(scene, row, col) {
  if (scene.map[row]?.[col] !== 'B') return;
  scene.map[row][col] = '#';
  const sprite = scene.brittleSprites.get(`${row},${col}`);
  scene.brittleSprites.delete(`${row},${col}`);
  if (sprite?.active) {
    scene.playTone('fall');
    scene.cameras.main.shake(95, 0.0024);
    scene.tweens.add({
      targets: sprite,
      scale: 0.72,
      alpha: 0,
      angle: 6,
      duration: 170,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (!scene.sys.isActive()) return;
        sprite.setTexture('rebuild-pit').setScale(1).setAlpha(1).setAngle(0).setDepth(2);
      }
    });
  }
}

function installMechanics() {
  const originalMovePlayer = TempleScene.prototype.movePlayer;
  TempleScene.prototype.movePlayer = function movePlayerWithCollapsingFloors(dr, dc) {
    const previous = this.playerPosition ? { ...this.playerPosition } : null;
    const previousTile = previous ? this.map[previous.row]?.[previous.col] : null;
    const result = originalMovePlayer.call(this, dr, dc);
    const moved = previous && this.playerPosition && (previous.row !== this.playerPosition.row || previous.col !== this.playerPosition.col);
    if (moved && previousTile === 'B') this.time.delayedCall(150, () => collapseBrittle(this, previous.row, previous.col));
    return result;
  };

  const originalResolveLanding = TempleScene.prototype.resolveLanding;
  TempleScene.prototype.resolveLanding = function resolveRebuiltLanding(target, row, col) {
    if (target === 'T') {
      this.map[row][col] = '.';
      this.torchShieldTurns = 5;
      this.spikesActive = false;
      const shrine = this.shrineSprites.get(`${row},${col}`);
      this.shrineSprites.delete(`${row},${col}`);
      gameState.addScore(150);
      if (shrine?.active) {
        this.createBurst(shrine.x, shrine.y, 0x63f0bd, 24);
        this.showFloatingText(shrine.x, shrine.y, 'SPIKES SEALED', '#b7ffe3');
        this.tweens.add({ targets: shrine, alpha: 0, scale: 1.55, duration: 260, ease: 'Back.easeIn', onComplete: () => shrine.destroy() });
      }
      this.playTone('switch');
      this.updateSpikeVisuals();
      this.updateHud('Torch shrine activated — spike traps are suppressed for five turns.');
      return originalResolveLanding.call(this, '.', row, col);
    }
    return originalResolveLanding.call(this, target === 'B' ? '.' : target, row, col);
  };

  TempleScene.prototype.finishTurn = function finishRebuiltTurn() {
    if (this.torchShieldTurns > 0) {
      this.torchShieldTurns -= 1;
      this.spikesActive = false;
    } else {
      this.spikesActive = !this.spikesActive;
    }
    this.updateSpikeVisuals();

    if (this.map[this.playerPosition.row]?.[this.playerPosition.col] === '^' && this.spikesActive) {
      this.damagePlayer('The spikes rose beneath the explorer!', 'spike');
      return;
    }
    if (this.advanceGuardians()) return;
    this.busy = false;
    this.refreshDangerMarkers();
    this.updateHud();
  };

  TempleScene.prototype.advanceGuardians = function advanceHuntingGuardians() {
    const canEnter = (row, col) => {
      const tile = this.map[row]?.[col];
      return ['.', 'S', '^', 'B', 'T'].includes(tile) || this.isPlayerAt(row, col);
    };
    const lineClear = (guardian, dr, dc, distance) => {
      for (let step = 1; step < distance; step += 1) {
        if (!canEnter(guardian.row + dr * step, guardian.col + dc * step)) return false;
      }
      return true;
    };

    for (const guardian of this.guardians) {
      const rowDelta = this.playerPosition.row - guardian.row;
      const colDelta = this.playerPosition.col - guardian.col;
      const distance = Math.abs(rowDelta) + Math.abs(colDelta);
      const candidates = [];

      if (distance <= 6 && rowDelta === 0 && lineClear(guardian, 0, Math.sign(colDelta), Math.abs(colDelta))) {
        candidates.push([0, Math.sign(colDelta)]);
      } else if (distance <= 6 && colDelta === 0 && lineClear(guardian, Math.sign(rowDelta), 0, Math.abs(rowDelta))) {
        candidates.push([Math.sign(rowDelta), 0]);
      } else if (distance <= 5) {
        if (Math.abs(colDelta) >= Math.abs(rowDelta) && colDelta !== 0) candidates.push([0, Math.sign(colDelta)]);
        if (rowDelta !== 0) candidates.push([Math.sign(rowDelta), 0]);
      }

      candidates.push([guardian.dr, guardian.dc], [-guardian.dr, -guardian.dc], [guardian.dc, guardian.dr], [-guardian.dc, -guardian.dr]);
      const choice = candidates.find(([dr, dc]) => (dr !== 0 || dc !== 0) && canEnter(guardian.row + dr, guardian.col + dc));
      if (!choice) continue;
      const [dr, dc] = choice;
      const nextRow = guardian.row + dr;
      const nextCol = guardian.col + dc;
      guardian.dr = dr;
      guardian.dc = dc;

      if (this.isPlayerAt(nextRow, nextCol)) {
        this.damagePlayer('A sentinel hunted the explorer down!', 'guardian');
        return true;
      }

      const destinationTile = this.map[nextRow][nextCol];
      this.map[guardian.row][guardian.col] = guardian.underTile;
      this.entities.delete(`${guardian.row},${guardian.col}`);
      guardian.underTile = destinationTile;
      guardian.row = nextRow;
      guardian.col = nextCol;
      this.map[nextRow][nextCol] = 'M';
      this.entities.set(`${nextRow},${nextCol}`, guardian.sprite);
      guardian.sprite.setFlipX(dc < 0);
      this.tweens.add({ targets: guardian.sprite, x: nextCol * TILE_SIZE + 20, y: nextRow * TILE_SIZE + 20, duration: 155, ease: 'Quad.easeOut' });
    }
    return false;
  };

  const originalCollectGem = TempleScene.prototype.collectGem;
  TempleScene.prototype.collectGem = function collectGemWithChain(row, col) {
    const result = originalCollectGem.call(this, row, col);
    this.gemCombo = this.moves - this.lastGemMove <= 6 ? this.gemCombo + 1 : 1;
    this.lastGemMove = this.moves;
    if (this.gemCombo > 1) {
      const bonus = (this.gemCombo - 1) * 50;
      gameState.addScore(bonus);
      this.showFloatingText(col * TILE_SIZE + 20, row * TILE_SIZE + 9, `CHAIN x${this.gemCombo}  +${bonus}`, '#fff0a8');
      this.updateHud(`Crystal chain x${this.gemCombo}! Bonus +${bonus}.`);
    }
    return result;
  };

  const originalUpdateHud = TempleScene.prototype.updateHud;
  TempleScene.prototype.updateHud = function updateRebuiltHud(...args) {
    const result = originalUpdateHud.apply(this, args);
    if (this.mechanicBadge) {
      const parts = [];
      if (this.torchShieldTurns > 0) parts.push(`SPIKE SHIELD ${this.torchShieldTurns}`);
      if (this.gemCombo > 1 && this.moves - this.lastGemMove <= 6) parts.push(`CHAIN x${this.gemCombo}`);
      this.mechanicBadge.setText(parts.join('  •  ')).setAlpha(parts.length ? 1 : 0);
    }
    return result;
  };
}

installLevelDefinitions();
installPolishedTextures();
installPresentation();
installMechanics();

window.emeraldTempleRebuild = Object.freeze({
  version: '3.0.0',
  levelSize: { columns: 18, rows: 11 },
  mechanics: ['brittle-floors', 'torch-shield', 'guardian-line-of-sight', 'crystal-chain']
});
