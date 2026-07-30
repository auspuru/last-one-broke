import { VISUAL_ASSETS } from '../assets/AssetManifest.js';
import BootScene from '../scenes/BootScene.js';
import TempleScene from '../scenes/TempleScene.js';

const DISPLAY_FONT = 'Georgia, Times New Roman, serif';
const UI_FONT = 'Trebuchet MS, Arial, sans-serif';
const TILE_SIZE = 40;
const BOARD_TOP = 118;

function installPreloader() {
  const originalPreload = BootScene.prototype.preload;

  BootScene.prototype.preload = function preloadProductionAssets(...args) {
    originalPreload?.apply(this, args);

    this.cameras.main.setBackgroundColor('#06110e');
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const track = this.add.rectangle(cx, cy + 44, 250, 8, 0x07110e, 0.95)
      .setStrokeStyle(1, 0xb98b42, 0.8);
    const bar = this.add.rectangle(cx - 123, cy + 44, 0, 5, 0x64eab9, 1)
      .setOrigin(0, 0.5);
    const status = this.add.text(cx, cy + 67, 'PREPARING THE TEMPLE', {
      fontFamily: UI_FONT,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#9fc8b8',
      letterSpacing: 1.2
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      bar.width = 246 * value;
      status.setText(`PREPARING THE TEMPLE  ${Math.round(value * 100)}%`);
    });

    this.load.once('complete', () => {
      [track, bar, status].forEach((item) => item.destroy());
    });

    this.load.on('loaderror', (file) => {
      console.warn(`[Emerald Quest] Visual asset fallback used for ${file?.key || 'unknown asset'}.`);
    });

    VISUAL_ASSETS.forEach((asset) => {
      if (this.textures.exists(asset.key)) return;
      if (asset.type === 'svg') {
        this.load.svg(asset.key, asset.url, { width: asset.width, height: asset.height });
      }
    });
  };
}

