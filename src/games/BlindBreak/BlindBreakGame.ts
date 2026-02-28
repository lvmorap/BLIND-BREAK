import { C } from '../../core/constants.ts';
import { state, resetBalls, resetGame, isHumanTurn } from '../../core/state.ts';
import {
  updatePhysics,
  allBallsStopped,
  updateSquash,
  updateShake,
  fireShot,
} from '../../core/physics.ts';
import { updateParticles, updatePopups, spawnDust } from '../../rendering/effects.ts';
import { prerenderFelt, prerenderWood } from '../../rendering/textures.ts';
import { ctx as bbCtx, lightCanvas, lctx } from '../../rendering/canvas.ts';
import { drawScene } from '../../rendering/scene.ts';
import {
  drawMenu,
  drawCountdown,
  drawEndScreen,
  drawTutorial,
  drawPauseMenu,
} from '../../rendering/screens.ts';
import { setupInput } from '../../input/input.ts';
import { resolveTurn } from '../../core/turns.ts';
import { aiThink } from '../../ai/ai.ts';
import type { IGame } from '../IGame.ts';

export class BlindBreakGame implements IGame {
  init(_canvas: HTMLCanvasElement, _ctx: CanvasRenderingContext2D): void {
    prerenderFelt();
    prerenderWood();
    resetGame();
    resetBalls();
    setupInput();
    state.tutorialSeen = true;
    state.gameMode = 'VS_LOCAL';
    state.gameState = 'COUNTDOWN';
    state.countdownVal = 3;
    state.countdownTimer = 0;
  }

  update(dt: number): void {
    if (state.paused) return;

    const effectiveDt = dt * state.timeScale;

    if (state.slowMoTimer > 0) {
      state.slowMoTimer -= dt * 1000;
      if (state.slowMoTimer <= 0) {
        state.timeScale = 1.0;
      }
    }

    state.dashOffset += dt * 40;

    state.dustTimer += dt * 1000;
    if (state.dustTimer > C.DUST_INTERVAL) {
      state.dustTimer -= C.DUST_INTERVAL;
      for (let i = 0; i < 5; i++) spawnDust();
    }

    updateParticles(effectiveDt);
    updatePopups(effectiveDt);
    updateShake(dt);

    if (state.gameState === 'COUNTDOWN') {
      state.countdownTimer += dt * 1000;
      const step = Math.floor(state.countdownTimer / C.COUNTDOWN_STEP);
      state.countdownVal = 3 - step;
      if (step >= 4) {
        state.gameState = 'PLAYING';
        state.turnPhase = 'AIM';
        state.turnTimer = 0;
      }
      return;
    }

    if (state.gameState !== 'PLAYING') return;

    if (state.turnPhase === 'AIM') {
      state.turnTimer += dt * 1000;
      if (state.turnTimer >= C.TURN_TIMER) {
        state.turnTimer = 0;
        const cue = state.balls[0];
        if (cue && cue.alive && isHumanTurn()) {
          const angle = Math.random() * Math.PI * 2;
          fireShot(angle, 0.15);
        }
      }
    }

    if (state.dragging && isHumanTurn()) {
      const cue = state.balls[0];
      if (cue && cue.alive) {
        const dx = state.mouseX - cue.x;
        const dy = state.mouseY - cue.y;
        const dragDist = Math.sqrt(dx * dx + dy * dy);
        state.power = Math.min(1, dragDist / C.MAX_DRAG_DIST);
      }
    }

    if (state.turnPhase === 'ROLLING') {
      updatePhysics(effectiveDt);
      if (allBallsStopped()) {
        state.settleTimer += dt * 1000;
        if (state.settleTimer >= 500) {
          state.settleTimer = 0;
          resolveTurn();
          state.turnTimer = 0;
        }
      } else {
        state.settleTimer = 0;
      }
    }

    if (state.gameMode === 'VS_AI' && state.currentTurn === 'AI' && state.aiState === 'THINKING') {
      state.aiThinkTimer -= dt * 1000;
      if (state.aiThinkTimer <= 0) {
        aiThink();
      }
    }

    for (const b of state.balls) {
      if (b.alive) updateSquash(b, dt);
    }

    if (state.roundTransMsg && state.roundTransMsg.timer > 0) {
      state.roundTransMsg.timer -= dt * 1000;
    }

    if (state.scoringReminder && state.scoringReminder.timer > 0) {
      state.scoringReminder.timer -= dt * 1000;
      if (state.scoringReminder.timer <= 0) state.scoringReminder = null;
    }
    if (state.scoringReminder && state.turnPhase === 'ROLLING') state.scoringReminder = null;

    if (state.firstShotCoach && state.dragging) {
      state.firstShotCoach = false;
    }

    state.parallaxX += (state.parallaxTargetX - state.parallaxX) * 0.05;
    state.parallaxY += (state.parallaxTargetY - state.parallaxY) * 0.05;

    state.breathTimer += dt;

    const now = performance.now();
    state.lightZones = state.lightZones.filter((z) => now - z.createdAt < C.TRAIL_DURATION);

    if (state.chromaticTimer > 0) state.chromaticTimer--;

    for (let i = state.numberBouncePopups.length - 1; i >= 0; i--) {
      const nb = state.numberBouncePopups[i];
      if (!nb) continue;
      nb.y += nb.vy;
      nb.vy += 0.12;
      nb.timer--;
      nb.alpha = Math.max(0, nb.timer / 60);
      nb.scale *= 0.985;
      if (nb.timer <= 0) state.numberBouncePopups.splice(i, 1);
    }

    if (state.scratchFlashTimer > 0) state.scratchFlashTimer--;

    for (let i = state.wallRipples.length - 1; i >= 0; i--) {
      const r = state.wallRipples[i];
      if (!r) continue;
      r.time += dt * 1000;
      if (r.time >= r.maxTime) state.wallRipples.splice(i, 1);
    }

    if (state.laserBeam && state.laserBeam.timer > 0) {
      state.laserBeam.timer -= dt * 1000;
      if (state.laserBeam.timer <= 0) {
        state.laserBeam = null;
      }
    }

    if (Math.random() < 0.002 * dt * 60 && state.comets.length < 3) {
      const side = Math.floor(Math.random() * 4);
      let cx: number, cy: number, cvx: number, cvy: number;
      if (side === 0) {
        cx = -10;
        cy = Math.random() * C.H;
        cvx = 1 + Math.random() * 2;
        cvy = (Math.random() - 0.5) * 1.5;
      } else if (side === 1) {
        cx = C.W + 10;
        cy = Math.random() * C.H;
        cvx = -(1 + Math.random() * 2);
        cvy = (Math.random() - 0.5) * 1.5;
      } else if (side === 2) {
        cx = Math.random() * C.W;
        cy = -10;
        cvx = (Math.random() - 0.5) * 1.5;
        cvy = 1 + Math.random() * 2;
      } else {
        cx = Math.random() * C.W;
        cy = C.H + 10;
        cvx = (Math.random() - 0.5) * 1.5;
        cvy = -(1 + Math.random() * 2);
      }
      state.comets.push({
        x: cx,
        y: cy,
        vx: cvx,
        vy: cvy,
        size: 1 + Math.random() * 1.5,
        alpha: 0.4 + Math.random() * 0.4,
        tailLen: 20 + Math.random() * 40,
      });
    }

    for (let i = state.comets.length - 1; i >= 0; i--) {
      const cm = state.comets[i];
      if (!cm) continue;
      cm.x += cm.vx * dt * 60;
      cm.y += cm.vy * dt * 60;
      if (cm.x < -60 || cm.x > C.W + 60 || cm.y < -60 || cm.y > C.H + 60) {
        state.comets.splice(i, 1);
      }
    }

    if (state.supernovaActive && state.supernovaTimer > 0) {
      state.supernovaTimer -= dt * 1000;
      if (state.supernovaTimer <= 0) {
        state.supernovaActive = false;
      }
    }
  }

