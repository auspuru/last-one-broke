import { gameState } from '../Game.js';

const TILE_SIZE = 40;
const BOARD_TOP = 118;

const LEVEL = [
  '##########',
  '#P..#...G#',
  '#.#.#.##.#',
  '#.#..R...#',
  '#.###.##.#',
  '#G....#..#',
  '###.#.#G.#',
  '#...#....#',
  '#.R....#K#',
  '#...##...#',
  '#......#E#',
  '##########'
];

export default class TempleScene extends Phaser.Scene {
  constructor() {
    super('TempleScene');
  }

  create() {
    this.map = LEVEL.map((row) => row.split(''));
    this.entities = new Map();
    this.busy = false;
    this.pointerStart = null;
    this.gemsCollected = 0;
    this.hasKey = false;
    this.moves = 0;
    this.totalGems = 0;

    this.findLevelObjects();
    this.createTextures();
    this.drawBackground();
    this.drawHud();
    this.drawBoard();
    this.bindInput();
    this.updateHud('Swipe or tap a neighbouring tile to move.');
  }

  findLevelObjects() {
    for (let row = 0; row < this.map.length; row += 1) {
      for (let col = 0; col < this.map[row].length; col += 1) {
        const tile = this.map[row][col];

        if (tile === 'P') {
          this.playerPosition = { row, col };
          this.map[row][col] = '.';
        }

        if (tile === 'G') {
          this.totalGems += 1;
        }
      }
    }
  }

  createTextures() {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x2c4536).fillRoundedRect(0, 0, 40, 40, 4);
    graphics.lineStyle(2, 0x51715c).strokeRoundedRect(1, 1, 38, 38, 4);
    graphics.generateTexture('wall', 40, 40);
    graphics.clear();

    graphics.fillStyle(0x163329).fillRect(0, 0, 40, 40);
    graphics.fillStyle(0x20483a).fillRect(2, 2, 36, 36);
    graphics.generateTexture('floor', 40, 40);
    graphics.clear();

    graphics.fillStyle(0x6b5f55).fillCircle(20, 20, 15);
    graphics.fillStyle(0x94877c).fillCircle(15, 14, 7);
    graphics.generateTexture('rock', 40, 40);
    graphics.clear();

    graphics.fillStyle(0x59eaff).fillTriangle(20, 3, 35, 14, 28, 36);
    graphics.fillTriangle(20, 3, 5, 14, 12, 36);
    graphics.generateTexture('gem', 40, 40);
    graphics.clear();

    graphics.fillStyle(0xe8bf4f).fillCircle(13, 20, 7);
    graphics.fillRect(18, 17, 17, 6);
    graphics.generateTexture('key', 40, 40);
    graphics.clear();

    graphics.fillStyle(0x6e3d20).fillRoundedRect(7, 4, 26, 34, 12);
    graphics.fillStyle(0xbc7136).fillRoundedRect(11, 8, 18, 30, 8);
    graphics.generateTexture('door', 40, 40);
    graphics.clear();

