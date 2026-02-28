import { C } from '../core/constants.ts';
import { fctx, wctx } from './canvas.ts';

export function prerenderFelt(): void {
  // Dark space background for the playing field
  fctx.fillStyle = C.FELT_COLOR;
  fctx.fillRect(0, 0, C.TABLE_W, C.TABLE_H);

  // Subtle star dust on felt
  for (let i = 0; i < C.NOISE_DOTS; i++) {
    const x = Math.random() * C.TABLE_W;
    const y = Math.random() * C.TABLE_H;
    const a = 0.02 + Math.random() * 0.04;
    fctx.fillStyle = `rgba(150,170,220,${a})`;
    fctx.beginPath();
    fctx.arc(x, y, 0.5, 0, Math.PI * 2);
    fctx.fill();
  }

  // Faint nebula wisps
  for (let i = 0; i < 80; i++) {
    const fx = Math.random() * C.TABLE_W;
    const fy = Math.random() * C.TABLE_H;
    const r = 1 + Math.random() * 3;
    fctx.fillStyle = `rgba(40,30,80,${0.03 + Math.random() * 0.04})`;
    fctx.beginPath();
    fctx.arc(fx, fy, r, 0, Math.PI * 2);
    fctx.fill();
  }

  const vg = fctx.createRadialGradient(
    C.TABLE_W / 2,
    C.TABLE_H / 2,
    C.TABLE_W * 0.25,
    C.TABLE_W / 2,
    C.TABLE_H / 2,
    C.TABLE_W * 0.6,
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.15)');
  fctx.fillStyle = vg;
  fctx.fillRect(0, 0, C.TABLE_W, C.TABLE_H);
}

export function prerenderWood(): void {
  // Energy field border instead of wood
  const g = wctx.createLinearGradient(0, 0, C.TABLE_W, 0);
  g.addColorStop(0, '#0a1030');
  g.addColorStop(0.3, '#101840');
  g.addColorStop(0.5, '#0c1435');
  g.addColorStop(0.7, '#101840');
  g.addColorStop(1, '#0a1030');
  wctx.fillStyle = g;
  wctx.fillRect(0, 0, C.TABLE_W, C.TABLE_H);

  // Energy grid lines
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * C.TABLE_H;
    wctx.strokeStyle = `rgba(60,100,200,${0.03 + Math.random() * 0.06})`;
    wctx.lineWidth = 0.5 + Math.random() * 1;
    wctx.beginPath();
    wctx.moveTo(0, y);
    wctx.bezierCurveTo(
      C.TABLE_W * 0.25,
      y + (Math.random() - 0.5) * 8,
      C.TABLE_W * 0.75,
      y + (Math.random() - 0.5) * 8,
      C.TABLE_W,
      y + (Math.random() - 0.5) * 4,
    );
    wctx.stroke();
  }

  const highlight = wctx.createLinearGradient(0, 0, 0, C.TABLE_H);
  highlight.addColorStop(0, 'rgba(60,100,200,0.04)');
  highlight.addColorStop(0.5, 'rgba(60,100,200,0)');
  highlight.addColorStop(1, 'rgba(0,0,0,0.06)');
  wctx.fillStyle = highlight;
  wctx.fillRect(0, 0, C.TABLE_W, C.TABLE_H);
}
