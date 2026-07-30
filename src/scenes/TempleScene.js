import { gameState } from '../Game.js';

const TILE_SIZE = 40;
const BOARD_TOP = 118;
const STORAGE_KEY = 'emerald-quest-best-moves-v2';
const AUDIO_KEY = 'emerald-quest-audio';

// Original level design inspired by the digging-and-gravity puzzle genre.
// D = diggable earth, R = boulder, G = crystal, K = key, E = exit.
const LEVEL = [
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
];

export default class TempleScene extends Phaser.Scene {
  constructor() {
    super('TempleScene');
  }

  create() {
    gameState.startLevel({ world: 'jungle-temple', level: 1 });
    gameState.score = 0;

    this.map = LEVEL.map((row) => row.split(''));
    this.entities = new Map();
    this.terrain = new Map();
    this.dangerMarkers = [];
    this.busy = false;
    this.pointerStart = null;
    this.gemsCollected = 0;
    this.hasKey = false;
    this.moves = 0;
    this.totalGems = 0;
    this.audioEnabled = this.readAudioPreference();

    this.findLevelObjects();
    this.createTextures();
    this.drawBackground();
    this.drawHud();
    this.drawBoard();
    this.bindInput();
    this.updateHud('Dig through earth, collect every crystal, and beware falling boulders.');
    this.refreshDangerMarkers();

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
    if (this.textures.exists('emerald-earth')) return;

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

    for (let index = 0; index < 22; index += 1) {
      this.add.circle(
        Phaser.Math.Between(0, 400),
        Phaser.Math.Between(100, 640),
        Phaser.Math.Between(10, 42),
        0x24513f,
        Phaser.Math.FloatBetween(0.08, 0.2)
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
      fontSize: '11px',
      color: '#c9e2d1'
    }).setOrigin(0.5);
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
      fontSize: '12px',
      color: '#e8e0bf',
      align: 'center',
      wordWrap: { width: 310 }
    }).setOrigin(0.5);

    const restartButton = this.add.text(18, 18, '↻', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffe591',
      backgroundColor: '#27483b',
      padding: { x: 8, y: 4 }
    }).setOrigin(0, 0).setDepth(30).setInteractive({ useHandCursor: true });

    restartButton.on('pointerdown', () => {
      this.playTone('button');
      this.scene.restart();
    });

    this.audioButton = this.add.text(382, 18, this.audioEnabled ? 'SOUND ON' : 'SOUND OFF', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#ffe591',
      backgroundColor: '#27483b',
      padding: { x: 7, y: 7 }
    }).setOrigin(1, 0).setDepth(30).setInteractive({ useHandCursor: true });

    this.audioButton.on('pointerdown', () => this.toggleAudio());
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
          const moss = this.add.image(x, y, 'emerald-moss').setAlpha(0.42);
          this.board.add(moss);
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

    if (texture === 'emerald-gem') {
      this.tweens.add({
        targets: sprite,
        scale: 1.12,
        angle: 3,
        duration: 620,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    if (texture === 'emerald-key') {
      this.tweens.add({
        targets: sprite,
        y: sprite.y - 3,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    this.entities.set(`${row},${col}`, sprite);
    this.board.add(sprite);
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

      if (Math.abs(dx) > Math.abs(dy)) {
        this.movePlayer(0, dx > 0 ? 1 : -1);
      } else {
        this.movePlayer(dy > 0 ? 1 : -1, 0);
      }
    });

    this.input.keyboard?.on('keydown', (event) => {
      const keyMap = {
        ArrowUp: [-1, 0],
        w: [-1, 0],
        W: [-1, 0],
        ArrowDown: [1, 0],
        s: [1, 0],
        S: [1, 0],
        ArrowLeft: [0, -1],
        a: [0, -1],
        A: [0, -1],
        ArrowRight: [0, 1],
        d: [0, 1],
        D: [0, 1]
      };

      if (event.key === 'r' || event.key === 'R') {
        this.scene.restart();
        return;
      }

      const direction = keyMap[event.key];
      if (direction) this.movePlayer(...direction);
    });
  }

  handleTap(row, col) {
    const rowDiff = row - this.playerPosition.row;
    const colDiff = col - this.playerPosition.col;

    if (Math.abs(rowDiff) + Math.abs(colDiff) === 1) {
      this.movePlayer(rowDiff, colDiff);
    }
  }

  movePlayer(rowDirection, colDirection) {
    if (this.busy) return;

    const nextRow = this.playerPosition.row + rowDirection;
    const nextCol = this.playerPosition.col + colDirection;
    const target = this.map[nextRow]?.[nextCol];

    if (!target || target === '#') {
      this.playTone('blocked');
      this.cameras.main.shake(70, 0.0025);
      return;
    }

    if (target === 'R' && !this.tryPushRock(nextRow, nextCol, rowDirection, colDirection)) {
      this.playTone('blocked');
      this.cameras.main.shake(80, 0.0025);
      this.updateHud('That boulder needs empty space behind it.');
      return;
    }

    if (target === 'E' && (!this.hasKey || this.gemsCollected < this.totalGems)) {
      this.playTone('blocked');
      this.cameras.main.shake(90, 0.003);
      this.updateHud('The gate needs the key and every crystal.');
      return;
    }

    this.busy = true;
    this.moves = gameState.registerMove();
    this.playerPosition = { row: nextRow, col: nextCol };

    if (colDirection !== 0) this.hero.setFlipX(colDirection < 0);
    this.playTone(target === 'D' ? 'dig' : 'step');

    const targetX = nextCol * TILE_SIZE + TILE_SIZE / 2;
    const targetY = nextRow * TILE_SIZE + TILE_SIZE / 2;

    this.tweens.add({
      targets: [this.hero, this.heroShadow],
      x: targetX,
      duration: 135,
      ease: 'Quad.easeOut'
    });

    this.tweens.add({
      targets: this.hero,
      y: targetY,
      duration: 135,
      ease: 'Quad.easeOut',
      onComplete: () => this.resolveLanding(target, nextRow, nextCol)
    });

    this.tweens.add({
      targets: this.heroShadow,
      y: targetY + 13,
      duration: 135,
      ease: 'Quad.easeOut'
    });
  }

  tryPushRock(row, col, rowDirection, colDirection) {
    // Boulders can only be pushed sideways into already-cleared floor.
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
    const message = this.gemsCollected === this.totalGems
      ? 'All crystals found. Now retrieve the key!'
      : 'Crystal collected!';
    this.updateHud(message);
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
      this.tweens.add({
        targets: door,
        scale: 1.12,
        duration: 220,
        yoyo: true,
        ease: 'Back.easeOut'
      });
    }

    this.playTone('key');
    this.updateHud(
      this.gemsCollected === this.totalGems
        ? 'The ancient gate is open!'
        : 'Key found. Collect the remaining crystals.'
    );
  }

  settleGravity() {
    if (!this.sys.isActive()) return;

    const rockAbovePlayerRow = this.playerPosition.row - 1;
    const rockAbovePlayerCol = this.playerPosition.col;
    if (this.map[rockAbovePlayerRow]?.[rockAbovePlayerCol] === 'R'
      && this.map[this.playerPosition.row]?.[this.playerPosition.col] === '.') {
      const rock = this.entities.get(`${rockAbovePlayerRow},${rockAbovePlayerCol}`);
      if (rock) {
        this.entities.delete(`${rockAbovePlayerRow},${rockAbovePlayerCol}`);
        this.entities.set(`${this.playerPosition.row},${this.playerPosition.col}`, rock);
        this.map[rockAbovePlayerRow][rockAbovePlayerCol] = '.';
        this.map[this.playerPosition.row][this.playerPosition.col] = 'R';
        this.crushPlayer(rock, this.playerPosition.row, this.playerPosition.col);
        return;
      }
    }

    const falling = [];

    for (let row = this.map.length - 2; row >= 1; row -= 1) {
      for (let col = 1; col < this.map[row].length - 1; col += 1) {
        if (this.map[row][col] !== 'R') continue;

        const destinationRow = row + 1;
        const destinationCol = col;
        const below = this.map[destinationRow]?.[destinationCol];
        const playerBelow = this.isPlayerAt(destinationRow, destinationCol);

        if (playerBelow && below === '.') {
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
        falling.push({ rock, destinationRow, destinationCol });
      }
    }

    if (falling.length === 0) {
      this.busy = false;
      this.refreshDangerMarkers();
      this.updateHud();
      return;
    }

    this.busy = true;
    this.playTone('fall');
    let remaining = falling.length;

    falling.forEach(({ rock, destinationRow, destinationCol }) => {
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

  crushPlayer(rock, destinationRow, destinationCol) {
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

    this.tweens.add({
      targets: [this.hero, this.heroShadow],
      alpha: 0,
      scale: 0.65,
      duration: 220,
      ease: 'Back.easeIn'
    });

    const livesRemaining = gameState.loseLife();
    this.updateHud('A falling boulder struck the explorer!');

    this.time.delayedCall(750, () => {
      if (livesRemaining > 0) {
        this.scene.restart();
      } else {
        this.showGameOver();
      }
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
        this.tweens.add({
          targets: marker,
          alpha: 0.25,
          scale: 1.15,
          duration: 420,
          yoyo: true,
          repeat: -1
        });
      }
    }
  }

  clearDangerMarkers() {
    this.dangerMarkers.forEach((marker) => marker.destroy());
    this.dangerMarkers = [];
  }

  isPlayerAt(row, col) {
    return this.playerPosition.row === row && this.playerPosition.col === col;
  }

  createBurst(x, y, tint, quantity = 16) {
    const particles = this.add.particles(x, y, 'emerald-spark', {
      speed: { min: 35, max: 105 },
      lifespan: 500,
      quantity,
      scale: { start: 1, end: 0 },
      gravityY: 90,
      tint
    });

    this.board.add(particles);
    this.time.delayedCall(550, () => particles.destroy());
  }

  showFloatingText(x, y, label, color = '#dfffff') {
    const text = this.add.text(x, y, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color,
      stroke: '#0b3028',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(12);

    this.board.add(text);
    this.tweens.add({
      targets: text,
      y: y - 24,
      alpha: 0,
      duration: 650,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy()
    });
  }

  updateHud(message) {
    this.hud[0].setText(`◆ ${this.gemsCollected}/${this.totalGems}`);
    this.hud[1].setText(`KEY ${this.hasKey ? 1 : 0}/1`);
    this.hud[2].setText(`MOVES ${this.moves}`);
    this.hud[3].setText('♥'.repeat(gameState.lives));
    this.subtitle.setText(`THE SUNKEN TEMPLE • SCORE ${gameState.score}`);

    if (message) this.message.setText(message);
  }

  completeLevel() {
    this.busy = true;
    this.clearDangerMarkers();

    const previousBest = this.readBestMoves();
    const isNewBest = previousBest === null || this.moves < previousBest;
    const bestMoves = isNewBest ? this.moves : previousBest;
    const bonus = Math.max(150, 1500 - this.moves * 20);
    const stars = this.moves <= 30 ? 3 : this.moves <= 43 ? 2 : 1;

    gameState.addScore(bonus);
    gameState.setFlag('level-1-complete', true);
    if (isNewBest) this.saveBestMoves(this.moves);

    this.playTone('win');
    this.cameras.main.flash(350, 255, 220, 90);

    this.add.rectangle(200, 320, 344, 268, 0x17382f, 0.98)
      .setStrokeStyle(4, 0xe4b95c)
      .setDepth(20);

    this.add.text(200, 222, 'CHAMBER CLEARED!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '25px',
      fontStyle: 'bold',
      color: '#ffe7a0',
      stroke: '#3a260c',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(21);

    this.add.text(200, 260, '★'.repeat(stars) + '☆'.repeat(3 - stars), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      color: '#ffd45c'
    }).setOrigin(0.5).setDepth(21);

    this.add.text(200, 309,
      `Moves: ${this.moves}\nBest: ${bestMoves}\nScore: ${gameState.score}\nLives: ${gameState.lives}`,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#e7f3e9',
        align: 'center',
        lineSpacing: 4
      }
    ).setOrigin(0.5).setDepth(21);

    if (isNewBest) {
      this.add.text(200, 373, 'NEW BEST!', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#6fffd1'
      }).setOrigin(0.5).setDepth(21);
    }

    const replayButton = this.makePanelButton(139, 420, 'PLAY AGAIN');
    const menuButton = this.makePanelButton(261, 420, 'MAIN MENU');

    replayButton.on('pointerdown', () => {
      gameState.lives = 3;
      this.scene.restart();
    });
    menuButton.on('pointerdown', () => {
      gameState.lives = 3;
      this.scene.start('MainMenuScene');
    });
  }

  showGameOver() {
    this.add.rectangle(200, 320, 336, 224, 0x321b1b, 0.98)
      .setStrokeStyle(4, 0xd65b58)
      .setDepth(30);

    this.add.text(200, 258, 'EXPEDITION LOST', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffd4cf'
    }).setOrigin(0.5).setDepth(31);

    this.add.text(200, 310, 'The temple claimed all three lives.\nWatch the warning marks beneath loose rocks.', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#f3dddd',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5).setDepth(31);

    const retryButton = this.makePanelButton(139, 378, 'TRY AGAIN', 31);
    const menuButton = this.makePanelButton(261, 378, 'MAIN MENU', 31);

    retryButton.on('pointerdown', () => {
      gameState.lives = 3;
      this.scene.restart();
    });
    menuButton.on('pointerdown', () => {
      gameState.lives = 3;
      this.scene.start('MainMenuScene');
    });
  }

  makePanelButton(x, y, label, depth = 21) {
    const button = this.add.text(x, y, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#3b2708',
      backgroundColor: '#f0c75e',
      padding: { x: 13, y: 10 }
    }).setOrigin(0.5).setDepth(depth).setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setScale(1.04));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerdown', () => this.playTone('button'));

    return button;
  }

  readBestMoves() {
    try {
      const value = Number(window.localStorage.getItem(STORAGE_KEY));
      return Number.isFinite(value) && value > 0 ? value : null;
    } catch {
      return null;
    }
  }

  saveBestMoves(moves) {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(moves));
    } catch {
      // Local storage can be unavailable in private browsing; gameplay continues.
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

    if (!window.emeraldAudioContext) {
      window.emeraldAudioContext = new AudioContextClass();
    }

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
      gem: { frequency: 720, duration: 0.16, volume: 0.045, wave: 'sine' },
      key: { frequency: 520, duration: 0.2, volume: 0.05, wave: 'triangle' },
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

    if (type === 'gem') {
      oscillator.frequency.exponentialRampToValueAtTime(980, now + sound.duration);
    } else if (type === 'key') {
      oscillator.frequency.exponentialRampToValueAtTime(760, now + sound.duration);
    } else if (type === 'win') {
      oscillator.frequency.exponentialRampToValueAtTime(880, now + sound.duration);
    } else if (type === 'fall' || type === 'crush') {
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
