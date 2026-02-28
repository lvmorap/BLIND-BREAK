import { C, FELT_L, FELT_W, FELT_CX, FELT_CY, POCKETS } from '../core/constants.ts';
import { state, getCueBall } from '../core/state.ts';
import { fireShot, fireRecon, getVisibility } from '../core/physics.ts';
import { ctx } from '../rendering/canvas.ts';

export function aiTakeTurn(): void {
  state.aiState = 'THINKING';
  state.aiThinkTimer = C.AI_THINK_TIME;
  state.aiScanAnim = 0;
}

export function aiThink(): void {
  const cue = getCueBall();
  if (!cue.alive) return;

  if (!state.aiReconUsed && state.currentRound === state.aiReconRound) {
    const angle = Math.atan2(FELT_CY - cue.y, FELT_CX - cue.x);
    fireRecon(angle);
    state.aiState = 'IDLE';
    return;
  }

  let bestBall: { x: number; y: number } | null = null;
  let bestScore = -Infinity;
  let bestAimAngle = 0;
  let bestPower = 0.4;

  for (let i = 1; i < state.balls.length; i++) {
    const b = state.balls[i];
    if (!b || !b.alive) continue;
    if (getVisibility(b.x, b.y) < 0.1) continue;
    {
      for (const pk of POCKETS) {
        const bpDx = pk.x - b.x;
        const bpDy = pk.y - b.y;
        const bpDist = Math.sqrt(bpDx * bpDx + bpDy * bpDy);
        const bpAngle = Math.atan2(bpDy, bpDx);
        const aimX = b.x - Math.cos(bpAngle) * C.BALL_R * 2;
        const aimY = b.y - Math.sin(bpAngle) * C.BALL_R * 2;
        const cueDx = aimX - cue.x;
        const cueDy = aimY - cue.y;
        const cueDist = Math.sqrt(cueDx * cueDx + cueDy * cueDy);
        const aimAngle = Math.atan2(cueDy, cueDx);
        let cutAngle = Math.abs(aimAngle - bpAngle);
        if (cutAngle > Math.PI) cutAngle = 2 * Math.PI - cutAngle;
        let pathClear = true;
        for (let j = 1; j < state.balls.length; j++) {
          const ob = state.balls[j];
          if (j === i || !ob || !ob.alive) continue;
          if (getVisibility(ob.x, ob.y) < 0.1) continue;
          const toDx = ob.x - cue.x;
          const toDy = ob.y - cue.y;
          const proj = toDx * Math.cos(aimAngle) + toDy * Math.sin(aimAngle);
          if (proj > 0 && proj < cueDist) {
            const perp = Math.abs(-toDx * Math.sin(aimAngle) + toDy * Math.cos(aimAngle));
            if (perp < C.BALL_R * 2.5) {
              pathClear = false;
              break;
            }
          }
        }
        const score = 100 - bpDist * 0.5 - cutAngle * 200 + (pathClear ? 500 : 0);
        if (score > bestScore) {
          bestScore = score;
          bestBall = b;
          bestAimAngle = aimAngle;
          bestPower = Math.min(0.75, Math.max(0.2, cueDist / 400));
        }
      }
    }
  }

  if (!bestBall) {
    for (const g of state.ghostBalls) {
      const age = state.currentRound - g.round;
      if (age > 2) continue;
      const variance = (Math.random() - 0.5) * C.AI_GHOST_VARIANCE_DEG * 2 * (Math.PI / 180);
      const angle = Math.atan2(g.y - cue.y, g.x - cue.x) + variance;
      const power = 0.3 + Math.random() * 0.3;
      fireShot(angle, power);
      state.aiState = 'IDLE';
      return;
    }
  }

  if (bestBall) {
    fireShot(bestAimAngle, bestPower);
    state.aiState = 'IDLE';
    return;
  }

  const variance = (Math.random() - 0.5) * C.AI_PROBE_VARIANCE_DEG * 2 * (Math.PI / 180);
  const rackX = FELT_L + FELT_W * 0.72;
  const angle = Math.atan2(FELT_CY - cue.y, rackX - cue.x) + variance;
  const power = 0.3 + Math.random() * 0.4;
  fireShot(angle, power);
  state.aiState = 'IDLE';
}

export function drawAIThinking(): void {
  if (state.gameMode !== 'VS_AI' || state.currentTurn !== 'AI' || state.aiState !== 'THINKING')
    return;

  state.aiScanAnim += 0.05;
  const pulse = 0.5 + 0.5 * Math.sin(state.aiScanAnim * 3);

  ctx.save();
  ctx.fillStyle = `rgba(255,68,102,${0.5 + pulse * 0.5})`;
  ctx.font = 'bold 18px Orbitron';
  ctx.textAlign = 'center';
  ctx.shadowColor = C.AI_COLOR;
  ctx.shadowBlur = 10;
  ctx.fillText('AI THINKING...', C.W / 2, 30);
  ctx.shadowBlur = 0;

  const eyeX = C.W / 2;
  const eyeY = 48;
  ctx.strokeStyle = `rgba(255,68,102,${pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(eyeX, eyeY, 15, 8, 0, 0, Math.PI * 2);
  ctx.stroke();

  const scanTargetX = eyeX + Math.cos(state.aiScanAnim) * 6;
  ctx.fillStyle = C.AI_COLOR;
  ctx.beginPath();
  ctx.arc(scanTargetX, eyeY, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
