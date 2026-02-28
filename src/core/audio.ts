import type { SoundType } from '../types/game.ts';
import { state } from './state.ts';

export function initAudio(): void {
  if (state.audioInited) return;
  try {
    state.audioCtx = new AudioContext();
    state.audioInited = true;
    startAmbient();
  } catch {
    /* no audio */
  }
}

function startAmbient(): void {
  if (!state.audioCtx) return;
  try {
    const osc = state.audioCtx.createOscillator();
    state.ambientGain = state.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 40;
    state.ambientGain.gain.value = 0.03;
    osc.connect(state.ambientGain);
    state.ambientGain.connect(state.audioCtx.destination);
    osc.start();
    state.ambientNode = osc;
  } catch {
    /* silent */
  }
}

export function playSound(type: SoundType): void {
  if (!state.audioCtx) return;
  try {
    const now = state.audioCtx.currentTime;
    const ctx = state.audioCtx;

    if (type === 'CUE_STRIKE') {
      const bufferSize = ctx.sampleRate * 0.04;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 800;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.3, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      src.connect(hp);
      hp.connect(g);
      g.connect(ctx.destination);
      src.start(now);
      src.stop(now + 0.04);
    } else if (type === 'BALL_COLLISION') {
      if (state.collisionSoundCount >= 3) return;
      state.collisionSoundCount++;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 900 + Math.random() * 300;
      g.gain.setValueAtTime(0.15, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'CUSHION') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 200 + Math.random() * 100;
      g.gain.setValueAtTime(0.12, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'POCKET') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
      g.gain.setValueAtTime(0.2, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'BLIND_BONUS') {
      [440, 554, 659].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.12, now + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + i * 0.03);
        osc.stop(now + 0.5);
      });
    }
  } catch {
    /* silent */
  }
}
