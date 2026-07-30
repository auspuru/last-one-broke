import TempleScene from '../scenes/TempleScene.js';

const AUDIO_KEY = 'emerald-quest-audio';

function readPreference() {
  try {
    return window.localStorage.getItem(AUDIO_KEY) !== 'off';
  } catch {
    return true;
  }
}

function savePreference(enabled) {
  try {
    window.localStorage.setItem(AUDIO_KEY, enabled ? 'on' : 'off');
  } catch {
    // Audio still works when storage is unavailable.
  }
}

class EmeraldAudioEngine {
  constructor() {
    this.enabled = readPreference();
    this.context = null;
    this.master = null;
    this.sfxBus = null;
    this.ambientBus = null;
    this.compressor = null;
    this.noiseBuffer = null;
    this.ambientNodes = [];
    this.waterTimer = null;
    this.ambientRunning = false;
  }

  async unlock() {
    if (!this.enabled) return null;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!this.context) {
      this.context = new AudioContextClass();
      this.buildGraph();
    }

    if (this.context.state === 'suspended') {
      try {
        await this.context.resume();
      } catch {
        return null;
      }
    }

    this.startAmbience();
    return this.context;
  }

  buildGraph() {
    const context = this.context;
    this.master = context.createGain();
    this.sfxBus = context.createGain();
    this.ambientBus = context.createGain();
    this.compressor = context.createDynamicsCompressor();

    this.master.gain.value = this.enabled ? 0.78 : 0.0001;
    this.sfxBus.gain.value = 0.9;
    this.ambientBus.gain.value = 0.0001;

    this.compressor.threshold.value = -22;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 5;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.22;

    this.sfxBus.connect(this.compressor);
    this.ambientBus.connect(this.compressor);
    this.compressor.connect(this.master);
    this.master.connect(context.destination);

    const sampleRate = context.sampleRate;
    this.noiseBuffer = context.createBuffer(1, sampleRate, sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    savePreference(this.enabled);

    if (!this.context || !this.master) return;

    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(Math.max(0.0001, this.master.gain.value), now);
    this.master.gain.exponentialRampToValueAtTime(this.enabled ? 0.78 : 0.0001, now + 0.16);

    if (this.enabled) {
      this.unlock().then(() => this.startAmbience());
    } else {
      this.stopAmbience();
    }
  }

  startAmbience() {
    if (!this.enabled || !this.context || this.context.state !== 'running' || this.ambientRunning) return;

    const context = this.context;
    const now = context.currentTime;
    this.ambientRunning = true;

    this.ambientBus.gain.cancelScheduledValues(now);
    this.ambientBus.gain.setValueAtTime(0.0001, now);
    this.ambientBus.gain.exponentialRampToValueAtTime(0.17, now + 1.1);

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 360;
    filter.Q.value = 0.7;
    filter.connect(this.ambientBus);

    const droneA = context.createOscillator();
    const droneB = context.createOscillator();
    const droneGainA = context.createGain();
    const droneGainB = context.createGain();
    droneA.type = 'triangle';
    droneB.type = 'sine';
    droneA.frequency.value = 55;
    droneB.frequency.value = 82.5;
    droneGainA.gain.value = 0.06;
    droneGainB.gain.value = 0.035;
    droneA.connect(droneGainA).connect(filter);
    droneB.connect(droneGainB).connect(filter);

    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.09;
    lfoGain.gain.value = 0.018;
    lfo.connect(lfoGain);
    lfoGain.connect(droneGainA.gain);
    lfoGain.connect(droneGainB.gain);

    const air = context.createBufferSource();
    const airFilter = context.createBiquadFilter();
    const airGain = context.createGain();
    air.buffer = this.noiseBuffer;
    air.loop = true;
    airFilter.type = 'lowpass';
    airFilter.frequency.value = 240;
    airGain.gain.value = 0.012;
    air.connect(airFilter).connect(airGain).connect(filter);

    [droneA, droneB, lfo, air].forEach((node) => node.start(now));
    this.ambientNodes = [droneA, droneB, lfo, air, filter, droneGainA, droneGainB, lfoGain, airFilter, airGain];
    this.scheduleWaterDrop();
  }

  stopAmbience() {
    if (!this.context || !this.ambientRunning) return;

    this.ambientRunning = false;
    window.clearTimeout(this.waterTimer);
    this.waterTimer = null;

    const now = this.context.currentTime;
    this.ambientBus.gain.cancelScheduledValues(now);
    this.ambientBus.gain.setValueAtTime(Math.max(0.0001, this.ambientBus.gain.value), now);
    this.ambientBus.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    const nodes = this.ambientNodes;
    this.ambientNodes = [];
    window.setTimeout(() => {
      nodes.forEach((node) => {
        try {
          if (typeof node.stop === 'function') node.stop();
          if (typeof node.disconnect === 'function') node.disconnect();
        } catch {
          // Nodes may already be stopped by the browser.
        }
      });
    }, 340);
  }

  scheduleWaterDrop() {
    window.clearTimeout(this.waterTimer);
    const delay = 3600 + Math.random() * 4800;
    this.waterTimer = window.setTimeout(() => {
      if (this.enabled && this.ambientRunning) {
        this.tone(920, 0, 0.18, 'sine', 0.055, 410);
        this.tone(610, 0.12, 0.24, 'sine', 0.026, 330);
        this.scheduleWaterDrop();
      }
    }, delay);
  }

  tone(frequency, delay = 0, duration = 0.12, wave = 'sine', volume = 0.1, endFrequency = null) {
    if (!this.context || !this.sfxBus) return;

    const context = this.context;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(Math.max(20, frequency), start);
    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain).connect(this.sfxBus);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  noise(delay = 0, duration = 0.12, volume = 0.08, filterFrequency = 800, filterType = 'lowpass') {
    if (!this.context || !this.sfxBus || !this.noiseBuffer) return;

    const context = this.context;
    const start = context.currentTime + delay;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    source.buffer = this.noiseBuffer;
    filter.type = filterType;
    filter.frequency.value = filterFrequency;
    filter.Q.value = 0.8;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    source.connect(filter).connect(gain).connect(this.sfxBus);
    source.start(start);
    source.stop(start + duration + 0.02);
  }

  play(type) {
    if (!this.enabled) return;
    this.unlock().then((context) => {
      if (!context) return;
      this.renderEffect(type);
      this.vibrate(type);
    });
  }

  renderEffect(type) {
    switch (type) {
      case 'enter':
        this.tone(220, 0, 0.18, 'triangle', 0.08, 330);
        this.tone(440, 0.12, 0.28, 'sine', 0.07, 660);
        break;
      case 'button':
        this.tone(340, 0, 0.06, 'triangle', 0.11, 470);
        this.tone(620, 0.045, 0.07, 'sine', 0.055, 760);
        break;
      case 'step':
        this.noise(0, 0.045, 0.06, 1200, 'highpass');
        this.tone(125, 0, 0.055, 'triangle', 0.065, 92);
        break;
      case 'dig':
        this.noise(0, 0.11, 0.14, 760);
        this.tone(112, 0, 0.12, 'triangle', 0.1, 64);
        break;
      case 'blocked':
        this.tone(88, 0, 0.11, 'square', 0.12, 64);
        this.tone(72, 0.075, 0.12, 'square', 0.09, 52);
        break;
      case 'rock':
        this.noise(0, 0.16, 0.14, 310);
        this.tone(118, 0, 0.18, 'triangle', 0.13, 48);
        break;
      case 'fall':
        this.noise(0, 0.22, 0.17, 260);
        this.tone(175, 0, 0.25, 'sawtooth', 0.12, 42);
        break;
      case 'crush':
        this.noise(0, 0.32, 0.24, 220);
        this.tone(74, 0, 0.34, 'sawtooth', 0.2, 34);
        this.tone(48, 0.08, 0.3, 'square', 0.12, 28);
        break;
      case 'spike':
        this.tone(1320, 0, 0.11, 'triangle', 0.12, 410);
        this.tone(860, 0.045, 0.14, 'square', 0.08, 260);
        break;
      case 'guardian':
        this.tone(104, 0, 0.25, 'sawtooth', 0.16, 46);
        this.noise(0.03, 0.2, 0.1, 420);
        break;
      case 'switch':
        [330, 494, 660].forEach((note, index) => this.tone(note, index * 0.055, 0.17, 'triangle', 0.085, note * 1.12));
        break;
      case 'gem':
        [720, 960, 1240].forEach((note, index) => this.tone(note, index * 0.045, 0.16, 'sine', 0.09, note * 1.12));
        break;
      case 'key':
        [520, 660, 880].forEach((note, index) => this.tone(note, index * 0.065, 0.2, 'triangle', 0.095, note * 1.14));
        break;
      case 'relic':
        [392, 523, 659, 1046].forEach((note, index) => this.tone(note, index * 0.075, 0.32, 'sine', 0.085, note * 1.08));
        break;
      case 'win':
        [392, 494, 587, 784].forEach((note, index) => this.tone(note, index * 0.11, 0.42, index % 2 ? 'triangle' : 'sine', 0.11, note * 1.08));
        this.tone(1175, 0.43, 0.5, 'sine', 0.075, 1568);
        break;
      default:
        this.tone(300, 0, 0.08, 'sine', 0.06, 420);
    }
  }

  vibrate(type) {
    if (!navigator.vibrate) return;
    const patterns = {
      blocked: 18,
      rock: 22,
      fall: [18, 25, 28],
      crush: [45, 30, 70],
      spike: [25, 20, 25],
      guardian: [35, 25, 35],
      gem: 12,
      key: [12, 20, 12],
      relic: [15, 25, 15, 25, 20],
      win: [18, 30, 18, 30, 45]
    };
    const pattern = patterns[type];
    if (pattern) navigator.vibrate(pattern);
  }
}

