// ─────────────────────────────────────────────────────────────
// SlitherSupreme — Sound engine (Web Audio API)
// Procedural SFX + a chill background music loop using a
// lightweight step sequencer. No external audio files needed.
// ─────────────────────────────────────────────────────────────

import { getSettings, saveSettings } from "./storage.js";

export class SoundManager {
  constructor() {
    this.sfxEnabled = true;
    this.musicEnabled = true;
    this._ctx = null;
    this._master = null;
    this._sfxGain = null;
    this._musicGain = null;
    this._musicTimer = null;
    this._musicStep = 0;
    this._intensity = 0;

    const settings = getSettings();
    this.sfxEnabled = settings.sound !== false;
    this.musicEnabled = settings.music !== false;

    this.sounds = {
      eatCrystal: { type: "sine", freqs: [1046, 1318], dur: 0.09, vol: 0.16 },
      eatStar: { type: "triangle", freqs: [880, 1174, 1568], dur: 0.12, vol: 0.16 },
      eatDiamond: { type: "sine", freqs: [1174, 1568, 2093], dur: 0.14, vol: 0.16 },
      eatFruit: { type: "sine", freqs: [784, 988, 1318, 1568], dur: 0.16, vol: 0.18 },
      powerup: { type: "sawtooth", freqs: [523, 659, 784, 1046], dur: 0.18, vol: 0.14 },
      achievement: { type: "triangle", freqs: [659, 784, 1046, 1318], dur: 0.2, vol: 0.16 },
      levelup: { type: "sine", freqs: [523, 659, 784, 1046, 1318], dur: 0.22, vol: 0.18 },
      shield: { type: "sine", freqs: [392, 523, 659], dur: 0.16, vol: 0.16 },
      shieldBreak: { type: "sawtooth", freqs: [659, 392, 196], dur: 0.25, vol: 0.16 },
      shieldSave: { type: "triangle", freqs: [392, 523, 659, 784], dur: 0.2, vol: 0.18 },
      gameOver: { type: "sawtooth", freqs: [392, 311, 233, 155], slideDown: true, dur: 0.5, vol: 0.18 },
      victory: { type: "sine", freqs: [523, 659, 784, 1046, 1318, 1568], dur: 0.25, vol: 0.2 },
      pause: { type: "sine", freqs: [440, 330], dur: 0.1, vol: 0.12 },
      start: { type: "sine", freqs: [330, 440, 523], dur: 0.12, vol: 0.14 },
      click: { type: "triangle", freqs: [660, 880], dur: 0.05, vol: 0.08 },
      newRecord: { type: "sine", freqs: [784, 988, 1174, 1568, 1568, 1568], dur: 0.2, vol: 0.2 },
      combo: { type: "triangle", freqs: [523, 659], dur: 0.08, vol: 0.12 },
    };

    // Music chord progression (in note frequencies)
    this._chords = [
      [261.63, 329.63, 392.0],   // C
      [220.0, 261.63, 329.63],   // Am
      [174.61, 220.0, 261.63],   // F
      [196.0, 246.94, 293.66],   // G
    ];
  }

  _getContext() {
    if (!this._ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this._ctx = new Ctx();
      this._master = this._ctx.createGain();
      this._master.gain.value = 0.9;
      this._master.connect(this._ctx.destination);

      this._sfxGain = this._ctx.createGain();
      this._sfxGain.gain.value = 0.8;
      this._sfxGain.connect(this._master);

      this._musicGain = this._ctx.createGain();
      this._musicGain.gain.value = this.musicEnabled ? 0.22 : 0;
      this._musicGain.connect(this._master);

      this._delay = this._ctx.createDelay();
      this._delay.delayTime.value = 0.28;
      const fb = this._ctx.createGain();
      fb.gain.value = 0.3;
      const wet = this._ctx.createGain();
      wet.gain.value = 0.25;
      this._delay.connect(fb);
      fb.connect(this._delay);
      this._delay.connect(wet);
      wet.connect(this._master);
      this._musicDelaySend = this._musicGain;
      this._sfxDelaySend = this._sfxGain;
    }
    if (this._ctx.state === "suspended") this._ctx.resume();
    return this._ctx;
  }

  // ── Public API ─────────────────────────────────────────────
  unlock() {
    this._getContext();
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    const settings = getSettings();
    settings.sound = this.sfxEnabled;
    saveSettings(settings);
    return this.sfxEnabled;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    const settings = getSettings();
    settings.music = this.musicEnabled;
    saveSettings(settings);
    if (this._musicGain) this._musicGain.gain.value = this.musicEnabled ? 0.22 : 0;
    return this.musicEnabled;
  }

  setIntensity(v) {
    this._intensity = Math.max(0, Math.min(1, v));
    if (this._musicGain) {
      this._musicGain.gain.value = this.musicEnabled ? 0.2 + this._intensity * 0.08 : 0;
    }
  }

  /** Play a named sound effect. */
  play(name) {
    if (!this.sfxEnabled || !this.sounds[name]) return;
    try {
      const config = this.sounds[name];
      const ctx = this._getContext();
      if (!ctx) return;
      const t0 = ctx.currentTime;
      config.freqs.forEach((freq, i) => {
        const t = t0 + i * config.dur * 0.22;
        this._tone({
          ctx,
          dest: this._sfxGain,
          type: config.type,
          freq,
          start: t,
          dur: config.dur,
          vol: config.vol,
          slideDown: config.slideDown,
        });
      });
    } catch {
      // ignore audio errors
    }
  }

  // ── Music ─────────────────────────────────────────────────
  startMusic() {
    if (this._musicTimer) return;
    const ctx = this._getContext();
    if (!ctx) return;
    this._musicStep = 0;
    this._musicTimer = setInterval(() => this._stepMusic(ctx), 260);
  }

  stopMusic() {
    if (this._musicTimer) {
      clearInterval(this._musicTimer);
      this._musicTimer = null;
    }
  }

  _stepMusic(ctx) {
    const chord = this._chords[this._musicStep % this._chords.length];
    const root = chord[0];
    const step = this._musicStep % 16;
    const bassEvery = 4;

    // Soft bass on each bar
    if (step % bassEvery === 0) {
      this._tone({ ctx, dest: this._musicGain, type: "sine", freq: root / 2, start: ctx.currentTime, dur: 0.5, vol: 0.16 });
    }

    // Arpeggiated plucks
    const pluckNotes = [0, 1, 2, 1, 0, 2, 1, 2];
    if (step % 2 === 0) {
      const idx = pluckNotes[(step / 2) % pluckNotes.length];
      const freq = chord[idx];
      this._tone({ ctx, dest: this._musicGain, type: "triangle", freq, start: ctx.currentTime, dur: 0.22, vol: 0.1 });
    }

    // Occasional sparkle
    if (step === 6 || step === 14) {
      this._tone({ ctx, dest: this._musicGain, type: "sine", freq: chord[2] * 2, start: ctx.currentTime, dur: 0.3, vol: 0.06 });
    }

    this._musicStep += 1;
  }

  // ── Low-level tone ─────────────────────────────────────────
  _tone({ ctx, dest, type = "sine", freq, start, dur, vol = 0.1, slideDown = false, delaySend = false }) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideDown) {
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, start + dur);
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(gain);
    gain.connect(dest);

    if (delaySend && this._delay) {
      gain.connect(this._delay);
    }

    osc.start(start);
    osc.stop(start + dur + 0.05);
  }
}
