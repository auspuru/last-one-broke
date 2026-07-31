import { gameState } from '../Game.js';
import MainMenuScene from '../scenes/MainMenuScene.js';
import TempleScene from '../scenes/TempleScene.js';

const TILE_SIZE = 40;
const UI_FONT = 'Trebuchet MS, Arial, sans-serif';
const DISPLAY_FONT = 'Georgia, Times New Roman, serif';
const MAX_FOCUS = 3;

// Original expansion maps. New symbols:
// C pushable rune crate, O pressure plate, W deep water, b crate-built bridge.
const EXPANDED_LEVELS = [
  {
    name: 'THE BURIED APPROACH',
    objective: 'Bridge the flooded passage, power the rune gate, and recover the vault key.',
    par: 46,
    hints: [
      'Push the upper rune crate onto the circular pressure plate.',
      'A crate pushed into deep water becomes a permanent bridge.',
      'Focus Scan reveals objectives and freezes sentinels for the next turn.'
    ],
    map: [
      '##################',
      '#P...G.......###E#',
      '#.#####.####.###X#',
      '#.....#....#.#...#',
      '#.....#.CO.#.###.#',
      '#.....#....#.....#',
      '###.#####.#####..#',
      '#...W....G....#..#',
      '#..CW........K#..#',
      '#...W..........T.#',
      '##################'
    ]
  },
  {
    name: 'THE SENTINEL GALLERY',
    objective: 'Open the seal, build a crossing, and outmanoeuvre the hunting sentinel.',
    par: 52,
    hints: [
      'The emerald switch opens the sealed exit route.',
      'Sentinels become aggressive when they see you along a clear corridor.',
      'Use the bridge crate and shrine before committing to the eastern wing.'
    ],
    map: [
      '##################',
      '#P....#..G....##E#',
      '#.S...#.....####X#',
      '#.....#..M..#....#',
      '###.#####...#.^..#',
      '#...#...B...#....#',
      '#.G.#..WWW..###..#',
      '#...#..W.W.......#',
      '#.R...CW.W..G.#K.#',
      '#......W.W.....T.#',
      '##################'
    ]
  },
  {
    name: 'THE EMERALD VAULT',
    objective: 'Solve the rune lock, cross the flooded vault, and escape with the relic.',
    par: 60,
    hints: [
      'The upper crate powers the rune gate; the lower crate can bridge the water.',
      'A Focus Scan pauses sentinels for one completed turn.',
      'The relic is optional, but crystal chains and the relic produce the highest score.'
    ],
    map: [
      '##################',
      '#P.D..#..G....##E#',
      '#..D..#.....####X#',
      '#..R..#..M..#....#',
      '###.#####...#.^..#',
      '#...#..A.B..#....#',
      '#.G.#..WWW..###..#',
      '#...#.CO.W.......#',
      '#.R...CW.W..G.#K.#',
      '#......W.W.....T.#',
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

function keyFor(row, col) {
  return `${row},${col}`;
}

function insertBeforeHero(scene, child) {
  if (!scene.board) return child;
  const heroIndex = scene.hero ? scene.board.list.indexOf(scene.hero) : -1;
  if (heroIndex >= 0 && typeof scene.board.addAt === 'function') scene.board.addAt(child, heroIndex);
  else scene.board.add(child);
  return child;
}

function installLevelDefinitions() {
  TempleScene.prototype.findLevelObjects = function findExpandedLevelObjects() {
    const design = EXPANDED_LEVELS[this.levelIndex] || EXPANDED_LEVELS[0];
    this.level = { ...this.level, ...design };
    this.map = design.map.map((row) => row.split(''));
    this.totalGems = 0;
    this.playerPosition = { row: 1, col: 1 };

    this.brittleSprites = new Map();
    this.shrineSprites = new Map();
    this.crateSprites = new Map();
    this.crateState = new Map();
    this.plateSprites = new Map();
    this.waterSprites = new Map();
    this.bridgeSprites = new Map();
    this.platePositions = [];
    this.focusOverlays = [];

    this.torchShieldTurns = 0;
    this.gemCombo = 0;
    this.lastGemMove = -Infinity;
    this.focusCharges = MAX_FOCUS;
    this.guardianFrozenTurns = 0;
    this.pressureSolved = false;
    this.usesPressureGate = false;

    for (let row = 0; row < this.map.length; row += 1) {
      for (let col = 0; col < this.map[row].length; col += 1) {
        const tile = this.map[row][col];
        if (tile === 'P') {
          this.playerPosition = { row, col };
          this.map[row][col] = '.';
        }
        if (tile === 'G') this.totalGems += 1;
        if (tile === 'O') this.platePositions.push({ row, col });
      }
    }
    this.usesPressureGate = this.platePositions.length > 0;
  };
}

function installTextures() {
  const originalCreateTextures = TempleScene.prototype.createTextures;
  TempleScene.prototype.createTextures = function createExpansionTextures(...args) {
    originalCreateTextures?.apply(this, args);
    if (this.textures.exists('systems-rune-crate')) return;

    const g = this.add.graphics();
    const save = (key, width = 40, height = 40) => {
      g.generateTexture(key, width, height);
      g.clear();
    };

    g.fillStyle(0x000000, 0.34).fillEllipse(20, 34, 34, 8);
    g.fillStyle(0x4a321d).fillRoundedRect(3, 3, 34, 34, 5);
    g.fillStyle(0x8d6231).fillRoundedRect(6, 6, 28, 28, 4);
    g.fillStyle(0xc79a54).fillRoundedRect(10, 10, 20, 20, 3);
    g.lineStyle(3, 0x2a1a0e).strokeRoundedRect(3, 3, 34, 34, 5);
    g.lineStyle(2, 0xf1d182, 0.62).strokeRoundedRect(9, 9, 22, 22, 3);
    g.lineStyle(2, 0x57e2b1, 0.86).beginPath().moveTo(20, 11).lineTo(27, 20).lineTo(20, 29).lineTo(13, 20).closePath().strokePath();
    g.fillStyle(0xb9ffe4, 0.85).fillCircle(20, 20, 2);
    save('systems-rune-crate');

    g.fillStyle(0x07110d, 0.55).fillEllipse(20, 31, 36, 11);
    g.fillStyle(0x273e34).fillEllipse(20, 25, 34, 19);
    g.fillStyle(0x4f705f).fillEllipse(20, 23, 27, 13);
    g.lineStyle(2, 0xba8b3d).strokeEllipse(20, 24, 34, 19);
    g.lineStyle(2, 0x79d9b3, 0.45).strokeEllipse(20, 23, 19, 8);
    save('systems-plate-off');

    g.fillStyle(0x38e9aa, 0.2).fillCircle(20, 20, 19);
    g.fillStyle(0x092019).fillEllipse(20, 31, 36, 11);
    g.fillStyle(0x236c51).fillEllipse(20, 25, 34, 19);
    g.fillStyle(0x53efb7).fillEllipse(20, 23, 27, 13);
    g.lineStyle(2, 0xe5c96d).strokeEllipse(20, 24, 34, 19);
    g.fillStyle(0xd8fff0).fillCircle(20, 22, 3);
    save('systems-plate-on');

    ['a', 'b'].forEach((suffix, index) => {
      g.fillStyle(0x041716).fillRect(0, 0, 40, 40);
      g.fillStyle(index ? 0x087f82 : 0x096d75).fillRoundedRect(1, 1, 38, 38, 4);
      g.fillStyle(index ? 0x0ca5a2 : 0x0a8d91, 0.78).fillRoundedRect(4, 4, 32, 32, 3);
      g.lineStyle(2, 0x72e9dc, 0.7)
        .beginPath()
        .moveTo(index ? 2 : 8, 11)
        .quadraticBezierTo(15, 5, 26, 11)
        .quadraticBezierTo(34, 15, 40, 9)
        .moveTo(index ? 10 : 0, 25)
        .quadraticBezierTo(18, 18, 31, 25)
        .quadraticBezierTo(36, 28, 42, 23)
        .strokePath();
      g.fillStyle(0xb9fff3, 0.28).fillCircle(index ? 9 : 31, 17, 2).fillCircle(index ? 27 : 13, 31, 1.5);
      save(`systems-water-${suffix}`);
    });

    g.fillStyle(0x04201e).fillRect(0, 0, 40, 40);
    g.fillStyle(0x0a6d70).fillRoundedRect(1, 1, 38, 38, 4);
    g.fillStyle(0x5a3a1f).fillRoundedRect(3, 8, 34, 25, 4);
    g.fillStyle(0xb37d3d).fillRoundedRect(5, 10, 30, 7, 2).fillRoundedRect(5, 23, 30, 7, 2);
    g.lineStyle(2, 0xefd28a, 0.6).strokeRoundedRect(5, 10, 30, 7, 2).strokeRoundedRect(5, 23, 30, 7, 2);
    g.fillStyle(0x63e9d6, 0.35).fillCircle(4, 5, 3).fillCircle(35, 36, 3);
    save('systems-water-bridge');

    g.fillStyle(0xff493d, 0.14).fillCircle(20, 20, 19);
    g.lineStyle(3, 0xff766c, 0.95).strokeCircle(20, 20, 16);
    g.fillStyle(0xffd3ce).fillTriangle(20, 5, 31, 27, 9, 27);
    g.fillStyle(0x7c1713).fillRect(18, 12, 4, 9).fillCircle(20, 25, 2);
    save('systems-alert');

    g.destroy();
  };
}

function crateAt(scene, row, col) {
  return scene.crateState?.get(keyFor(row, col));
}

function plateOccupied(scene, row, col) {
  return [...(scene.crateState?.values() || [])].some((crate) => crate.row === row && crate.col === col);
}

function refreshPlateVisuals(scene) {
  scene.plateSprites?.forEach((sprite, key) => {
    const [row, col] = key.split(',').map(Number);
    const active = plateOccupied(scene, row, col);
    sprite.setTexture(active ? 'systems-plate-on' : 'systems-plate-off');
    sprite.setAlpha(active ? 1 : 0.82);
  });
}

function openPressureGate(scene) {
  if (!scene.usesPressureGate || scene.pressureSolved) return;
  const solved = scene.platePositions.every(({ row, col }) => plateOccupied(scene, row, col));
  if (!solved) return;

  scene.pressureSolved = true;
  scene.gateOpen = true;
  gameState.addScore(200);
  scene.playTone?.('switch');
  scene.cameras.main.flash(170, 72, 220, 165);

  scene.gateSprites?.forEach((gate) => {
    scene.tweens.add({
      targets: gate,
      alpha: 0.13,
      scaleY: 0.2,
      duration: 300,
      ease: 'Back.easeIn'
    });
  });
  scene.updateHud?.('Rune pressure complete — the vault gate is open.');
}

function addBridge(scene, row, col) {
  const x = col * TILE_SIZE + TILE_SIZE / 2;
  const y = row * TILE_SIZE + TILE_SIZE / 2;
  const bridge = scene.add.image(x, y, 'systems-water-bridge').setAlpha(0).setScale(0.72);
  insertBeforeHero(scene, bridge);
  scene.bridgeSprites.set(keyFor(row, col), bridge);
  scene.tweens.add({ targets: bridge, alpha: 1, scale: 1, duration: 240, ease: 'Back.easeOut' });
  return bridge;
}

function pushCrate(scene, row, col, dr, dc) {
  const crate = crateAt(scene, row, col);
  if (!crate) return false;
  const destinationRow = row + dr;
  const destinationCol = col + dc;
  const destinationTile = scene.map[destinationRow]?.[destinationCol];
  if (!['.', 'O', 'W'].includes(destinationTile)) return false;
  if (scene.isPlayerAt?.(destinationRow, destinationCol)) return false;

  const oldKey = keyFor(row, col);
  const newKey = keyFor(destinationRow, destinationCol);
  const sourceUnderTile = crate.underTile;
  const sprite = crate.sprite;

  scene.tweens.killTweensOf(sprite);
  scene.crateState.delete(oldKey);
  scene.crateSprites.delete(oldKey);
  scene.map[row][col] = sourceUnderTile;

  if (destinationTile === 'W') {
    scene.map[destinationRow][destinationCol] = 'b';
    gameState.addScore(75);
    scene.playTone?.('fall');
    scene.cameras.main.shake(100, 0.0023);
    scene.tweens.add({
      targets: sprite,
      x: destinationCol * TILE_SIZE + TILE_SIZE / 2,
      y: destinationRow * TILE_SIZE + TILE_SIZE / 2 + 5,
      angle: sprite.angle + 18 * (dc || 1),
      scale: 0.72,
      alpha: 0.15,
      duration: 190,
      ease: 'Quad.easeIn',
      onComplete: () => {
        sprite.destroy();
        addBridge(scene, destinationRow, destinationCol);
        scene.showFloatingText?.(destinationCol * TILE_SIZE + 20, destinationRow * TILE_SIZE + 10, 'BRIDGE BUILT  +75', '#b8fff1');
      }
    });
  } else {
    crate.row = destinationRow;
    crate.col = destinationCol;
    crate.underTile = destinationTile;
    scene.crateState.set(newKey, crate);
    scene.crateSprites.set(newKey, sprite);
    scene.map[destinationRow][destinationCol] = 'C';
    gameState.addScore(10);
    scene.playTone?.('rock');
    scene.tweens.add({
      targets: sprite,
      x: destinationCol * TILE_SIZE + TILE_SIZE / 2,
      y: destinationRow * TILE_SIZE + TILE_SIZE / 2,
      angle: sprite.angle + 8 * (dc || dr),
      duration: 155,
      ease: 'Quad.easeOut'
    });
  }

  refreshPlateVisuals(scene);
  openPressureGate(scene);
  return true;
}

function clearFocusOverlays(scene) {
  scene.focusOverlays?.forEach((overlay) => overlay.destroy());
  scene.focusOverlays = [];
}

function focusScan(scene) {
  clearFocusOverlays(scene);
  if (!scene.board) return;

  const addOverlay = (object) => {
    insertBeforeHero(scene, object);
    scene.focusOverlays.push(object);
  };

  scene.platePositions?.forEach(({ row, col }) => {
    const ring = scene.add.circle(col * TILE_SIZE + 20, row * TILE_SIZE + 20, 17, 0x5df0b8, 0.08)
      .setStrokeStyle(2, 0x9bffe0, 0.9);
    addOverlay(ring);
  });
  scene.waterSprites?.forEach((sprite) => {
    const ring = scene.add.rectangle(sprite.x, sprite.y, 34, 34, 0x3ce6dd, 0.04)
      .setStrokeStyle(1, 0x91fff2, 0.55);
    addOverlay(ring);
  });

  const blockers = new Set(['#', 'D', 'R', 'C', 'X', 'W', 'G', 'K', 'E', 'A']);
  scene.guardians?.forEach((guardian) => {
    const alert = scene.add.image(guardian.sprite.x, guardian.sprite.y, 'systems-alert').setAlpha(0.8).setScale(0.8);
    addOverlay(alert);
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
      for (let step = 1; step <= 6; step += 1) {
        const row = guardian.row + dr * step;
        const col = guardian.col + dc * step;
        const tile = scene.map[row]?.[col];
        if (!tile || blockers.has(tile)) break;
        const beam = scene.add.rectangle(col * TILE_SIZE + 20, row * TILE_SIZE + 20, 31, 31, 0xff4d45, 0.12)
          .setStrokeStyle(1, 0xff8f87, 0.5);
        addOverlay(beam);
      }
    });
  });

  scene.entities?.forEach((sprite) => {
    if (!sprite?.active) return;
    const texture = sprite.texture?.key;
    if (!['premium-diamond', 'emerald-gem', 'emerald-key', 'emerald-door', 'emerald-switch', 'emerald-relic'].includes(texture)) return;
    scene.tweens.add({ targets: sprite, scale: sprite.scale * 1.18, duration: 130, yoyo: true, ease: 'Back.easeOut' });
  });

  scene.time.delayedCall(900, () => clearFocusOverlays(scene));
}

function addDepthAndLighting(scene) {
  if (!scene.board) return;
  const layout = layoutFor(scene);

  for (let row = 1; row < scene.map.length; row += 1) {
    for (let col = 1; col < scene.map[row].length - 1; col += 1) {
      const tile = scene.map[row][col];
      const above = scene.map[row - 1]?.[col];
      const x = col * TILE_SIZE + 20;
      const y = row * TILE_SIZE + 20;

      if (tile !== '#' && above === '#') {
        const shadow = scene.add.rectangle(x, y - 15, 38, 9, 0x000000, 0.28);
        insertBeforeHero(scene, shadow);
      }

      if (tile === 'W') {
        const water = scene.add.image(x, y, 'systems-water-a').setAlpha(0.95);
        insertBeforeHero(scene, water);
        scene.waterSprites.set(keyFor(row, col), water);
        scene.tweens.add({
          targets: water,
          alpha: { from: 0.78, to: 1 },
          y: y - 1.5,
          duration: 620 + ((row + col) % 4) * 80,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          onYoyo: () => water.setTexture(water.texture.key === 'systems-water-a' ? 'systems-water-b' : 'systems-water-a')
        });
      }

      if (tile === 'b') addBridge(scene, row, col);

      if (tile === 'O') {
        const plate = scene.add.image(x, y, 'systems-plate-off').setAlpha(0.82);
        insertBeforeHero(scene, plate);
        scene.plateSprites.set(keyFor(row, col), plate);
      }
    }
  }

  for (let row = 0; row < scene.map.length; row += 1) {
    for (let col = 0; col < scene.map[row].length; col += 1) {
      if (scene.map[row][col] !== 'C') continue;
      const sprite = scene.add.image(col * TILE_SIZE + 20, row * TILE_SIZE + 20, 'systems-rune-crate');
      insertBeforeHero(scene, sprite);
      const crate = { row, col, underTile: '.', sprite };
      scene.crateSprites.set(keyFor(row, col), sprite);
      scene.crateState.set(keyFor(row, col), crate);
      scene.tweens.add({ targets: sprite, y: sprite.y - 1.5, duration: 720, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  scene.entities?.forEach((sprite) => {
    const texture = sprite.texture?.key;
    const glowColor = ['premium-diamond', 'emerald-gem'].includes(texture)
      ? 0x4eeaff
      : texture === 'emerald-key'
        ? 0xffd45f
        : ['emerald-door', 'emerald-switch', 'emerald-relic'].includes(texture)
          ? 0x68efbd
          : null;
    if (glowColor === null) return;
    const glow = scene.add.circle(sprite.x, sprite.y, 18, glowColor, 0.12).setBlendMode(Phaser.BlendModes.ADD);
    const index = scene.board.list.indexOf(sprite);
    if (index >= 0 && typeof scene.board.addAt === 'function') scene.board.addAt(glow, index);
    else scene.board.add(glow);
    scene.tweens.add({ targets: glow, alpha: { from: 0.04, to: 0.18 }, scale: { from: 0.85, to: 1.18 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  });

  if (scene.hero) {
    const aura = scene.add.circle(scene.hero.x, scene.hero.y + 2, 25, 0x6ceec0, 0.08)
      .setBlendMode(Phaser.BlendModes.ADD);
    const heroIndex = scene.board.list.indexOf(scene.hero);
    if (heroIndex >= 0 && typeof scene.board.addAt === 'function') scene.board.addAt(aura, heroIndex);
    else scene.board.add(aura);
    scene.systemHeroAura = aura;
    scene.tweens.add({ targets: aura, alpha: { from: 0.035, to: 0.12 }, scale: { from: 0.85, to: 1.16 }, duration: 760, yoyo: true, repeat: -1 });
  }

  const mistWidth = Math.max(36, layout.x * 0.7);
  [mistWidth / 2, layout.width - mistWidth / 2].forEach((x, index) => {
    const mist = scene.add.rectangle(x, layout.height / 2, mistWidth, layout.height - 60, index ? 0x0b4938 : 0x103e31, 0.1).setDepth(4);
    scene.tweens.add({ targets: mist, alpha: { from: 0.045, to: 0.14 }, duration: 1700 + index * 240, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  });

  refreshPlateVisuals(scene);
  openPressureGate(scene);
}

function installPresentation() {
  const originalMenuCreate = MainMenuScene.prototype.create;
  MainMenuScene.prototype.create = function createExpansionMenu(...args) {
    const result = originalMenuCreate.apply(this, args);
    const { width, height } = this.scale;
    const badge = this.add.text(width / 2, height - 22, 'RUNE CRATES  •  WATER BRIDGES  •  FOCUS SCAN', {
      fontFamily: UI_FONT,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#a8e5cd',
      backgroundColor: '#07150f',
      padding: { x: 10, y: 5 },
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(30).setAlpha(0.86);
    this.tweens.add({ targets: badge, alpha: { from: 0.58, to: 1 }, duration: 1100, yoyo: true, repeat: -1 });
    return result;
  };

  const originalDrawBoard = TempleScene.prototype.drawBoard;
  TempleScene.prototype.drawBoard = function drawExpansionBoard(...args) {
    const result = originalDrawBoard.apply(this, args);
    addDepthAndLighting(this);
    return result;
  };
}

function installMechanics() {
  const originalMovePlayer = TempleScene.prototype.movePlayer;
  TempleScene.prototype.movePlayer = function movePlayerWithCrates(dr, dc) {
    if (this.busy) return originalMovePlayer.call(this, dr, dc);
    const nextRow = this.playerPosition.row + dr;
    const nextCol = this.playerPosition.col + dc;
    const target = this.map[nextRow]?.[nextCol];

    if (target === 'W') {
      this.playTone?.('blocked');
      this.cameras.main.shake(70, 0.002);
      this.updateHud?.('Deep water blocks the route. Push a rune crate into it to build a bridge.');
      return;
    }

    if (target === 'C') {
      if (!pushCrate(this, nextRow, nextCol, dr, dc)) {
        this.playTone?.('blocked');
        this.cameras.main.shake(80, 0.0023);
        this.updateHud?.('The rune crate needs a clear plate, floor, or water tile behind it.');
        return;
      }
    }

    const destinationX = nextCol * TILE_SIZE + TILE_SIZE / 2;
    const destinationY = nextRow * TILE_SIZE + TILE_SIZE / 2 + 2;
    if (this.systemHeroAura) {
      this.tweens.add({ targets: this.systemHeroAura, x: destinationX, y: destinationY, duration: 145, ease: 'Quad.easeOut' });
    }

    return originalMovePlayer.call(this, dr, dc);
  };

  TempleScene.prototype.advanceGuardians = function advanceExpandedGuardians() {
    if (this.guardianFrozenTurns > 0) {
      this.guardianFrozenTurns -= 1;
      this.guardians.forEach((guardian) => {
        guardian.sprite.setTint(0x82e8ff);
        this.tweens.add({ targets: guardian.sprite, alpha: 0.45, duration: 110, yoyo: true, repeat: 1, onComplete: () => guardian.sprite.clearTint() });
      });
      this.updateHud?.('Focus holds the sentinels in place for this turn.');
      return false;
    }

    const canEnter = (row, col) => {
      const tile = this.map[row]?.[col];
      return ['.', 'S', '^', 'B', 'T', 'O', 'b'].includes(tile) || this.isPlayerAt(row, col);
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
      let alerted = false;

      if (distance <= 7 && rowDelta === 0 && lineClear(guardian, 0, Math.sign(colDelta), Math.abs(colDelta))) {
        candidates.push([0, Math.sign(colDelta)]);
        alerted = true;
      } else if (distance <= 7 && colDelta === 0 && lineClear(guardian, Math.sign(rowDelta), 0, Math.abs(rowDelta))) {
        candidates.push([Math.sign(rowDelta), 0]);
        alerted = true;
      } else if (distance <= 5) {
        if (Math.abs(colDelta) >= Math.abs(rowDelta) && colDelta !== 0) candidates.push([0, Math.sign(colDelta)]);
        if (rowDelta !== 0) candidates.push([Math.sign(rowDelta), 0]);
      }

      candidates.push([guardian.dr, guardian.dc], [-guardian.dr, -guardian.dc], [guardian.dc, guardian.dr], [-guardian.dc, -guardian.dr]);
      const choice = candidates.find(([moveRow, moveCol]) => (moveRow !== 0 || moveCol !== 0) && canEnter(guardian.row + moveRow, guardian.col + moveCol));
      if (!choice) continue;

      if (alerted) {
        const alert = this.add.image(guardian.sprite.x, guardian.sprite.y, 'systems-alert').setAlpha(0.88).setScale(0.7);
        insertBeforeHero(this, alert);
        this.tweens.add({ targets: alert, alpha: 0, scale: 1.25, duration: 320, onComplete: () => alert.destroy() });
        this.playTone?.('guardian');
      }

      const [moveRow, moveCol] = choice;
      const nextRow = guardian.row + moveRow;
      const nextCol = guardian.col + moveCol;
      guardian.dr = moveRow;
      guardian.dc = moveCol;

      if (this.isPlayerAt(nextRow, nextCol)) {
        this.damagePlayer('A hunting sentinel caught the explorer!', 'guardian');
        return true;
      }

      const trail = this.add.image(guardian.sprite.x, guardian.sprite.y, guardian.sprite.texture.key)
        .setAlpha(0.13)
        .setTint(0xff675e)
        .setScale(guardian.sprite.scaleX, guardian.sprite.scaleY);
      insertBeforeHero(this, trail);
      this.tweens.add({ targets: trail, alpha: 0, scale: 0.76, duration: 220, onComplete: () => trail.destroy() });

      const destinationTile = this.map[nextRow][nextCol];
      this.map[guardian.row][guardian.col] = guardian.underTile;
      this.entities.delete(keyFor(guardian.row, guardian.col));
      guardian.underTile = destinationTile;
      guardian.row = nextRow;
      guardian.col = nextCol;
      this.map[nextRow][nextCol] = 'M';
      this.entities.set(keyFor(nextRow, nextCol), guardian.sprite);
      guardian.sprite.setFlipX(moveCol < 0);
      this.tweens.add({
        targets: guardian.sprite,
        x: nextCol * TILE_SIZE + TILE_SIZE / 2,
        y: nextRow * TILE_SIZE + TILE_SIZE / 2,
        duration: alerted ? 120 : 155,
        ease: alerted ? 'Cubic.easeOut' : 'Quad.easeOut'
      });
    }
    return false;
  };

  const originalShowHint = TempleScene.prototype.showHint;
  TempleScene.prototype.showHint = function showFocusScan(...args) {
    if (this.busy) return;
    const hadFocus = this.focusCharges > 0;
    if (hadFocus) {
      this.focusCharges -= 1;
      this.guardianFrozenTurns = Math.max(this.guardianFrozenTurns, 1);
      focusScan(this);
      this.cameras.main.flash(110, 82, 220, 180);
    }
    const result = originalShowHint.apply(this, args);
    if (hadFocus) {
      const hint = this.level.hints[(this.hintIndex - 1 + this.level.hints.length) % this.level.hints.length];
      this.updateHud(`Focus ${this.focusCharges}/${MAX_FOCUS}: ${hint}`);
    } else {
      this.updateHud('Focus depleted. The hint remains available, but sentinels will not pause.');
    }
    return result;
  };

  const originalCollectGem = TempleScene.prototype.collectGem;
  TempleScene.prototype.collectGem = function collectGemAndRecharge(row, col) {
    const beforeCombo = this.gemCombo || 0;
    const result = originalCollectGem.call(this, row, col);
    if ((this.gemCombo || 0) >= 3 && beforeCombo < 3 && this.focusCharges < MAX_FOCUS) {
      this.focusCharges += 1;
      gameState.addScore(100);
      this.showFloatingText?.(col * TILE_SIZE + 20, row * TILE_SIZE + 5, 'FOCUS RESTORED  +100', '#baffea');
      this.updateHud?.(`Crystal chain restored Focus. Charges ${this.focusCharges}/${MAX_FOCUS}.`);
    }
    return result;
  };

  const originalUpdateHud = TempleScene.prototype.updateHud;
  TempleScene.prototype.updateHud = function updateExpansionHud(...args) {
    const result = originalUpdateHud.apply(this, args);
    if (this.mechanicBadge) {
      const statuses = [`FOCUS ${this.focusCharges ?? MAX_FOCUS}/${MAX_FOCUS}`];
      if (this.platePositions?.length) {
        const pressed = this.platePositions.filter(({ row, col }) => plateOccupied(this, row, col)).length;
        statuses.push(this.pressureSolved ? 'RUNE GATE OPEN' : `PLATES ${pressed}/${this.platePositions.length}`);
      }
      if (this.torchShieldTurns > 0) statuses.push(`SPIKE SHIELD ${this.torchShieldTurns}`);
      if (this.gemCombo > 1 && this.moves - this.lastGemMove <= 6) statuses.push(`CHAIN x${this.gemCombo}`);
      this.mechanicBadge.setText(statuses.join('  •  ')).setAlpha(1);
    }
    return result;
  };
}

installLevelDefinitions();
installTextures();
installPresentation();
installMechanics();

window.emeraldTempleExpansion = Object.freeze({
  version: '4.0.0',
  mechanics: [
    'rune-crates',
    'pressure-plates',
    'water-bridges',
    'focus-scan',
    'sentinel-sight-lines',
    'focus-recharge'
  ],
  assets: 'original-procedural'
});