const audio = new EmeraldAudioEngine();
window.emeraldAudio = audio;

const originalTempleCreate = TempleScene.prototype.create;
TempleScene.prototype.create = function createWithAudio(...args) {
  const result = originalTempleCreate.apply(this, args);
  audio.setEnabled(this.audioEnabled);
  if (audio.context?.state === 'running') audio.startAmbience();
  return result;
};

TempleScene.prototype.ensureAudioContext = function ensurePremiumAudioContext() {
  audio.unlock();
  return audio.context;
};

TempleScene.prototype.playTone = function playPremiumTone(type) {
  audio.play(type);
};

TempleScene.prototype.readAudioPreference = function readPremiumAudioPreference() {
  return readPreference();
};

TempleScene.prototype.toggleAudio = function togglePremiumAudio() {
  this.audioEnabled = !this.audioEnabled;
  audio.setEnabled(this.audioEnabled);
  this.audioButton?.setText(this.audioEnabled ? 'SOUND ON' : 'SOUND OFF');
  if (this.audioEnabled) audio.play('switch');
};

let firstGestureHandled = false;
function unlockFromGesture() {
  if (firstGestureHandled) return;
  firstGestureHandled = true;
  audio.unlock().then((context) => {
    if (context && audio.enabled) audio.play('enter');
  });
}

window.addEventListener('pointerdown', unlockFromGesture, { capture: true, once: true });
window.addEventListener('touchend', unlockFromGesture, { capture: true, once: true });
window.addEventListener('keydown', unlockFromGesture, { capture: true, once: true });
