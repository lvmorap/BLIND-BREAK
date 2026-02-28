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
import { ctx, feltCanvas } from './canvas.ts';

let starField: Array<{ x: number; y: number; size: number; brightness: number }> | null = null;

function ensureStarField(): void {
  if (starField) return;
  starField = [];
  for (let i = 0; i < 300; i++) {
    starField.push({
      x: Math.random() * C.W,
      y: Math.random() * C.H,
      size: Math.random() * 1.5 + 0.3,
      brightness: 0.3 + Math.random() * 0.7,
    });
  }
}

export function drawBrickWall(): void {
  ensureStarField();
  if (!starField) return;
  ctx.fillStyle = '#020206';
  ctx.fillRect(0, 0, C.W, C.H);

  const t = performance.now() * 0.001;
  for (const star of starField) {
    const twinkle = star.brightness * (0.6 + 0.4 * Math.sin(t * 2 + star.x * 0.1 + star.y * 0.1));
    ctx.fillStyle = `rgba(200,210,255,${twinkle})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant nebula glow
  const ng = ctx.createRadialGradient(C.W * 0.7, C.H * 0.3, 20, C.W * 0.7, C.H * 0.3, 200);
  ng.addColorStop(0, 'rgba(80,20,120,0.06)');
  ng.addColorStop(0.5, 'rgba(40,10,80,0.03)');
  ng.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = ng;
  ctx.fillRect(0, 0, C.W, C.H);
}

export function drawWallSconces(): void {
  // No sconces in space - intentionally empty
}

export function drawTable(): void {
  // Table shadow
  ctx.fillStyle = 'rgba(0,0,10,0.6)';
  ctx.fillRect(TABLE_L + 6, TABLE_T + 6, C.TABLE_W, C.TABLE_H);

  // Energy field border
  const t = performance.now() * 0.002;
  const pulse = 0.5 + 0.3 * Math.sin(t);

  ctx.fillStyle = `rgba(20,40,80,${0.4 + pulse * 0.1})`;
  ctx.fillRect(TABLE_L, TABLE_T, C.TABLE_W, C.TABLE_H);

  // Energy field edges
  ctx.strokeStyle = `rgba(60,120,255,${0.3 + pulse * 0.2})`;
  ctx.lineWidth = 3;
  ctx.shadowColor = '#3366ff';
  ctx.shadowBlur = 15;
  ctx.strokeRect(TABLE_L + 2, TABLE_T + 2, C.TABLE_W - 4, C.TABLE_H - 4);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = `rgba(100,180,255,${0.15 + pulse * 0.1})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(TABLE_L + 6, TABLE_T + 6, C.TABLE_W - 12, C.TABLE_H - 12);

  // Inner felt border glow
  ctx.strokeStyle = `rgba(80,140,255,${0.4 + pulse * 0.15})`;
  ctx.lineWidth = 2;
  ctx.shadowColor = '#4488ff';
  ctx.shadowBlur = 10;
  ctx.strokeRect(FELT_L - 1, FELT_T - 1, FELT_W + 2, FELT_H + 2);
  ctx.shadowBlur = 0;

  // Space felt (dark space surface)
  ctx.drawImage(feltCanvas, FELT_L, FELT_T, FELT_W, FELT_H);

  const fpg = ctx.createRadialGradient(FELT_CX, FELT_CY, 20, FELT_CX, FELT_CY, FELT_W * 0.6);
  fpg.addColorStop(0, 'rgba(20,30,60,0.08)');
  fpg.addColorStop(1, 'rgba(0,0,0,0.2)');
  ctx.fillStyle = fpg;
  ctx.fillRect(FELT_L, FELT_T, FELT_W, FELT_H);

  // Wall ripple effects
  for (const ripple of state.wallRipples) {
    const age = ripple.time / ripple.maxTime;
    if (age >= 1) continue;
    const alpha = 0.6 * (1 - age);
    const radius = 5 + age * 40;
    const rg = ctx.createRadialGradient(ripple.x, ripple.y, 0, ripple.x, ripple.y, radius);
    rg.addColorStop(0, `rgba(80,140,255,${alpha})`);
    rg.addColorStop(0.5, `rgba(60,100,255,${alpha * 0.5})`);
    rg.addColorStop(1, 'rgba(60,100,255,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Black hole pockets
  for (const pk of POCKETS) {
    const bhT = performance.now() * 0.003;
    const bhPulse = 0.7 + 0.3 * Math.sin(bhT + pk.x * 0.01);

    // Accretion disk glow
    const diskR = pk.r + 8;
    ctx.save();
    ctx.translate(pk.x, pk.y);
    ctx.rotate(bhT * 0.5);
    const dg = ctx.createRadialGradient(0, 0, pk.r * 0.3, 0, 0, diskR);
    dg.addColorStop(0, 'rgba(0,0,0,0)');
    dg.addColorStop(0.4, `rgba(120,60,200,${0.15 * bhPulse})`);
    dg.addColorStop(0.7, `rgba(200,100,255,${0.1 * bhPulse})`);
    dg.addColorStop(1, 'rgba(200,100,255,0)');
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.ellipse(0, 0, diskR, diskR * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Event horizon
    ctx.fillStyle = '#000008';
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, pk.r, 0, Math.PI * 2);
    ctx.fill();

    // Inner glow ring
    ctx.strokeStyle = `rgba(160,80,255,${0.4 * bhPulse})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = '#aa44ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, pk.r + 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Gravitational lensing rings
    ctx.strokeStyle = `rgba(100,60,180,${0.15 * bhPulse})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, pk.r + 6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawLamps(): void {
  // No physical lamps in space - dim nebula lighting instead
  const lampBreath = 1.0 + 0.08 * Math.sin((state.breathTimer * 2 * Math.PI) / 4.2);
  for (const lamp of LAMP_ZONES) {
    ctx.save();
    ctx.globalAlpha = 0.03 * lampBreath;
    ctx.fillStyle = '#6644aa';
    ctx.beginPath();
    ctx.ellipse(lamp.x, lamp.y, lamp.rx, lamp.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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

  const text = 'COSMIC BREAK';
  const nx = C.W / 2;
  const ny = TABLE_T - 30;

  ctx.save();
  ctx.globalAlpha = state.neonFlicker;
  ctx.font = 'bold 36px Orbitron';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = '#aa44ff';
  ctx.shadowBlur = 50;
  ctx.strokeStyle = '#aa44ff';
  ctx.lineWidth = 5;
  ctx.strokeText(text, nx, ny);
  ctx.shadowBlur = 30;
  ctx.strokeText(text, nx, ny);

  ctx.shadowBlur = 8;
  ctx.shadowColor = '#ddaaff';
  ctx.strokeStyle = '#ddccff';
  ctx.lineWidth = 1.5;
  ctx.strokeText(text, nx, ny);

  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(230,210,255,${0.5 * state.neonFlicker})`;
  ctx.fillText(text, nx, ny);

  ctx.restore();
}

export function drawTableOutline(): void {
  ctx.save();

  ctx.strokeStyle = 'rgba(80,120,255,0.25)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([12, 6]);
  ctx.strokeRect(FELT_L, FELT_T, FELT_W, FELT_H);
  ctx.setLineDash([]);

  for (const pk of POCKETS) {
    ctx.strokeStyle = 'rgba(160,80,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, pk.r + 2, 0, Math.PI * 2);
    ctx.stroke();

    const pg = ctx.createRadialGradient(pk.x, pk.y, 0, pk.x, pk.y, pk.r + 6);
    pg.addColorStop(0, 'rgba(160,80,255,0.08)');
    pg.addColorStop(1, 'rgba(160,80,255,0)');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, pk.r + 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(80,120,255,0.12)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(FELT_CX, FELT_T);
  ctx.lineTo(FELT_CX, FELT_T + FELT_H);
  ctx.stroke();

  ctx.restore();
}
