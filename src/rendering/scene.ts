import { C } from '../core/constants.ts';
import { state } from '../core/state.ts';
import { ctx } from './canvas.ts';
import {
  drawBrickWall,
  drawWallSconces,
  drawTable,
  drawLamps,
  drawNeonSign,
  drawTableOutline,
} from './table.ts';
import { drawBalls } from './balls.ts';
import { drawDarkness } from './darkness.ts';
import {
  drawHUD,
  drawAimLine,
  drawAlienHand,
  drawPowerBar,
  drawReconButton,
  drawChargingEffects,
  drawReconBeams,
  drawSupernovaEffect,
  drawPopups,
  drawParticlesView,
  drawNumberBouncePopups,
  drawRoundTransition,
  drawFirstShotCoach,
  drawLaserBeam,
  drawComets,
} from './hud.ts';
import { drawAIThinking } from '../ai/ai.ts';

export function drawScene(t: number): void {
  ctx.save();
  ctx.translate(state.parallaxX, state.parallaxY);
  drawBrickWall();
  drawWallSconces();
  ctx.restore();

  const tableParX = state.parallaxTargetX * 0.375;
  const tableParY = state.parallaxTargetY * 0.375;
  ctx.save();
  ctx.translate(tableParX, tableParY);
  drawTable();
  drawLamps();
  ctx.restore();

  drawBalls();
  drawDarkness();
  drawSupernovaEffect();
  drawTableOutline();
  drawComets();
  drawParticlesView();
  drawNumberBouncePopups();
  drawNeonSign(t);
  drawAimLine();
  drawAlienHand();
  drawLaserBeam();
  drawChargingEffects(t);
  drawPowerBar();
  drawReconButton();
  drawAIThinking();
  drawReconBeams(t);
  drawPopups();
  drawHUD();
  drawRoundTransition();
  drawFirstShotCoach(t);

  const vigAlpha = 0.15 + 0.03 * Math.sin((state.breathTimer * 2 * Math.PI) / 6.5);
  const vig = ctx.createRadialGradient(C.W / 2, C.H / 2, C.W * 0.25, C.W / 2, C.H / 2, C.W * 0.6);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, `rgba(0,0,0,${vigAlpha})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, C.W, C.H);
}
