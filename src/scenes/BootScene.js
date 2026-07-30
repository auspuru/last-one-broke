export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0b1713');

    this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'EMERALD QUEST', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffe59a',
      })
      .setOrigin(0.5);

    this.time.delayedCall(300, () => {
      this.scene.start('MainMenuScene');
    });
  }
}