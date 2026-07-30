export const VISUAL_ASSETS = Object.freeze([
  { key: 'premium-chamber-backdrop', type: 'svg', url: './assets/visual/chamber-1-backdrop.svg', width: 400, height: 640 },
  { key: 'premium-jungle-frame', type: 'svg', url: './assets/visual/jungle-frame.svg', width: 400, height: 480 },
  { key: 'premium-hud-frame', type: 'svg', url: './assets/visual/hud-frame.svg', width: 370, height: 44 },
  { key: 'premium-hero-idle', type: 'svg', url: './assets/visual/hero-idle.svg', width: 64, height: 64 },
  { key: 'premium-guardian-idle', type: 'svg', url: './assets/visual/guardian-idle.svg', width: 64, height: 64 },
  { key: 'premium-diamond', type: 'svg', url: './assets/visual/diamond.svg', width: 64, height: 64 }
]);

export const PRODUCTION_TARGET = Object.freeze({
  currentWidth: 400,
  currentHeight: 640,
  targetWidth: 1280,
  targetHeight: 720,
  artScale: 2,
  textureFormat: 'webp',
  fallbackFormat: 'png'
});
