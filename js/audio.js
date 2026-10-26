// Scriptura - background music engine (100% offline Web Audio)

// Background music, all synthesized on the device (no audio files, works offline)
export const SOUNDSCAPES = [
  { id: 'organ', name: 'Cathedral organ', sub: 'Warm, sustained chords' },
  { id: 'rain', name: 'Gentle rain', sub: 'Soft rain on a quiet roof' },
  { id: 'stillness', name: 'Stillness', sub: 'A calm, open chord' },
  { id: 'bells', name: 'Evening bells', sub: 'Slow bells over a soft pad' }
];

// Volume slider (0–1) to output gain; kept low so music never competes with reading
const levelFor = (volume) => Math.max(0.0001, Math.min(1, volume) * 0.6);

class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.ambient = null;
    this.ambientKind = 'organ';
    this.ambientVolume = 0.35;
    this.isAmbientPlaying = false;
  }

  // --- Web Audio setup ---
  initWebAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return true;
  }

  toggleAmbient(enable, volume = this.ambientVolume, kind = this.ambientKind) {
    if (!this.initWebAudio()) return;
    if (enable) this.startAmbient(volume, kind);
    else this.stopAmbient();
  }

  // Starting a different soundscape crossfades from the one already playing
  startAmbient(volume = this.ambientVolume, kind = this.ambientKind) {
    if (!this.initWebAudio()) return;
    if (!SOUNDSCAPES.some(s => s.id === kind)) kind = 'organ';
    if (this.isAmbientPlaying && this.ambientKind === kind) return;
    if (this.isAmbientPlaying) this.stopAmbient(0.8);

    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(levelFor(volume), now + 2.5);
    master.connect(ctx.destination);

    const voice = { master, sources: [], timers: [] };
    this[`build${kind.charAt(0).toUpperCase()}${kind.slice(1)}`](ctx, master, voice);
    this.ambient = voice;
    this.ambientKind = kind;
    this.ambientVolume = volume;
    this.isAmbientPlaying = true;
  }

  setAmbientVolume(volume) {
    this.ambientVolume = volume;
    if (this.ambient && this.audioCtx) {
      this.ambient.master.gain.cancelScheduledValues(this.audioCtx.currentTime);
      this.ambient.master.gain.linearRampToValueAtTime(levelFor(volume), this.audioCtx.currentTime + 0.15);
    }
  }

  stopAmbient(fade = 1.5) {
    if (!this.isAmbientPlaying || !this.ambient) return;
    const voice = this.ambient;
    const now = this.audioCtx.currentTime;
    voice.master.gain.cancelScheduledValues(now);
    voice.master.gain.setValueAtTime(Math.max(0.0001, voice.master.gain.value), now);
    voice.master.gain.exponentialRampToValueAtTime(0.0001, now + fade);
    voice.timers.forEach(clearTimeout);
    voice.stopped = true;
    this.ambient = null;
    this.isAmbientPlaying = false;
    setTimeout(() => {
      voice.sources.forEach(src => {
        try { src.stop(); } catch { /* already stopped */ }
      });
      try { voice.master.disconnect(); } catch { /* already gone */ }
    }, fade * 1000 + 150);
  }

  // --- Soundscape recipes ---
  // A sine/triangle voice with a slow drift in pitch, so long tones breathe instead of droning
  addTone(ctx, voice, out, freq, { type = 'sine', gain = 0.2, drift = 0.5, driftRate = 0.08 } = {}) {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoAmp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.value = gain;
    lfo.frequency.value = driftRate;
    lfoAmp.gain.value = drift;
    lfo.connect(lfoAmp);
    lfoAmp.connect(osc.frequency);
    osc.connect(amp);
    amp.connect(out);
    osc.start();
    lfo.start();
    voice.sources.push(osc, lfo);
    return amp;
  }

  // Cathedral organ: harmonic series on a 54 Hz root, darkened by a low-pass filter
  buildOrgan(ctx, master, voice) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.connect(master);
    [108, 162, 216, 324].forEach((freq, i) => {
      this.addTone(ctx, voice, filter, freq, { type: i % 2 ? 'triangle' : 'sine', gain: 0.32 / (i + 1), drift: 0.6, driftRate: 0.08 + i * 0.03 });
    });
  }

  // Gentle rain: looping noise, shaped into a hiss and a soft low rumble that swells slowly
  buildRain(ctx, master, voice) {
    const seconds = 3;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      brown = (brown + 0.02 * white) / 1.02;
      data[i] = white * 0.6 + brown * 3;
    }
    const layer = (lowFreq, highFreq, gain) => {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      src.loopStart = Math.random();
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = lowFreq;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = highFreq;
      const amp = ctx.createGain();
      amp.gain.value = gain;
      src.connect(hp);
      hp.connect(lp);
      lp.connect(amp);
      amp.connect(master);
      src.start(0, Math.random() * seconds);
      voice.sources.push(src);
      return amp;
    };
    const hiss = layer(500, 3200, 0.22);
    layer(60, 380, 0.4);
    // Slow swells, like rain moving across a roof
    const swell = ctx.createOscillator();
    const swellAmp = ctx.createGain();
    swell.frequency.value = 0.07;
    swellAmp.gain.value = 0.06;
    swell.connect(swellAmp);
    swellAmp.connect(hiss.gain);
    swell.start();
    voice.sources.push(swell);
  }

  // Stillness: a soft D-major pad with gently detuned pairs for width
  buildStillness(ctx, master, voice) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.connect(master);
    [146.83, 220, 293.66, 369.99].forEach((freq, i) => {
      this.addTone(ctx, voice, filter, freq, { gain: 0.11 - i * 0.015, drift: 0.4, driftRate: 0.05 + i * 0.02 });
      this.addTone(ctx, voice, filter, freq * 1.004, { gain: 0.07 - i * 0.01, drift: 0.3, driftRate: 0.04 + i * 0.015 });
    });
  }

  // Evening bells: a quiet pad with pentatonic bell notes at unhurried, random moments
  buildBells(ctx, master, voice) {
    const pad = ctx.createBiquadFilter();
    pad.type = 'lowpass';
    pad.frequency.value = 600;
    const padAmp = ctx.createGain();
    padAmp.gain.value = 0.55;
    pad.connect(padAmp);
    padAmp.connect(master);
    [146.83, 220, 293.66].forEach((freq, i) => this.addTone(ctx, voice, pad, freq, { gain: 0.09, drift: 0.3, driftRate: 0.05 + i * 0.02 }));

    // A short feedback delay stands in for the room's reverb
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.34;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.38;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2400;
    delay.connect(tone);
    tone.connect(feedback);
    feedback.connect(delay);
    tone.connect(master);

    const notes = [587.33, 659.25, 739.99, 880, 987.77, 1174.66];
    const strike = () => {
      if (voice.stopped) return;
      const t = ctx.currentTime + 0.02;
      const freq = notes[Math.floor(Math.random() * notes.length)];
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 4);
      env.connect(master);
      env.connect(delay);
      // A bell is a fundamental plus an inharmonic overtone that dies sooner
      [[1, 1], [2.76, 0.35]].forEach(([ratio, level]) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.frequency.value = freq * ratio;
        g.gain.value = level;
        osc.connect(g);
        g.connect(env);
        osc.start(t);
        osc.stop(t + 4.2);
      });
      voice.timers.push(setTimeout(strike, 1800 + Math.random() * 3200));
    };
    voice.timers.push(setTimeout(strike, 900));
  }

}

export const audio = new AudioEngine();
