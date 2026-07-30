import BootScene from './scenes/BootScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import TempleScene from './scenes/TempleScene.js';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 640;
const TILE_SIZE = 40;
const BOARD_TOP = 118;
const DISPLAY_FONT = 'Georgia, Times New Roman, serif';
const UI_FONT = 'Trebuchet MS, Arial, sans-serif';

function patchMenu() {
  MainMenuScene.prototype.create = function createPremiumMenu() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#06110e');
    this.add.rectangle(width / 2, height / 2, width, height, 0x071a15);
    this.add.rectangle(width / 2, 390, width, 500, 0x0b241c, 0.95);

    for (let i = 0; i < 30; i += 1) {
      this.add.circle(
        i % 2 ? Phaser.Math.Between(320, 430) : Phaser.Math.Between(-30, 80),
        Phaser.Math.Between(190, 650),
        Phaser.Math.Between(18, 62),
        i % 3 ? 0x123c2e : 0x1d523d,
        Phaser.Math.FloatBetween(0.08, 0.22)
      );
    }

    const temple = this.add.graphics();
    temple.fillStyle(0x050d0b, 0.95).fillTriangle(58, 380, 200, 220, 342, 380);
    temple.fillRect(76, 370, 248, 120).fillRect(54, 425, 292, 76);
    temple.fillStyle(0x0d2d22).fillRoundedRect(165, 363, 70, 132, 30);
    temple.lineStyle(2, 0x286a51, 0.45).strokeRoundedRect(165, 363, 70, 132, 30);

    const glows = [this.add.circle(82, 417, 54, 0xffa137, 0.07), this.add.circle(318, 417, 54, 0xffa137, 0.07)];
    this.add.circle(82, 417, 4, 0xffd779, 0.95);
    this.add.circle(318, 417, 4, 0xffd779, 0.95);
    this.tweens.add({ targets: glows, alpha: { from: 0.04, to: 0.13 }, scale: { from: 0.85, to: 1.16 }, duration: 540, yoyo: true, repeat: -1 });

    for (let i = 0; i < 20; i += 1) {
      const mote = this.add.circle(Phaser.Math.Between(30, 370), Phaser.Math.Between(190, 570), Phaser.Math.Between(1, 2), 0x73f3c0, Phaser.Math.FloatBetween(0.08, 0.26));
      this.tweens.add({ targets: mote, y: mote.y - Phaser.Math.Between(20, 48), x: mote.x + Phaser.Math.Between(-8, 8), alpha: 0, duration: Phaser.Math.Between(1700, 2900), repeat: -1, delay: Phaser.Math.Between(0, 1200) });
    }

    this.add.text(width / 2, 95, 'EMERALD', { fontFamily: DISPLAY_FONT, fontSize: '48px', fontStyle: 'bold', color: '#f3d681', stroke: '#251405', strokeThickness: 6, letterSpacing: 3 }).setOrigin(0.5);
    this.add.text(width / 2, 140, 'QUEST', { fontFamily: DISPLAY_FONT, fontSize: '44px', fontStyle: 'bold', color: '#69efbd', stroke: '#083629', strokeThickness: 6, letterSpacing: 7 }).setOrigin(0.5);
    this.add.text(width / 2, 181, 'THE SUNKEN TEMPLE', { fontFamily: UI_FONT, fontSize: '11px', fontStyle: 'bold', color: '#a8ccbd', letterSpacing: 2 }).setOrigin(0.5);

    this.add.rectangle(width / 2 + 3, 520, 326, 146, 0x000000, 0.38);
    this.add.rectangle(width / 2, 516, 326, 146, 0x102e25, 0.98).setStrokeStyle(2, 0xb68c42, 0.95);
    this.add.text(width / 2, 477, 'THREE CHAMBERS. ONE EXPEDITION.', { fontFamily: UI_FONT, fontSize: '10px', fontStyle: 'bold', color: '#b6d9cc', letterSpacing: 0.8 }).setOrigin(0.5);

    const start = this.add.text(width / 2, 524, 'ENTER THE TEMPLE', { fontFamily: UI_FONT, fontSize: '15px', fontStyle: 'bold', color: '#241604', backgroundColor: '#e7bb57', padding: { x: 31, y: 14 }, stroke: '#fff0af', strokeThickness: 1 }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.add.text(width / 2, 570, 'SWIPE • TAP • ARROW KEYS • WASD', { fontFamily: UI_FONT, fontSize: '9px', fontStyle: 'bold', color: '#80aa9a', letterSpacing: 0.8 }).setOrigin(0.5);
    start.on('pointerover', () => start.setScale(1.045).setStyle({ backgroundColor: '#f5d476' }));
    start.on('pointerout', () => start.setScale(1).setStyle({ backgroundColor: '#e7bb57' }));
    start.on('pointerdown', () => {
      start.disableInteractive();
      this.cameras.main.fadeOut(280, 4, 15, 11);
      this.time.delayedCall(280, () => this.scene.start('TempleScene'));
    });
  };
}

