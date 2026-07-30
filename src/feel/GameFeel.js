import { gameState } from '../Game.js';
import MainMenuScene from '../scenes/MainMenuScene.js';
import TempleScene from '../scenes/TempleScene.js';

const TILE_SIZE = 40;
const BOARD_TOP = 118;
const UI_FONT = 'Trebuchet MS, Arial, sans-serif';

function boardPosition(row, col) {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2
  };
}

function safeTween(scene, config) {
  if (!scene?.sys?.isActive()) return null;
  return scene.tweens.add(config);
}

function pulse(target, amount = 1.12, duration = 115) {
  const scene = target?.scene;
  if (!scene || !target.active) return;
  scene.tweens.killTweensOf(target);
  target.setScale(1);
  scene.tweens.add({
    targets: target,
    scale: amount,
    duration,
    yoyo: true,
    ease: 'Back.easeOut'
  });
}

function cameraPunch(scene, zoom = 1.012, outDuration = 70, returnDuration = 150) {
  const camera = scene?.cameras?.main;
  if (!camera || !scene.sys.isActive()) return;
  camera.zoomTo(zoom, outDuration, 'Quad.easeOut', true, (_camera, progress) => {
    if (progress === 1 && scene.sys.isActive()) {
      camera.zoomTo(1, returnDuration, 'Sine.easeOut', true);
    }
  });
}

function edgeFlash(scene, color = 0x69efbd, alpha = 0.28, duration = 360) {
  if (!scene?.sys?.isActive()) return;
  const pieces = [
    scene.add.rectangle(200, 2, 400, 5, color, alpha),
    scene.add.rectangle(200, 638, 400, 5, color, alpha),
    scene.add.rectangle(2, 320, 5, 640, color, alpha),
    scene.add.rectangle(398, 320, 5, 640, color, alpha)
  ].map((piece) => piece.setDepth(70));

  safeTween(scene, {
    targets: pieces,
    alpha: 0,
    duration,
    ease: 'Quad.easeOut',
    onComplete: () => pieces.forEach((piece) => piece.destroy())
  });
}

function boardSparks(scene, x, y, color = 0x6ff0bd, quantity = 8, speed = 24) {
  if (!scene?.board || !scene.sys.isActive()) return;

  for (let index = 0; index < quantity; index += 1) {
    const angle = (Math.PI * 2 * index) / quantity + Phaser.Math.FloatBetween(-0.22, 0.22);
    const distance = Phaser.Math.Between(Math.round(speed * 0.65), Math.round(speed * 1.25));
    const spark = scene.add.circle(x, y, Phaser.Math.FloatBetween(1.1, 2.4), color, Phaser.Math.FloatBetween(0.48, 0.92))
      .setDepth(13);
    scene.board.add(spark);

    safeTween(scene, {
      targets: spark,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      alpha: 0,
      scale: 0.25,
      duration: Phaser.Math.Between(260, 460),
      ease: 'Quad.easeOut',
      onComplete: () => spark.destroy()
    });
  }
}

function boardRing(scene, x, y, color = 0x6ff0bd, radius = 8, maxScale = 2.5, duration = 420) {
  if (!scene?.board || !scene.sys.isActive()) return null;
  const ring = scene.add.circle(x, y, radius, color, 0.08)
    .setStrokeStyle(2, color, 0.8)
    .setDepth(12);
  scene.board.add(ring);

  safeTween(scene, {
    targets: ring,
    scale: maxScale,
    alpha: 0,
    duration,
    ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy()
  });
  return ring;
}

function worldRipple(scene, x, y, color = 0x6ff0bd) {
  if (!scene?.sys?.isActive()) return;
  const ring = scene.add.circle(x, y, 7, color, 0.04)
    .setStrokeStyle(1.5, color, 0.35)
    .setDepth(15);
  safeTween(scene, {
    targets: ring,
    scale: 2.8,
    alpha: 0,
    duration: 340,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy()
  });
}

function floatingLabel(scene, x, y, label, color = '#dffff2', depth = 55) {
  if (!scene?.sys?.isActive()) return;
  const text = scene.add.text(x, y, label, {
    fontFamily: UI_FONT,
    fontSize: '12px',
    fontStyle: 'bold',
    color,
    stroke: '#06110e',
    strokeThickness: 4,
    letterSpacing: 0.5
  }).setOrigin(0.5).setDepth(depth).setScale(0.82).setAlpha(0);

  safeTween(scene, {
    targets: text,
    y: y - 28,
    scale: 1.05,
    alpha: 1,
    duration: 170,
    ease: 'Back.easeOut',
    onComplete: () => safeTween(scene, {
      targets: text,
      y: text.y - 12,
      alpha: 0,
      duration: 520,
      delay: 180,
      ease: 'Quad.easeIn',
      onComplete: () => text.destroy()
    })
  });
}

