import { gameState } from '../Game.js';

const TILE_SIZE = 40;
const BOARD_TOP = 118;
const AUDIO_KEY = 'emerald-quest-audio';
const PROGRESS_KEY = 'emerald-quest-progress-v3';

// Original level designs influenced by classic grid, digging, gravity, and trap puzzles.
// Symbols: # wall, . floor, D earth, R boulder, G crystal, K key, E exit,
// S switch, X sealed gate, ^ spike trap, M guardian, A ancient relic, P player.
const LEVELS = [
  {
    name: 'THE BURIED APPROACH',
    objective: 'Dig carefully. Loose boulders fall into cleared tunnels.',
    par: 30,
    hints: [
      'Warning marks show where a boulder can fall.',
      'Boulders can only be pushed sideways onto clear floor.',
      'Collect every crystal and the key before entering the exit.'
    ],
    map: [
      '##########',
      '#PDD#...G#',
      '#D#D#D##D#',
      '#D#..R...#',
      '#D###.##D#',
      '#G....#DD#',
      '###D#D#GD#',
      '#...#....#',
      '#.R....#K#',
      '#DDD##DDD#',
      '#......#E#',
      '##########'
    ]
  },
  {
    name: 'THE SENTINEL GALLERY',
    objective: 'Open the seal, time the spikes, and evade the guardian.',
    par: 34,
    hints: [
      'Step on the green switch to remove every sealed gate.',
      'Spike traps change state after each completed move.',
      'Guardians patrol clear corridors and reverse at obstacles.'
    ],
    map: [
      '##########',
      '#P..#...G#',
      '#.#.#.##.#',
      '#.#S.X...#',
      '#.#.#.##.#',
      '#G..#....#',
      '###.#.^#.#',
      '#...#..M.#',
      '#.R....#K#',
      '#...##...#',
      '#......#E#',
      '##########'
    ]
  },
  {
    name: 'THE EMERALD VAULT',
    objective: 'Master every mechanism and recover the ancient relic.',
    par: 42,
    hints: [
      'The relic is optional, but it awards a large score bonus.',
      'A guardian cannot pass through earth, boulders, gems, or sealed gates.',
      'Plan a safe route before digging beneath suspended boulders.'
    ],
    map: [
      '##########',
      '#PDD#G...#',
      '#D#D#D##.#',
      '#D#.R..M.#',
      '#D###.##.#',
      '#G..S.X..#',
      '###D#D#G.#',
      '#..^#....#',
      '#.R..A.#K#',
      '#DDD##...#',
      '#......#E#',
      '##########'
    ]
  }
];

export default class TempleScene extends Phaser.Scene {
  constructor() {
    super('TempleScene');
  }

  init(data = {}) {
    this.levelIndex = Phaser.Math.Clamp(Number(data.levelIndex) || 0, 0, LEVELS.length - 1);
    this.levelBaseScore = Number.isFinite(data.levelBaseScore) ? data.levelBaseScore : 0;
    this.keepLives = Boolean(data.keepLives);
  }

  create() {
    this.level = LEVELS[this.levelIndex];

    if (!this.keepLives) gameState.lives = 3;
    gameState.score = this.levelBaseScore;
    gameState.startLevel({ world: 'jungle-temple', level: this.levelIndex + 1 });

    this.map = this.level.map.map((row) => row.split(''));
    this.entities = new Map();
    this.terrain = new Map();
    this.spikeSprites = new Map();
    this.gateSprites = new Map();
    this.guardians = [];
    this.dangerMarkers = [];
    this.busy = true;
    this.playerDefeated = false;
    this.pointerStart = null;
    this.gemsCollected = 0;
    this.totalGems = 0;
    this.hasKey = false;
    this.relicFound = false;
    this.moves = 0;
    this.gateOpen = false;
    this.spikesActive = true;
    this.hintIndex = 0;
    this.audioEnabled = this.readAudioPreference();

    this.findLevelObjects();
    this.createTextures();
    this.drawBackground();
    this.drawHud();
    this.drawBoard();
    this.bindInput();
    this.updateHud(this.level.objective);
    this.refreshDangerMarkers();
    this.updateSpikeVisuals();
    this.showLevelIntro();

    this.cameras.main.fadeIn(250, 8, 18, 15);
  }

  findLevelObjects() {
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
  }

