import type { Ball } from '../types/game.ts';
import {
  C,
  FELT_L,
  FELT_T,
  FELT_R,
  FELT_B,
  FELT_W,
  FELT_CX,
  FELT_CY,
  POCKETS,
} from './constants.ts';
import { state, getCueBall } from './state.ts';
import { playSound } from './audio.ts';
import { spawnBallTrail, spawnPocketBurst, addScorePopup } from '../rendering/effects.ts';

export function getLightLevel(x: number, y: number): number {
  const cue = state.balls[0];
  if (!cue || !cue.alive) return 0;
  const dx = x - cue.x;
  const dy = y - cue.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < C.CUE_LIGHT_R) {
    return 1.0 - dist / C.CUE_LIGHT_R;
  }
  return 0;
}

export function getVisibility(x: number, y: number): number {
  let level = getLightLevel(x, y);
  if (level > 0) return level;
  const now = performance.now();
  for (const z of state.lightZones) {
    const age = now - z.createdAt;
    if (age > C.TRAIL_DURATION) continue;
    const dx = x - z.x;
    const dy = y - z.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < z.radius) {
      const fade = 1 - age / C.TRAIL_DURATION;
      level = Math.max(level, fade * (1 - dist / z.radius));
    }
  }
  return level;
}

export function triggerShake(intensity: number, duration: number): void {
  state.screenShake.intensity = Math.min(intensity, C.SHAKE_CAP);
  state.screenShake.duration = duration;
  state.screenShake.timer = duration;
}

export function triggerSquash(ball: Ball): void {
  ball.squash = { sx: 1.25, sy: 0.75, timer: C.SQUASH_DURATION };
}

export function updateSquash(ball: Ball, dt: number): void {
  const s = ball.squash;
  if (s.timer > 0) {
    s.timer -= dt * 1000;
    const t = 1 - s.timer / C.SQUASH_DURATION;
    const p = 0.3;
    const el = Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
    s.sx = 1 + (1.25 - 1) * (1 - el);
    s.sy = 1 + (0.75 - 1) * (1 - el);
  } else {
    s.sx = 1;
    s.sy = 1;
  }
}

function unstickBall(ball: Ball): void {
  for (const other of state.balls) {
    if (other === ball || !other.alive) continue;
    const dx = ball.x - other.x;
    const dy = ball.y - other.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < C.BALL_R * 2.5) {
      const angle = Math.atan2(FELT_CY - ball.y, FELT_CX - ball.x);
      ball.x += Math.cos(angle) * 15;
      ball.y += Math.sin(angle) * 15;
    }
  }
  ball.x = Math.max(FELT_L + C.BALL_R + 2, Math.min(FELT_R - C.BALL_R - 2, ball.x));
  ball.y = Math.max(FELT_T + C.BALL_R + 2, Math.min(FELT_B - C.BALL_R - 2, ball.y));
}

