import { C } from './core/constants.ts';
import { state, resetBalls } from './core/state.ts';
import { updatePhysics, allBallsStopped, updateSquash, updateShake } from './core/physics.ts';
import { updateParticles, updatePopups, spawnDust } from './rendering/effects.ts';
import { prerenderFelt, prerenderWood } from './rendering/textures.ts';
import { ctx, lightCanvas, lctx } from './rendering/canvas.ts';
import { drawScene } from './rendering/scene.ts';
import {
  drawMenu,
  drawCountdown,
  drawEndScreen,
  drawTutorial,
  drawPauseMenu,
} from './rendering/screens.ts';
import { setupInput } from './input/input.ts';
import { resolveTurn } from './core/turns.ts';
import { aiThink } from './ai/ai.ts';

function update(dt: number): void {
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
    }
    return;
  }

  if (state.gameState !== 'PLAYING') return;

  if (state.dragging && state.currentTurn === 'PLAYER') {
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
      }
    } else {
      state.settleTimer = 0;
    }
  }

  if (state.currentTurn === 'AI' && state.aiState === 'THINKING') {
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
}

function draw(t: number): void {
  ctx.clearRect(0, 0, C.W, C.H);

  ctx.save();
  ctx.translate(state.screenShake.ox, state.screenShake.oy);

  ctx.fillStyle = '#050508';
  ctx.fillRect(-20, -20, C.W + 40, C.H + 40);

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
      lctx.drawImage(document.getElementById('gameCanvas') as HTMLCanvasElement, 0, 0);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.08;
      ctx.drawImage(lightCanvas, offset, 0);
      ctx.drawImage(lightCanvas, -offset, 0);
      ctx.restore();
    }
    if (state.paused) drawPauseMenu();
  } else if (state.gameState === 'ENDSCREEN') {
    drawEndScreen(t);
  }

  ctx.restore();

  for (const p of state.scorePopups) {
    if (p.text.includes('SCRATCH') && p.life > p.maxLife - 200) {
      ctx.fillStyle = `rgba(255,0,0,${0.15 * (p.life / p.maxLife)})`;
      ctx.fillRect(0, 0, C.W, C.H);
    }
  }
}

function gameLoop(timestamp: number): void {
  const dt = Math.min((timestamp - state.prevTime) / 1000, 0.05);
  state.prevTime = timestamp;
  update(dt);
  draw(timestamp);
  requestAnimationFrame(gameLoop);
}

function init(): void {
  prerenderFelt();
  prerenderWood();
  resetBalls();
  state.gameState = 'MENU';
  setupInput();

  void document.fonts.ready.then(() => {
    requestAnimationFrame((t: number) => {
      state.prevTime = t;
      gameLoop(t);
    });
  });
}

init();
