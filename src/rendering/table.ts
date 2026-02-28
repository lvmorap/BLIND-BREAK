import {
  C,
  TABLE_L,
  TABLE_T,
  FELT_L,
  FELT_T,
  FELT_W,
  FELT_H,
  FELT_CX,
  FELT_CY,
  POCKETS,
  LAMP_ZONES,
} from '../core/constants.ts';
import { state } from '../core/state.ts';
import { ctx, woodCanvas, feltCanvas } from './canvas.ts';

export function drawBrickWall(): void {
  ctx.strokeStyle = 'rgba(51,68,85,0.04)';
  ctx.lineWidth = 0.5;
  const bw = 40;
  const bh = 18;
  for (let row = 0; row < Math.ceil(C.H / bh); row++) {
    const offset = (row % 2) * (bw / 2);
    for (let col = -1; col < Math.ceil(C.W / bw) + 1; col++) {
      ctx.strokeRect(col * bw + offset, row * bh, bw, bh);
    }
  }
}

export function drawWallSconces(): void {
  const sx1 = TABLE_L - 30;
  const sy1 = C.H / 2 - 80;
  const sx2 = C.W - TABLE_L + 30;
  for (const s of [{ x: sx1 }, { x: sx2 }]) {
    const g = ctx.createRadialGradient(s.x, sy1, 2, s.x, sy1, 80);
    g.addColorStop(0, 'rgba(255,170,68,0.25)');
    g.addColorStop(1, 'rgba(255,170,68,0)');
    ctx.fillStyle = g;
    ctx.fillRect(s.x - 80, sy1 - 80, 160, 160);
  }
}

export function drawTable(): void {
  ctx.fillStyle = '#1a0a04';
  ctx.fillRect(TABLE_L + 6, TABLE_T + 6, C.TABLE_W, C.TABLE_H);
  ctx.fillStyle = '#2d1208';
  ctx.fillRect(TABLE_L + 3, TABLE_T + 3, C.TABLE_W, C.TABLE_H);
  ctx.drawImage(woodCanvas, TABLE_L, TABLE_T);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(TABLE_L, TABLE_T + C.TABLE_H - 4, C.TABLE_W, 4);

  ctx.strokeStyle = '#c8a040';
  ctx.lineWidth = 2;
  ctx.strokeRect(FELT_L - 1, FELT_T - 1, FELT_W + 2, FELT_H + 2);

  ctx.drawImage(feltCanvas, FELT_L, FELT_T, FELT_W, FELT_H);

  const fpg = ctx.createRadialGradient(FELT_CX, FELT_CY, 20, FELT_CX, FELT_CY, FELT_W * 0.6);
  fpg.addColorStop(0, 'rgba(255,255,255,0.04)');
  fpg.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = fpg;
  ctx.fillRect(FELT_L, FELT_T, FELT_W, FELT_H);

  for (const pk of POCKETS) {
    ctx.strokeStyle = '#2a1208';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, pk.r + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#1a0a04';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, pk.r + 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#000005';
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, pk.r, 0, Math.PI * 2);
    ctx.fill();
    const pg = ctx.createRadialGradient(pk.x, pk.y, pk.r * 0.5, pk.x, pk.y, pk.r);
    pg.addColorStop(0, 'rgba(0,0,5,0)');
    pg.addColorStop(0.8, 'rgba(40,60,40,0.2)');
    pg.addColorStop(1, 'rgba(0,0,5,0)');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, pk.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawLamps(): void {
  const lampBreath = 1.0 + 0.08 * Math.sin((state.breathTimer * 2 * Math.PI) / 4.2);
  for (const lamp of LAMP_ZONES) {
    ctx.fillStyle = '#222';
    ctx.fillRect(lamp.x - 15, TABLE_T - 20, 30, 8);
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(lamp.x - 12, TABLE_T - 12);
    ctx.lineTo(lamp.x + 12, TABLE_T - 12);
    ctx.lineTo(lamp.x + 20, TABLE_T + 5);
    ctx.lineTo(lamp.x - 20, TABLE_T + 5);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = 0.06 * lampBreath;
    ctx.fillStyle = '#ffeecc';
    ctx.beginPath();
    ctx.ellipse(lamp.x, lamp.y, lamp.rx, lamp.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.04 * lampBreath;
    ctx.beginPath();
    ctx.ellipse(lamp.x, lamp.y, lamp.rx * 1.3, lamp.ry * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const bg = ctx.createRadialGradient(lamp.x, TABLE_T + 5, 2, lamp.x, TABLE_T + 5, 20);
    bg.addColorStop(0, `rgba(255,238,180,${0.5 * lampBreath})`);
    bg.addColorStop(1, 'rgba(255,238,180,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(lamp.x - 20, TABLE_T - 15, 40, 40);
  }
}

export function updateNeonFlicker(t: number): void {
  const base = 0.85 + 0.15 * Math.sin((t * 2 * Math.PI) / 3700);
  let flick = base;
  if (state.neonDropTimer > 0) {
    flick = 0.3;
    state.neonDropTimer -= 16;
  } else if (Math.random() < 0.003) {
    state.neonDropTimer = 80;
  }
  state.neonFlicker = flick;
}

export function drawNeonSign(t: number): void {
  updateNeonFlicker(t);

  const text = 'BLIND BREAK';
  const nx = C.W / 2;
  const ny = TABLE_T - 30;

  ctx.save();
  ctx.globalAlpha = state.neonFlicker;
  ctx.font = 'bold 36px Orbitron';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = C.NEON_COLOR;
  ctx.shadowBlur = 50;
  ctx.strokeStyle = C.NEON_COLOR;
  ctx.lineWidth = 5;
  ctx.strokeText(text, nx, ny);
  ctx.shadowBlur = 30;
  ctx.strokeText(text, nx, ny);

  ctx.shadowBlur = 8;
  ctx.shadowColor = '#ffaacc';
  ctx.strokeStyle = '#ffccdd';
  ctx.lineWidth = 1.5;
  ctx.strokeText(text, nx, ny);

  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(255,230,240,${0.5 * state.neonFlicker})`;
  ctx.fillText(text, nx, ny);

  ctx.restore();
}

export function drawTableOutline(): void {
  ctx.save();

  ctx.strokeStyle = 'rgba(100,180,160,0.25)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([12, 6]);
  ctx.strokeRect(FELT_L, FELT_T, FELT_W, FELT_H);
  ctx.setLineDash([]);

  for (const pk of POCKETS) {
    ctx.strokeStyle = 'rgba(100,180,160,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, pk.r + 2, 0, Math.PI * 2);
    ctx.stroke();

    const pg = ctx.createRadialGradient(pk.x, pk.y, 0, pk.x, pk.y, pk.r + 6);
    pg.addColorStop(0, 'rgba(100,180,160,0.08)');
    pg.addColorStop(1, 'rgba(100,180,160,0)');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, pk.r + 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(100,180,160,0.12)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(FELT_CX, FELT_T);
  ctx.lineTo(FELT_CX, FELT_T + FELT_H);
  ctx.stroke();

  ctx.restore();
}
