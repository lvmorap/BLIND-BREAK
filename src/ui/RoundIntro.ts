import { Tween, TweenManager, easeOutBack } from '../core/TweenEngine.ts';

export class RoundIntro {
  private timer: number = 0;
  private scale: number = 0;
  private tweenManager: TweenManager;
  private icon: string;
  private gameName: string;
  private subtitle: string;
  private roundNum: number;
  private totalRounds: number;

  constructor(
    icon: string,
    gameName: string,
    subtitle: string,
    roundNum: number,
    totalRounds: number,
    tweenManager: TweenManager,
  ) {
    this.icon = icon;
    this.gameName = gameName;
    this.subtitle = subtitle;
    this.roundNum = roundNum;
    this.totalRounds = totalRounds;
    this.tweenManager = tweenManager;

    this.tweenManager.add(
      Tween.create(0, 1, 0.6, easeOutBack, (v: number): void => {
        this.scale = v;
      }),
    );
  }

  update(dt: number): boolean {
    this.timer += dt;
    this.tweenManager.update(dt);
    return this.timer >= 4;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Dark background with radial gradient
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
    grad.addColorStop(0, 'rgba(20, 18, 30, 0.95)');
    grad.addColorStop(1, 'rgba(5, 5, 8, 0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(this.scale, this.scale);

    // Round number
    ctx.font = '600 20px Rajdhani, sans-serif';
    ctx.fillStyle = '#e0d5c0';
    ctx.textAlign = 'center';
    ctx.fillText(`ROUND ${this.roundNum} / ${this.totalRounds}`, 0, -100);

    // Icon
    ctx.font = '80px serif';
    ctx.fillText(this.icon, 0, -10);

    // Game name
    ctx.font = '700 48px Orbitron, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.gameName, 0, 60);

    // Subtitle
    ctx.font = '400 22px Rajdhani, sans-serif';
    ctx.fillStyle = '#a0a0a0';
    ctx.fillText(this.subtitle, 0, 95);

    ctx.restore();
  }
}
