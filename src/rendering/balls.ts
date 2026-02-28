import type { Ball } from '../types/game.ts';
import { C, CB_SHAPES, POCKETS } from '../core/constants.ts';
import { state } from '../core/state.ts';
import { getLightLevel } from '../core/physics.ts';
import { ctx } from './canvas.ts';
import { lightenColor, darkenColor } from '../utils/color.ts';

/** Planet ring rendering config */
interface PlanetRing {
  hasRing: boolean;
  color: string;
  alpha: number;
}

const PLANET_RINGS: PlanetRing[] = [
  { hasRing: false, color: '', alpha: 0 }, // Sol
  { hasRing: false, color: '', alpha: 0 }, // Mercury
  { hasRing: false, color: '', alpha: 0 }, // Venus
  { hasRing: false, color: '', alpha: 0 }, // Earth
  { hasRing: false, color: '', alpha: 0 }, // Mars
  { hasRing: false, color: '', alpha: 0 }, // Jupiter
  { hasRing: true, color: '#d4b896', alpha: 0.5 }, // Saturn
  { hasRing: true, color: '#88aacc', alpha: 0.3 }, // Uranus
];

function drawSunBall(_b: Ball): void {
  const t = performance.now() * 0.003;
  const pulse = 1.0 + 0.08 * Math.sin(t);

  // Outer corona haze
  const outerR = C.BALL_R * 3.5 * pulse;
  const og = ctx.createRadialGradient(0, 0, C.BALL_R, 0, 0, outerR);
  og.addColorStop(0, 'rgba(255,180,40,0.15)');
  og.addColorStop(0.4, 'rgba(255,120,20,0.06)');
  og.addColorStop(1, 'rgba(255,60,0,0)');
  ctx.fillStyle = og;
  ctx.beginPath();
  ctx.arc(0, 0, outerR, 0, Math.PI * 2);
  ctx.fill();

  // Solar corona with prominences
  const coronaR = C.BALL_R * 2.5 * pulse;
  const cg = ctx.createRadialGradient(0, 0, C.BALL_R * 0.5, 0, 0, coronaR);
  cg.addColorStop(0, 'rgba(255,220,80,0.35)');
  cg.addColorStop(0.3, 'rgba(255,160,30,0.15)');
  cg.addColorStop(0.7, 'rgba(255,100,10,0.05)');
  cg.addColorStop(1, 'rgba(255,80,0,0)');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(0, 0, coronaR, 0, Math.PI * 2);
  ctx.fill();

  // Solar prominences (spiky rays)
  const rayCount = 8;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2 + t * 0.5;
    const rayLen = C.BALL_R * (1.6 + 0.5 * Math.sin(t * 2 + i * 1.7));
    const rayAlpha = 0.12 + 0.08 * Math.sin(t * 1.5 + i);
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = `rgba(255,200,60,${rayAlpha})`;
    ctx.beginPath();
    ctx.moveTo(C.BALL_R * 0.7, -1.5);
    ctx.lineTo(C.BALL_R * 0.7 + rayLen, 0);
    ctx.lineTo(C.BALL_R * 0.7, 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Sun body
  const sg = ctx.createRadialGradient(-2, -2, 1, 0, 0, C.BALL_R);
  sg.addColorStop(0, '#fff8e0');
  sg.addColorStop(0.3, '#ffdd44');
  sg.addColorStop(0.7, '#ffaa00');
  sg.addColorStop(1, '#ff6600');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(0, 0, C.BALL_R, 0, Math.PI * 2);
  ctx.fill();

  // Surface granulation
  for (let i = 0; i < 5; i++) {
    const gx = Math.cos(t * 0.3 + i * 1.2) * C.BALL_R * 0.5;
    const gy = Math.sin(t * 0.4 + i * 1.5) * C.BALL_R * 0.5;
    ctx.fillStyle = `rgba(255,160,40,${0.15 + 0.05 * Math.sin(t + i)})`;
    ctx.beginPath();
    ctx.arc(gx, gy, 2 + Math.sin(t + i) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sun hot spot
  const hg = ctx.createRadialGradient(-3, -3, 1, -3, -3, 5);
  hg.addColorStop(0, 'rgba(255,255,255,0.85)');
  hg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.ellipse(-3, -3, 4, 3, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Outer glow
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 25 * pulse;
  ctx.strokeStyle = 'rgba(255,200,50,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, C.BALL_R + 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawPlanetBall(b: Ball): void {
  // Planet shadow
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

  // Light glow for visible planets
  const ll = getLightLevel(b.x, b.y);
  if (ll > 0.3) {
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 14;
  }

  // Planet body
  const bg = ctx.createRadialGradient(-3, -3, 1, 0, 0, C.BALL_R);
  bg.addColorStop(0, lightenColor(b.color, 40));
  bg.addColorStop(0.7, b.color);
  bg.addColorStop(1, darkenColor(b.color, 30));
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(0, 0, C.BALL_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Planet surface features
  if (b.id === 3) {
    // Earth - continents hint
    ctx.fillStyle = 'rgba(60,140,60,0.25)';
    ctx.beginPath();
    ctx.ellipse(-2, -1, 4, 3, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(60,140,60,0.2)';
    ctx.beginPath();
    ctx.ellipse(3, 2, 3, 2, -0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (b.id === 5) {
    // Jupiter - bands
    ctx.strokeStyle = 'rgba(180,120,60,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-C.BALL_R + 2, -3);
    ctx.lineTo(C.BALL_R - 2, -3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-C.BALL_R + 2, 2);
    ctx.lineTo(C.BALL_R - 2, 2);
    ctx.stroke();
    // Great red spot
    ctx.fillStyle = 'rgba(200,80,40,0.3)';
    ctx.beginPath();
    ctx.ellipse(3, 0, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (b.id === 4) {
    // Mars - surface features
    ctx.fillStyle = 'rgba(180,60,30,0.2)';
    ctx.beginPath();
    ctx.ellipse(1, -2, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rings for Saturn and Uranus
  const ringData = PLANET_RINGS[b.id];
  if (ringData && ringData.hasRing) {
    ctx.strokeStyle = `rgba(${b.id === 6 ? '212,184,150' : '136,170,204'},${ringData.alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, C.BALL_R + 5, C.BALL_R * 0.25, b.id === 7 ? 1.2 : 0.2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Highlight
  const hg = ctx.createRadialGradient(-3, -4, 1, -3, -4, 6);
  hg.addColorStop(0, 'rgba(255,255,255,0.5)');
  hg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.ellipse(-3, -4, 5, 4, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Planet name
  if (b.num) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 7px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.num.substring(0, 3), 0, 1);
  }

  // Colorblind symbol
  if (state.colorBlind && b.id > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(CB_SHAPES[b.id] ?? '', 0, -4);
  }
}

export function drawBall(b: Ball): void {
  if (!b.alive && !b.sinking) return;

  const scale = b.sinking ? b.sinkScale : 1;
  if (scale <= 0) return;

  if (b.id > 0 && b.visAlpha !== undefined && b.visAlpha < 0.02) return;

  // Gravitational distortion near black holes
  let distortSx = 1;
  let distortSy = 1;
  for (const pk of POCKETS) {
    const dx = b.x - pk.x;
    const dy = b.y - pk.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const influenceR = pk.r + 50;
    if (dist < influenceR && dist > 0) {
      const strength = (1 - dist / influenceR) * 0.2;
      const angle = Math.atan2(dy, dx);
      // Stretch toward the black hole
      distortSx += Math.abs(Math.cos(angle)) * strength;
      distortSy += Math.abs(Math.sin(angle)) * strength;
    }
  }

  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.scale(b.squash.sx * scale * distortSx, b.squash.sy * scale * distortSy);

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

  if (b.id === 0) {
    drawSunBall(b);
  } else {
    drawPlanetBall(b);
  }

  ctx.restore();
}

export function drawBalls(): void {
  const sorted = state.balls.filter((b) => b.alive || b.sinking).sort((a, b) => a.y - b.y);
  for (const b of sorted) {
    drawBall(b);
  }
}