function rewardFeedback(scene, x, y, label, color, ringColor) {
  const now = scene.time.now;
  const feel = scene.gameFeel;
  if (feel) {
    feel.combo = now - feel.lastRewardAt < 2600 ? feel.combo + 1 : 1;
    feel.lastRewardAt = now;
  }

  boardRing(scene, x, y, ringColor, 7, 3.1, 500);
  boardSparks(scene, x, y, ringColor, 12, 32);
  cameraPunch(scene, 1.018, 65, 180);
  edgeFlash(scene, ringColor, 0.16, 260);

  const combo = feel?.combo > 1 ? `  •  CHAIN ×${feel.combo}` : '';
  floatingLabel(scene, 200, 154, `${label}${combo}`, color, 58);
}

function addHeroAura(scene) {
  if (!scene.board || !scene.hero) return;
  const aura = scene.add.circle(scene.hero.x, scene.hero.y + 2, 23, 0x62e8b7, 0.055)
    .setStrokeStyle(1, 0x8df6d4, 0.12)
    .setDepth(6);
  scene.board.add(aura);
  scene.gameFeel.aura = aura;

  safeTween(scene, {
    targets: aura,
    scale: { from: 0.88, to: 1.2 },
    alpha: { from: 0.035, to: 0.095 },
    duration: 900,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });
}

function addSceneAtmosphere(scene) {
  if (!scene.board || !scene.hero) return;

  const originalY = scene.board.y;
  scene.board.setAlpha(0.3).setY(originalY + 13).setScale(0.985);
  safeTween(scene, {
    targets: scene.board,
    y: originalY,
    alpha: 1,
    scale: 1,
    duration: 520,
    ease: 'Cubic.easeOut'
  });

  addHeroAura(scene);

  const inputRipple = (pointer) => {
    if (pointer.y < BOARD_TOP || pointer.y > BOARD_TOP + 480) return;
    worldRipple(scene, pointer.x, pointer.y, 0x6be6ba);
  };
  scene.input.on('pointerdown', inputRipple);

  const idleTimer = scene.time.addEvent({
    delay: 1350,
    loop: true,
    callback: () => {
      if (!scene.sys.isActive() || scene.playerDefeated || !scene.hero || scene.busy) return;
      const x = scene.hero.x + Phaser.Math.Between(-10, 10);
      const y = scene.hero.y + Phaser.Math.Between(-13, 5);
      const mote = scene.add.circle(x, y, Phaser.Math.FloatBetween(0.8, 1.7), 0x90f7d4, 0.42).setDepth(9);
      scene.board.add(mote);
      safeTween(scene, {
        targets: mote,
        x: x + Phaser.Math.Between(-5, 5),
        y: y - Phaser.Math.Between(13, 25),
        alpha: 0,
        duration: Phaser.Math.Between(700, 1050),
        ease: 'Sine.easeOut',
        onComplete: () => mote.destroy()
      });
    }
  });

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.input.off('pointerdown', inputRipple);
    idleTimer.remove(false);
  });
}

function highlightObjective(scene) {
  let target = null;
  const priorities = [];

  if (!scene.gateOpen) priorities.push('S');
  if (scene.gemsCollected < scene.totalGems) priorities.push('G');
  if (!scene.hasKey) priorities.push('K');
  priorities.push('E');

  for (const symbol of priorities) {
    for (let row = 0; row < scene.map.length; row += 1) {
      const col = scene.map[row].indexOf(symbol);
      if (col >= 0) {
        target = { row, col, symbol };
        break;
      }
    }
    if (target) break;
  }

  if (!target) return;
  const { x, y } = boardPosition(target.row, target.col);
  const colors = { S: 0x68efb9, G: 0x62eaff, K: 0xf2cb64, E: 0xe1ae55 };
  boardRing(scene, x, y, colors[target.symbol] || 0x6ff0bd, 9, 2.8, 720);
  scene.time.delayedCall(190, () => boardRing(scene, x, y, colors[target.symbol] || 0x6ff0bd, 8, 2.4, 620));
}

