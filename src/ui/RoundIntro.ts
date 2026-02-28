import { Tween, TweenManager, easeOutBack } from '../core/TweenEngine.ts';
import { StarfieldBackground } from '../core/StarfieldBackground.ts';
import { COLORS } from '../core/Colors.ts';

const LORE_MAP: Record<string, string> = {
  billiards: 'The Nexari first observed humans playing billiards in darkened rooms...',
  pingpong: 'The Nexari were baffled that humans chose to play this sport on tables...',
  soccer: 'Zero-gravity soccer was the sport the Nexari understood least...',
  sumo: 'The ancient volcano arena: only the strongest survive the molten fury...',
  formula: 'The Nexari watched human racing and one question haunted them...',
  volleyball: 'The concept of opposing sides separated by a net was immediately comprehensible...',
};

function getGameLoreKey(gameId: string): string {
  if (gameId.includes('blind') || gameId.includes('billiard') || gameId.includes('nebula'))
    return 'billiards';
  if (gameId.includes('ping') || gameId.includes('pulsar')) return 'pingpong';
  if (gameId.includes('soccer') || gameId.includes('zero')) return 'soccer';
  if (gameId.includes('sumo') || gameId.includes('orbital') || gameId.includes('volcan'))
    return 'sumo';
  if (gameId.includes('formula') || gameId.includes('race') || gameId.includes('saturn'))
    return 'formula';
  if (gameId.includes('volley') || gameId.includes('cosmic') || gameId.includes('gravity'))
    return 'volleyball';
  return '';
}

export class RoundIntro {
  private timer: number = 0;
  private scale: number = 0;
  private tweenManager: TweenManager;
  private icon: string;
  private gameName: string;
  private subtitle: string;
  private roundNum: number;
  private totalRounds: number;
  private starfield: StarfieldBackground;
  private loreText: string;
  private spacePressed = false;
  private canSkip = false;

  private handleKeyDown: ((e: KeyboardEvent) => void) | null = null;

  constructor(
    icon: string,
    gameName: string,
    subtitle: string,
    roundNum: number,
    totalRounds: number,
    tweenManager: TweenManager,
    gameId: string = '',
  ) {
    this.icon = icon;
    this.gameName = gameName;
    this.subtitle = subtitle;
    this.roundNum = roundNum;
    this.totalRounds = totalRounds;
    this.tweenManager = tweenManager;
    this.starfield = new StarfieldBackground();
    this.starfield.init(120);

    const loreKey = getGameLoreKey(gameId || gameName.toLowerCase());
    this.loreText = LORE_MAP[loreKey] ?? '';

    this.tweenManager.add(
      Tween.create(0, 1, 0.6, easeOutBack, (v: number): void => {
        this.scale = v;
      }),
    );

    this.handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code === 'Space' && this.canSkip) {
        this.spacePressed = true;
      }
    };
    window.addEventListener('keydown', this.handleKeyDown);
  }

  update(dt: number): boolean {
    this.timer += dt;
    this.tweenManager.update(dt);

    if (this.timer >= 1) {
      this.canSkip = true;
    }

    if (this.spacePressed || this.timer >= 4) {
      this.destroy();
      return true;
    }

    return false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Starfield background
    this.starfield.render(ctx, 0.016);

    // Dark overlay
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
    grad.addColorStop(0, 'rgba(20, 18, 30, 0.6)');
    grad.addColorStop(1, 'rgba(5, 5, 8, 0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Top bar: NEXUS ARENA — ROUND N OF TOTAL
    ctx.font = '600 18px Orbitron, sans-serif';
    ctx.fillStyle = COLORS.NEXARI_PURPLE;
    ctx.textAlign = 'center';
    ctx.fillText(`NEXUS ARENA \u2014 ROUND ${this.roundNum} OF ${this.totalRounds}`, w / 2, 40);

    ctx.save();
    ctx.translate(w / 2, h / 2 - 20);
    ctx.scale(this.scale, this.scale);

    // Icon
    ctx.font = '80px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.icon, 0, -30);

    // Game name with cyan glow
    ctx.save();
    ctx.shadowBlur = 30;
    ctx.shadowColor = COLORS.NEXARI_CYAN;
    ctx.font = '900 64px Orbitron, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.gameName, 0, 55);
    ctx.restore();

    // Subtitle
    ctx.font = '400 22px Rajdhani, sans-serif';
    ctx.fillStyle = '#a0a0a0';
    ctx.fillText(this.subtitle, 0, 90);

    // Lore text
    if (this.loreText) {
      ctx.font = 'italic 16px Rajdhani, sans-serif';
      ctx.fillStyle = '#7799bb';
      ctx.fillText(this.loreText, 0, 125);
    }

    ctx.restore();

    // Pulsing [SPACE] Begin prompt
    if (this.canSkip) {
      const pulse = Math.sin(this.timer * 3) * 0.3 + 0.7;
      ctx.globalAlpha = pulse;
      ctx.font = '500 18px Rajdhani, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('[SPACE] Begin', w / 2, h - 40);
      ctx.globalAlpha = 1;
    }
  }

  private destroy(): void {
    if (this.handleKeyDown) {
      window.removeEventListener('keydown', this.handleKeyDown);
      this.handleKeyDown = null;
    }
  }
}
