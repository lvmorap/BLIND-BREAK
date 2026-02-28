import { C, FELT_L, FELT_T, FELT_R, FELT_B, FELT_CX, FELT_CY } from '../core/constants.ts';
import { state, getCueBall } from '../core/state.ts';
import { ctx } from './canvas.ts';

export function drawHUD(): void {
  ctx.fillStyle = C.PLAYER_COLOR;
  ctx.font = 'bold 48px Orbitron';
  ctx.textAlign = 'left';
  ctx.shadowColor = C.PLAYER_COLOR;
  ctx.shadowBlur = 10;
  ctx.fillText(state.playerScore.toString(), 20, C.H - 20);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#88bbcc';
  ctx.font = '14px Rajdhani';
  ctx.fillText('PLAYER', 20, C.H - 55);
  ctx.fillStyle = '#557788';
  ctx.font = '11px Rajdhani';
  ctx.fillText(`Pocketed: ${state.endStats.player.lit}`, 20, C.H - 68);

  ctx.fillStyle = C.AI_COLOR;
  ctx.font = 'bold 48px Orbitron';
  ctx.textAlign = 'right';
  ctx.shadowColor = C.AI_COLOR;
  ctx.shadowBlur = 10;
  ctx.fillText(state.aiScore.toString(), C.W - 20, C.H - 20);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#cc8899';
  ctx.font = '14px Rajdhani';
  ctx.textAlign = 'right';
  ctx.fillText('AI', C.W - 20, C.H - 55);
  ctx.fillStyle = '#885566';
  ctx.font = '11px Rajdhani';
  ctx.fillText(`Pocketed: ${state.endStats.ai.lit}`, C.W - 20, C.H - 68);

  ctx.fillStyle = '#888';
  ctx.font = 'bold 16px Orbitron';
  ctx.textAlign = 'center';
  ctx.fillText(`ROUND ${state.currentRound}/${C.ROUNDS}`, C.W / 2, C.H - 12);

  const turnText = state.currentTurn === 'PLAYER' ? 'YOUR TURN' : 'AI TURN';
  const turnColor = state.currentTurn === 'PLAYER' ? C.PLAYER_COLOR : C.AI_COLOR;
  ctx.fillStyle = turnColor;
  ctx.font = 'bold 14px Orbitron';
  ctx.fillText(turnText, C.W / 2, C.H - 32);
}

