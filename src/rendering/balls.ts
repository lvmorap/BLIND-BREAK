import type { Ball } from '../types/game.ts';
import { C, CB_SHAPES } from '../core/constants.ts';
import { state } from '../core/state.ts';
import { getLightLevel } from '../core/physics.ts';
import { ctx } from './canvas.ts';
import { lightenColor, darkenColor } from '../utils/color.ts';

export function drawBall(b: Ball): void {
  if (!b.alive && !b.sinking) return;

  const scale = b.sinking ? b.sinkScale : 1;
  if (scale <= 0) return;

  if (b.id > 0 && b.visAlpha !== undefined && b.visAlpha < 0.02) return;

  ctx.save();
  if (b.id > 0 && b.visAlpha !== undefined && b.visAlpha < 1) {
    ctx.globalAlpha = b.visAlpha;
  }
  ctx.translate(b.x, b.y);
  ctx.scale(b.squash.sx * scale, b.squash.sy * scale);

  if (b.trail.length > 0) {
    const alphas = [0.05, 0.12, 0.25];
    for (let i = 0; i < b.trail.length; i++) {
      const tr = b.trail[i];
      if (!tr) continue;
      ctx.globalAlpha = alphas[Math.min(i, alphas.length - 1)] ?? 0.05;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(tr.x - b.x, tr.y - b.y, C.BALL_R, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
  const shadowScale = 1.0 + Math.min(spd * 0.01, 0.15);
  const sRx = C.BALL_R * 1.1 * shadowScale;
  const sRy = C.BALL_R * 0.3 * shadowScale;
  const sg2 = ctx.createRadialGradient(3, C.BALL_R * 0.85, 0, 3, C.BALL_R * 0.85, sRx);
  sg2.addColorStop(0, 'rgba(0,0,0,0.35)');
  sg2.addColorStop(0.6, 'rgba(0,0,0,0.15)');
  sg2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg2;
  ctx.beginPath();
  ctx.ellipse(3, C.BALL_R * 0.85, sRx, sRy, 0, 0, Math.PI * 2);
  ctx.fill();

  if (b.id > 0) {
    const ll = getLightLevel(b.x, b.y);
    if (ll > 0.3) {
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 14;
    }
  }
  const bg = ctx.createRadialGradient(-3, -3, 1, 0, 0, C.BALL_R);
  bg.addColorStop(0, lightenColor(b.color, 40));
  bg.addColorStop(0.7, b.color);
  bg.addColorStop(1, darkenColor(b.color, 30));
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(0, 0, C.BALL_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  const sg = ctx.createRadialGradient(-3, -4, 1, -3, -4, 6);
  sg.addColorStop(0, 'rgba(255,255,255,0.7)');
  sg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.ellipse(-3, -4, 5, 4, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(0, 0, C.BALL_R - 0.5, 0, Math.PI * 2);
  ctx.stroke();

  const blg = ctx.createRadialGradient(2, 4, 0, 2, 4, 5);
  blg.addColorStop(0, 'rgba(255,255,255,0.12)');
  blg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = blg;
  ctx.beginPath();
  ctx.arc(2, 4, 5, 0, Math.PI * 2);
  ctx.fill();

  if (b.num) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.num, 0, 1);
  }

  if (state.colorBlind && b.id > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(CB_SHAPES[b.id] ?? '', 0, -4);
  }

  if (b.id === 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#ffffffaa';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, C.BALL_R + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

export function drawBalls(): void {
  const sorted = state.balls.filter((b) => b.alive || b.sinking).sort((a, b) => a.y - b.y);
  for (const b of sorted) {
    drawBall(b);
  }
}
