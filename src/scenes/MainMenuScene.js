export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#0b1713');

    this.add
      .text(width / 2, height * 0.27, 'EMERALD QUEST', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#ffe59a',
        align: 'center',
        stroke: '#3d2a10',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.37, 'Explore the temple, collect every crystal,\nand unlock the ancient gate.', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#d5e8dd',
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    const startButton = this.add
      .text(width / 2, height * 0.58, 'START ADVENTURE', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#2f2108',
        backgroundColor: '#f2c861',
        padding: { x: 24, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startButton.on('pointerover', () => startButton.setScale(1.04));
    startButton.on('pointerout', () => startButton.setScale(1));
    startButton.on('pointerdown', () => {
      startButton.disableInteractive();
      this.cameras.main.fadeOut(250, 5, 10, 8);
      this.time.delayedCall(250, () => this.scene.start('TempleScene'));
    });

    this.add
      .text(width / 2, height * 0.78, 'Swipe or tap neighbouring tiles to move', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#9ebcaf',
        align: 'center',
      })
      .setOrigin(0.5);
  }
}