function sinkBall(ball: Ball): void {
  if (ball.sinking) return;
  ball.sinking = true;
  ball.sinkTimer = 300;
  ball.sinkScale = 1;
  ball.vx = 0;
  ball.vy = 0;

  const pocket = POCKETS.find((pk) => {
    const dx = ball.x - pk.x;
    const dy = ball.y - pk.y;
    return Math.sqrt(dx * dx + dy * dy) < C.POCKET_SINK_R + 10;
  });
  const pocketX = pocket ? pocket.x : ball.x;
  const pocketY = pocket ? pocket.y : ball.y;

  playSound('POCKET');
  triggerShake(6, 200);

  if (ball.id === 0) {
    const who = state.currentTurn === 'PLAYER' ? 'player' : 'ai';
    if (who === 'player') state.playerScore -= 1;
    else state.aiScore -= 1;
    state.endStats[who].scratches++;
    state.cueScratchedThisTurn = true;
    addScorePopup(pocketX, pocketY, '-1 SCRATCH', '#ff0000', 28);
    triggerShake(8, 250);
    state.scratchFlashTimer = 3;
    setTimeout(() => {
      if (state.gameState !== 'PLAYING' || ball.alive) return;
      ball.alive = true;
      ball.sinking = false;
      ball.sinkScale = 1;
      ball.x = FELT_L + FELT_W * 0.25;
      ball.y = FELT_CY;
      ball.vx = 0;
      ball.vy = 0;
      unstickBall(ball);
    }, C.SCRATCH_RESPAWN_MS);
    return;
  }

  const statKey = state.currentTurn === 'PLAYER' ? 'player' : 'ai';
  const pts = 1;
  const label = '+1';
  const color = ball.color;
  const size = 24;
  state.endStats[statKey].lit++;
  state.ballPocketedThisTurn = true;

  if (state.currentTurn === 'PLAYER') state.playerScore += pts;
  else state.aiScore += pts;
  addScorePopup(pocketX, pocketY, label, color, size);
  spawnPocketBurst(pocketX, pocketY, ball.color, 12);

  if (ball.num) {
    state.numberBouncePopups.push({
      num: ball.num,
      x: pocketX,
      y: pocketY,
      vy: -4.5,
      scale: 2.0,
      alpha: 1.0,
      color: ball.color,
      timer: 60,
    });
  }

  // Ghost balls removed from game
}

export function updatePhysics(dt: number): void {
  state.collisionSoundCount = 0;
  const realDt = dt;

  for (const b of state.balls) {
    if (!b.alive || b.sinking) continue;
    b.x += b.vx * dt * 60;
    b.y += b.vy * dt * 60;
    b.vx *= Math.pow(C.FRICTION, dt * 60);
    b.vy *= Math.pow(C.FRICTION, dt * 60);

    const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    if (spd < C.MIN_VEL) {
      b.vx = 0;
      b.vy = 0;
      b.trail = [];
    }

    if (spd > 0.5) {
      b.trail.push({ x: b.x, y: b.y, a: 0.25 });
      if (b.trail.length > 4) b.trail.shift();
      if (b.id === 0) {
        const lastZ = b._lastLightZone;
        if (!lastZ || Math.abs(b.x - lastZ.x) + Math.abs(b.y - lastZ.y) > 8) {
          state.lightZones.push({
            x: b.x,
            y: b.y,
            radius: C.TRAIL_LIGHT_R,
            createdAtRound: state.currentRound,
            intensity: C.DARKNESS_ALPHA,
            createdAt: performance.now(),
          });
          b._lastLightZone = { x: b.x, y: b.y };
        }
      }
    }

    if (b.x - C.BALL_R < FELT_L) {
      b.x = FELT_L + C.BALL_R;
      b.vx = -b.vx * C.WALL_RESTITUTION;
      playSound('CUSHION');
      triggerSquash(b);
    }
    if (b.x + C.BALL_R > FELT_R) {
      b.x = FELT_R - C.BALL_R;
      b.vx = -b.vx * C.WALL_RESTITUTION;
      playSound('CUSHION');
      triggerSquash(b);
    }
    if (b.y - C.BALL_R < FELT_T) {
      b.y = FELT_T + C.BALL_R;
      b.vy = -b.vy * C.WALL_RESTITUTION;
      playSound('CUSHION');
      triggerSquash(b);
    }
    if (b.y + C.BALL_R > FELT_B) {
      b.y = FELT_B - C.BALL_R;
      b.vy = -b.vy * C.WALL_RESTITUTION;
      playSound('CUSHION');
      triggerSquash(b);
    }

    for (const pk of POCKETS) {
      const dx = b.x - pk.x;
      const dy = b.y - pk.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < C.POCKET_SINK_R) {
        sinkBall(b);
        break;
      }
    }

    spawnBallTrail(b);
    updateSquash(b, realDt);
  }

  for (let i = 0; i < state.balls.length; i++) {
    for (let j = i + 1; j < state.balls.length; j++) {
      const a = state.balls[i];
      const b = state.balls[j];
      if (!a || !b || !a.alive || !b.alive || a.sinking || b.sinking) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minD = C.BALL_R * 2;
      if (dist < minD && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minD - dist;
        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;
        const dvx = a.vx - b.vx;
        const dvy = a.vy - b.vy;
        const dvn = dvx * nx + dvy * ny;
        if (dvn > 0) {
          a.vx -= dvn * nx * C.BALL_RESTITUTION;
          a.vy -= dvn * ny * C.BALL_RESTITUTION;
          b.vx += dvn * nx * C.BALL_RESTITUTION;
          b.vy += dvn * ny * C.BALL_RESTITUTION;
          playSound('BALL_COLLISION');
          triggerSquash(a);
          triggerSquash(b);
          const impactSpd = Math.abs(dvn);
          if (impactSpd > 8) triggerShake(3, 80);
          if (impactSpd > 12) state.chromaticTimer = 3;
        }
      }
    }
  }

  for (const b of state.balls) {
    if (b.sinking) {
      b.sinkTimer -= realDt * 1000;
      b.sinkScale = Math.max(0, b.sinkTimer / 300);
      if (b.sinkTimer <= 0) {
        b.alive = false;
        b.sinking = false;
      }
    }
  }
}

