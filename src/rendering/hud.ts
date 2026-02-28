import { C, FELT_L, FELT_T, FELT_R, FELT_B, FELT_CX, FELT_CY } from '../core/constants.ts';
import { state, getCueBall, isHumanTurn } from '../core/state.ts';
import { ctx } from './canvas.ts';

export function drawHUD(): void {
  const isLocal = state.gameMode === 'VS_LOCAL';
  const p1Label = isLocal ? 'ALIEN 1' : 'ALIEN';
  const p2Label = isLocal ? 'ALIEN 2' : 'AI';

  // Player 1 score — bottom left
  ctx.fillStyle = C.PLAYER_COLOR;
  ctx.font = 'bold 48px Orbitron';
  ctx.textAlign = 'left';
  ctx.shadowColor = C.PLAYER_COLOR;
  ctx.shadowBlur = 10;
  ctx.fillText(state.playerScore.toString(), 20, C.H - 16);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#88bbcc';
  ctx.font = '14px Rajdhani';
  ctx.fillText(p1Label, 20, C.H - 58);
  ctx.fillStyle = '#557788';
  ctx.font = '11px Rajdhani';
  ctx.fillText(`Planets captured: ${state.endStats.player.lit}`, 20, C.H - 72);

  // Player 2 / AI score — bottom right
  ctx.fillStyle = C.AI_COLOR;
  ctx.font = 'bold 48px Orbitron';
  ctx.textAlign = 'right';
  ctx.shadowColor = C.AI_COLOR;
  ctx.shadowBlur = 10;
  ctx.fillText(state.aiScore.toString(), C.W - 20, C.H - 16);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#cc8899';
  ctx.font = '14px Rajdhani';
  ctx.textAlign = 'right';
  ctx.fillText(p2Label, C.W - 20, C.H - 58);
  ctx.fillStyle = '#885566';
  ctx.font = '11px Rajdhani';
  ctx.fillText(`Planets captured: ${state.endStats.ai.lit}`, C.W - 20, C.H - 72);

  // Round indicator — top center
  ctx.fillStyle = '#888';
  ctx.font = 'bold 14px Orbitron';
  ctx.textAlign = 'center';
  ctx.fillText(`ORBIT ${state.currentRound}/${C.ROUNDS}`, C.W / 2, 20);

  // Turn indicator — below round
  let turnText: string;
  if (isLocal) {
    turnText = state.currentTurn === 'PLAYER' ? 'ALIEN 1 TURN' : 'ALIEN 2 TURN';
  } else {
    turnText = state.currentTurn === 'PLAYER' ? 'YOUR TURN' : 'AI TURN';
  }
  const turnColor = state.currentTurn === 'PLAYER' ? C.PLAYER_COLOR : C.AI_COLOR;
  ctx.fillStyle = turnColor;
  ctx.font = 'bold 13px Orbitron';
  ctx.fillText(turnText, C.W / 2, 38);

  // Turn timer
  if (state.turnPhase === 'AIM' && state.gameState === 'PLAYING') {
    const remaining = Math.max(0, C.TURN_TIMER - state.turnTimer);
    const secs = Math.ceil(remaining / 1000);
    const pct = remaining / C.TURN_TIMER;
    const timerColor = pct > 0.4 ? '#aaccff' : pct > 0.2 ? '#ffaa44' : '#ff4444';
    const pulse = pct <= 0.2 ? 0.5 + 0.5 * Math.sin(performance.now() * 0.01) : 1;
    ctx.fillStyle = timerColor;
    ctx.globalAlpha = pulse;
    ctx.font = 'bold 16px Orbitron';
    ctx.fillText(`${secs}s`, C.W / 2, 56);
    ctx.globalAlpha = 1;

    // Timer bar
    const barW = 100;
    const barH = 4;
    const barX = C.W / 2 - barW / 2;
    const barY = 62;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = timerColor;
    ctx.fillRect(barX, barY, barW * pct, barH);
  }
}

