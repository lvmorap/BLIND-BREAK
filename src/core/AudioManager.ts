class AudioManager {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private musicNodes: OscillatorNode[] = [];
  private musicGains: GainNode[] = [];

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      this.ctx = new AudioContext();
      this.noiseBuffer = this.createNoiseBuffer(this.ctx);
      return this.ctx;
    } catch {
      return null;
    }
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const size = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private playNoise(duration: number, volume: number, filterFreq: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    source.stop(ctx.currentTime + duration);
  }

  private playTone(freq: number, duration: number, volume: number, type: OscillatorType): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  playHit(): void {
    this.playNoise(0.1, 0.4, 2000);
    this.playTone(200, 0.08, 0.3, 'square');
  }

  playScore(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523, ctx.currentTime);
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }

  playCountdown(): void {
    this.playTone(440, 0.15, 0.25, 'sine');
  }

  playWhistle(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.15);
    osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.3);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }

  playBounce(): void {
    this.playTone(300, 0.06, 0.2, 'triangle');
  }

  playDash(): void {
    this.playNoise(0.08, 0.3, 4000);
    this.playTone(150, 0.1, 0.15, 'sawtooth');
  }

  playPowerUp(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }

  playMenuSelect(): void {
    this.playTone(600, 0.08, 0.15, 'sine');
    const ctx = this.ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ctx.currentTime + 0.08);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + 0.08);
    osc.stop(ctx.currentTime + 0.18);
  }

  playGameMusic(gameId: string): void {
    this.stopGameMusic();
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const dur = 120;

      const master = ctx.createGain();
      master.gain.value = 0.05;
      master.connect(ctx.destination);
      this.musicGains.push(master);

      // Oscillators/gains are tracked in musicNodes/musicGains for cleanup in stopGameMusic()
      const makeOsc = (type: OscillatorType, freq: number, vol: number): void => {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.value = vol;
        o.connect(g);
        g.connect(master);
        o.start(now);
        o.stop(now + dur);
        this.musicNodes.push(o);
        this.musicGains.push(g);
      };

      const makeLfo = (freq: number, depth: number, target: AudioParam): void => {
        const l = ctx.createOscillator();
        l.type = 'sine';
        l.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.value = depth;
        l.connect(g);
        g.connect(target);
        l.start(now);
        l.stop(now + dur);
        this.musicNodes.push(l);
        this.musicGains.push(g);
      };

      if (gameId === 'blindbreak') {
        makeOsc('sine', 55, 0.7);
        makeOsc('sine', 57, 0.5);
        makeLfo(0.3, 0.03, master.gain);
      } else if (gameId === 'pingpong') {
        makeOsc('square', 110, 0.4);
        makeOsc('sawtooth', 220, 0.2);
        makeLfo(140 / 60, 0.04, master.gain);
      } else if (gameId === 'soccer') {
        makeOsc('triangle', 82, 0.5);
        makeOsc('sine', 165, 0.3);
        makeLfo(1.5, 0.03, master.gain);
      } else if (gameId === 'sumo') {
        makeOsc('sawtooth', 55, 0.6);
        makeOsc('square', 82, 0.3);
        makeLfo(2, 0.04, master.gain);
      } else if (gameId === 'formula') {
        makeOsc('sawtooth', 110, 0.4);
        makeOsc('square', 220, 0.2);
        makeLfo(160 / 60, 0.04, master.gain);
      } else if (gameId === 'volleyball') {
        makeOsc('sine', 220, 0.5);
        makeOsc('sine', 223, 0.5);
        makeLfo(0.15, 0.02, master.gain);
      }
    } catch {
      /* silent */
    }
  }

  stopGameMusic(): void {
    try {
      for (const node of this.musicNodes) {
        try {
          node.stop();
        } catch {
          /* already stopped */
        }
        node.disconnect();
      }
      for (const gain of this.musicGains) {
        gain.disconnect();
      }
    } catch {
      /* silent */
    }
    this.musicNodes = [];
    this.musicGains = [];
  }

  playSFX(type: string): void {
    try {
      if (type === 'score') {
        this.playScore();
      } else if (type === 'countdown') {
        this.playCountdown();
      } else if (type === 'hit') {
        this.playHit();
      } else if (type === 'whoosh') {
        this.playWhoosh();
      }
    } catch {
      /* silent */
    }
  }

  private playWhoosh(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 0.15);
    filter.Q.value = 2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    source.stop(ctx.currentTime + 0.2);
  }
}

export const audioManager = new AudioManager();