  createTextures() {
    if (this.textures.exists('emerald-guardian')) return;

    const graphics = this.add.graphics();

    graphics.fillStyle(0x253d31).fillRoundedRect(0, 0, 40, 40, 5);
    graphics.fillStyle(0x355744).fillRoundedRect(3, 3, 34, 34, 4);
    graphics.lineStyle(2, 0x6a8c72).strokeRoundedRect(1, 1, 38, 38, 5);
    graphics.lineStyle(1, 0x1c2d25, 0.8).strokeRect(7, 7, 26, 26);
    graphics.generateTexture('emerald-wall', 40, 40);
    graphics.clear();

    graphics.fillStyle(0x122d24).fillRect(0, 0, 40, 40);
    graphics.fillStyle(0x1d4637).fillRect(2, 2, 36, 36);
    graphics.lineStyle(1, 0x2b5d49, 0.75).strokeRect(4, 4, 32, 32);
    graphics.fillStyle(0x42705b, 0.35).fillCircle(10, 11, 2).fillCircle(30, 27, 2);
    graphics.generateTexture('emerald-floor', 40, 40);
    graphics.clear();

    graphics.fillStyle(0x60472d).fillRect(1, 1, 38, 38);
    graphics.fillStyle(0x795b37).fillCircle(8, 10, 5).fillCircle(25, 8, 4);
    graphics.fillCircle(32, 25, 6).fillCircle(14, 30, 5);
    graphics.fillStyle(0x9b7647, 0.7).fillCircle(18, 13, 2).fillCircle(7, 28, 2);
    graphics.lineStyle(2, 0x3d2e20).strokeRect(1, 1, 38, 38);
    graphics.generateTexture('emerald-earth', 40, 40);
    graphics.clear();

    graphics.fillStyle(0x1c5139, 0.95).fillCircle(8, 7, 6).fillCircle(31, 8, 7);
    graphics.fillCircle(35, 32, 5).fillCircle(5, 34, 6);
    graphics.generateTexture('emerald-moss', 40, 40);
    graphics.clear();

    graphics.fillStyle(0x514a45).fillCircle(20, 21, 16);
    graphics.fillStyle(0x7b7068).fillCircle(15, 15, 8);
    graphics.fillStyle(0x332f2c).fillCircle(27, 26, 6);
    graphics.lineStyle(2, 0x1d1a18).strokeCircle(20, 21, 16);
    graphics.generateTexture('emerald-rock', 40, 40);
    graphics.clear();

    graphics.fillStyle(0x62f5ff).fillTriangle(20, 2, 36, 14, 28, 37);
    graphics.fillTriangle(20, 2, 4, 14, 12, 37);
    graphics.fillStyle(0xe9ffff, 0.9).fillTriangle(20, 5, 15, 17, 24, 15);
    graphics.lineStyle(2, 0x087ea9).strokeTriangle(20, 2, 36, 14, 28, 37);
    graphics.strokeTriangle(20, 2, 4, 14, 12, 37);
    graphics.generateTexture('emerald-gem', 40, 40);
    graphics.clear();

    graphics.fillStyle(0xf0c54f).fillCircle(13, 20, 8);
    graphics.fillStyle(0x9c691c).fillCircle(13, 20, 3);
    graphics.fillStyle(0xf0c54f).fillRect(18, 17, 17, 6);
    graphics.fillRect(29, 21, 4, 7);
    graphics.generateTexture('emerald-key', 40, 40);
    graphics.clear();

    graphics.fillStyle(0x57321f).fillRoundedRect(6, 3, 28, 36, 12);
    graphics.fillStyle(0xa75f32).fillRoundedRect(10, 7, 20, 31, 8);
    graphics.lineStyle(2, 0x2b170e).strokeRoundedRect(6, 3, 28, 36, 12);
    graphics.fillStyle(0xf7d46a).fillCircle(25, 23, 2);
    graphics.generateTexture('emerald-door', 40, 40);
    graphics.clear();

    graphics.fillStyle(0x345b4a).fillRoundedRect(4, 4, 32, 32, 5);
    graphics.lineStyle(3, 0xd7a94e).strokeRect(7, 4, 7, 32).strokeRect(26, 4, 7, 32);
    graphics.fillStyle(0xb74636).fillCircle(20, 20, 5);
    graphics.generateTexture('emerald-gate', 40, 40);
    graphics.clear();

    graphics.fillStyle(0x173f32).fillRoundedRect(5, 10, 30, 22, 6);
    graphics.fillStyle(0x66d68e).fillRoundedRect(9, 14, 22, 14, 5);
    graphics.lineStyle(2, 0xb9f2c9).strokeRoundedRect(9, 14, 22, 14, 5);
    graphics.generateTexture('emerald-switch', 40, 40);
    graphics.clear();

    graphics.fillStyle(0x4b3130).fillRect(4, 30, 32, 6);
    graphics.fillStyle(0xd9d6c7).fillTriangle(5, 31, 10, 8, 15, 31);
    graphics.fillTriangle(13, 31, 20, 5, 27, 31);
    graphics.fillTriangle(25, 31, 31, 9, 36, 31);
    graphics.generateTexture('emerald-spikes', 40, 40);
    graphics.clear();

    graphics.fillStyle(0x304d42).fillRoundedRect(8, 5, 24, 31, 7);
    graphics.fillStyle(0x5f8e76).fillCircle(20, 14, 9);
    graphics.fillStyle(0xff5b4f).fillCircle(16, 14, 2).fillCircle(24, 14, 2);
    graphics.fillStyle(0x1b2a25).fillRect(13, 24, 14, 8);
    graphics.lineStyle(2, 0xa9c6b5).strokeRoundedRect(8, 5, 24, 31, 7);
    graphics.generateTexture('emerald-guardian', 40, 40);
    graphics.clear();

    graphics.fillStyle(0xf4ce62).fillCircle(20, 20, 12);
    graphics.fillStyle(0x64e8bd).fillTriangle(20, 5, 31, 20, 20, 35);
    graphics.fillTriangle(20, 5, 9, 20, 20, 35);
    graphics.lineStyle(2, 0x76571f).strokeCircle(20, 20, 13);
    graphics.generateTexture('emerald-relic', 40, 40);
    graphics.clear();

    graphics.fillStyle(0xd5a15f).fillCircle(20, 15, 7);
    graphics.fillStyle(0x6d4828).fillEllipse(20, 8, 25, 8);
    graphics.fillStyle(0x7b5530).fillRoundedRect(13, 20, 14, 15, 4);
    graphics.fillStyle(0x2d2341).fillRect(13, 32, 6, 7).fillRect(22, 32, 6, 7);
    graphics.fillStyle(0xe6c36f).fillEllipse(20, 5, 17, 7);
    graphics.generateTexture('emerald-hero', 40, 40);
    graphics.clear();

    graphics.fillStyle(0xffdc62).fillCircle(4, 4, 4);
    graphics.generateTexture('emerald-spark', 8, 8);
    graphics.clear();

    graphics.fillStyle(0x000000, 0.4).fillEllipse(20, 21, 26, 10);
    graphics.generateTexture('emerald-shadow', 40, 40);
    graphics.destroy();
  }

