/**
 * Dynamic Jungle-Retro 8-Bit Web Audio Engine
 * 100% Offline, synthetic polyrhythmic drums + 8bit chiptune
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicInterval: number | null = null;
  private isMusicPlaying = false;
  private musicVolume = 0.7;
  private sfxVolume = 0.8;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private tempo = 125; // BPM
  private step = 0;
  private intensity = 1.0; // scales as player climbs higher floors

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(music: number, sfx: number) {
    this.musicVolume = Math.max(0, Math.min(1, music));
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    if (this.musicGain) this.musicGain.gain.value = this.musicVolume;
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume;
  }

  public setIntensity(intensity: number) {
    // Intensity between 1.0 (bottom floor) and 2.2 (top floor near Ape or holding hammer)
    this.intensity = Math.max(0.8, Math.min(2.5, intensity));
  }

  // --- Dynamic Jungle-Retro Soundtrack ---
  public startMusic() {
    if (this.isMusicPlaying) return;
    this.initContext();
    this.isMusicPlaying = true;
    this.step = 0;

    const intervalMs = (60 / this.tempo / 4) * 1000; // 16th notes
    this.musicInterval = window.setInterval(() => {
      this.playMusicStep();
    }, intervalMs);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  private playMusicStep() {
    if (!this.ctx || !this.musicGain || this.musicVolume <= 0.01) return;
    const now = this.ctx.currentTime;
    const s = this.step % 16;
    const bar = Math.floor((this.step / 16) % 4);

    // 1. Jungle Drums: Tribal Kick (steps 0, 6, 10)
    if (s === 0 || s === 6 || s === 10) {
      this.synthTribalKick(now);
    }

    // 2. Jungle Bongo / Percussion (steps 2, 4, 8, 12, 14)
    if (s === 4 || s === 12) {
      this.synthSnare(now);
    }
    if (s === 2 || s === 7 || s === 11 || s === 14) {
      this.synthBongo(now, s % 2 === 0 ? 320 : 440);
    }

    // 3. Shaker / Hi-Hat (Every 16th note, accented)
    this.synthShaker(now, s % 2 === 0 ? 0.08 : 0.03);

    // 4. 8-Bit Chiptune Bassline (Pentatonic minor jungle groove)
    // Notes: C2 (65.4), Eb2 (77.8), F2 (87.3), G2 (98.0), Bb2 (116.5)
    const bassScale = [65.4, 77.8, 87.3, 98.0, 116.5, 130.8];
    const bassPattern = [0, 0, 1, 0, 2, 2, 3, 2, 0, 0, 4, 3, 2, 1, 3, 4];
    if (s % 2 === 0) {
      const noteIdx = bassPattern[s];
      const freq = bassScale[noteIdx] * (this.intensity > 1.8 ? 1.0 : 1.0);
      this.synthChiptuneBass(now, freq, 0.14);
    }

    // 5. 8-Bit Arpeggio / Lead (Wild Ape Heights theme)
    // Plays syncopated lively melody
    if (s % 2 === 1 || this.intensity > 1.5) {
      const melodyNotes = [
        261.6, 311.1, 349.2, 392.0, 466.2, 523.3, 622.3, 698.5
      ];
      // Melodic motif shifts based on bar
      const melodyIndex = (bar * 2 + s * 3) % melodyNotes.length;
      const freq = melodyNotes[melodyIndex];
      this.synthChiptuneLead(now, freq, 0.09, this.intensity);
    }

    this.step++;
  }

  // Synthesis helpers for music
  private synthTribalKick(time: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.14);

    gain.gain.setValueAtTime(0.5 * this.musicVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  private synthSnare(time: number) {
    if (!this.ctx || !this.musicGain) return;
    // Noise buffer
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3 * this.musicVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    noise.start(time);
    noise.stop(time + 0.09);
  }

  private synthBongo(time: number, freq: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 1.2, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, time + 0.08);

    gain.gain.setValueAtTime(0.3 * this.musicVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  private synthShaker(time: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.03);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(6500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * this.musicVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    noise.start(time);
    noise.stop(time + 0.035);
  }

  private synthChiptuneBass(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.28 * this.musicVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + duration + 0.01);
  }

  private synthChiptuneLead(time: number, freq: number, duration: number, intensity: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // 8bit square wave
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    const targetVol = (0.12 + (intensity - 1.0) * 0.06) * this.musicVolume;
    gain.gain.setValueAtTime(targetVol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + duration);
  }

  // --- 8-BIT RETRO SOUND EFFECTS (SFX) ---
  public playJump() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.16);

    gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.17);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playBarrelRoll() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(45 + Math.random() * 20, now);
    osc.frequency.linearRampToValueAtTime(35, now + 0.12);

    gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playHammerSmash() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = this.ctx.currentTime;

    // Crunch noise + low square drop
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noise.connect(gain);
    osc.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    osc.start(now);
    noise.stop(now + 0.26);
    osc.stop(now + 0.26);
  }

  public playCoin() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = this.ctx.currentTime;

    const notes = [987.77, 1318.51]; // B5 -> E6 classic arcade coin
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.25 * this.sfxVolume, now + idx * 0.08 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.26);
    });
  }

  public playLadderClimb() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(220 + (Math.random() > 0.5 ? 40 : -30), now);

    gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playApeRoar() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(102, now);
    osc2.frequency.exponentialRampToValueAtTime(53, now + 0.5);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.linearRampToValueAtTime(250, now + 0.5);

    gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.56);
    osc2.stop(now + 0.56);
  }

  public playHit() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

    gain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  public playVictory() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = this.ctx.currentTime;

    // Classic retro victory flourish
    const fanfareNotes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
    fanfareNotes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);

      gain.gain.setValueAtTime(0.28 * this.sfxVolume, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.38);
    });
  }
}

export const soundEngine = new SoundEngine();
