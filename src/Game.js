export default class Game {
  /**
   * Central runtime state for Project Emerald Quest.
   * This class intentionally stays framework-light so scenes and systems
   * can share state without becoming tightly coupled.
   */
  constructor() {
    this.version = '0.1.0';
    this.reset();
  }

  reset() {
    this.currentWorld = 'jungle-temple';
    this.currentLevel = 1;
    this.lives = 3;
    this.score = 0;
    this.diamonds = 0;
    this.keys = 0;
    this.moves = 0;
    this.flags = {};
  }

  startLevel({ world = this.currentWorld, level = this.currentLevel } = {}) {
    this.currentWorld = world;
    this.currentLevel = level;
    this.diamonds = 0;
    this.keys = 0;
    this.moves = 0;
    this.flags = {};
  }

  addScore(points) {
    const value = Number(points);
    if (!Number.isFinite(value) || value <= 0) return this.score;

    this.score += Math.floor(value);
    return this.score;
  }

  collectDiamond(value = 1) {
    const amount = Math.max(1, Math.floor(Number(value) || 1));
    this.diamonds += amount;
    this.addScore(100 * amount);
    return this.diamonds;
  }

  collectKey(value = 1) {
    const amount = Math.max(1, Math.floor(Number(value) || 1));
    this.keys += amount;
    return this.keys;
  }

  useKey() {
    if (this.keys < 1) return false;
    this.keys -= 1;
    return true;
  }

  registerMove() {
    this.moves += 1;
    return this.moves;
  }

  loseLife() {
    this.lives = Math.max(0, this.lives - 1);
    return this.lives;
  }

  gainLife() {
    this.lives += 1;
    return this.lives;
  }

  setFlag(name, value = true) {
    if (!name) return;
    this.flags[name] = value;
  }

  getFlag(name, fallback = false) {
    return Object.prototype.hasOwnProperty.call(this.flags, name)
      ? this.flags[name]
      : fallback;
  }

  getSnapshot() {
    return {
      version: this.version,
      currentWorld: this.currentWorld,
      currentLevel: this.currentLevel,
      lives: this.lives,
      score: this.score,
      diamonds: this.diamonds,
      keys: this.keys,
      moves: this.moves,
      flags: { ...this.flags },
    };
  }
}
