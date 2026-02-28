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

let starfield: Array<{ x: number; y: number; size: number; brightness: number }> | null = null;

function ensureStarfield(): void {
  if (starfield) return;
  starfield = [];
  for (let i = 0; i < 300; i++) {
    starfield.push({
      x: Math.random() * C.W,
      y: Math.random() * C.H,
      size: Math.random() * 1.5 + 0.3,
      brightness: 0.3 + Math.random() * 0.7,
    });
  }
}

export function drawBrickWall(): void {
  ensureStarfield();
  if (!starfield) return;
  ctx.fillStyle = '#020206';
  ctx.fillRect(0, 0, C.W, C.H);

  const t = performance.now() * 0.001;
  for (const star of starfield) {
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
    const bhPulse = 0.6 + 0.4 * Math.sin(bhT + pk.x * 0.01);
    const slowSpin = bhT * 0.3;
    const seed = pk.x * 7 + pk.y * 13;
    const horizonR = pk.r + 2;
    const diskR = pk.r + 18;

    // Hawking radiation halo
    const hawkR = pk.r + 28;
    const hg = ctx.createRadialGradient(pk.x, pk.y, pk.r, pk.x, pk.y, hawkR);
    hg.addColorStop(0, `rgba(180,140,255,${0.06 * bhPulse})`);
    hg.addColorStop(0.4, `rgba(100,60,200,${0.03 * bhPulse})`);
    hg.addColorStop(1, 'rgba(60,20,120,0)');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, hawkR, 0, Math.PI * 2);
    ctx.fill();

    // Gravitational lensing distortion rings
    for (let ring = 0; ring < 4; ring++) {
      const ringR = pk.r + 6 + ring * 5;
      const ringAlpha = (0.12 - ring * 0.025) * bhPulse;
      const wobble = Math.sin(bhT * 0.7 + ring * 1.5) * 1.5;
      ctx.strokeStyle = `rgba(${130 - ring * 15},${70 + ring * 10},${210 - ring * 10},${ringAlpha})`;
      ctx.lineWidth = 1.2 - ring * 0.15;
      ctx.beginPath();
      ctx.ellipse(pk.x + wobble, pk.y + wobble * 0.5, ringR, ringR * (0.85 + ring * 0.03), slowSpin * 0.2 + ring * 0.4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Accretion disk layer 1 — hot orange outer
    ctx.save();
    ctx.translate(pk.x, pk.y);
    ctx.rotate(slowSpin);
    const dg1 = ctx.createRadialGradient(0, 0, pk.r * 0.5, 0, 0, diskR);
    dg1.addColorStop(0, 'rgba(0,0,0,0)');
    dg1.addColorStop(0.3, `rgba(255,140,40,${0.1 * bhPulse})`);
    dg1.addColorStop(0.6, `rgba(255,100,20,${0.07 * bhPulse})`);
    dg1.addColorStop(1, 'rgba(255,80,0,0)');
    ctx.fillStyle = dg1;
    ctx.beginPath();
    ctx.ellipse(0, 0, diskR, diskR * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Accretion disk layer 2 — blue-white inner
    ctx.save();
    ctx.translate(pk.x, pk.y);
    ctx.rotate(-slowSpin * 1.3);
    const dg2 = ctx.createRadialGradient(0, 0, pk.r * 0.2, 0, 0, diskR * 0.75);
    dg2.addColorStop(0, 'rgba(0,0,0,0)');
    dg2.addColorStop(0.35, `rgba(180,200,255,${0.12 * bhPulse})`);
    dg2.addColorStop(0.65, `rgba(140,170,255,${0.08 * bhPulse})`);
    dg2.addColorStop(1, 'rgba(100,140,255,0)');
    ctx.fillStyle = dg2;
    ctx.beginPath();
    ctx.ellipse(0, 0, diskR * 0.75, diskR * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Accretion disk layer 3 — purple mid-layer
    ctx.save();
    ctx.translate(pk.x, pk.y);
    ctx.rotate(slowSpin * 0.8 + 1.0);
    const dg3 = ctx.createRadialGradient(0, 0, pk.r * 0.4, 0, 0, diskR * 0.9);
    dg3.addColorStop(0, 'rgba(0,0,0,0)');
    dg3.addColorStop(0.3, `rgba(160,60,220,${0.09 * bhPulse})`);
    dg3.addColorStop(0.7, `rgba(200,100,255,${0.06 * bhPulse})`);
    dg3.addColorStop(1, 'rgba(180,80,240,0)');
    ctx.fillStyle = dg3;
    ctx.beginPath();
    ctx.ellipse(0, 0, diskR * 0.9, diskR * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Spinning particle streams
    const particleColors = ['255,180,80', '180,200,255', '200,120,255'];
    for (let i = 0; i < 10; i++) {
      // Golden angle (~2.39996 rad) spreads particles evenly around the orbit
      const angle = bhT * (1.2 + i * 0.15) + (seed + i) * 2.39996;
      const orbitR = pk.r + 4 + (i % 3) * 5 + Math.sin(bhT + i) * 2;
      const px = pk.x + Math.cos(angle) * orbitR;
      const py = pk.y + Math.sin(angle) * orbitR * 0.55;
      const pAlpha = (0.5 + 0.5 * Math.sin(bhT * 2 + i)) * bhPulse;
      const pSize = 0.6 + (i % 3) * 0.4;
      ctx.fillStyle = `rgba(${particleColors[i % 3]},${pAlpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Event horizon (solid black center, slightly larger)
    ctx.fillStyle = '#000004';
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, horizonR, 0, Math.PI * 2);
    ctx.fill();

    // Inner glow ring — primary
    ctx.strokeStyle = `rgba(180,100,255,${0.5 * bhPulse})`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#bb55ff';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, horizonR + 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner glow ring — secondary warm
    ctx.strokeStyle = `rgba(255,160,60,${0.2 * bhPulse})`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#ff8830';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, horizonR + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Pulsing outer glow
    const pulseGlowR = pk.r + 14 + Math.sin(bhT * 1.5 + seed) * 3;
    const pg = ctx.createRadialGradient(pk.x, pk.y, horizonR, pk.x, pk.y, pulseGlowR);
    pg.addColorStop(0, `rgba(160,80,255,${0.15 * bhPulse})`);
    pg.addColorStop(0.5, `rgba(120,60,200,${0.06 * bhPulse})`);
    pg.addColorStop(1, 'rgba(100,40,180,0)');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, pulseGlowR, 0, Math.PI * 2);
    ctx.fill();
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