function installMenuFeel() {
  const originalCreate = MainMenuScene.prototype.create;
  if (originalCreate.__gameFeelWrapped) return;

  function createWithFeel(...args) {
    const result = originalCreate.apply(this, args);
    this.cameras.main.fadeIn(520, 3, 13, 10);

    const start = this.children.list.find((child) => child?.text === 'ENTER THE TEMPLE');
    if (start) {
      start.on('pointerdown', () => safeTween(this, {
        targets: start,
        scale: 0.94,
        duration: 70,
        yoyo: true,
        ease: 'Quad.easeOut'
      }));
    }

    const breathingFrame = this.add.rectangle(200, 320, 394, 632, 0x000000, 0)
      .setStrokeStyle(2, 0x5edab0, 0.08)
      .setDepth(2);
    safeTween(this, {
      targets: breathingFrame,
      alpha: { from: 0.25, to: 0.8 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    return result;
  }

  createWithFeel.__gameFeelWrapped = true;
  MainMenuScene.prototype.create = createWithFeel;
}

function installTempleFeel() {
  const originalCreate = TempleScene.prototype.create;
  TempleScene.prototype.create = function createWithGameFeel(...args) {
    const result = originalCreate.apply(this, args);
    this.gameFeel = {
      combo: 0,
      lastRewardAt: -Infinity,
      lastScore: gameState.score,
      aura: null
    };
    addSceneAtmosphere(this);
    return result;
  };

  const originalUpdateHud = TempleScene.prototype.updateHud;
  TempleScene.prototype.updateHud = function updateHudWithFeel(...args) {
    const before = this.hud?.map((item) => item.text) || [];
    const beforeScore = this.gameFeel?.lastScore ?? gameState.score;
    const result = originalUpdateHud.apply(this, args);

    this.hud?.forEach((item, index) => {
      if (before[index] !== undefined && before[index] !== item.text) pulse(item, index === 3 ? 1.16 : 1.1, 105);
    });

    if (this.gameFeel && gameState.score !== beforeScore) {
      this.gameFeel.lastScore = gameState.score;
      pulse(this.subtitle, 1.045, 90);
    }
    return result;
  };

  const originalMovePlayer = TempleScene.prototype.movePlayer;
  TempleScene.prototype.movePlayer = function movePlayerWithFeel(rowDirection, colDirection) {
    const oldPosition = this.playerPosition ? { ...this.playerPosition } : null;
    const oldX = this.hero?.x;
    const oldY = this.hero?.y;
    const oldFlip = this.hero?.flipX;
    const result = originalMovePlayer.call(this, rowDirection, colDirection);

    const moved = oldPosition && this.playerPosition
      && (oldPosition.row !== this.playerPosition.row || oldPosition.col !== this.playerPosition.col);
    if (!moved || !this.hero || !this.board) return result;

    const echo = this.add.image(oldX, oldY, 'emerald-hero')
      .setDepth(7)
      .setAlpha(0.14)
      .setScale(0.97)
      .setFlipX(oldFlip);
    this.board.add(echo);
    safeTween(this, {
      targets: echo,
      alpha: 0,
      scale: 0.78,
      duration: 175,
      ease: 'Quad.easeOut',
      onComplete: () => echo.destroy()
    });

    boardSparks(this, oldX, oldY + 13, 0x9a7d4f, 4, 12);
    this.hero.setAngle(colDirection * -2.4);
    safeTween(this, { targets: this.hero, angle: 0, duration: 170, ease: 'Back.easeOut' });

    if (this.gameFeel?.aura) {
      const target = boardPosition(this.playerPosition.row, this.playerPosition.col);
      safeTween(this, {
        targets: this.gameFeel.aura,
        x: target.x,
        y: target.y + 2,
        duration: 140,
        ease: 'Quad.easeOut'
      });
    }

    return result;
  };

  const originalTryPushRock = TempleScene.prototype.tryPushRock;
  TempleScene.prototype.tryPushRock = function tryPushRockWithFeel(row, col, dr, dc) {
    const result = originalTryPushRock.call(this, row, col, dr, dc);
    if (result) {
      const destination = boardPosition(row, col + dc);
      boardRing(this, destination.x, destination.y, 0xa9957f, 10, 1.8, 260);
      boardSparks(this, destination.x - dc * 10, destination.y + 10, 0xb59466, 7, 19);
      cameraPunch(this, 1.008, 55, 130);
    }
    return result;
  };

  const originalDigEarth = TempleScene.prototype.digEarth;
  TempleScene.prototype.digEarth = function digEarthWithFeel(row, col) {
    const result = originalDigEarth.call(this, row, col);
    const { x, y } = boardPosition(row, col);
    boardSparks(this, x, y, 0xc69a62, 9, 25);
    this.cameras.main.shake(45, 0.0012);
    return result;
  };

  const originalCollectGem = TempleScene.prototype.collectGem;
  TempleScene.prototype.collectGem = function collectGemWithFeel(row, col) {
    const position = boardPosition(row, col);
    const result = originalCollectGem.call(this, row, col);
    rewardFeedback(this, position.x, position.y, 'CRYSTAL SECURED', '#bffbff', 0x55eaff);
    return result;
  };

  const originalCollectKey = TempleScene.prototype.collectKey;
  TempleScene.prototype.collectKey = function collectKeyWithFeel(row, col) {
    const position = boardPosition(row, col);
    const result = originalCollectKey.call(this, row, col);
    rewardFeedback(this, position.x, position.y, 'ANCIENT KEY FOUND', '#ffe8a0', 0xf0c65b);
    return result;
  };

  const originalCollectRelic = TempleScene.prototype.collectRelic;
  TempleScene.prototype.collectRelic = function collectRelicWithFeel(row, col) {
    const position = boardPosition(row, col);
    const result = originalCollectRelic.call(this, row, col);
    rewardFeedback(this, position.x, position.y, 'RELIC RECOVERED', '#c4ffe9', 0x66efbd);
    edgeFlash(this, 0x66efbd, 0.35, 520);
    return result;
  };

  const originalActivateSwitch = TempleScene.prototype.activateSwitch;
  TempleScene.prototype.activateSwitch = function activateSwitchWithFeel(row, col) {
    const gates = [...this.gateSprites.keys()].map((key) => {
      const [gateRow, gateCol] = key.split(',').map(Number);
      return boardPosition(gateRow, gateCol);
    });
    const result = originalActivateSwitch.call(this, row, col);

    const switchPosition = boardPosition(row, col);
    boardRing(this, switchPosition.x, switchPosition.y, 0x68f0bc, 9, 3.2, 500);
    gates.forEach((position, index) => this.time.delayedCall(index * 70, () => {
      boardRing(this, position.x, position.y, 0x68f0bc, 10, 2.7, 440);
      boardSparks(this, position.x, position.y, 0x68f0bc, 9, 27);
    }));
    edgeFlash(this, 0x68f0bc, 0.24, 420);
    cameraPunch(this, 1.015, 90, 210);
    return result;
  };

  TempleScene.prototype.updateSpikeVisuals = function updateSpikesWithFeel() {
    this.spikeSprites.forEach((sprite) => {
      if (sprite._feelBaseY === undefined) sprite._feelBaseY = sprite.y;
      this.tweens.killTweensOf(sprite);
      sprite.setTint(this.spikesActive ? 0xff766c : 0x67877a);
      safeTween(this, {
        targets: sprite,
        alpha: this.spikesActive ? 1 : 0.34,
        scaleX: 1,
        scaleY: this.spikesActive ? 1 : 0.48,
        y: sprite._feelBaseY + (this.spikesActive ? 0 : 7),
        duration: this.spikesActive ? 150 : 210,
        ease: this.spikesActive ? 'Back.easeOut' : 'Quad.easeIn'
      });
      if (this.spikesActive) boardRing(this, sprite.x, sprite._feelBaseY + 7, 0xff6f63, 5, 1.7, 220);
    });
  };

  const originalAdvanceGuardians = TempleScene.prototype.advanceGuardians;
  TempleScene.prototype.advanceGuardians = function advanceGuardiansWithFeel() {
    const previous = this.guardians.map((guardian) => ({
      row: guardian.row,
      col: guardian.col,
      x: guardian.sprite.x,
      y: guardian.sprite.y
    }));
    const result = originalAdvanceGuardians.call(this);

    this.guardians.forEach((guardian, index) => {
      const old = previous[index];
      if (!old || (old.row === guardian.row && old.col === guardian.col)) return;
      const trail = this.add.image(old.x, old.y, 'emerald-guardian')
        .setDepth(4)
        .setAlpha(0.14)
        .setTint(0xff5e55);
      this.board.add(trail);
      safeTween(this, {
        targets: trail,
        alpha: 0,
        scale: 0.78,
        duration: 210,
        onComplete: () => trail.destroy()
      });
      boardRing(this, guardian.sprite.x, guardian.sprite.y, 0xff6058, 5, 1.6, 230);
    });
    return result;
  };

  const originalShowHint = TempleScene.prototype.showHint;
  TempleScene.prototype.showHint = function showHintWithHighlight(...args) {
    const result = originalShowHint.apply(this, args);
    if (!this.busy) highlightObjective(this);
    return result;
  };

  const originalDamagePlayer = TempleScene.prototype.damagePlayer;
  TempleScene.prototype.damagePlayer = function damagePlayerWithFeel(...args) {
    edgeFlash(this, 0xff4c45, 0.48, 520);
    cameraPunch(this, 1.035, 65, 260);
    floatingLabel(this, 200, 178, 'DANGER!', '#ffb4ae', 75);
    return originalDamagePlayer.apply(this, args);
  };

  const originalCrushPlayer = TempleScene.prototype.crushPlayer;
  TempleScene.prototype.crushPlayer = function crushPlayerWithFeel(...args) {
    edgeFlash(this, 0xff3e37, 0.56, 620);
    cameraPunch(this, 1.045, 80, 300);
    floatingLabel(this, 200, 178, 'CRUSHED!', '#ffd0cb', 75);
    return originalCrushPlayer.apply(this, args);
  };

  const originalCompleteLevel = TempleScene.prototype.completeLevel;
  TempleScene.prototype.completeLevel = function completeLevelWithCelebration(...args) {
    const result = originalCompleteLevel.apply(this, args);
    cameraPunch(this, 1.03, 150, 420);
    edgeFlash(this, 0xffd86f, 0.38, 850);

    const origins = [92, 200, 308];
    origins.forEach((originX, index) => this.time.delayedCall(index * 120, () => {
      for (let particle = 0; particle < 14; particle += 1) {
        const angle = Phaser.Math.FloatBetween(Math.PI * 1.08, Math.PI * 1.92);
        const distance = Phaser.Math.Between(45, 105);
        const colors = [0x67efbd, 0x5ce8ff, 0xf1c85d, 0xffffff];
        const shard = this.add.rectangle(originX, 230, Phaser.Math.Between(2, 4), Phaser.Math.Between(5, 9), colors[particle % colors.length], 0.92)
          .setDepth(24)
          .setAngle(Phaser.Math.Between(0, 180));
        safeTween(this, {
          targets: shard,
          x: originX + Math.cos(angle) * distance,
          y: 230 + Math.sin(angle) * distance + Phaser.Math.Between(25, 65),
          angle: shard.angle + Phaser.Math.Between(90, 260),
          alpha: 0,
          duration: Phaser.Math.Between(650, 980),
          ease: 'Quad.easeOut',
          onComplete: () => shard.destroy()
        });
      }
    }));
    return result;
  };

  const originalShowGameOver = TempleScene.prototype.showGameOver;
  TempleScene.prototype.showGameOver = function showGameOverWithWeight(...args) {
    const result = originalShowGameOver.apply(this, args);
    edgeFlash(this, 0x8f2020, 0.42, 900);
    this.cameras.main.zoomTo(0.985, 420, 'Sine.easeOut', true);
    return result;
  };

  const originalShowLevelIntro = TempleScene.prototype.showLevelIntro;
  TempleScene.prototype.showLevelIntro = function showIntroWithProgress(...args) {
    const result = originalShowLevelIntro.apply(this, args);
    const lineLeft = this.add.rectangle(82, 379, 118, 1, 0x6cebc0, 0.42).setDepth(42).setAlpha(0);
    const lineRight = this.add.rectangle(318, 379, 118, 1, 0x6cebc0, 0.42).setDepth(42).setAlpha(0);
    const marker = this.add.text(200, 379, `${this.levelIndex + 1} / 3`, {
      fontFamily: UI_FONT,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#8edec2',
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(42).setAlpha(0);

    safeTween(this, { targets: [lineLeft, lineRight, marker], alpha: 1, duration: 220 });
    this.time.delayedCall(1020, () => safeTween(this, {
      targets: [lineLeft, lineRight, marker],
      alpha: 0,
      duration: 240,
      onComplete: () => [lineLeft, lineRight, marker].forEach((item) => item.destroy())
    }));
    return result;
  };

  const originalMakePanelButton = TempleScene.prototype.makePanelButton;
  TempleScene.prototype.makePanelButton = function makePanelButtonWithPress(...args) {
    const button = originalMakePanelButton.apply(this, args);
    button.on('pointerdown', () => safeTween(this, {
      targets: button,
      scale: 0.94,
      duration: 65,
      yoyo: true,
      ease: 'Quad.easeOut'
    }));
    return button;
  };
}

installMenuFeel();
installTempleFeel();