  render(_ctx: CanvasRenderingContext2D): void {
    const t = performance.now();

    bbCtx.clearRect(0, 0, C.W, C.H);

    bbCtx.save();
    bbCtx.translate(state.screenShake.ox, state.screenShake.oy);

    bbCtx.fillStyle = '#020206';
    bbCtx.fillRect(-20, -20, C.W + 40, C.H + 40);

    if (state.gameState === 'PRELOAD' || state.gameState === 'MENU') {
      drawMenu(t);
    } else if (state.gameState === 'TUTORIAL') {
      drawTutorial(t);
    } else if (state.gameState === 'COUNTDOWN') {
      drawCountdown(t);
    } else if (state.gameState === 'PLAYING') {
      drawScene(t);
      if (state.chromaticTimer > 0) {
        const offset = state.chromaticTimer * 1.5;
        lctx.clearRect(0, 0, C.W, C.H);
        lctx.drawImage(bbCtx.canvas, 0, 0);
        bbCtx.save();
        bbCtx.globalCompositeOperation = 'lighter';
        bbCtx.globalAlpha = 0.08;
        bbCtx.drawImage(lightCanvas, offset, 0);
        bbCtx.drawImage(lightCanvas, -offset, 0);
        bbCtx.restore();
      }
      if (state.paused) drawPauseMenu();
    } else if (state.gameState === 'ENDSCREEN') {
      drawEndScreen(t);
    }

    bbCtx.restore();

    for (const p of state.scorePopups) {
      if (p.text.includes('SCRATCH') && p.life > p.maxLife - 200) {
        bbCtx.fillStyle = `rgba(255,0,0,${0.15 * (p.life / p.maxLife)})`;
        bbCtx.fillRect(0, 0, C.W, C.H);
      }
    }
  }

  destroy(): void {
    resetGame();
    state.gameState = 'PRELOAD';
    if (state.ambientNode) {
      try {
        state.ambientNode.stop();
      } catch {
        /* already stopped */
      }
      state.ambientNode = null;
    }
    if (state.ambientGain) {
      state.ambientGain.disconnect();
      state.ambientGain = null;
    }
  }

  getWinner(): 1 | 2 | null {
    if (state.playerScore > state.aiScore) return 1;
    if (state.aiScore > state.playerScore) return 2;
    return null;
  }

  isFinished(): boolean {
    return state.gameState === 'ENDSCREEN';
  }
}
