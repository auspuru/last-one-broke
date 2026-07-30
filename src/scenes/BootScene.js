export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.setPath('assets');

    // Placeholder assets - these will be added in upcoming commits.
    this.load.image('logo', 'images/logo.png');
  }

  create() {
    console.log('Project Emerald Quest - BootScene');

    // Temporary loading screen.
    this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      'Loading Emerald Quest...',
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);

    // Next commit will replace this with a real preload pipeline
    // and then start MainMenuScene.
  }
}
