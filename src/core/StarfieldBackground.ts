import { COLORS } from './Colors.ts';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
}

const WIDTH = 1280;
const HEIGHT = 720;

export class StarfieldBackground {
  private stars: Star[] = [];
  private elapsed: number = 0;

  init(count: number = 150): void {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 2 + 1,
      });
    }
  }

  render(ctx: CanvasRenderingContext2D, dt: number): void {
    this.elapsed += dt;

    // Fill background
    ctx.fillStyle = COLORS.NEBULA_BG;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Nebula layer with radial gradient
    const gradient = ctx.createRadialGradient(
      WIDTH / 2,
      HEIGHT / 2,
      0,
      WIDTH / 2,
      HEIGHT / 2,
      WIDTH * 0.6,
    );
    gradient.addColorStop(0, 'rgba(20, 10, 60, 0.35)');
    gradient.addColorStop(0.5, 'rgba(10, 5, 40, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Twinkling stars
    for (const star of this.stars) {
      const flicker = Math.sin(this.elapsed * star.twinkleSpeed) * 0.3 + 0.7;
      const alpha = star.opacity * flicker;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = COLORS.STAR_WHITE;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }
}
