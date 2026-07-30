import TempleScene from '../scenes/TempleScene.js';

const originalDrawBoard = TempleScene.prototype.drawBoard;

TempleScene.prototype.drawBoard = function drawBoardWithCorrectContainerOrder(...args) {
  const result = originalDrawBoard.apply(this, args);
  const worldWidth = (this.map?.[0]?.length || 24) * 40;
  const worldHeight = (this.map?.length || 12) * 40;

  if (!this.board) return result;

  const base = this.board.list.find((child) => (
    child.type === 'Rectangle'
    && Math.round(child.width) === worldWidth
    && Math.round(child.height) === worldHeight
    && child.fillColor === 0x07120e
  ));

  const wash = this.board.list.find((child) => (
    child.type === 'Rectangle'
    && Math.round(child.width) === worldWidth
    && Math.round(child.height) === worldHeight
    && child.fillColor === 0x476b58
  ));

  if (base) this.board.sendToBack(base);
  wash?.destroy();

  return result;
};