function installPremiumTemplePresentation() {
  TempleScene.prototype.drawBackground = function drawIllustratedBackground() {
    this.cameras.main.setBackgroundColor('#040e0b');

    if (this.textures.exists('premium-chamber-backdrop')) {
      this.add.image(200, 320, 'premium-chamber-backdrop').setDepth(-20);
    } else {
      this.add.rectangle(200, 320, 400, 640, 0x0b261d).setDepth(-20);
    }

    this.add.rectangle(200, 61, 388, 103, 0x071410, 0.9)
      .setStrokeStyle(2, 0xb8893e, 0.9)
      .setDepth(1);
    this.add.rectangle(200, 62, 372, 87, 0x102b22, 0.84)
      .setStrokeStyle(1, 0x6e5230, 0.8)
      .setDepth(1);

    this.add.text(200, 27, 'EMERALD QUEST', {
      fontFamily: DISPLAY_FONT,
      fontSize: '23px',
      fontStyle: 'bold',
      color: '#f6d984',
      stroke: '#241505',
      strokeThickness: 4,
      letterSpacing: 1.8
    }).setOrigin(0.5).setDepth(2);

    this.subtitle = this.add.text(200, 53, '', {
      fontFamily: UI_FONT,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#a7d1c1',
      letterSpacing: 0.7
    }).setOrigin(0.5).setDepth(2);

    [61, 339].forEach((x, index) => {
      const glow = this.add.circle(x, 345, 43, 0xffa338, 0.075).setDepth(0);
      const core = this.add.circle(x, 345, 4, 0xffdc75, 0.92).setDepth(1);
      this.tweens.add({
        targets: [glow, core],
        alpha: { from: index ? 0.42 : 0.35, to: 0.9 },
        scale: { from: 0.88, to: 1.13 },
        duration: 440 + index * 90,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  };

  TempleScene.prototype.drawHud = function drawIllustratedHud() {
    this.hud = [];

    if (this.textures.exists('premium-hud-frame')) {
      this.add.image(200, 88, 'premium-hud-frame').setDepth(4);
    } else {
      this.add.rectangle(200, 88, 370, 42, 0x132e25, 0.98)
        .setStrokeStyle(2, 0xb8893e)
        .setDepth(4);
    }

    const positions = [55, 145, 245, 345];
    const common = {
      fontFamily: UI_FONT,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#f4dfa0',
      stroke: '#050b09',
      strokeThickness: 2
    };

    this.hud.push(this.add.text(positions[0], 88, '', { ...common, color: '#8df6d2' }).setOrigin(0.5).setDepth(5));
    this.hud.push(this.add.text(positions[1], 88, '', common).setOrigin(0.5).setDepth(5));
    this.hud.push(this.add.text(positions[2], 88, '', common).setOrigin(0.5).setDepth(5));
    this.hud.push(this.add.text(positions[3], 88, '', { ...common, fontSize: '14px', color: '#ff7772' }).setOrigin(0.5).setDepth(5));

    this.add.rectangle(200, 618, 374, 35, 0x050d0b, 0.96)
      .setStrokeStyle(2, 0x8f682f, 0.82)
      .setDepth(5);
    this.message = this.add.text(200, 618, '', {
      fontFamily: UI_FONT,
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#e2ece7',
      align: 'center',
      wordWrap: { width: 310 },
      lineSpacing: 2
    }).setOrigin(0.5).setDepth(6);

    const makeButton = (x, label, fontSize) => {
      const button = this.add.text(x, 17, label, {
        fontFamily: UI_FONT,
        fontSize: `${fontSize}px`,
        fontStyle: 'bold',
        color: '#f5dc91',
        backgroundColor: '#142f26',
        stroke: '#060d0a',
        strokeThickness: 2,
        padding: { x: 8, y: fontSize > 12 ? 4 : 7 }
      }).setDepth(30).setInteractive({ useHandCursor: true });

      button.on('pointerover', () => button.setScale(1.04).setStyle({ backgroundColor: '#235141' }));
      button.on('pointerout', () => button.setScale(1).setStyle({ backgroundColor: '#142f26' }));
      button.on('pointerdown', () => this.playTone('button'));
      return button;
    };

    const restart = makeButton(18, '↻', 20).setOrigin(0, 0);
    restart.on('pointerdown', () => this.restartLevel());
    this.hintButton = makeButton(82, 'HINT', 9).setOrigin(0.5, 0);
    this.hintButton.on('pointerdown', () => this.showHint());
    this.audioButton = makeButton(382, this.audioEnabled ? 'SOUND ON' : 'SOUND OFF', 8).setOrigin(1, 0);
    this.audioButton.on('pointerdown', () => this.toggleAudio());
  };

  const originalAddEntity = TempleScene.prototype.addEntity;
  TempleScene.prototype.addEntity = function addIllustratedEntity(row, col, texture) {
    const sprite = originalAddEntity.call(this, row, col, texture);

    if (texture === 'emerald-gem' && this.textures.exists('premium-diamond')) {
      sprite.setTexture('premium-diamond').setDisplaySize(47, 47);
    }
    if (texture === 'emerald-guardian' && this.textures.exists('premium-guardian-idle')) {
      sprite.setTexture('premium-guardian-idle').setDisplaySize(49, 49);
    }

    return sprite;
  };

  const originalDrawBoard = TempleScene.prototype.drawBoard;
  TempleScene.prototype.drawBoard = function drawIllustratedBoard(...args) {
    const result = originalDrawBoard.apply(this, args);

    if (this.hero && this.textures.exists('premium-hero-idle')) {
      this.hero.setTexture('premium-hero-idle').setDisplaySize(48, 48);
      this.heroShadow?.setScale(1.05, 0.82).setAlpha(0.62);
    }

    if (this.board && this.textures.exists('premium-jungle-frame')) {
      const foliage = this.add.image(200, 240, 'premium-jungle-frame')
        .setDepth(14)
        .setAlpha(0.86);
      this.board.add(foliage);
    }

    for (let index = 0; index < 18; index += 1) {
      const mote = this.add.circle(
        Phaser.Math.Between(35, 365),
        Phaser.Math.Between(20, 455),
        Phaser.Math.FloatBetween(0.7, 1.6),
        index % 3 === 0 ? 0xffd77a : 0x82e6be,
        Phaser.Math.FloatBetween(0.08, 0.23)
      ).setDepth(13);
      this.board.add(mote);
      this.tweens.add({
        targets: mote,
        y: mote.y - Phaser.Math.Between(18, 44),
        x: mote.x + Phaser.Math.Between(-7, 7),
        alpha: 0,
        duration: Phaser.Math.Between(1700, 3000),
        delay: Phaser.Math.Between(0, 1200),
        repeat: -1,
        ease: 'Sine.easeOut'
      });
    }

    return result;
  };
}

installPreloader();
installPremiumTemplePresentation();

window.emeraldProductionPipeline = Object.freeze({
  version: '0.1.0',
  assets: VISUAL_ASSETS.map(({ key, url }) => ({ key, url })),
  board: { tileSize: TILE_SIZE, top: BOARD_TOP }
});
