import { C, FELT_L, FELT_T, FELT_R, FELT_B, FELT_CX, FELT_CY } from './constants.ts';
import { state, getCueBall } from './state.ts';
import { getLightLevel, allObjectBallsSunk, triggerShake } from './physics.ts';
import { aiTakeTurn } from '../ai/ai.ts';

export function resolveTurn(): void {
  state.turnPhase = 'RESOLVE';

  state.lightZones = state.lightZones.filter((z) => state.currentRound - z.createdAtRound <= 2);
  state.ghostBalls = state.ghostBalls.filter((g) => state.currentRound - g.round <= 2);

  for (let i = 1; i < state.balls.length; i++) {
    const b = state.balls[i];
    if (!b || !b.alive) continue;
    const ll = getLightLevel(b.x, b.y);
    if (ll <= 0.1 && b.lastLitX !== undefined) {
      const existing = state.ghostBalls.find((g) => g.id === b.id);
      if (existing) {
        existing.x = b.lastLitX;
        existing.y = b.lastLitY ?? b.y;
        existing.round = state.currentRound;
      } else {
        state.ghostBalls.push({
          id: b.id,
          x: b.lastLitX,
          y: b.lastLitY ?? b.y,
          color: b.color,
          round: state.currentRound,
        });
        if (!state.scoringReminderShown && !state.scoringReminder) {
          state.scoringReminder = {
            x: b.lastLitX,
            y: b.lastLitY ?? b.y,
            ghostId: b.id,
            timer: 4000,
            maxTimer: 4000,
          };
          state.scoringReminderShown = true;
        }
      }
    } else if (ll > 0.1) {
      state.ghostBalls = state.ghostBalls.filter((g) => g.id !== b.id);
    }
  }

  if (allObjectBallsSunk() || state.currentRound > C.ROUNDS) {
    state.gameState = 'ENDSCREEN';
    return;
  }

  if (state.currentTurn === 'PLAYER') {
    state.currentTurn = 'AI';
  } else {
    state.currentTurn = 'PLAYER';
    state.currentRound++;
    if (state.currentRound === 2) {
      state.roundTransMsg = {
        text: 'DARKNESS DEEPENS',
        color: '#6644aa',
        timer: 2000,
        maxTimer: 2000,
      };
    } else if (state.currentRound === 4) {
      state.roundTransMsg = {
        text: 'TRUST YOUR MEMORY',
        color: '#4488ff',
        timer: 2000,
        maxTimer: 2000,
      };
    } else if (state.currentRound === 6) {
      state.roundTransMsg = {
        text: 'FINAL SHADOWS',
        color: '#ff4444',
        timer: 2000,
        maxTimer: 2000,
      };
    } else if (state.currentRound === 7) {
      state.roundTransMsg = {
        text: 'LAST SHOT',
        color: '#ffd700',
        timer: 2500,
        maxTimer: 2500,
      };
      triggerShake(5, 200);
    }
    if (state.currentRound > C.ROUNDS) {
      state.gameState = 'ENDSCREEN';
      return;
    }
  }

  state.turnPhase = 'AIM';
  state.power = 0;
  state.charging = false;
  state.reconMode = false;

  const cue = getCueBall();
  if (cue.alive) {
    const margin = C.BALL_R + 15;
    if (
      (cue.x < FELT_L + margin && cue.y < FELT_T + margin) ||
      (cue.x < FELT_L + margin && cue.y > FELT_B - margin) ||
      (cue.x > FELT_R - margin && cue.y < FELT_T + margin) ||
      (cue.x > FELT_R - margin && cue.y > FELT_B - margin)
    ) {
      const angle = Math.atan2(FELT_CY - cue.y, FELT_CX - cue.x);
      cue.x += Math.cos(angle) * 15;
      cue.y += Math.sin(angle) * 15;
    }
  }

  if (state.currentTurn === 'AI') {
    aiTakeTurn();
  }
}