export function allBallsStopped(): boolean {
  for (const b of state.balls) {
    if (!b.alive || b.sinking) continue;
    if (Math.abs(b.vx) > 0.01 || Math.abs(b.vy) > 0.01) return false;
  }
  return true;
}

export function allObjectBallsSunk(): boolean {
  for (let i = 1; i < state.balls.length; i++) {
    const ball = state.balls[i];
    if (ball && ball.alive) return false;
  }
  return true;
}

export function fireShot(angle: number, shotPower: number): void {
  const cue = getCueBall();
  const vel = C.POWER_MIN + (C.POWER_MAX - C.POWER_MIN) * shotPower;
  cue.vx = Math.cos(angle) * vel;
  cue.vy = Math.sin(angle) * vel;
  state.turnPhase = 'ROLLING';
  state.ballPocketedThisTurn = false;
  state.cueScratchedThisTurn = false;
  playSound('CUE_STRIKE');
  if (shotPower > 0.7) triggerShake(4, 120);
}

export function fireRecon(angle: number): void {
  const cueBall = getCueBall();
  const startX = cueBall.x;
  const startY = cueBall.y;
  state.reconBeamAnim = {
    angle: angle,
    startTime: performance.now(),
    duration: 800,
    cx: startX,
    cy: startY,
  };
  setTimeout(() => {
    const spread = (C.RECON_SPREAD_DEG * Math.PI) / 180;
    const beamLength = 300;
    for (let i = -1; i <= 1; i++) {
      const a = angle + i * spread;
      const steps = 30;
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const bx = startX + Math.cos(a) * beamLength * t;
        const by = startY + Math.sin(a) * beamLength * t;
        if (bx > FELT_L && bx < FELT_R && by > FELT_T && by < FELT_B) {
          state.lightZones.push({
            x: bx,
            y: by,
            radius: 25,
            createdAtRound: state.currentRound,
            intensity: 0.7,
            createdAt: performance.now(),
          });
        }
      }
    }
    if (state.currentTurn === 'PLAYER') state.playerReconUsed = true;
    else state.aiReconUsed = true;
    state.reconBeamAnim = null;
    state.turnPhase = 'ROLLING';
  }, 800);
}

export function updateShake(dt: number): void {
  if (state.screenShake.timer > 0) {
    state.screenShake.timer -= dt * 1000;
    const t = state.screenShake.timer / state.screenShake.duration;
    const i = state.screenShake.intensity * t;
    state.screenShake.ox = (Math.random() - 0.5) * 2 * i;
    state.screenShake.oy = (Math.random() - 0.5) * 2 * i;
  } else {
    state.screenShake.ox = 0;
    state.screenShake.oy = 0;
  }
}
