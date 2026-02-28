const FADE_DURATION = 0.3; // 300ms
const WARP_LINE_COUNT = 20;
const WIDTH = 1280;
const HEIGHT = 720;

type TransitionPhase = 'NONE' | 'FADE_OUT' | 'FADE_IN';

export class ScreenTransition {
  private phase: TransitionPhase = 'NONE';
  private timer: number = 0;
  private callback: (() => void) | null = null;

  startFade(callback: () => void): void {
    this.phase = 'FADE_OUT';
    this.timer = 0;
    this.callback = callback;
  }

  update(dt: number): void {
    if (this.phase === 'NONE') return;

    this.timer += dt;

    if (this.phase === 'FADE_OUT' && this.timer >= FADE_DURATION) {
      if (this.callback) {
        this.callback();
        this.callback = null;
      }
      this.phase = 'FADE_IN';
      this.timer = 0;
    } else if (this.phase === 'FADE_IN' && this.timer >= FADE_DURATION) {
      this.phase = 'NONE';
      this.timer = 0;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.phase === 'NONE') return;

    const progress = Math.min(this.timer / FADE_DURATION, 1);
    const alpha = this.phase === 'FADE_OUT' ? progress : 1 - progress;

    // Black overlay
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Warp lines radiating from center
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    const maxLen = Math.max(WIDTH, HEIGHT) * 0.6;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = alpha * 0.6;

    for (let i = 0; i < WARP_LINE_COUNT; i++) {
      const angle = (i / WARP_LINE_COUNT) * Math.PI * 2;
      const innerR = 20 + progress * 40;
      const outerR = innerR + progress * maxLen;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
      ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
      ctx.stroke();
    }

    ctx.restore();
  }

  isActive(): boolean {
    return this.phase !== 'NONE';
  }
}
