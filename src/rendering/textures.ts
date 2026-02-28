import { C } from '../core/constants.ts';
import { fctx, wctx } from './canvas.ts';

export function prerenderFelt(): void {
  fctx.fillStyle = C.FELT_COLOR;
  fctx.fillRect(0, 0, C.TABLE_W, C.TABLE_H);
  for (let i = 0; i < C.NOISE_DOTS; i++) {
    const x = Math.random() * C.TABLE_W;
    const y = Math.random() * C.TABLE_H;
    const a = 0.03 + Math.random() * 0.05;
    fctx.fillStyle = `rgba(255,255,255,${a})`;
    fctx.beginPath();
    fctx.arc(x, y, 0.5, 0, Math.PI * 2);
    fctx.fill();
  }
  for (let i = 0; i < 200; i++) {
    const fx = Math.random() * C.TABLE_W;
    const fy = Math.random() * C.TABLE_H;
    const angle = Math.random() * Math.PI * 2;
    const len = 2 + Math.random() * 2;
    fctx.strokeStyle = 'rgba(42,64,48,0.02)';
    fctx.lineWidth = 0.5;
    fctx.beginPath();
    fctx.moveTo(fx, fy);
    fctx.lineTo(fx + Math.cos(angle) * len, fy + Math.sin(angle) * len);
    fctx.stroke();
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
  vg.addColorStop(1, 'rgba(0,0,0,0.12)');
  fctx.fillStyle = vg;
  fctx.fillRect(0, 0, C.TABLE_W, C.TABLE_H);
}

export function prerenderWood(): void {
  const g = wctx.createLinearGradient(0, 0, C.TABLE_W, 0);
  g.addColorStop(0, '#3d1f0a');
  g.addColorStop(0.5, '#5c2e0e');
  g.addColorStop(1, '#3d1f0a');
  wctx.fillStyle = g;
  wctx.fillRect(0, 0, C.TABLE_W, C.TABLE_H);
  for (let i = 0; i < 60; i++) {
    const y = Math.random() * C.TABLE_H;
    wctx.strokeStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.1})`;
    wctx.lineWidth = 0.5 + Math.random();
    wctx.beginPath();
    wctx.moveTo(0, y);
    wctx.bezierCurveTo(
      C.TABLE_W * 0.3,
      y + (Math.random() - 0.5) * 10,
      C.TABLE_W * 0.7,
      y + (Math.random() - 0.5) * 10,
      C.TABLE_W,
      y,
    );
    wctx.stroke();
  }
}
