import { C } from '../core/constants.ts';

function getCanvas(): HTMLCanvasElement {
  const el = document.getElementById('gameCanvas');
  if (!(el instanceof HTMLCanvasElement)) {
    throw new Error('Canvas element #gameCanvas not found');
  }
  return el;
}

function get2DContext(c: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = c.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D rendering context');
  }
  return ctx;
}

export const canvas = getCanvas();
export const ctx = get2DContext(canvas);

export const lightCanvas = document.createElement('canvas');
lightCanvas.width = C.W;
lightCanvas.height = C.H;
export const lctx = get2DContext(lightCanvas);

export const feltCanvas = document.createElement('canvas');
feltCanvas.width = C.TABLE_W;
feltCanvas.height = C.TABLE_H;
export const fctx = get2DContext(feltCanvas);

export const woodCanvas = document.createElement('canvas');
woodCanvas.width = C.TABLE_W;
woodCanvas.height = C.TABLE_H;
export const wctx = get2DContext(woodCanvas);