export function drawAimLine(): void {
  const cue = getCueBall();
  if (!cue.alive || state.turnPhase !== 'AIM') return;
  if (!isHumanTurn() || !state.dragging) return;

  const dx = cue.x - state.mouseX;
  const dy = cue.y - state.mouseY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 5) return;

  const nx = dx / len;
  const ny = dy / len;

  ctx.save();

  // Energy ray beam (replaces dotted line)
  let endX = cue.x + nx * 400;
  let endY = cue.y + ny * 400;

  const steps = 400;
  let hitWall = false;
  let wallX = 0;
  let wallY = 0;
  let reflNx = 0;
  let reflNy = 0;
  let hitWallFound = false;

  for (let s = 1; s <= steps; s++) {
    const px = cue.x + nx * s;
    const py = cue.y + ny * s;
    if (
      px < FELT_L + C.BALL_R ||
      px > FELT_R - C.BALL_R ||
      py < FELT_T + C.BALL_R ||
      py > FELT_B - C.BALL_R
    ) {
      endX = cue.x + nx * (s - 1);
      endY = cue.y + ny * (s - 1);
      hitWall = true;
      wallX = endX;
      wallY = endY;
      if (px < FELT_L + C.BALL_R || px > FELT_R - C.BALL_R) {
        reflNx = -nx;
        reflNy = ny;
      } else {
        reflNx = nx;
        reflNy = -ny;
      }
      hitWallFound = true;
      break;
    }
  }

  // Main energy beam
  const beamGrad = ctx.createLinearGradient(cue.x, cue.y, endX, endY);
  beamGrad.addColorStop(0, 'rgba(100,200,255,0.9)');
  beamGrad.addColorStop(0.5, 'rgba(60,140,255,0.6)');
  beamGrad.addColorStop(1, 'rgba(40,80,255,0.2)');

  ctx.shadowColor = '#4488ff';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = beamGrad;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cue.x, cue.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Inner bright core
  ctx.shadowBlur = 6;
  ctx.strokeStyle = 'rgba(180,220,255,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cue.x, cue.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Energy particles along beam
  const beamLen = Math.sqrt((endX - cue.x) ** 2 + (endY - cue.y) ** 2);
  const t = performance.now() * 0.005;
  for (let i = 0; i < 5; i++) {
    const frac = ((t + i * 0.2) % 1.0) * (beamLen / 400);
    const px = cue.x + nx * frac * 400;
    const py = cue.y + ny * frac * 400;
    ctx.fillStyle = 'rgba(150,200,255,0.6)';
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  if (hitWall && hitWallFound) {
    ctx.strokeStyle = 'rgba(60,120,255,0.25)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(wallX, wallY);
    ctx.lineTo(wallX + reflNx * 120, wallY + reflNy * 120);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

export function drawAlienHand(): void {
  if (!state.dragging || !isHumanTurn() || state.turnPhase !== 'AIM') return;

  const mx = state.mouseX;
  const my = state.mouseY;

  ctx.save();
  ctx.translate(mx, my);

  // Alien hand with bioluminescent glow
  const t = performance.now() * 0.003;
  const glowPulse = 0.6 + 0.4 * Math.sin(t);

  // Hand glow aura
  const aura = ctx.createRadialGradient(0, 4, 0, 0, 4, 28);
  aura.addColorStop(0, `rgba(60,220,100,${0.15 * glowPulse})`);
  aura.addColorStop(1, 'rgba(60,220,100,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 4, 28, 0, Math.PI * 2);
  ctx.fill();

  // Palm (20×16 ellipse, cy offset +8)
  const palmGrad = ctx.createRadialGradient(-2, 6, 2, 0, 8, 12);
  palmGrad.addColorStop(0, 'rgba(100,230,140,0.8)');
  palmGrad.addColorStop(1, 'rgba(50,180,90,0.6)');
  ctx.fillStyle = palmGrad;
  ctx.strokeStyle = `rgba(40,200,80,${0.5 + glowPulse * 0.3})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 8, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3 fingers at x={-6, 0, 6}, angled {-0.3, 0, 0.3} rad
  const fingers = [
    { x: -6, y: 0, angle: -0.3, len: 14 },
    { x: 0, y: -2, angle: 0, len: 16 },
    { x: 6, y: 0, angle: 0.3, len: 14 },
  ];
  for (const f of fingers) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.angle);
    ctx.fillStyle = 'rgba(80,210,120,0.7)';
    ctx.beginPath();
    ctx.ellipse(0, -f.len / 2, 3, f.len / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(60,180,90,${0.4 + glowPulse * 0.2})`;
    ctx.stroke();
    // Bioluminescent fingertip
    ctx.fillStyle = `rgba(120,255,160,${0.5 + glowPulse * 0.3})`;
    ctx.shadowColor = '#44ff88';
    ctx.shadowBlur = 6 * glowPulse;
    ctx.beginPath();
    ctx.arc(0, -f.len, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Thumb
  ctx.save();
  ctx.translate(-10, 6);
  ctx.rotate(-0.6);
  ctx.fillStyle = 'rgba(80,210,120,0.7)';
  ctx.beginPath();
  ctx.ellipse(0, -5, 2.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Wrist veins (bioluminescent)
  ctx.strokeStyle = `rgba(80,255,120,${0.15 * glowPulse})`;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-3, 16);
  ctx.bezierCurveTo(-2, 12, -1, 8, 0, 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, 16);
  ctx.bezierCurveTo(2, 12, 1, 8, 0, 4);
  ctx.stroke();

  ctx.restore();
}

export function drawPowerBar(): void {
  if (!isHumanTurn() || state.turnPhase !== 'AIM') return;
  if (!state.charging && !state.dragging) return;

  const bx = 20;
  const by = C.H / 2 - 100;
  const bw = 30;
  const bh = 200;
  const now = performance.now();

  ctx.fillStyle = 'rgba(0,0,20,0.6)';
  ctx.strokeStyle = '#334';
  ctx.lineWidth = 1;
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeRect(bx, by, bw, bh);

  const fillH = bh * state.power;
  const pulse = 0.85 + 0.15 * Math.sin(now * 0.008);
  const grd = ctx.createLinearGradient(0, by + bh, 0, by);
  grd.addColorStop(0, '#4488ff');
  grd.addColorStop(0.5, '#aa44ff');
  grd.addColorStop(1, '#ff2200');
  ctx.globalAlpha = pulse;
  ctx.fillStyle = grd;
  ctx.fillRect(bx + 2, by + bh - fillH, bw - 4, fillH);
  ctx.globalAlpha = 1;

  if (state.power >= 0.99) {
    ctx.save();
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 15 + 5 * Math.sin(now * 0.01);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.restore();
  }

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px Rajdhani';
  ctx.textAlign = 'center';
  ctx.fillText(String(Math.round(state.power * 100)) + '%', bx + bw / 2, by - 6);

  ctx.fillStyle = '#aaccff';
  ctx.font = '11px Rajdhani';
  ctx.textAlign = 'center';
  ctx.fillText('ENERGY', bx + bw / 2, by + bh + 16);
}

export function drawReconButton(): void {
  if (!isHumanTurn() || state.turnPhase !== 'AIM') return;

  const reconUsed = state.currentTurn === 'PLAYER' ? state.playerReconUsed : state.aiReconUsed;

  const bx = 15;
  const by = 15;
  const bw = 95;
  const bh = 30;
  if (reconUsed) {
    ctx.fillStyle = 'rgba(40,40,40,0.3)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#555';
    ctx.font = 'bold 12px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('USED', bx + bw / 2, by + 20);
    return;
  }
  ctx.fillStyle = state.reconMode ? 'rgba(255,180,40,0.3)' : 'rgba(255,255,255,0.1)';
  ctx.strokeStyle = state.reconMode ? '#ffaa00' : '#666';
  ctx.lineWidth = 1;
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = state.reconMode ? '#ffaa00' : '#aaa';
  ctx.font = 'bold 11px Orbitron';
  ctx.textAlign = 'center';
  ctx.fillText('SUPERNOVA', bx + bw / 2, by + 20);

  if (
    state.mouseX >= bx &&
    state.mouseX <= bx + bw &&
    state.mouseY >= by &&
    state.mouseY <= by + bh
  ) {
    const tx = bx;
    const ty = by + bh + 8;
    ctx.fillStyle = 'rgba(10,10,15,0.9)';
    ctx.fillRect(tx, ty, 220, 58);
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx, ty + 58);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffaa00';
    ctx.font = 'bold 13px Rajdhani';
    ctx.fillText('DETONATE A SUPERNOVA', tx + 10, ty + 18);
    ctx.fillStyle = '#aaa';
    ctx.font = '12px Rajdhani';
    ctx.fillText('Illuminates the entire cosmos', tx + 10, ty + 34);
    ctx.fillStyle = 'rgba(170,170,170,0.6)';
    ctx.font = '11px Rajdhani';
    ctx.fillText('One use only. Sacrifices your turn.', tx + 10, ty + 50);
  }
}

export function drawChargingEffects(t: number): void {
  const cue = getCueBall();
  if (!cue.alive || !state.charging || !isHumanTurn()) return;

  const pulse = 1.0 + 0.12 * state.power * Math.sin(t * 0.01);
  ctx.save();
  ctx.translate(cue.x, cue.y);
  ctx.scale(pulse, pulse);

  // Energy charge ring
  ctx.strokeStyle = `rgba(80,160,255,${0.3 + state.power * 0.5})`;
  ctx.lineWidth = 2;
  ctx.shadowColor = '#4488ff';
  ctx.shadowBlur = 10 + state.power * 15;
  ctx.beginPath();
  ctx.arc(0, 0, C.BALL_R + 5 + state.power * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.restore();
}

export function drawReconBeams(t: number): void {
  if (!state.reconBeamAnim) return;
  const elapsed = t - state.reconBeamAnim.startTime;
  const progress = Math.min(1, elapsed / state.reconBeamAnim.duration);
  const spread = (C.RECON_SPREAD_DEG * Math.PI) / 180;
  const beamLength = 300;

  ctx.save();
  for (let i = -1; i <= 1; i++) {
    const a = state.reconBeamAnim.angle + i * spread;
    const endX = state.reconBeamAnim.cx + Math.cos(a) * beamLength * progress;
    const endY = state.reconBeamAnim.cy + Math.sin(a) * beamLength * progress;

    ctx.strokeStyle = `rgba(255,200,50,${0.5 * (1 - progress * 0.4)})`;
    ctx.lineWidth = 6;
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(state.reconBeamAnim.cx, state.reconBeamAnim.cy);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - progress * 0.5)})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(state.reconBeamAnim.cx, state.reconBeamAnim.cy);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

export function drawSupernovaEffect(): void {
  if (!state.supernovaActive || state.supernovaTimer <= 0) return;

  const maxTime = 3000;
  const progress = 1 - state.supernovaTimer / maxTime;
  const cx = C.W / 2;
  const cy = C.H / 2;

  ctx.save();

  if (progress < 0.3) {
    // Expanding flash — bright white/gold
    const flashAlpha = (1 - progress / 0.3) * 0.9;
    const flashR = progress * C.W * 1.2;
    const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, flashR);
    fg.addColorStop(0, `rgba(255,255,240,${flashAlpha})`);
    fg.addColorStop(0.15, `rgba(255,240,180,${flashAlpha * 0.8})`);
    fg.addColorStop(0.4, `rgba(255,180,80,${flashAlpha * 0.5})`);
    fg.addColorStop(0.7, `rgba(255,100,30,${flashAlpha * 0.2})`);
    fg.addColorStop(1, 'rgba(255,50,0,0)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, 0, C.W, C.H);

    // Shockwave ring
    const ringR = progress * C.W * 0.8;
    const ringW = 4 + progress * 8;
    ctx.strokeStyle = `rgba(255,200,100,${flashAlpha * 0.6})`;
    ctx.lineWidth = ringW;
    ctx.shadowColor = '#ffcc66';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Residual glow during full effect
  if (progress >= 0.3 && progress < 0.8) {
    const glowAlpha = 0.15 * (1 - (progress - 0.3) / 0.5);
    ctx.fillStyle = `rgba(255,200,100,${glowAlpha})`;
    ctx.fillRect(0, 0, C.W, C.H);
  }

  // Cosmic text
  if (progress > 0.1 && progress < 0.6) {
    const textAlpha = Math.min(1, (progress - 0.1) * 5) * Math.min(1, (0.6 - progress) * 5);
    ctx.globalAlpha = textAlpha;
    ctx.fillStyle = '#ffdd88';
    ctx.font = 'bold 52px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 40;
    ctx.fillText('☀ SUPERNOVA ☀', cx, cy);
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 20;
    ctx.fillText('☀ SUPERNOVA ☀', cx, cy);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // Fading star particles
  if (progress > 0.1) {
    const t = performance.now() * 0.005;
    const count = Math.floor(12 * (1 - progress));
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + t;
      const dist = 50 + progress * 300 + Math.sin(t + i) * 30;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist * 0.6;
      const pAlpha = (1 - progress) * 0.6;
      ctx.fillStyle = `rgba(255,220,120,${pAlpha})`;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

export function drawPopups(): void {
  for (const p of state.scorePopups) {
    const a = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.font = `bold ${p.size}px Orbitron`;
    ctx.textAlign = 'center';
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 15;
    ctx.fillText(p.text, p.x, p.y);
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
}

export function drawParticlesView(): void {
  for (const p of state.particles) {
    const a = Math.max(0, p.life / p.startLife);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    if (p.shape === 'diamond') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

export function drawNumberBouncePopups(): void {
  for (const nb of state.numberBouncePopups) {
    ctx.save();
    ctx.globalAlpha = nb.alpha;
    ctx.font = `bold ${Math.round(28 * nb.scale)}px Orbitron`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = nb.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = nb.color;
    ctx.fillText(nb.num, nb.x, nb.y);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

export function drawLaserBeam(): void {
  if (!state.laserBeam || state.laserBeam.timer <= 0) return;

  const lb = state.laserBeam;
  const progress = lb.timer / lb.maxTimer;
  const alpha = progress;

  ctx.save();

  // Outer glow
  ctx.strokeStyle = `rgba(0,180,255,${alpha * 0.3})`;
  ctx.lineWidth = 16;
  ctx.shadowColor = '#00bbff';
  ctx.shadowBlur = 30 * progress;
  ctx.beginPath();
  ctx.moveTo(lb.sx, lb.sy);
  ctx.lineTo(lb.ex, lb.ey);
  ctx.stroke();

  // Mid beam
  ctx.strokeStyle = `rgba(100,200,255,${alpha * 0.6})`;
  ctx.lineWidth = 6;
  ctx.shadowBlur = 15 * progress;
  ctx.beginPath();
  ctx.moveTo(lb.sx, lb.sy);
  ctx.lineTo(lb.ex, lb.ey);
  ctx.stroke();

  // Core beam — white hot
  ctx.strokeStyle = `rgba(220,240,255,${alpha * 0.9})`;
  ctx.lineWidth = 2;
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 8 * progress;
  ctx.beginPath();
  ctx.moveTo(lb.sx, lb.sy);
  ctx.lineTo(lb.ex, lb.ey);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Impact flash at start point
  if (progress > 0.7) {
    const flashR = (20 * (progress - 0.7)) / 0.3;
    const fg = ctx.createRadialGradient(lb.sx, lb.sy, 0, lb.sx, lb.sy, flashR);
    fg.addColorStop(0, `rgba(255,255,255,${alpha * 0.8})`);
    fg.addColorStop(0.5, `rgba(100,200,255,${alpha * 0.4})`);
    fg.addColorStop(1, 'rgba(0,100,255,0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(lb.sx, lb.sy, flashR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawComets(): void {
  const t = performance.now() * 0.001;
  for (const comet of state.comets) {
    ctx.save();
    ctx.globalAlpha = comet.alpha;

    // Tail
    const tailAngle = Math.atan2(-comet.vy, -comet.vx);
    const tailEndX = comet.x + Math.cos(tailAngle) * comet.tailLen;
    const tailEndY = comet.y + Math.sin(tailAngle) * comet.tailLen;
    const tg = ctx.createLinearGradient(comet.x, comet.y, tailEndX, tailEndY);
    tg.addColorStop(0, 'rgba(200,220,255,0.6)');
    tg.addColorStop(0.3, 'rgba(150,180,255,0.3)');
    tg.addColorStop(1, 'rgba(100,140,255,0)');
    ctx.strokeStyle = tg;
    ctx.lineWidth = comet.size * 0.8;
    ctx.beginPath();
    ctx.moveTo(comet.x, comet.y);
    ctx.lineTo(tailEndX, tailEndY);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#ddeeff';
    ctx.shadowColor = '#88bbff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(comet.x, comet.y, comet.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // Ambient satellites orbiting near table edges
  const satCount = 3;
  for (let i = 0; i < satCount; i++) {
    const angle = t * (0.15 + i * 0.08) + (i * Math.PI * 2) / satCount;
    const orbitRx = 400 + i * 30;
    const orbitRy = 260 + i * 20;
    const sx = C.W / 2 + Math.cos(angle) * orbitRx;
    const sy = C.H / 2 + Math.sin(angle) * orbitRy;
    if (sx < -10 || sx > C.W + 10 || sy < -10 || sy > C.H + 10) continue;
    const satAlpha = 0.3 + 0.2 * Math.sin(t * 2 + i);
    ctx.save();
    ctx.globalAlpha = satAlpha;
    ctx.fillStyle = '#aabbdd';
    ctx.beginPath();
    ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Solar panel glint
    const glint = Math.sin(t * 4 + i * 2);
    if (glint > 0.8) {
      ctx.fillStyle = `rgba(255,255,200,${(glint - 0.8) * 5 * satAlpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function drawRoundTransition(): void {
  if (!state.roundTransMsg || state.roundTransMsg.timer <= 0) return;
  const progress = state.roundTransMsg.timer / state.roundTransMsg.maxTimer;
  const fadeIn = Math.min(1, (1 - progress) * 4);
  const fadeOut = Math.min(1, progress * 4);
  const alpha = Math.min(fadeIn, fadeOut);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = state.roundTransMsg.color;
  ctx.font = state.roundTransMsg.text === 'LAST SHOT' ? 'bold 44px Orbitron' : 'bold 32px Orbitron';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = state.roundTransMsg.color;
  ctx.shadowBlur = 20;
  ctx.fillText(state.roundTransMsg.text, FELT_CX, FELT_CY);
  ctx.shadowBlur = 0;
  ctx.restore();
}

export function drawFirstShotCoach(t: number): void {
  if (!state.firstShotCoach || state.currentRound > 1 || !isHumanTurn()) return;
  if (state.turnPhase !== 'AIM') return;
  const cue = getCueBall();
  if (!cue.alive) return;

  if (!state.dragging) {
    const bounce = Math.sin(t * 0.005) * 8;
    const ax = cue.x;
    const ay = cue.y - 30 + bounce;
    ctx.save();
    ctx.strokeStyle = '#4488ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax, ay + 15);
    ctx.moveTo(ax - 6, ay + 8);
    ctx.lineTo(ax, ay + 15);
    ctx.lineTo(ax + 6, ay + 8);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,10,0.8)';
    ctx.strokeStyle = 'rgba(80,140,255,0.6)';
    ctx.lineWidth = 1;
    const tw = 280;
    const th = 24;
    ctx.fillRect(ax - tw / 2, ay - th - 8, tw, th);
    ctx.strokeRect(ax - tw / 2, ay - th - 8, tw, th);
    ctx.fillStyle = '#fff';
    ctx.font = '13px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('DRAG FROM THE SUN — FIRE THE ENERGY RAY', ax, ay - th + 8);
    ctx.restore();
  }
}