export function drawAimLine(): void {
  const cue = getCueBall();
  if (!cue.alive || state.turnPhase !== 'AIM') return;
  if (state.currentTurn !== 'PLAYER' || !state.dragging) return;

  const dx = cue.x - state.mouseX;
  const dy = cue.y - state.mouseY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 5) return;

  const nx = dx / len;
  const ny = dy / len;

  ctx.save();
  ctx.strokeStyle = 'rgba(0,229,255,0.7)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 5]);
  ctx.lineDashOffset = -state.dashOffset;
  ctx.beginPath();
  ctx.moveTo(cue.x, cue.y);

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

  ctx.lineTo(endX, endY);
  ctx.stroke();

  if (hitWall && hitWallFound) {
    ctx.strokeStyle = 'rgba(0,229,255,0.35)';
    ctx.setLineDash([8, 5]);
    ctx.lineDashOffset = -state.dashOffset;
    ctx.beginPath();
    ctx.moveTo(wallX, wallY);
    ctx.lineTo(wallX + reflNx * 120, wallY + reflNy * 120);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawPowerBar(): void {
  if (state.currentTurn !== 'PLAYER' || state.turnPhase !== 'AIM') return;
  if (!state.charging && !state.dragging) return;

  const bx = 20;
  const by = C.H / 2 - 100;
  const bw = 30;
  const bh = 200;
  const now = performance.now();

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeRect(bx, by, bw, bh);

  const fillH = bh * state.power;
  const pulse = 0.85 + 0.15 * Math.sin(now * 0.008);
  const grd = ctx.createLinearGradient(0, by + bh, 0, by);
  grd.addColorStop(0, '#00ff44');
  grd.addColorStop(0.5, '#ffdd00');
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

  ctx.fillStyle = '#fff';
  ctx.font = '11px Rajdhani';
  ctx.textAlign = 'center';
  ctx.fillText('POWER', bx + bw / 2, by + bh + 16);
}

export function drawReconButton(): void {
  if (state.currentTurn !== 'PLAYER' || state.turnPhase !== 'AIM') return;

  const bx = 15;
  const by = 15;
  const bw = 80;
  const bh = 30;
  if (state.playerReconUsed) {
    ctx.fillStyle = 'rgba(40,40,40,0.3)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#555';
    ctx.font = 'bold 12px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('USED', bx + bw / 2, by + 20);
    return;
  }
  ctx.fillStyle = state.reconMode ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.1)';
  ctx.strokeStyle = state.reconMode ? '#00e5ff' : '#666';
  ctx.lineWidth = 1;
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = state.reconMode ? '#00e5ff' : '#aaa';
  ctx.font = 'bold 12px Orbitron';
  ctx.textAlign = 'center';
  ctx.fillText('RECON', bx + bw / 2, by + 20);

  if (
    state.mouseX >= bx &&
    state.mouseX <= bx + bw &&
    state.mouseY >= by &&
    state.mouseY <= by + bh
  ) {
    const tx = bx;
    const ty = by + bh + 8;
    ctx.fillStyle = 'rgba(10,10,15,0.9)';
    ctx.fillRect(tx, ty, 200, 58);
    ctx.strokeStyle = '#ff4466';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx, ty + 58);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ff4466';
    ctx.font = 'bold 13px Rajdhani';
    ctx.fillText('SACRIFICE THIS TURN', tx + 10, ty + 18);
    ctx.fillStyle = '#aaa';
    ctx.font = '12px Rajdhani';
    ctx.fillText('to illuminate dark zones', tx + 10, ty + 34);
    ctx.fillStyle = 'rgba(170,170,170,0.6)';
    ctx.font = '11px Rajdhani';
    ctx.fillText('One use only. Choose wisely.', tx + 10, ty + 50);
  }
}

export function drawChargingEffects(t: number): void {
  const cue = getCueBall();
  if (!cue.alive || !state.charging || state.currentTurn !== 'PLAYER') return;

  const pulse = 1.0 + 0.12 * state.power * Math.sin(t * 0.01);
  ctx.save();
  ctx.translate(cue.x, cue.y);
  ctx.scale(pulse, pulse);

  ctx.strokeStyle = `rgba(0,229,255,${0.3 + state.power * 0.5})`;
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00e5ff';
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

    ctx.strokeStyle = `rgba(0,229,255,${0.5 * (1 - progress * 0.4)})`;
    ctx.lineWidth = 6;
    ctx.shadowColor = '#00e5ff';
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
  if (!state.firstShotCoach || state.currentRound > 1 || state.currentTurn !== 'PLAYER') return;
  if (state.turnPhase !== 'AIM') return;
  const cue = getCueBall();
  if (!cue.alive) return;

  if (!state.dragging) {
    const bounce = Math.sin(t * 0.005) * 8;
    const ax = cue.x;
    const ay = cue.y - 30 + bounce;
    ctx.save();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax, ay + 15);
    ctx.moveTo(ax - 6, ay + 8);
    ctx.lineTo(ax, ay + 15);
    ctx.lineTo(ax + 6, ay + 8);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.strokeStyle = 'rgba(0,229,255,0.6)';
    ctx.lineWidth = 1;
    const tw = 260;
    const th = 24;
    ctx.fillRect(ax - tw / 2, ay - th - 8, tw, th);
    ctx.strokeRect(ax - tw / 2, ay - th - 8, tw, th);
    ctx.fillStyle = '#fff';
    ctx.font = '13px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('DRAG FROM BALL — FARTHER = MORE POWER', ax, ay - th + 8);
    ctx.restore();
  }
}