function patchTempleVisuals() {
  TempleScene.prototype.createTextures = function createPremiumTextures() {
    if (this.textures.exists('temple-floor-a')) return;
    const g = this.add.graphics();
    const save = (key, w = 40, h = 40) => { g.generateTexture(key, w, h); g.clear(); };
    const path = (points, color, alpha = 1, width = 1) => {
      g.lineStyle(width, color, alpha).beginPath().moveTo(points[0][0], points[0][1]);
      points.slice(1).forEach(([x, y]) => g.lineTo(x, y));
      g.strokePath();
    };
    const stone = (base, inset, light, shadow) => {
      g.fillStyle(shadow).fillRect(0, 0, 40, 40);
      g.fillStyle(base).fillRoundedRect(1, 1, 38, 38, 4);
      g.fillStyle(inset).fillRoundedRect(4, 4, 32, 32, 3);
      g.fillStyle(light, 0.5).fillRect(5, 5, 29, 2).fillRect(5, 7, 2, 27);
      g.fillStyle(shadow, 0.62).fillRect(5, 33, 30, 2).fillRect(33, 6, 2, 29);
    };

    stone(0x213d33, 0x2e5545, 0x789983, 0x081a15);
    g.lineStyle(1, 0x10271f, 0.85).strokeRect(8, 8, 24, 24);
    save('emerald-wall');
    stone(0x203a31, 0x315949, 0x83a48d, 0x081914);
    g.lineStyle(1, 0x10271f, 0.85).strokeRect(6, 7, 28, 12).strokeRect(9, 21, 22, 12);
    g.fillStyle(0x15402f, 0.75).fillCircle(7, 8, 5).fillCircle(34, 33, 5);
    save('temple-wall-a');
    stone(0x254136, 0x365f4d, 0x8aaa93, 0x091a16);
    path([[7, 10], [17, 17], [12, 28]], 0x142d24, 0.9);
    path([[25, 7], [31, 15], [27, 31]], 0x91ad98, 0.32);
    save('temple-wall-b');
    stone(0x1c352c, 0x294d3f, 0x718f79, 0x071612);
    g.fillStyle(0x143a2c, 0.9).fillCircle(5, 7, 7).fillCircle(35, 6, 5).fillCircle(36, 35, 7);
    save('temple-wall-c');

    const floor = (key, base, inset, shift) => {
      g.fillStyle(0x06130f).fillRect(0, 0, 40, 40);
      g.fillStyle(base).fillRect(1, 1, 38, 38);
      g.fillStyle(inset).fillRoundedRect(3, 3, 34, 34, 3);
      g.fillStyle(0x7ca18a, 0.18).fillRect(4, 4, 31, 1).fillRect(4, 5, 1, 30);
      g.fillStyle(0x04100d, 0.45).fillRect(4, 35, 32, 1).fillRect(35, 4, 1, 32);
      path([[8 + shift, 11], [14 + shift, 17], [11 + shift, 24], [18 + shift, 30]], 0x09261e, 0.88);
      save(key);
    };
    floor('emerald-floor', 0x102c24, 0x183d31, 0);
    floor('temple-floor-a', 0x102a22, 0x1a4033, 2);
    floor('temple-floor-b', 0x0e2921, 0x17392e, -2);
    floor('temple-floor-c', 0x123027, 0x1d4436, 4);

    const earth = (key, base, light) => {
      g.fillStyle(0x281a12).fillRect(0, 0, 40, 40);
      g.fillStyle(base).fillRoundedRect(1, 1, 38, 38, 3);
      g.fillStyle(light, 0.76).fillCircle(7, 9, 5).fillCircle(24, 8, 4).fillCircle(33, 24, 6).fillCircle(14, 31, 5);
      g.fillStyle(0x38261a, 0.82).fillCircle(18, 18, 3).fillCircle(6, 29, 2).fillCircle(30, 34, 3);
      path([[3, 19], [12, 15], [19, 22], [29, 17], [38, 21]], 0xc3975a, 0.28);
      g.lineStyle(2, 0x281a11, 0.85).strokeRoundedRect(1, 1, 38, 38, 3);
      save(key);
    };
    earth('emerald-earth', 0x694a2e, 0x956b3e);
    earth('temple-earth-a', 0x604229, 0x8b6239);
    earth('temple-earth-b', 0x705033, 0xa07849);

    g.fillStyle(0x0f3c2c, 0.9).fillCircle(6, 6, 7).fillCircle(33, 7, 8).fillCircle(37, 35, 7).fillCircle(4, 35, 6);
    g.fillStyle(0x2d7d55, 0.78).fillCircle(9, 5, 3).fillCircle(30, 8, 3).fillCircle(35, 31, 3);
    save('emerald-moss');

    g.fillStyle(0x000000, 0.34).fillEllipse(21, 31, 31, 12);
    g.fillStyle(0x3b3937).fillCircle(20, 21, 16);
    g.fillStyle(0x575551).fillCircle(18, 18, 14);
    g.fillStyle(0x7b7771).fillCircle(13, 13, 7);
    g.fillStyle(0x282725).fillCircle(28, 27, 7);
    g.lineStyle(2, 0x191817).strokeCircle(20, 21, 16);
    path([[9, 24], [17, 19], [25, 23]], 0xa09a91, 0.48);
    save('emerald-rock');

    g.fillStyle(0x31d9ff, 0.12).fillCircle(20, 20, 19);
    g.fillStyle(0x55edff, 0.23).fillCircle(20, 20, 14);
    g.fillStyle(0x12a9d0).fillTriangle(20, 2, 37, 15, 29, 37).fillTriangle(20, 2, 3, 15, 11, 37);
    g.fillStyle(0x70f4ff).fillTriangle(20, 2, 29, 37, 20, 28);
    g.fillStyle(0xd6fdff, 0.95).fillTriangle(20, 5, 14, 17, 23, 14);
    g.lineStyle(2, 0x075b7b).strokeTriangle(20, 2, 37, 15, 29, 37).strokeTriangle(20, 2, 3, 15, 11, 37);
    save('emerald-gem');

    g.fillStyle(0xf9d76b, 0.13).fillCircle(20, 20, 17);
    g.fillStyle(0xd29b2d).fillCircle(12, 20, 8);
    g.fillStyle(0xf5cf62).fillCircle(12, 20, 6);
    g.fillStyle(0x6f4914).fillCircle(12, 20, 3);
    g.fillStyle(0xe8b84a).fillRoundedRect(18, 17, 18, 6, 2).fillRect(29, 21, 4, 8).fillRect(23, 21, 4, 5);
    g.fillStyle(0xffeca2, 0.8).fillRect(20, 18, 12, 1);
    save('emerald-key');

    g.fillStyle(0x000000, 0.34).fillEllipse(20, 35, 30, 8);
    g.fillStyle(0x2b1912).fillRoundedRect(4, 3, 32, 36, 13);
    g.fillStyle(0x664125).fillRoundedRect(7, 5, 26, 34, 11);
    g.fillStyle(0x9d6836).fillRoundedRect(11, 8, 18, 31, 8);
    g.lineStyle(2, 0x1b0f0a).strokeRoundedRect(4, 3, 32, 36, 13);
    g.lineStyle(1, 0xe1a95d, 0.55).strokeRoundedRect(11, 8, 18, 31, 8);
    g.fillStyle(0x62f2bf, 0.16).fillCircle(20, 22, 9);
    g.fillStyle(0x67f0bd).fillCircle(20, 22, 3);
    g.fillStyle(0xe2c56f).fillCircle(26, 24, 2);
    save('emerald-door');

    g.fillStyle(0x142a24).fillRoundedRect(3, 2, 34, 37, 5);
    g.fillStyle(0x355c4e).fillRect(6, 3, 5, 34).fillRect(29, 3, 5, 34);
    g.lineStyle(2, 0xd1a54c).strokeRect(6, 3, 5, 34).strokeRect(29, 3, 5, 34);
    g.fillStyle(0x25b789, 0.5).fillRect(15, 4, 10, 32);
    path([[20, 7], [25, 14], [20, 20], [15, 27], [20, 34]], 0x6ff3c5, 0.78, 2);
    g.fillStyle(0xec5e4f).fillCircle(20, 20, 4);
    save('emerald-gate');

    g.fillStyle(0x061a14, 0.45).fillEllipse(20, 32, 31, 8);
    g.fillStyle(0x203e33).fillRoundedRect(4, 12, 32, 20, 7);
    g.fillStyle(0x356a53).fillRoundedRect(7, 14, 26, 15, 5);
    g.lineStyle(2, 0xb99b54).strokeRoundedRect(5, 12, 30, 20, 7);
    g.fillStyle(0x54efb4, 0.18).fillCircle(20, 20, 12);
    g.fillStyle(0x5df0b8).fillCircle(20, 20, 7);
    g.fillStyle(0xd9fff1).fillCircle(18, 18, 2);
    save('emerald-switch');

    g.fillStyle(0x111c19).fillRoundedRect(2, 29, 36, 8, 3);
    g.lineStyle(1, 0x6d716c).strokeRoundedRect(2, 29, 36, 8, 3);
    g.fillStyle(0x7c8580).fillTriangle(4, 31, 9, 8, 14, 31);
    g.fillStyle(0xd8ddd8).fillTriangle(12, 31, 19, 4, 26, 31);
    g.fillStyle(0x929b96).fillTriangle(24, 31, 31, 9, 36, 31);
    g.fillStyle(0xffffff, 0.45).fillTriangle(15, 28, 19, 8, 21, 28);
    save('emerald-spikes');

    g.fillStyle(0x0a0f0e, 0.36).fillEllipse(20, 35, 29, 8);
    g.fillStyle(0x23362f).fillRoundedRect(6, 6, 28, 30, 8);
    g.fillStyle(0x48695a).fillRoundedRect(9, 4, 22, 27, 8);
    g.fillStyle(0x708e7d).fillCircle(20, 13, 9);
    g.fillStyle(0x25362f).fillRect(11, 22, 18, 11);
    g.lineStyle(2, 0x9eb4a8).strokeRoundedRect(7, 5, 26, 31, 8);
    g.fillStyle(0xff5148, 0.3).fillCircle(15, 14, 5).fillCircle(25, 14, 5);
    g.fillStyle(0xff665b).fillCircle(15, 14, 2).fillCircle(25, 14, 2);
    g.fillStyle(0x111b17).fillRect(14, 25, 12, 5);
    g.fillStyle(0x6ff0bd, 0.35).fillCircle(20, 28, 3);
    save('emerald-guardian');

    g.fillStyle(0x59f1bd, 0.12).fillCircle(20, 20, 18);
    g.fillStyle(0x9d7429).fillCircle(20, 20, 13);
    g.fillStyle(0xf2d16d).fillCircle(20, 20, 10);
    g.fillStyle(0x63e9bd).fillTriangle(20, 6, 31, 20, 20, 35).fillTriangle(20, 6, 9, 20, 20, 35);
    g.fillStyle(0xd6fff1, 0.8).fillTriangle(20, 9, 17, 18, 23, 17);
    g.lineStyle(2, 0x6a4b16).strokeCircle(20, 20, 13);
    save('emerald-relic');

    g.fillStyle(0x000000, 0.3).fillEllipse(20, 36, 27, 7);
    g.fillStyle(0x2a1a11).fillRect(9, 31, 8, 7).fillRect(23, 31, 8, 7);
    g.fillStyle(0x4c2d18).fillRoundedRect(10, 20, 20, 15, 5);
    g.fillStyle(0x9a5c2d).fillRoundedRect(13, 20, 14, 14, 4);
    g.fillStyle(0xd29b5e).fillCircle(20, 15, 8);
    g.fillStyle(0x513016).fillEllipse(20, 8, 28, 9);
    g.fillStyle(0xb87a35).fillRect(8, 8, 24, 4);
    g.fillStyle(0xe0aa54).fillEllipse(20, 5, 18, 7);
    g.fillStyle(0x253c32).fillRoundedRect(8, 22, 6, 11, 3);
    g.fillStyle(0x1a2a23).fillRoundedRect(26, 22, 6, 11, 3);
    g.fillStyle(0xf2dfb2).fillCircle(17, 14, 1).fillCircle(23, 14, 1);
    g.fillStyle(0x3d2416).fillRect(18, 18, 4, 1);
    g.fillStyle(0x5df0b8, 0.3).fillCircle(30, 22, 5);
    g.fillStyle(0x6bf7c1).fillCircle(31, 21, 2);
    save('emerald-hero');

    g.fillStyle(0xfff0a8, 0.95).fillCircle(4, 4, 3);
    g.fillStyle(0x67f3c0, 0.55).fillCircle(4, 4, 4);
    save('emerald-spark', 8, 8);
    g.fillStyle(0x000000, 0.45).fillEllipse(20, 22, 29, 10).fillStyle(0x000000, 0.18).fillEllipse(20, 20, 36, 16);
    save('emerald-shadow');
    g.lineStyle(1, 0x72d9b0, 0.55).strokeCircle(20, 20, 11);
    path([[20, 7], [26, 20], [20, 33], [14, 20], [20, 7]], 0xe0be68, 0.35);
    save('temple-rune');
    g.fillStyle(0xffb43e, 0.22).fillCircle(20, 20, 18);
    g.fillStyle(0xffd66e).fillTriangle(20, 3, 31, 25, 20, 35);
    g.fillStyle(0xff7a2d).fillTriangle(20, 8, 25, 25, 20, 31);
    g.fillStyle(0xfff0a3).fillTriangle(20, 11, 22, 23, 20, 27);
    save('temple-flame');
    g.fillStyle(0x75f0c0, 0.85).fillCircle(2, 2, 2); save('temple-dust', 4, 4);
    g.destroy();
  };

  TempleScene.prototype.drawBackground = function drawPremiumBackground() {
    this.cameras.main.setBackgroundColor('#050e0c');
    [[0x061410, 0, 160], [0x091d17, 160, 150], [0x0c271e, 310, 170], [0x071913, 480, 160]].forEach(([color, y, h]) => this.add.rectangle(200, y + h / 2, 400, h, color));
    for (let i = 0; i < 26; i += 1) {
      this.add.circle(i % 2 ? Phaser.Math.Between(322, 424) : Phaser.Math.Between(-24, 78), Phaser.Math.Between(92, 630), Phaser.Math.Between(20, 62), i % 3 ? 0x103b2d : 0x1c553e, Phaser.Math.FloatBetween(0.1, 0.26));
    }

    this.add.rectangle(203, BOARD_TOP + 243, 397, 487, 0x000000, 0.5);
    this.add.rectangle(200, BOARD_TOP + 240, 396, 484, 0x081712, 0.98).setStrokeStyle(3, 0x9c7839, 0.9);
    this.add.rectangle(200, BOARD_TOP - 1, 378, 2, 0x66d4a9, 0.28);
    this.add.rectangle(203, 63, 384, 102, 0x000000, 0.42);
    this.add.rectangle(200, 60, 384, 102, 0x102e25, 0.98).setStrokeStyle(2, 0xb78b3e, 0.95);
    this.add.rectangle(200, 11, 354, 2, 0x69d5ad, 0.35);

    this.add.text(200, 25, 'EMERALD QUEST', { fontFamily: DISPLAY_FONT, fontSize: '25px', fontStyle: 'bold', color: '#f2d47d', stroke: '#241404', strokeThickness: 4, letterSpacing: 1.8 }).setOrigin(0.5);
    this.subtitle = this.add.text(200, 52, '', { fontFamily: UI_FONT, fontSize: '9px', fontStyle: 'bold', color: '#a6cdbd', letterSpacing: 0.6 }).setOrigin(0.5);

    const torch = (x, y) => {
      const holder = this.add.graphics().setDepth(11);
      holder.fillStyle(0x2b1a12).fillRect(x - 3, y + 10, 6, 24).fillStyle(0x8c6338).fillRoundedRect(x - 7, y + 7, 14, 7, 3);
      const outer = this.add.circle(x, y, 46, 0xff9a35, 0.055).setDepth(9);
      const inner = this.add.circle(x, y, 24, 0xffc04d, 0.11).setDepth(10);
      const flame = this.add.image(x, y, 'temple-flame').setScale(0.52).setDepth(12);
      this.tweens.add({ targets: outer, scale: { from: 0.82, to: 1.16 }, alpha: { from: 0.035, to: 0.09 }, duration: 560, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: [inner, flame], scaleX: { from: 0.48, to: 0.57 }, scaleY: { from: 0.48, to: 0.64 }, angle: { from: -2, to: 2 }, duration: 240, yoyo: true, repeat: -1 });
    };
    torch(13, 350); torch(387, 350);

    for (let i = 0; i < 18; i += 1) {
      const dust = this.add.image(Phaser.Math.Between(18, 382), Phaser.Math.Between(130, 605), 'temple-dust').setAlpha(Phaser.Math.FloatBetween(0.08, 0.25)).setDepth(12);
      this.tweens.add({ targets: dust, y: dust.y - Phaser.Math.Between(18, 42), x: dust.x + Phaser.Math.Between(-9, 9), alpha: 0, duration: Phaser.Math.Between(1900, 3300), repeat: -1, delay: Phaser.Math.Between(0, 1600) });
    }
  };

  TempleScene.prototype.drawHud = function drawPremiumHud() {
    this.hud = [];
    const positions = [52, 145, 246, 348];
    const widths = [84, 88, 98, 84];
    positions.forEach((x, i) => {
      this.add.rectangle(x + 2, 92, widths[i], 34, 0x000000, 0.36);
      this.add.rectangle(x, 88, widths[i], 34, 0x17372d, 0.98).setStrokeStyle(1, i === 0 ? 0x62dab0 : 0x9c7839, 0.9);
    });
    const style = { fontFamily: UI_FONT, fontSize: '11px', fontStyle: 'bold', color: '#f3df9d', stroke: '#08110e', strokeThickness: 2 };
    this.hud.push(this.add.text(positions[0], 88, '', { ...style, color: '#85f3d0' }).setOrigin(0.5));
    this.hud.push(this.add.text(positions[1], 88, '', style).setOrigin(0.5));
    this.hud.push(this.add.text(positions[2], 88, '', style).setOrigin(0.5));
    this.hud.push(this.add.text(positions[3], 88, '', { ...style, fontSize: '14px', color: '#ff7b78' }).setOrigin(0.5));
    this.add.rectangle(200, 618, 370, 34, 0x061310, 0.94).setStrokeStyle(1, 0x6f5b30, 0.75);
    this.message = this.add.text(200, 618, '', { fontFamily: UI_FONT, fontSize: '10px', fontStyle: 'bold', color: '#dce9e2', align: 'center', wordWrap: { width: 300 }, lineSpacing: 2 }).setOrigin(0.5);

    const topButton = (x, label, size) => {
      const button = this.add.text(x, 17, label, { fontFamily: UI_FONT, fontSize: `${size}px`, fontStyle: 'bold', color: '#f3d98d', backgroundColor: '#17372d', stroke: '#050b09', strokeThickness: 2, padding: { x: 8, y: size > 12 ? 4 : 7 } }).setDepth(30).setInteractive({ useHandCursor: true });
      button.on('pointerover', () => button.setScale(1.04).setStyle({ backgroundColor: '#245444', color: '#fff0ba' }));
      button.on('pointerout', () => button.setScale(1).setStyle({ backgroundColor: '#17372d', color: '#f3d98d' }));
      button.on('pointerdown', () => this.playTone('button'));
      return button;
    };
    const restart = topButton(18, '↻', 20).setOrigin(0, 0);
    restart.on('pointerdown', () => this.restartLevel());
    this.hintButton = topButton(83, 'HINT', 9).setOrigin(0.5, 0);
    this.hintButton.on('pointerdown', () => this.showHint());
    this.audioButton = topButton(382, this.audioEnabled ? 'SOUND ON' : 'SOUND OFF', 8).setOrigin(1, 0);
    this.audioButton.on('pointerdown', () => this.toggleAudio());
    for (let i = 0; i < 3; i += 1) {
      const active = i <= this.levelIndex;
      this.add.circle(177 + i * 23, 105, active ? 4 : 3, active ? 0x63e9ba : 0x2d5547, active ? 0.9 : 0.55).setStrokeStyle(1, active ? 0xc7f7e7 : 0x517767, 0.65);
    }
  };

  TempleScene.prototype.drawBoard = function drawPremiumBoard() {
    this.board = this.add.container(0, BOARD_TOP);
    this.board.add(this.add.rectangle(200, 240, 400, 480, 0x06120f, 0.84).setDepth(-5));
    const floors = ['temple-floor-a', 'temple-floor-b', 'temple-floor-c'];
    const walls = ['temple-wall-a', 'temple-wall-b', 'temple-wall-c'];
    const earths = ['temple-earth-a', 'temple-earth-b'];

    for (let row = 0; row < this.map.length; row += 1) {
      for (let col = 0; col < this.map[row].length; col += 1) {
        const tile = this.map[row][col];
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;
        const seed = row * 17 + col * 31 + this.levelIndex * 11;
        const base = this.add.image(x, y, tile === '#' ? walls[seed % 3] : floors[seed % 3]);
        this.board.add(base);
        if (tile === '#' && seed % 4 === 0) this.board.add(this.add.image(x, y, 'emerald-moss').setAlpha(0.5).setDepth(1));
        if (tile !== '#' && seed % 11 === 0) this.board.add(this.add.image(x, y, 'temple-rune').setAlpha(0.12).setDepth(1));
        if (tile !== '#') { base.setInteractive(); base.on('pointerdown', () => this.handleTap(row, col)); }
        if (tile === 'D') {
          const dirt = this.add.image(x, y, earths[seed % 2]).setDepth(2);
          this.terrain.set(`${row},${col}`, dirt);
          this.board.add(dirt);
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

    this.heroShadow = this.add.image(this.playerPosition.col * TILE_SIZE + 20, this.playerPosition.row * TILE_SIZE + 34, 'emerald-shadow').setDepth(7).setAlpha(0.72);
    this.hero = this.add.image(this.playerPosition.col * TILE_SIZE + 20, this.playerPosition.row * TILE_SIZE + 20, 'emerald-hero').setDepth(8).setScale(1.02);
    this.board.add([this.heroShadow, this.hero]);
    this.tweens.add({ targets: this.hero, y: this.hero.y - 1.5, scaleY: 1.025, scaleX: 0.99, duration: 560, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  };

  TempleScene.prototype.addEntity = function addPremiumEntity(row, col, texture) {
    const sprite = this.add.image(col * TILE_SIZE + 20, row * TILE_SIZE + 20, texture).setDepth(5);
    if (texture === 'emerald-door') sprite.setTint(0x6d756f);
    if (texture === 'emerald-rock') sprite.setScale(0.98);
    if (['emerald-gem', 'emerald-key', 'emerald-relic'].includes(texture)) {
      this.tweens.add({ targets: sprite, y: sprite.y - 3, scale: texture === 'emerald-gem' ? 1.12 : 1.06, angle: texture === 'emerald-gem' ? 3 : 0, duration: texture === 'emerald-relic' ? 780 : 620, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    if (texture === 'emerald-guardian') this.tweens.add({ targets: sprite, scaleX: 1.035, scaleY: 0.98, angle: { from: -1, to: 1 }, duration: 420, yoyo: true, repeat: -1 });
    this.entities.set(`${row},${col}`, sprite);
    this.board.add(sprite);
    return sprite;
  };

  TempleScene.prototype.refreshDangerMarkers = function refreshPremiumDangerMarkers() {
    this.clearDangerMarkers();
    for (let row = 1; row < this.map.length - 1; row += 1) {
      for (let col = 1; col < this.map[row].length - 1; col += 1) {
        if (this.map[row][col] !== 'R' || !['.', 'D'].includes(this.map[row + 1]?.[col])) continue;
        const ring = this.add.circle(0, 0, 12, 0x7b260f, 0.72).setStrokeStyle(2, 0xffc45d, 0.95);
        const icon = this.add.text(0, -1, '!', { fontFamily: UI_FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffe19a', stroke: '#431207', strokeThickness: 3 }).setOrigin(0.5);
        const marker = this.add.container(col * TILE_SIZE + 20, (row + 1) * TILE_SIZE + 20, [ring, icon]).setDepth(4).setAlpha(0.9);
        this.board.add(marker);
        this.dangerMarkers.push(marker);
        this.tweens.add({ targets: marker, alpha: 0.34, scale: 1.14, duration: 390, yoyo: true, repeat: -1 });
      }
    }
  };

  TempleScene.prototype.makePanelButton = function makePremiumPanelButton(x, y, label, depth = 21) {
    const button = this.add.text(x, y, label, { fontFamily: UI_FONT, fontSize: '11px', fontStyle: 'bold', color: '#251705', backgroundColor: '#e4b753', stroke: '#fff1b3', strokeThickness: 1, padding: { x: 12, y: 10 } }).setOrigin(0.5).setDepth(depth).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setScale(1.05).setStyle({ backgroundColor: '#f3d273' }));
    button.on('pointerout', () => button.setScale(1).setStyle({ backgroundColor: '#e4b753' }));
    button.on('pointerdown', () => this.playTone('button'));
    return button;
  };
}

patchMenu();
patchTempleVisuals();

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#06110e',
  scene: [BootScene, MainMenuScene, TempleScene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: GAME_WIDTH, height: GAME_HEIGHT },
  render: { antialias: true, pixelArt: false, roundPixels: true, powerPreference: 'high-performance' },
  input: { activePointers: 2, touch: { capture: true } },
};

window.addEventListener('load', () => {
  const game = new Phaser.Game(config);
  window.emeraldQuest = game;
});