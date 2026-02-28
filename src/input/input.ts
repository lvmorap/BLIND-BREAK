import { C } from '../core/constants.ts';
import { state, resetGame, getCueBall, isHumanTurn } from '../core/state.ts';
import { initAudio } from '../core/audio.ts';
import { fireShot, fireRecon } from '../core/physics.ts';
import { canvas } from '../rendering/canvas.ts';

export function setupInput(): void {
  canvas.addEventListener('mousedown', (e: MouseEvent) => {
    initAudio();
    const rect = canvas.getBoundingClientRect();
    const scaleX = C.W / rect.width;
    const scaleY = C.H / rect.height;
    state.mouseX = (e.clientX - rect.left) * scaleX;
    state.mouseY = (e.clientY - rect.top) * scaleY;
    state.mouseDown = true;

    if (state.gameState === 'TUTORIAL') {
      state.tutorialStep++;
      if (state.tutorialStep >= C.TUTORIAL_STEPS) {
        resetGame();
        state.gameState = 'COUNTDOWN';
        state.countdownVal = 3;
        state.countdownTimer = 0;
      }
      return;
    }

    if (state.gameState === 'PRELOAD' || state.gameState === 'MENU') {
      if (state.mouseX > C.W - 100 && state.mouseY < 40) {
        state.gameState = 'TUTORIAL';
        state.tutorialStep = 0;
        state.tutorialSeen = true;
        return;
      }
      const btnW = 200;
      const btnH = 36;
      const btnGap = 16;
      const btnY1 = 400;
      const btnY2 = btnY1 + btnH + btnGap;
      const btnX = C.W / 2 - btnW / 2;
      const inBtn1 =
        state.mouseX >= btnX &&
        state.mouseX <= btnX + btnW &&
        state.mouseY >= btnY1 &&
        state.mouseY <= btnY1 + btnH;
      const inBtn2 =
        state.mouseX >= btnX &&
        state.mouseX <= btnX + btnW &&
        state.mouseY >= btnY2 &&
        state.mouseY <= btnY2 + btnH;
      if (inBtn1 || inBtn2) {
        state.tutorialSeen = true;
        state.gameMode = inBtn1 ? 'VS_AI' : 'VS_LOCAL';
        resetGame();
        state.gameState = 'COUNTDOWN';
        state.countdownVal = 3;
        state.countdownTimer = 0;
      } else if (!state.tutorialSeen) {
        state.gameState = 'TUTORIAL';
        state.tutorialStep = 0;
        state.tutorialSeen = true;
      }
      return;
    }

    if (state.gameState === 'ENDSCREEN') {
      state.gameState = 'MENU';
      return;
    }

    if (
      state.gameState !== 'PLAYING' ||
      !isHumanTurn() ||
      state.turnPhase !== 'AIM'
    ) {
      return;
    }

    const reconUsed = state.currentTurn === 'PLAYER' ? state.playerReconUsed : state.aiReconUsed;
    if (
      !reconUsed &&
      state.mouseX >= 15 &&
      state.mouseX <= 95 &&
      state.mouseY >= 15 &&
      state.mouseY <= 45
    ) {
      state.reconMode = !state.reconMode;
      return;
    }

    const cue = getCueBall();
    if (!cue.alive) return;
    const dx = state.mouseX - cue.x;
    const dy = state.mouseY - cue.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 40) {
      state.dragging = true;
      state.charging = true;
      state.chargeTime = 0;
      state.dragStartX = state.mouseX;
      state.dragStartY = state.mouseY;
    }
  });

  canvas.addEventListener('mousemove', (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = C.W / rect.width;
    const scaleY = C.H / rect.height;
    state.mouseX = (e.clientX - rect.left) * scaleX;
    state.mouseY = (e.clientY - rect.top) * scaleY;
    state.parallaxTargetX = (state.mouseX - C.W / 2) * 0.008;
    state.parallaxTargetY = (state.mouseY - C.H / 2) * 0.008;
    state.parallaxTargetX = Math.max(-6, Math.min(6, state.parallaxTargetX));
    state.parallaxTargetY = Math.max(-6, Math.min(6, state.parallaxTargetY));
    if (
      state.gameState === 'PLAYING' &&
      state.turnPhase === 'AIM' &&
      isHumanTurn()
    ) {
      if (state.mouseX >= 15 && state.mouseX <= 95 && state.mouseY >= 15 && state.mouseY <= 45) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'crosshair';
      }
    } else if (state.gameState === 'PLAYING' && state.turnPhase === 'ROLLING') {
      canvas.style.cursor = 'default';
    } else {
      canvas.style.cursor = 'default';
    }
  });

  canvas.addEventListener('mouseup', () => {
    state.mouseDown = false;
    if (
      state.dragging &&
      state.charging &&
      state.gameState === 'PLAYING' &&
      isHumanTurn() &&
      state.turnPhase === 'AIM'
    ) {
      const cue = getCueBall();
      if (cue.alive && state.power > 0.05) {
        const dx = cue.x - state.mouseX;
        const dy = cue.y - state.mouseY;
        const angle = Math.atan2(dy, dx);
        if (state.reconMode) {
          fireRecon(angle);
        } else {
          fireShot(angle, state.power);
        }
      }
    }
    state.dragging = false;
    state.charging = false;
    state.power = 0;
    state.chargeTime = 0;
  });

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    initAudio();

    if (e.code === 'Escape') {
      if (state.gameState === 'PLAYING') {
        state.paused = !state.paused;
      }
      return;
    }

    if (e.code === 'KeyC') {
      state.colorBlind = !state.colorBlind;
      const indicator = document.getElementById('colorblindIndicator');
      if (indicator) {
        indicator.classList.toggle('hidden', !state.colorBlind);
      }
      return;
    }

    if (e.code === 'KeyT') {
      if (state.gameState === 'PLAYING') {
        state.paused = false;
        state.gameState = 'TUTORIAL';
        state.tutorialStep = 0;
        return;
      }
      if (state.gameState === 'MENU' || state.gameState === 'PRELOAD') {
        state.gameState = 'TUTORIAL';
        state.tutorialStep = 0;
        state.tutorialSeen = true;
        return;
      }
    }

    if (state.paused) {
      if (e.code === 'Space') {
        state.paused = false;
        return;
      }
      if (e.code === 'KeyR') {
        state.paused = false;
        resetGame();
        state.gameState = 'COUNTDOWN';
        state.countdownVal = 3;
        state.countdownTimer = 0;
        return;
      }
      if (e.code === 'KeyT') {
        state.paused = false;
        state.gameState = 'TUTORIAL';
        state.tutorialStep = 0;
        return;
      }
      return;
    }

    if (e.code === 'Space') {
      if (state.gameState === 'PRELOAD' || state.gameState === 'MENU') {
        if (!state.tutorialSeen) {
          state.gameState = 'TUTORIAL';
          state.tutorialStep = 0;
          state.tutorialSeen = true;
        } else {
          resetGame();
          state.gameState = 'COUNTDOWN';
          state.countdownVal = 3;
          state.countdownTimer = 0;
        }
      } else if (state.gameState === 'TUTORIAL') {
        state.tutorialStep++;
        if (state.tutorialStep >= C.TUTORIAL_STEPS) {
          resetGame();
          state.gameState = 'COUNTDOWN';
          state.countdownVal = 3;
          state.countdownTimer = 0;
        }
      } else if (state.gameState === 'ENDSCREEN') {
        state.gameState = 'MENU';
      }
    }
  });
}