  drawBackground() {
    this.cameras.main.setBackgroundColor('#08120f');
    this.add.rectangle(200, 320, 400, 640, 0x10261e);

    for (let index = 0; index < 24; index += 1) {
      this.add.circle(
        Phaser.Math.Between(0, 400),
        Phaser.Math.Between(100, 640),
        Phaser.Math.Between(10, 42),
        0x24513f,
        Phaser.Math.FloatBetween(0.07, 0.18)
      );
    }

    this.add.rectangle(200, 62, 384, 100, 0x15382d, 0.98).setStrokeStyle(3, 0xc5903d);
    this.add.text(200, 25, 'EMERALD QUEST', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffe9a6',
      stroke: '#33230d',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.subtitle = this.add.text(200, 50, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: '#c9e2d1'
    }).setOrigin(0.5);

    this.addTorch(10, 352);
    this.addTorch(390, 352);
  }

  addTorch(x, y) {
    const glow = this.add.circle(x, y, 24, 0xffb43d, 0.12).setDepth(1);
    const flame = this.add.circle(x, y, 5, 0xffd561, 0.9).setDepth(2);
    this.tweens.add({
      targets: [glow, flame],
      alpha: { from: 0.45, to: 0.95 },
      scale: { from: 0.82, to: 1.12 },
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  drawHud() {
    this.hud = [];
    const positions = [55, 145, 245, 345];

    positions.forEach((x) => {
      this.add.rectangle(x, 88, 82, 34, 0x203f35, 0.98).setStrokeStyle(2, 0xb4863e);
    });

    const commonStyle = {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#fff0b5'
    };

    this.hud.push(this.add.text(positions[0], 88, '', commonStyle).setOrigin(0.5));
    this.hud.push(this.add.text(positions[1], 88, '', commonStyle).setOrigin(0.5));
    this.hud.push(this.add.text(positions[2], 88, '', commonStyle).setOrigin(0.5));
    this.hud.push(this.add.text(positions[3], 88, '', {
      ...commonStyle,
      fontSize: '15px',
      color: '#ff6872'
    }).setOrigin(0.5));

    this.message = this.add.text(200, 620, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#e8e0bf',
      align: 'center',
      wordWrap: { width: 270 }
    }).setOrigin(0.5);

    const restartButton = this.makeTopButton(18, '↻', 22);
    restartButton.setOrigin(0, 0);
    restartButton.on('pointerdown', () => this.restartLevel());

    this.hintButton = this.makeTopButton(88, 'HINT', 9);
    this.hintButton.setOrigin(0.5, 0);
    this.hintButton.on('pointerdown', () => this.showHint());

    this.audioButton = this.makeTopButton(382, this.audioEnabled ? 'SOUND ON' : 'SOUND OFF', 9);
    this.audioButton.setOrigin(1, 0);
    this.audioButton.on('pointerdown', () => this.toggleAudio());
  }

  makeTopButton(x, label, fontSize) {
    const button = this.add.text(x, 18, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${fontSize}px`,
      fontStyle: 'bold',
      color: '#ffe591',
      backgroundColor: '#27483b',
      padding: { x: 8, y: fontSize > 12 ? 4 : 7 }
    }).setDepth(30).setInteractive({ useHandCursor: true });

    button.on('pointerdown', () => this.playTone('button'));
    return button;
  }

  drawBoard() {
    this.board = this.add.container(0, BOARD_TOP);

    for (let row = 0; row < this.map.length; row += 1) {
      for (let col = 0; col < this.map[row].length; col += 1) {
        const tile = this.map[row][col];
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;
        const floor = this.add.image(x, y, tile === '#' ? 'emerald-wall' : 'emerald-floor');
        this.board.add(floor);

        if (tile === '#' && (row + col) % 3 === 0) {
          this.board.add(this.add.image(x, y, 'emerald-moss').setAlpha(0.42));
        }

        if (tile !== '#') {
          floor.setInteractive();
          floor.on('pointerdown', () => this.handleTap(row, col));
        }

        if (tile === 'D') {
          const earth = this.add.image(x, y, 'emerald-earth').setDepth(2);
          this.terrain.set(`${row},${col}`, earth);
          this.board.add(earth);
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

    this.heroShadow = this.add.image(
      this.playerPosition.col * TILE_SIZE + TILE_SIZE / 2,
      this.playerPosition.row * TILE_SIZE + TILE_SIZE / 2 + 13,
      'emerald-shadow'
    ).setDepth(7).setAlpha(0.55);

    this.hero = this.add.image(
      this.playerPosition.col * TILE_SIZE + TILE_SIZE / 2,
      this.playerPosition.row * TILE_SIZE + TILE_SIZE / 2,
      'emerald-hero'
    ).setDepth(8);

    this.board.add([this.heroShadow, this.hero]);
    this.tweens.add({
      targets: this.hero,
      scaleY: 1.035,
      scaleX: 0.98,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  addEntity(row, col, texture) {
    const sprite = this.add.image(
      col * TILE_SIZE + TILE_SIZE / 2,
      row * TILE_SIZE + TILE_SIZE / 2,
      texture
    ).setDepth(5);

    if (texture === 'emerald-door') sprite.setTint(0x676767);

    if (['emerald-gem', 'emerald-key', 'emerald-relic'].includes(texture)) {
      this.tweens.add({
        targets: sprite,
        y: sprite.y - 3,
        scale: texture === 'emerald-gem' ? 1.1 : 1.04,
        angle: texture === 'emerald-gem' ? 3 : 0,
        duration: 650,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    this.entities.set(`${row},${col}`, sprite);
    this.board.add(sprite);
    return sprite;
  }

  addGate(row, col) {
    const sprite = this.addEntity(row, col, 'emerald-gate');
    this.gateSprites.set(`${row},${col}`, sprite);
  }

  addSpike(row, col) {
    const sprite = this.addEntity(row, col, 'emerald-spikes');
    this.spikeSprites.set(`${row},${col}`, sprite);
  }

  addGuardian(row, col) {
    const sprite = this.addEntity(row, col, 'emerald-guardian');
    this.guardians.push({ row, col, dr: 0, dc: col % 2 === 0 ? -1 : 1, underTile: '.', sprite });
  }

  bindInput() {
    this.input.on('pointerdown', (pointer) => {
      this.pointerStart = { x: pointer.x, y: pointer.y };
      this.ensureAudioContext();
    });

    this.input.on('pointerup', (pointer) => {
      if (!this.pointerStart || this.busy) return;
      const dx = pointer.x - this.pointerStart.x;
      const dy = pointer.y - this.pointerStart.y;
      this.pointerStart = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) this.movePlayer(0, dx > 0 ? 1 : -1);
      else this.movePlayer(dy > 0 ? 1 : -1, 0);
    });

    this.input.keyboard?.on('keydown', (event) => {
      const keyMap = {
        ArrowUp: [-1, 0], w: [-1, 0], W: [-1, 0],
        ArrowDown: [1, 0], s: [1, 0], S: [1, 0],
        ArrowLeft: [0, -1], a: [0, -1], A: [0, -1],
        ArrowRight: [0, 1], d: [0, 1], D: [0, 1]
      };

      if (event.key === 'r' || event.key === 'R') return this.restartLevel();
      if (event.key === 'h' || event.key === 'H') return this.showHint();
      const direction = keyMap[event.key];
      if (direction) this.movePlayer(...direction);
    });
  }

  handleTap(row, col) {
    const rowDiff = row - this.playerPosition.row;
    const colDiff = col - this.playerPosition.col;
    if (Math.abs(rowDiff) + Math.abs(colDiff) === 1) this.movePlayer(rowDiff, colDiff);
  }

  movePlayer(rowDirection, colDirection) {
    if (this.busy) return;

    const nextRow = this.playerPosition.row + rowDirection;
    const nextCol = this.playerPosition.col + colDirection;
    const target = this.map[nextRow]?.[nextCol];

    if (!target || target === '#' || (target === 'X' && !this.gateOpen)) {
      this.playTone('blocked');
      this.cameras.main.shake(70, 0.0025);
      this.updateHud(target === 'X' ? 'The emerald seal is still locked.' : undefined);
      return;
    }

    if (target === 'M') {
      this.damagePlayer('A temple guardian blocked the passage!', 'guardian');
      return;
    }

    if (target === 'R' && !this.tryPushRock(nextRow, nextCol, rowDirection, colDirection)) {
      this.playTone('blocked');
      this.cameras.main.shake(80, 0.0025);
      this.updateHud('That boulder needs clear floor behind it.');
      return;
    }

    if (target === 'E' && (!this.hasKey || this.gemsCollected < this.totalGems)) {
      this.playTone('blocked');
      this.cameras.main.shake(90, 0.003);
      this.updateHud('The exit needs the key and every crystal.');
      return;
    }

    this.busy = true;
    this.moves = gameState.registerMove();
    this.playerPosition = { row: nextRow, col: nextCol };
    if (colDirection !== 0) this.hero.setFlipX(colDirection < 0);
    this.playTone(target === 'D' ? 'dig' : 'step');

    const targetX = nextCol * TILE_SIZE + TILE_SIZE / 2;
    const targetY = nextRow * TILE_SIZE + TILE_SIZE / 2;

    this.tweens.add({ targets: [this.hero, this.heroShadow], x: targetX, duration: 135, ease: 'Quad.easeOut' });
    this.tweens.add({
      targets: this.hero,
      y: targetY,
      duration: 135,
      ease: 'Quad.easeOut',
      onComplete: () => this.resolveLanding(target, nextRow, nextCol)
    });
    this.tweens.add({ targets: this.heroShadow, y: targetY + 13, duration: 135, ease: 'Quad.easeOut' });
  }

  tryPushRock(row, col, rowDirection, colDirection) {
    if (rowDirection !== 0) return false;
    const destinationRow = row;
    const destinationCol = col + colDirection;
    if (this.map[destinationRow]?.[destinationCol] !== '.') return false;
    if (this.isPlayerAt(destinationRow, destinationCol)) return false;

    const rock = this.entities.get(`${row},${col}`);
    if (!rock) return false;

    this.entities.delete(`${row},${col}`);
    this.entities.set(`${destinationRow},${destinationCol}`, rock);
    this.map[destinationRow][destinationCol] = 'R';
    this.map[row][col] = '.';

    gameState.addScore(5);
    this.playTone('rock');
    this.cameras.main.shake(55, 0.0015);
    this.tweens.add({
      targets: rock,
      x: destinationCol * TILE_SIZE + TILE_SIZE / 2,
      y: destinationRow * TILE_SIZE + TILE_SIZE / 2,
      angle: rock.angle + 35 * colDirection,
      duration: 145,
      ease: 'Quad.easeOut'
    });
    return true;
  }

  resolveLanding(target, row, col) {
    if (target === 'D') this.digEarth(row, col);
    if (target === 'G') this.collectGem(row, col);
    if (target === 'K') this.collectKey(row, col);
    if (target === 'S') this.activateSwitch(row, col);
    if (target === 'A') this.collectRelic(row, col);

    if (target === '^' && this.spikesActive) {
      this.damagePlayer('The floor spikes caught the explorer!', 'spike');
      return;
    }

    if (target === 'E') {
      this.completeLevel();
      return;
    }

    this.updateHud();
    this.time.delayedCall(55, () => this.settleGravity());
  }

  digEarth(row, col) {
    this.map[row][col] = '.';
    gameState.addScore(10);
    const earth = this.terrain.get(`${row},${col}`);
    this.terrain.delete(`${row},${col}`);
    if (earth) {
      this.createBurst(earth.x, earth.y, 0xb78b54, 11);
      this.showFloatingText(earth.x, earth.y, '+10', '#ffe1a4');
      earth.destroy();
    }
  }

  collectGem(row, col) {
    this.map[row][col] = '.';
    this.gemsCollected += 1;
    gameState.collectDiamond(1);
    const gem = this.entities.get(`${row},${col}`);
    this.entities.delete(`${row},${col}`);
    if (gem) {
      this.createBurst(gem.x, gem.y, 0x62f5ff, 16);
      this.showFloatingText(gem.x, gem.y, '+100');
      gem.destroy();
    }
    this.playTone('gem');
    this.updateHud(this.gemsCollected === this.totalGems
      ? 'All crystals found. Retrieve the key and reach the exit!'
      : 'Crystal collected!');
  }

  collectKey(row, col) {
    this.map[row][col] = '.';
    this.hasKey = true;
    gameState.collectKey(1);
    const key = this.entities.get(`${row},${col}`);
    this.entities.delete(`${row},${col}`);
    if (key) {
      this.createBurst(key.x, key.y, 0xf0c54f, 18);
      key.destroy();
    }
    const door = [...this.entities.values()].find((sprite) => sprite.texture.key === 'emerald-door');
    if (door) {
      door.clearTint();
      this.tweens.add({ targets: door, scale: 1.12, duration: 220, yoyo: true, ease: 'Back.easeOut' });
    }
    this.playTone('key');
    this.updateHud(this.gemsCollected === this.totalGems
      ? 'The ancient exit is ready!'
      : 'Key found. Collect the remaining crystals.');
  }

  activateSwitch(row, col) {
    if (this.gateOpen) return;
    this.gateOpen = true;
    gameState.addScore(75);
    const switchSprite = this.entities.get(`${row},${col}`);
    switchSprite?.setTint(0x8affae);
    this.playTone('switch');

    this.gateSprites.forEach((gate, key) => {
      const [gateRow, gateCol] = key.split(',').map(Number);
      this.map[gateRow][gateCol] = '.';
      this.entities.delete(key);
      this.tweens.add({
        targets: gate,
        alpha: 0,
        scaleY: 0.2,
        duration: 260,
        ease: 'Back.easeIn',
        onComplete: () => gate.destroy()
      });
    });
    this.gateSprites.clear();
    this.updateHud('The emerald seal has opened!');
  }

  collectRelic(row, col) {
    this.map[row][col] = '.';
    this.relicFound = true;
    gameState.addScore(300);
    const relic = this.entities.get(`${row},${col}`);
    this.entities.delete(`${row},${col}`);
    if (relic) {
      this.createBurst(relic.x, relic.y, 0x64e8bd, 26);
      this.showFloatingText(relic.x, relic.y, '+300', '#a8ffe3');
      relic.destroy();
    }
    this.playTone('relic');
    this.updateHud('Ancient relic recovered!');
  }

  settleGravity() {
    if (!this.sys.isActive()) return;

    const falling = [];
    for (let row = this.map.length - 2; row >= 1; row -= 1) {
      for (let col = 1; col < this.map[row].length - 1; col += 1) {
        if (this.map[row][col] !== 'R') continue;
        const destinationRow = row + 1;
        const destinationCol = col;
        const below = this.map[destinationRow]?.[destinationCol];

        if (this.isPlayerAt(destinationRow, destinationCol) && below === '.') {
          const rock = this.entities.get(`${row},${col}`);
          if (rock) {
            this.entities.delete(`${row},${col}`);
            this.entities.set(`${destinationRow},${destinationCol}`, rock);
            this.map[row][col] = '.';
            this.map[destinationRow][destinationCol] = 'R';
            this.crushPlayer(rock, destinationRow, destinationCol);
            return;
          }
        }

        if (below !== '.') continue;
        const rock = this.entities.get(`${row},${col}`);
        if (!rock) continue;
        this.entities.delete(`${row},${col}`);
        this.entities.set(`${destinationRow},${destinationCol}`, rock);
        this.map[row][col] = '.';
        this.map[destinationRow][destinationCol] = 'R';
        falling.push({ rock, destinationRow });
      }
    }

    if (falling.length === 0) {
      this.finishTurn();
      return;
    }

    this.busy = true;
    this.playTone('fall');
    let remaining = falling.length;
    falling.forEach(({ rock, destinationRow }) => {
      this.tweens.add({
        targets: rock,
        y: destinationRow * TILE_SIZE + TILE_SIZE / 2,
        angle: rock.angle + 22,
        duration: 145,
        ease: 'Quad.easeIn',
        onComplete: () => {
          remaining -= 1;
          if (remaining === 0) {
            this.cameras.main.shake(45, 0.0012);
            this.time.delayedCall(65, () => this.settleGravity());
          }
        }
      });
    });
  }

  finishTurn() {
    this.spikesActive = !this.spikesActive;
    this.updateSpikeVisuals();

    if (this.map[this.playerPosition.row]?.[this.playerPosition.col] === '^' && this.spikesActive) {
      this.damagePlayer('The spikes rose beneath the explorer!', 'spike');
      return;
    }

    if (this.advanceGuardians()) return;

    this.busy = false;
    this.refreshDangerMarkers();
    this.updateHud();
  }

  advanceGuardians() {
    for (const guardian of this.guardians) {
      let nextRow = guardian.row + guardian.dr;
      let nextCol = guardian.col + guardian.dc;

      if (!this.guardianCanEnter(nextRow, nextCol)) {
        guardian.dr *= -1;
        guardian.dc *= -1;
        nextRow = guardian.row + guardian.dr;
        nextCol = guardian.col + guardian.dc;
      }

      if (!this.guardianCanEnter(nextRow, nextCol)) continue;
      if (this.isPlayerAt(nextRow, nextCol)) {
        this.damagePlayer('A temple guardian caught the explorer!', 'guardian');
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

      this.tweens.add({
        targets: guardian.sprite,
        x: nextCol * TILE_SIZE + TILE_SIZE / 2,
        y: nextRow * TILE_SIZE + TILE_SIZE / 2,
        duration: 150,
        ease: 'Quad.easeOut'
      });
    }
    return false;
  }

  guardianCanEnter(row, col) {
    const tile = this.map[row]?.[col];
    return ['.', 'S', '^'].includes(tile) || this.isPlayerAt(row, col);
  }

  updateSpikeVisuals() {
    this.spikeSprites.forEach((sprite) => {
      sprite.setAlpha(this.spikesActive ? 1 : 0.35);
      sprite.setTint(this.spikesActive ? 0xff786d : 0x6d8a7d);
      sprite.setScale(1, this.spikesActive ? 1 : 0.55);
    });
  }

  crushPlayer(rock, destinationRow, destinationCol) {
    if (this.playerDefeated) return;
    this.playerDefeated = true;
    this.busy = true;
    this.clearDangerMarkers();
    this.playTone('crush');
    this.cameras.main.shake(320, 0.008);
    this.cameras.main.flash(180, 180, 20, 20);
    this.tweens.add({
      targets: rock,
      y: destinationRow * TILE_SIZE + TILE_SIZE / 2,
      angle: rock.angle + 35,
      duration: 170,
      ease: 'Quad.easeIn'
    });
    this.tweens.add({ targets: [this.hero, this.heroShadow], alpha: 0, scale: 0.65, duration: 220 });
    this.loseLifeAndRestart('A falling boulder struck the explorer!');
  }

  damagePlayer(message, type) {
    if (this.playerDefeated) return;
    this.playerDefeated = true;
    this.busy = true;
    this.clearDangerMarkers();
    this.playTone(type === 'guardian' ? 'guardian' : 'spike');
    this.cameras.main.shake(220, 0.006);
    this.cameras.main.flash(180, 210, 35, 35);
    this.tweens.add({ targets: [this.hero, this.heroShadow], alpha: 0.15, duration: 100, yoyo: true, repeat: 2 });
    this.loseLifeAndRestart(message);
  }

  loseLifeAndRestart(message) {
    const livesRemaining = gameState.loseLife();
    this.updateHud(message);
    this.time.delayedCall(720, () => {
      if (livesRemaining > 0) this.restartLevel(true);
      else this.showGameOver();
    });
  }

  refreshDangerMarkers() {
    this.clearDangerMarkers();
    for (let row = 1; row < this.map.length - 1; row += 1) {
      for (let col = 1; col < this.map[row].length - 1; col += 1) {
        if (this.map[row][col] !== 'R') continue;
        if (!['.', 'D'].includes(this.map[row + 1]?.[col])) continue;
        const marker = this.add.text(
          col * TILE_SIZE + TILE_SIZE / 2,
          (row + 1) * TILE_SIZE + TILE_SIZE / 2,
          '!',
          {
            fontFamily: 'Arial, sans-serif',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ffcc59',
            stroke: '#5a240e',
            strokeThickness: 4
          }
        ).setOrigin(0.5).setDepth(4).setAlpha(0.8);
        this.board.add(marker);
        this.dangerMarkers.push(marker);
        this.tweens.add({ targets: marker, alpha: 0.25, scale: 1.15, duration: 420, yoyo: true, repeat: -1 });
      }
    }
  }

  clearDangerMarkers() {
    this.dangerMarkers.forEach((marker) => marker.destroy());
    this.dangerMarkers = [];
  }

  showLevelIntro() {
    const panel = this.add.rectangle(200, 320, 344, 150, 0x102c24, 0.97)
      .setStrokeStyle(3, 0xe0b65c)
      .setDepth(40);
    const title = this.add.text(200, 286, `CHAMBER ${this.levelIndex + 1}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#70f0bf'
    }).setOrigin(0.5).setDepth(41);
    const name = this.add.text(200, 315, this.level.name, {
      fontFamily: 'Arial, sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#ffe7a0'
    }).setOrigin(0.5).setDepth(41);
    const objective = this.add.text(200, 350, this.level.objective, {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#dcebe2', align: 'center', wordWrap: { width: 300 }
    }).setOrigin(0.5).setDepth(41);

    this.time.delayedCall(1050, () => {
      this.tweens.add({
        targets: [panel, title, name, objective],
        alpha: 0,
        duration: 260,
        onComplete: () => {
          [panel, title, name, objective].forEach((item) => item.destroy());
          this.busy = false;
        }
      });
    });
  }

  showHint() {
    if (this.busy) return;
    const hint = this.level.hints[this.hintIndex % this.level.hints.length];
    this.hintIndex += 1;
    this.playTone('button');
    this.updateHud(`Hint: ${hint}`);
    this.hintButton.setScale(1.08);
    this.time.delayedCall(140, () => this.hintButton?.setScale(1));
  }

  updateHud(message) {
    this.hud[0].setText(`◆ ${this.gemsCollected}/${this.totalGems}`);
    this.hud[1].setText(`KEY ${this.hasKey ? 1 : 0}/1`);
    this.hud[2].setText(`MOVES ${this.moves}`);
    this.hud[3].setText('♥'.repeat(gameState.lives));
    this.subtitle.setText(`CHAMBER ${this.levelIndex + 1}/${LEVELS.length} • SCORE ${gameState.score}`);
    if (message) this.message.setText(message);
  }

  completeLevel() {
    this.busy = true;
    this.clearDangerMarkers();

    const previousBest = this.readBestMoves();
    const isNewBest = previousBest === null || this.moves < previousBest;
    const bestMoves = isNewBest ? this.moves : previousBest;
    const bonus = Math.max(200, 1800 - this.moves * 25);
    const stars = this.moves <= this.level.par ? 3 : this.moves <= this.level.par + 12 ? 2 : 1;

    gameState.addScore(bonus);
    gameState.setFlag(`level-${this.levelIndex + 1}-complete`, true);
    if (isNewBest) this.saveBestMoves(this.moves);
    this.saveProgress(Math.min(LEVELS.length - 1, this.levelIndex + 1));

    this.playTone('win');
    this.cameras.main.flash(350, 255, 220, 90);

    const isFinal = this.levelIndex === LEVELS.length - 1;
    this.add.rectangle(200, 320, 350, 278, 0x17382f, 0.98).setStrokeStyle(4, 0xe4b95c).setDepth(20);
    this.add.text(200, 216, isFinal ? 'EXPEDITION COMPLETE!' : 'CHAMBER CLEARED!', {
      fontFamily: 'Arial, sans-serif', fontSize: isFinal ? '22px' : '25px', fontStyle: 'bold',
      color: '#ffe7a0', stroke: '#3a260c', strokeThickness: 3
    }).setOrigin(0.5).setDepth(21);
    this.add.text(200, 255, '★'.repeat(stars) + '☆'.repeat(3 - stars), {
      fontFamily: 'Arial, sans-serif', fontSize: '30px', color: '#ffd45c'
    }).setOrigin(0.5).setDepth(21);
    this.add.text(200, 309,
      `Moves: ${this.moves}\nBest: ${bestMoves}\nScore: ${gameState.score}\nRelic: ${this.relicFound ? 'Recovered' : '—'}`,
      { fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#e7f3e9', align: 'center', lineSpacing: 4 }
    ).setOrigin(0.5).setDepth(21);

    if (isNewBest) {
      this.add.text(200, 371, 'NEW BEST!', {
        fontFamily: 'Arial, sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#6fffd1'
      }).setOrigin(0.5).setDepth(21);
    }

    if (isFinal) {
      const replayButton = this.makePanelButton(139, 426, 'REPLAY RUN');
      const menuButton = this.makePanelButton(261, 426, 'MAIN MENU');
      replayButton.on('pointerdown', () => this.scene.restart({ levelIndex: 0, levelBaseScore: 0, keepLives: false }));
      menuButton.on('pointerdown', () => this.scene.start('MainMenuScene'));
    } else {
      const nextButton = this.makePanelButton(139, 426, 'NEXT CHAMBER');
      const menuButton = this.makePanelButton(261, 426, 'MAIN MENU');
      nextButton.on('pointerdown', () => this.scene.restart({
        levelIndex: this.levelIndex + 1,
        levelBaseScore: gameState.score,
        keepLives: true
      }));
      menuButton.on('pointerdown', () => this.scene.start('MainMenuScene'));
    }
  }

  showGameOver() {
    this.add.rectangle(200, 320, 340, 232, 0x321b1b, 0.98).setStrokeStyle(4, 0xd65b58).setDepth(30);
    this.add.text(200, 253, 'EXPEDITION LOST', {
      fontFamily: 'Arial, sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#ffd4cf'
    }).setOrigin(0.5).setDepth(31);
    this.add.text(200, 311, 'The temple claimed all three lives.\nUse warnings, switches, and enemy timing to survive.', {
      fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#f3dddd', align: 'center', lineSpacing: 6
    }).setOrigin(0.5).setDepth(31);

    const retryButton = this.makePanelButton(139, 386, 'TRY AGAIN', 31);
    const menuButton = this.makePanelButton(261, 386, 'MAIN MENU', 31);
    retryButton.on('pointerdown', () => this.scene.restart({
      levelIndex: this.levelIndex,
      levelBaseScore: this.levelBaseScore,
      keepLives: false
    }));
    menuButton.on('pointerdown', () => this.scene.start('MainMenuScene'));
  }

  makePanelButton(x, y, label, depth = 21) {
    const button = this.add.text(x, y, label, {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#3b2708',
      backgroundColor: '#f0c75e', padding: { x: 11, y: 10 }
    }).setOrigin(0.5).setDepth(depth).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setScale(1.04));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerdown', () => this.playTone('button'));
    return button;
  }

  restartLevel(keepLives = true) {
    this.scene.restart({
      levelIndex: this.levelIndex,
      levelBaseScore: this.levelBaseScore,
      keepLives
    });
  }

  isPlayerAt(row, col) {
    return this.playerPosition.row === row && this.playerPosition.col === col;
  }

  createBurst(x, y, tint, quantity = 16) {
    const particles = this.add.particles(x, y, 'emerald-spark', {
      speed: { min: 35, max: 105 }, lifespan: 500, quantity,
      scale: { start: 1, end: 0 }, gravityY: 90, tint
    });
    this.board.add(particles);
    this.time.delayedCall(550, () => particles.destroy());
  }

  showFloatingText(x, y, label, color = '#dfffff') {
    const text = this.add.text(x, y, label, {
      fontFamily: 'Arial, sans-serif', fontSize: '13px', fontStyle: 'bold', color,
      stroke: '#0b3028', strokeThickness: 3
    }).setOrigin(0.5).setDepth(12);
    this.board.add(text);
    this.tweens.add({
      targets: text, y: y - 24, alpha: 0, duration: 650, ease: 'Quad.easeOut',
      onComplete: () => text.destroy()
    });
  }

  storageKeyForLevel() {
    return `emerald-quest-best-moves-v3-${this.levelIndex}`;
  }

  readBestMoves() {
    try {
      const value = Number(window.localStorage.getItem(this.storageKeyForLevel()));
      return Number.isFinite(value) && value > 0 ? value : null;
    } catch {
      return null;
    }
  }

  saveBestMoves(moves) {
    try {
      window.localStorage.setItem(this.storageKeyForLevel(), String(moves));
    } catch {
      // Gameplay continues when storage is unavailable.
    }
  }

  saveProgress(unlockedLevelIndex) {
    try {
      const previous = Number(window.localStorage.getItem(PROGRESS_KEY)) || 0;
      window.localStorage.setItem(PROGRESS_KEY, String(Math.max(previous, unlockedLevelIndex)));
    } catch {
      // Gameplay continues when storage is unavailable.
    }
  }

  readAudioPreference() {
    try {
      return window.localStorage.getItem(AUDIO_KEY) !== 'off';
    } catch {
      return true;
    }
  }

  toggleAudio() {
    this.audioEnabled = !this.audioEnabled;
    this.audioButton.setText(this.audioEnabled ? 'SOUND ON' : 'SOUND OFF');
    try {
      window.localStorage.setItem(AUDIO_KEY, this.audioEnabled ? 'on' : 'off');
    } catch {
      // Ignore storage failures.
    }
    if (this.audioEnabled) this.playTone('button');
  }

  ensureAudioContext() {
    if (!this.audioEnabled) return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!window.emeraldAudioContext) window.emeraldAudioContext = new AudioContextClass();
    if (window.emeraldAudioContext.state === 'suspended') {
      window.emeraldAudioContext.resume().catch(() => {});
    }
    return window.emeraldAudioContext;
  }

