import type { Ball, ParticleOptions } from '../types/game.ts';
import { C, FELT_L, FELT_T, FELT_W, FELT_H } from '../core/constants.ts';
import { state } from '../core/state.ts';

export function spawnParticle(p: ParticleOptions): void {
  if (state.particles.length >= C.MAX_PARTICLES) return;
  state.particles.push({
    x: p.x,
    y: p.y,
    vx: p.vx ?? 0,
    vy: p.vy ?? 0,
    life: p.life ?? 1,
    decay: p.decay ?? 0.02,
    color: p.color ?? '#fff',
    size: p.size ?? 3,
    shape: p.shape ?? 'circle',
    gravity: p.gravity ?? 0,
    startLife: p.life ?? 1,
  });
}

export function spawnPocketBurst(x: number, y: number, color: string, count: number): void {
  const n = count || 12;
  for (let i = 0; i < n; i++) {
    const a = ((Math.PI * 2) / n) * i + Math.random() * 0.3;
    const spd = 1 + Math.random() * 3;
    spawnParticle({
      x,
      y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd,
      life: 1,
      decay: 0.018 + Math.random() * 0.01,
      color,
      size: 2 + Math.random() * 3,
      shape: Math.random() > 0.5 ? 'diamond' : 'circle',
      gravity: 0.02,
    });
  }
}

export function spawnBlindBurst(x: number, y: number): void {
  for (let i = 0; i < 20; i++) {
    const a = Math.random() * Math.PI * 2;
    const spd = 1.5 + Math.random() * 4;
    spawnParticle({
      x,
      y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd,
      life: 1,
      decay: 0.012 + Math.random() * 0.008,
      color: '#ffd700',
      size: 3 + Math.random() * 4,
      shape: 'diamond',
      gravity: 0.01,
    });
  }
}

export function spawnBallTrail(ball: Ball): void {
  const spd = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  if (spd < 1.5) return;
  spawnParticle({
    x: ball.x + (Math.random() - 0.5) * 4,
    y: ball.y + (Math.random() - 0.5) * 4,
    life: 0.6,
    decay: 0.03,
    color: ball.color,
    size: 1.5,
    shape: 'circle',
  });
}

export function spawnDust(): void {
  spawnParticle({
    x: FELT_L + Math.random() * FELT_W,
    y: FELT_T + Math.random() * FELT_H,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -0.15 - Math.random() * 0.2,
    life: 1,
    decay: 0.004,
    color: 'rgba(102,102,85,0.15)',
    size: 1,
    shape: 'circle',
    gravity: -0.002,
  });
}

export function updateParticles(dt: number): void {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    if (!p) continue;
    p.x += p.vx * dt * 60;
    p.y += p.vy * dt * 60;
    p.vy += p.gravity * dt * 60;
    p.life -= p.decay * dt * 60;
    if (p.life <= 0) state.particles.splice(i, 1);
  }
}

export function addScorePopup(
  x: number,
  y: number,
  text: string,
  color: string,
  size: number,
): void {
  state.scorePopups.push({
    x,
    y,
    text,
    color,
    size,
    life: C.POPUP_DURATION,
    maxLife: C.POPUP_DURATION,
  });
}

export function updatePopups(dt: number): void {
  for (let i = state.scorePopups.length - 1; i >= 0; i--) {
    const popup = state.scorePopups[i];
    if (!popup) continue;
    popup.life -= dt * 1000;
    popup.y -= 30 * dt;
    if (popup.life <= 0) state.scorePopups.splice(i, 1);
  }
}
