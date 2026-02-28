import { C, FELT_L, FELT_T, FELT_R, FELT_B, FELT_CX, FELT_CY } from './constants.ts';
import { state, getCueBall } from './state.ts';
import { allObjectBallsSunk } from './physics.ts';
import { aiTakeTurn } from '../ai/ai.ts';
import { addScorePopup } from '../rendering/effects.ts';

export function resolveTurn(): void {
  state.turnPhase = 'RESOLVE';

  const now = performance.now();
  state.lightZones = state.lightZones.filter((z) => now - z.createdAt < C.TRAIL_DURATION);

  if (allObjectBallsSunk() || state.currentRound > C.ROUNDS) {
    state.gameState = 'ENDSCREEN';
    return;
  }

  const pocketed = state.ballPocketedThisTurn;
  const scratched = state.cueScratchedThisTurn;
  state.ballPocketedThisTurn = false;
  state.cueScratchedThisTurn = false;

  if (scratched) {
    if (state.currentTurn === 'PLAYER') {
      state.currentTurn = 'AI';
    } else {
      state.currentTurn = 'PLAYER';
      state.currentRound++;
      if (state.currentRound > C.ROUNDS) {
        state.gameState = 'ENDSCREEN';
        return;
      }
    }
  } else if (pocketed) {
    addScorePopup(C.W / 2, C.H / 2 - 40, 'EXTRA TURN!', '#ffd700', 22);
  } else {
    if (state.currentTurn === 'PLAYER') {
      state.currentTurn = 'AI';
    } else {
      state.currentTurn = 'PLAYER';
      state.currentRound++;
      if (state.currentRound > C.ROUNDS) {
        state.gameState = 'ENDSCREEN';
        return;
      }
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