    graphics.fillStyle(0xd9a05d).fillCircle(20, 15, 7);
    graphics.fillStyle(0x76502b).fillEllipse(20, 8, 24, 8);
    graphics.fillRoundedRect(14, 20, 12, 15, 4);
    graphics.generateTexture('hero', 40, 40);
    graphics.destroy();
  }

  drawBackground() {
    this.cameras.main.setBackgroundColor('#10261e');
    this.add.rectangle(200, 320, 400, 640, 0x10261e);
    this.add.rectangle(200, 67, 380, 92, 0x173c30, 0.98).setStrokeStyle(3, 0xc5903d);
    this.add.text(200, 25, 'EMERALD QUEST', {
      fontFamily: 'Arial',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffe9a6'
    }).setOrigin(0.5);
    this.add.text(200, 50, 'THE SUNKEN TEMPLE • LEVEL 1', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#c9e2d1'
    }).setOrigin(0.5);
  }

  drawHud() {
    this.hud = [];
    const positions = [55, 145, 245, 345];

    positions.forEach((x) => {
      this.add.rectangle(x, 88, 82, 34, 0x203f35).setStrokeStyle(2, 0xb4863e);
    });

    this.hud.push(this.add.text(positions[0], 88, '', { fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: '#fff0b5' }).setOrigin(0.5));
    this.hud.push(this.add.text(positions[1], 88, '', { fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: '#fff0b5' }).setOrigin(0.5));
    this.hud.push(this.add.text(positions[2], 88, '', { fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: '#fff0b5' }).setOrigin(0.5));
    this.hud.push(this.add.text(positions[3], 88, '♥♥♥', { fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold', color: '#ff6872' }).setOrigin(0.5));

    this.message = this.add.text(200, 620, '', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#e8e0bf',
      align: 'center',
      wordWrap: { width: 360 }
    }).setOrigin(0.5);
  }

  drawBoard() {
    this.board = this.add.container(0, BOARD_TOP);

    for (let row = 0; row < this.map.length; row += 1) {
      for (let col = 0; col < this.map[row].length; col += 1) {
        const tile = this.map[row][col];
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;
        const floor = this.add.image(x, y, tile === '#' ? 'wall' : 'floor');

        this.board.add(floor);

        if (tile !== '#') {
          floor.setInteractive();
          floor.on('pointerdown', () => this.handleTap(row, col));
        }

        if (tile === 'G') this.addEntity(row, col, 'gem');
        if (tile === 'R') this.addEntity(row, col, 'rock');
        if (tile === 'K') this.addEntity(row, col, 'key');
        if (tile === 'E') this.addEntity(row, col, 'door');
      }
    }

    this.hero = this.add.image(
      this.playerPosition.col * TILE_SIZE + TILE_SIZE / 2,
      this.playerPosition.row * TILE_SIZE + TILE_SIZE / 2,
      'hero'
    ).setDepth(8);

    this.board.add(this.hero);
  }

  addEntity(row, col, texture) {
    const sprite = this.add.image(
      col * TILE_SIZE + TILE_SIZE / 2,
      row * TILE_SIZE + TILE_SIZE / 2,
      texture
    ).setDepth(5);

    if (texture === 'door') sprite.setTint(0x777777);

    this.entities.set(`${row},${col}`, sprite);
    this.board.add(sprite);
  }

  bindInput() {
    this.input.on('pointerdown', (pointer) => {
      this.pointerStart = { x: pointer.x, y: pointer.y };
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
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1]
      };

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
      this.cameras.main.shake(70, 0.002);
      return;
    }

    if (target === 'R' && !this.tryPushRock(nextRow, nextCol, rowDirection, colDirection)) {
      this.updateHud('That boulder will not move.');
      return;
    }

    if (target === 'E' && (!this.hasKey || this.gemsCollected < this.totalGems)) {
      this.updateHud('The gate needs the key and every crystal.');
      return;
    }

    this.busy = true;
    this.moves += 1;
    this.playerPosition = { row: nextRow, col: nextCol };

    this.tweens.add({
      targets: this.hero,
      x: nextCol * TILE_SIZE + TILE_SIZE / 2,
      y: nextRow * TILE_SIZE + TILE_SIZE / 2,
      duration: 135,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.busy = false;
        this.resolveLanding(target, nextRow, nextCol);
      }
    });
  }

  tryPushRock(row, col, rowDirection, colDirection) {
    const destinationRow = row + rowDirection;
    const destinationCol = col + colDirection;

    if (this.map[destinationRow]?.[destinationCol] !== '.') return false;

    const rock = this.entities.get(`${row},${col}`);
    this.entities.delete(`${row},${col}`);
    this.entities.set(`${destinationRow},${destinationCol}`, rock);

    this.map[destinationRow][destinationCol] = 'R';
    this.map[row][col] = '.';

    this.tweens.add({
      targets: rock,
      x: destinationCol * TILE_SIZE + TILE_SIZE / 2,
      y: destinationRow * TILE_SIZE + TILE_SIZE / 2,
      duration: 130,
      ease: 'Quad.easeOut'
    });

    return true;
  }

  resolveLanding(target, row, col) {
    if (target === 'G') {
      this.collectGem(row, col);
    } else if (target === 'K') {
      this.collectKey(row, col);
    } else if (target === 'E') {
      this.completeLevel();
    } else {
      this.updateHud();
    }
  }

  collectGem(row, col) {
    this.map[row][col] = '.';
    this.gemsCollected += 1;
    gameState.addDiamond?.(1);

    const gem = this.entities.get(`${row},${col}`);
    this.entities.delete(`${row},${col}`);
    gem?.destroy();

    this.updateHud('Crystal collected!');
  }

  collectKey(row, col) {
    this.map[row][col] = '.';
    this.hasKey = true;
    gameState.addKey?.(1);

    const key = this.entities.get(`${row},${col}`);
    this.entities.delete(`${row},${col}`);
    key?.destroy();

    const door = [...this.entities.values()].find((sprite) => sprite.texture.key === 'door');
    door?.clearTint();

    this.updateHud('The temple key has been found.');
  }

  updateHud(message) {
    this.hud[0].setText(`◆ ${this.gemsCollected}/${this.totalGems}`);
    this.hud[1].setText(`KEY ${this.hasKey ? 1 : 0}/1`);
    this.hud[2].setText(`MOVES ${this.moves}`);

    if (message) this.message.setText(message);
  }

  completeLevel() {
    this.busy = true;
    this.cameras.main.flash(350, 255, 220, 90);
    this.add.rectangle(200, 320, 330, 190, 0x183a2f, 0.97).setStrokeStyle(4, 0xe4b95c).setDepth(20);
    this.add.text(200, 274, 'CHAMBER CLEARED!', {
      fontFamily: 'Arial',
      fontSize: '25px',
      fontStyle: 'bold',
      color: '#ffe7a0'
    }).setOrigin(0.5).setDepth(21);
    this.add.text(200, 315, `You escaped in ${this.moves} moves.`, {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#e7f3e9'
    }).setOrigin(0.5).setDepth(21);

    const replayButton = this.add.text(200, 360, 'PLAY AGAIN', {
      fontFamily: 'Arial',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#3b2708',
      backgroundColor: '#f0c75e',
      padding: { x: 18, y: 10 }
    }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });

    replayButton.on('pointerdown', () => this.scene.restart());
  }
}
