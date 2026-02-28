import { C, POCKETS } from '../core/constants.ts';
import { state } from '../core/state.ts';
import { ctx, lightCanvas, lctx } from './canvas.ts';

export function drawDarkness(): void {
  // If supernova is active, skip darkness entirely
  if (state.supernovaActive && state.supernovaTimer > 0) {
    return;
  }

  lctx.fillStyle = 'rgba(5,5,8,0.96)';
  lctx.fillRect(0, 0, C.W, C.H);

  lctx.globalCompositeOperation = 'destination-out';

  const cue = state.balls[0];
  if (cue && cue.alive) {
    const cg = lctx.createRadialGradient(cue.x, cue.y, 0, cue.x, cue.y, C.CUE_LIGHT_R);
    cg.addColorStop(0, 'rgba(0,0,0,1)');
    cg.addColorStop(0.6, 'rgba(0,0,0,0.6)');
    cg.addColorStop(1, 'rgba(0,0,0,0)');
    lctx.fillStyle = cg;
    lctx.fillRect(
      cue.x - C.CUE_LIGHT_R,
      cue.y - C.CUE_LIGHT_R,
      C.CUE_LIGHT_R * 2,
      C.CUE_LIGHT_R * 2,
    );
  }

  const now = performance.now();
  for (const z of state.lightZones) {
    const age = now - z.createdAt;
    if (age > C.TRAIL_DURATION) continue;
    const fade = 1 - age / C.TRAIL_DURATION;
    const alpha = 0.7 * fade;
    const zg = lctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.radius);
    zg.addColorStop(0, `rgba(0,0,0,${alpha})`);
    zg.addColorStop(1, 'rgba(0,0,0,0)');
    lctx.fillStyle = zg;
    lctx.fillRect(z.x - z.radius, z.y - z.radius, z.radius * 2, z.radius * 2);
  }

  // Black holes are always visible — punch through darkness
  for (const pk of POCKETS) {
    const bhR = pk.r + 22;
    const bhGlow = lctx.createRadialGradient(pk.x, pk.y, 0, pk.x, pk.y, bhR);
    bhGlow.addColorStop(0, 'rgba(0,0,0,0.9)');
    bhGlow.addColorStop(0.5, 'rgba(0,0,0,0.5)');
    bhGlow.addColorStop(1, 'rgba(0,0,0,0)');
    lctx.fillStyle = bhGlow;
    lctx.fillRect(pk.x - bhR, pk.y - bhR, bhR * 2, bhR * 2);
  }

  lctx.globalCompositeOperation = 'source-over';

  ctx.drawImage(lightCanvas, 0, 0);
}
