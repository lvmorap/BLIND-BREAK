import { C, POCKETS } from '../core/constants.ts';
import { state } from '../core/state.ts';
import { ctx, lightCanvas, lctx } from './canvas.ts';

export function drawDarkness(): void {
  lctx.fillStyle = `rgba(5,5,8,${C.DARKNESS_ALPHA})`;
  lctx.fillRect(0, 0, C.W, C.H);

  lctx.globalCompositeOperation = 'destination-out';

  const cue = state.balls[0];
  if (cue && cue.alive && state.turnPhase === 'ROLLING') {
    const cg = lctx.createRadialGradient(cue.x, cue.y, 0, cue.x, cue.y, C.LIGHT_CUE_R);
    cg.addColorStop(0, 'rgba(0,0,0,1)');
    cg.addColorStop(1, 'rgba(0,0,0,0)');
    lctx.fillStyle = cg;
    lctx.fillRect(
      cue.x - C.LIGHT_CUE_R,
      cue.y - C.LIGHT_CUE_R,
      C.LIGHT_CUE_R * 2,
      C.LIGHT_CUE_R * 2,
    );
  }

  for (const pk of POCKETS) {
    const pg = lctx.createRadialGradient(pk.x, pk.y, 0, pk.x, pk.y, 35);
    pg.addColorStop(0, 'rgba(0,0,0,0.4)');
    pg.addColorStop(1, 'rgba(0,0,0,0)');
    lctx.fillStyle = pg;
    lctx.fillRect(pk.x - 35, pk.y - 35, 70, 70);
  }

  for (const z of state.lightZones) {
    const roundAge = state.currentRound - z.createdAtRound;
    let mult: number;
    if (roundAge === 0) mult = 0.92;
    else if (roundAge === 1) mult = 0.5;
    else if (roundAge === 2) mult = 0.2;
    else continue;

    const zg = lctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.radius);
    zg.addColorStop(0, `rgba(0,0,0,${mult})`);
    zg.addColorStop(1, 'rgba(0,0,0,0)');
    lctx.fillStyle = zg;
    lctx.fillRect(z.x - z.radius, z.y - z.radius, z.radius * 2, z.radius * 2);
  }

  lctx.globalCompositeOperation = 'source-over';

  ctx.drawImage(lightCanvas, 0, 0);
}
