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

  for (let i = 0; i < 400; i++) {
    const fx = Math.random() * C.TABLE_W;
    const fy = Math.random() * C.TABLE_H;
    const angle = -0.2 + Math.random() * 0.4;
    const len = 3 + Math.random() * 4;
    fctx.strokeStyle = `rgba(42,64,48,${0.02 + Math.random() * 0.02})`;
    fctx.lineWidth = 0.5;
    fctx.beginPath();
    fctx.moveTo(fx, fy);
    fctx.lineTo(fx + Math.cos(angle) * len, fy + Math.sin(angle) * len);
    fctx.stroke();
  }

  for (let i = 0; i < 80; i++) {
    const fx = Math.random() * C.TABLE_W;
    const fy = Math.random() * C.TABLE_H;
    const r = 1 + Math.random() * 3;
    fctx.fillStyle = `rgba(20,40,28,${0.03 + Math.random() * 0.04})`;
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
  const g = wctx.createLinearGradient(0, 0, C.TABLE_W, 0);
  g.addColorStop(0, '#3d1f0a');
  g.addColorStop(0.3, '#5c2e0e');
  g.addColorStop(0.5, '#4a2309');
  g.addColorStop(0.7, '#5c2e0e');
  g.addColorStop(1, '#3d1f0a');
  wctx.fillStyle = g;
  wctx.fillRect(0, 0, C.TABLE_W, C.TABLE_H);

  for (let i = 0; i < 90; i++) {
    const y = Math.random() * C.TABLE_H;
    wctx.strokeStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.12})`;
    wctx.lineWidth = 0.5 + Math.random() * 1.5;
    wctx.beginPath();
    wctx.moveTo(0, y);
    wctx.bezierCurveTo(
      C.TABLE_W * 0.25,
      y + (Math.random() - 0.5) * 12,
      C.TABLE_W * 0.75,
      y + (Math.random() - 0.5) * 12,
      C.TABLE_W,
      y + (Math.random() - 0.5) * 6,
    );
    wctx.stroke();
  }

  for (let i = 0; i < 8; i++) {
    const kx = 20 + Math.random() * (C.TABLE_W - 40);
    const ky = 20 + Math.random() * (C.TABLE_H - 40);
    const kr = 2 + Math.random() * 4;
    const kg = wctx.createRadialGradient(kx, ky, 0, kx, ky, kr);
    kg.addColorStop(0, 'rgba(30,12,4,0.3)');
    kg.addColorStop(1, 'rgba(30,12,4,0)');
    wctx.fillStyle = kg;
    wctx.beginPath();
    wctx.arc(kx, ky, kr, 0, Math.PI * 2);
    wctx.fill();
  }

  const highlight = wctx.createLinearGradient(0, 0, 0, C.TABLE_H);
  highlight.addColorStop(0, 'rgba(255,200,120,0.04)');
  highlight.addColorStop(0.5, 'rgba(255,200,120,0)');
  highlight.addColorStop(1, 'rgba(0,0,0,0.06)');
  wctx.fillStyle = highlight;
  wctx.fillRect(0, 0, C.TABLE_W, C.TABLE_H);
}
