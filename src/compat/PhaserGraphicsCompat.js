const Graphics = globalThis.Phaser?.GameObjects?.Graphics;

if (Graphics && typeof Graphics.prototype.quadraticBezierTo !== 'function') {
  /**
   * Compatibility fallback for artwork code authored with Path-style curves.
   * Phaser 3.90 Graphics does not expose quadraticBezierTo on every build.
   * Two connected segments retain the intended ripple silhouette and, most
   * importantly, preserve the fluent Graphics API used by the texture builder.
   */
  Graphics.prototype.quadraticBezierTo = function quadraticBezierToCompat(
    controlX,
    controlY,
    endX,
    endY
  ) {
    this.lineTo(controlX, controlY);
    this.lineTo(endX, endY);
    return this;
  };
}

globalThis.emeraldPhaserGraphicsCompat = Object.freeze({
  quadraticBezierTo: Boolean(Graphics?.prototype?.quadraticBezierTo)
});
