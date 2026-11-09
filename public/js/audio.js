/**
 * PRAMANA — Procedural Cinematic Web Audio Soundscape
 * Uses Web Audio API for high-fidelity ambient cinematic drone,
 * courtroom acoustics, and realistic wooden gavel strike.
 * Zero external audio files required — 100% reliable offline & online.
 */

class CinematicAudioSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isInitialized = false;
    this.masterGain = null;
    this.droneGain = null;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneFilter = null;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Low Ambient Drone Setup
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

      this.droneFilter = this.ctx.createBiquadFilter();
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(110, this.ctx.currentTime);

      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note

      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(54.6, this.ctx.currentTime); // Slight detune for slow beat

      this.droneOsc1.connect(this.droneFilter);
      this.droneOsc2.connect(this.droneFilter);
      this.droneFilter.connect(this.droneGain);
      this.droneGain.connect(this.masterGain);

      this.droneOsc1.start();
      this.droneOsc2.start();

      this.isInitialized = true;
    } catch (e) {
      console.warn('[Audio] Web Audio initialization deferred until user gesture:', e);
    }
  }

  ensureContext() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startAmbientDrone(fadeInDuration = 3.0) {
    this.ensureContext();
    if (!this.droneGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    this.droneGain.gain.cancelScheduledValues(now);
    this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, now);
    this.droneGain.gain.linearRampToValueAtTime(0.35, now + fadeInDuration);
  }

  duckAmbientDrone(targetGain = 0.08, duration = 1.0) {
    if (!this.droneGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.droneGain.gain.cancelScheduledValues(now);
    this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, now);
    this.droneGain.gain.linearRampToValueAtTime(targetGain, now + duration);
  }

  playGavelStrike() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;

    // 1. Initial transient wooden "crack" (high-passed noise burst)
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1400, now);
    noiseFilter.Q.setValueAtTime(3.5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.85, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);

    // 2. Teak Wood Sounding Block Resonance (Low-mid damped sine decay)
    const woodOsc = this.ctx.createOscillator();
    woodOsc.type = 'triangle';
    woodOsc.frequency.setValueAtTime(220, now); // 220Hz wood body resonance
    woodOsc.frequency.exponentialRampToValueAtTime(120, now + 0.18);

    const woodGain = this.ctx.createGain();
    woodGain.gain.setValueAtTime(0.9, now);
    woodGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    woodOsc.connect(woodGain);
    woodGain.connect(this.masterGain);
    woodOsc.start(now);
    woodOsc.stop(now + 0.38);

    // 3. Courtroom Hall Reverb Tail (Second delayed reflection)
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      const echoTime = this.ctx.currentTime;
      const echoOsc = this.ctx.createOscillator();
      echoOsc.type = 'sine';
      echoOsc.frequency.setValueAtTime(180, echoTime);

      const echoGain = this.ctx.createGain();
      echoGain.gain.setValueAtTime(0.25, echoTime);
      echoGain.gain.exponentialRampToValueAtTime(0.001, echoTime + 0.4);

      echoOsc.connect(echoGain);
      echoGain.connect(this.masterGain);
      echoOsc.start(echoTime);
      echoOsc.stop(echoTime + 0.42);
    }, 70);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0.0 : 0.3, now + 0.2);
    }
    return this.isMuted;
  }
}

export const audioSystem = new CinematicAudioSystem();