  playTone(type) {
    if (!this.audioEnabled) return;
    const audioContext = this.ensureAudioContext();
    if (!audioContext) return;

    const sounds = {
      step: { frequency: 150, duration: 0.045, volume: 0.025, wave: 'square' },
      dig: { frequency: 118, duration: 0.07, volume: 0.035, wave: 'triangle' },
      blocked: { frequency: 85, duration: 0.1, volume: 0.04, wave: 'sawtooth' },
      rock: { frequency: 105, duration: 0.13, volume: 0.045, wave: 'triangle' },
      fall: { frequency: 92, duration: 0.11, volume: 0.045, wave: 'sawtooth' },
      crush: { frequency: 62, duration: 0.3, volume: 0.07, wave: 'sawtooth' },
      spike: { frequency: 115, duration: 0.18, volume: 0.055, wave: 'square' },
      guardian: { frequency: 78, duration: 0.24, volume: 0.06, wave: 'sawtooth' },
      switch: { frequency: 390, duration: 0.18, volume: 0.045, wave: 'triangle' },
      gem: { frequency: 720, duration: 0.16, volume: 0.045, wave: 'sine' },
      key: { frequency: 520, duration: 0.2, volume: 0.05, wave: 'triangle' },
      relic: { frequency: 620, duration: 0.28, volume: 0.055, wave: 'sine' },
      button: { frequency: 330, duration: 0.07, volume: 0.03, wave: 'sine' },
      win: { frequency: 440, duration: 0.4, volume: 0.055, wave: 'sine' }
    };

    const sound = sounds[type];
    if (!sound) return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = sound.wave;
    oscillator.frequency.setValueAtTime(sound.frequency, now);

    if (['gem', 'key', 'relic', 'win', 'switch'].includes(type)) {
      oscillator.frequency.exponentialRampToValueAtTime(sound.frequency * 1.7, now + sound.duration);
    } else if (['fall', 'crush', 'guardian'].includes(type)) {
      oscillator.frequency.exponentialRampToValueAtTime(45, now + sound.duration);
    }

    gain.gain.setValueAtTime(sound.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + sound.duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + sound.duration);
  }
}
