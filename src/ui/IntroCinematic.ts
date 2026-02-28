import { COLORS } from '../core/Colors.ts';

const WIDTH = 1280;
const HEIGHT = 720;

const FLAVOR_TEXTS = [
  'Calibrating quantum entanglement arrays...',
  'Synchronizing orbital trajectories...',
  'Decrypting Nexari broadcast frequencies...',
  'Establishing sub-space relay...',
  'Aligning Saturn ring transponders...',
  'Loading combat protocols...',
];

const LORE_LINES = [
  'The Nexari watched humanity for centuries.',
  'They studied our games — our competitions.',
  'They found beauty in our need to struggle.',
  'Now they have chosen six of our sports...',
  'Reimagined them in the arenas of deep space.',
  '"Prove yourselves worthy," they said.',
  '"One champion. Six worlds. Begin."',
];

interface BootStar {
  x: number;
  y: number;
  size: number;
  twinkleSpeed: number;
  phase: number;
}

interface ParallaxStar {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
}

export class IntroCinematic {
  private elapsed = 0;
  private done = false;
  private canSkip = false;

  // Boot stage
  private bootStars: BootStar[] = [];
  private loadProgress = 0;
  private flavorIndex = 0;
  private flavorTimer = 0;
  private flavorCharIndex = 0;
  private currentFlavorText = '';

  // Cinematic stage
  private cinematicStars: ParallaxStar[] = [];
  private cinematicStarsFar: ParallaxStar[] = [];
  private saturnOpacity = 0;
  private loreLineIndex = 0;
  private loreCharIndex = 0;
  private loreTimer = 0;
  private displayedLoreLines: string[] = [];
  private currentLoreText = '';

  private handleKeyDown: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    this.initBootStars();
    this.initCinematicStars();
    this.currentFlavorText = FLAVOR_TEXTS[0] ?? '';

    this.handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code === 'Space' && this.canSkip) {
        this.done = true;
      }
    };
    window.addEventListener('keydown', this.handleKeyDown);
  }

  private initBootStars(): void {
    for (let i = 0; i < 200; i++) {
      this.bootStars.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        size: Math.random() * 1.8 + 0.4,
        twinkleSpeed: Math.random() * 3 + 1,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  private initCinematicStars(): void {
    for (let i = 0; i < 120; i++) {
      this.cinematicStars.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: 15 + Math.random() * 10,
        alpha: Math.random() * 0.6 + 0.3,
      });
    }
    for (let i = 0; i < 80; i++) {
      this.cinematicStarsFar.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        size: Math.random() * 1.2 + 0.3,
        speed: 5 + Math.random() * 5,
        alpha: Math.random() * 0.3 + 0.1,
      });
    }
  }

  update(dt: number): boolean {
    if (this.done) return true;

    this.elapsed += dt;

    if (this.elapsed >= 2) {
      this.canSkip = true;
    }
    if (this.elapsed >= 12) {
      this.done = true;
      return true;
    }

    if (this.elapsed < 4) {
      this.updateBoot(dt);
    } else {
      this.updateCinematic(dt);
    }

    return false;
  }

  private updateBoot(dt: number): void {
    this.loadProgress = Math.min(this.elapsed / 3.8, 1);

    this.flavorTimer += dt;
    const src = FLAVOR_TEXTS[this.flavorIndex] ?? '';
    if (this.flavorCharIndex < src.length) {
      this.flavorCharIndex += dt * 40;
      this.currentFlavorText = src.substring(0, Math.floor(this.flavorCharIndex));
    }

    if (this.flavorTimer >= 1.5) {
      this.flavorTimer = 0;
      this.flavorIndex = (this.flavorIndex + 1) % FLAVOR_TEXTS.length;
      this.flavorCharIndex = 0;
      this.currentFlavorText = '';
    }
  }

  private updateCinematic(dt: number): void {
    const cinematicTime = this.elapsed - 4;

    // Saturn fade in over first 2s of cinematic
    this.saturnOpacity = Math.min(cinematicTime / 2, 1);

    // Move parallax stars
    for (const star of this.cinematicStars) {
      star.x -= star.speed * dt;
      if (star.x < 0) {
        star.x = WIDTH;
        star.y = Math.random() * HEIGHT;
      }
    }
    for (const star of this.cinematicStarsFar) {
      star.x -= star.speed * dt;
      if (star.x < 0) {
        star.x = WIDTH;
        star.y = Math.random() * HEIGHT;
      }
    }

    // Lore typewriter — one line every ~1s, typewriter within
    this.loreTimer += dt;
    const loreSrc = LORE_LINES[this.loreLineIndex];
    if (loreSrc && this.loreCharIndex < loreSrc.length) {
      this.loreCharIndex += dt * 35;
      this.currentLoreText = loreSrc.substring(0, Math.floor(this.loreCharIndex));
    }

    if (this.loreTimer >= 1.0 && this.loreLineIndex < LORE_LINES.length) {
      if (this.currentLoreText.length > 0) {
        this.displayedLoreLines.push(LORE_LINES[this.loreLineIndex] ?? '');
      }
      this.loreTimer = 0;
      this.loreLineIndex++;
      this.loreCharIndex = 0;
      this.currentLoreText = '';
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.elapsed < 4) {
      this.renderBoot(ctx);
    } else {
      this.renderCinematic(ctx);
    }

    // Skip indicator
    if (this.canSkip) {
      const pulse = Math.sin(this.elapsed * 3) * 0.3 + 0.7;
      ctx.globalAlpha = pulse;
      ctx.font = '500 16px Rajdhani, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('[SPACE] Skip', WIDTH / 2, HEIGHT - 30);
      ctx.globalAlpha = 1;
    }
  }

  private renderBoot(ctx: CanvasRenderingContext2D): void {
    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Twinkling stars
    for (const star of this.bootStars) {
      const flicker = Math.sin(this.elapsed * star.twinkleSpeed + star.phase) * 0.4 + 0.6;
      ctx.globalAlpha = flicker;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Title text
    ctx.font = '700 28px Orbitron, sans-serif';
    ctx.fillStyle = COLORS.SUCCESS;
    ctx.textAlign = 'center';
    ctx.fillText('ESTABLISHING NEXARI LINK...', WIDTH / 2, HEIGHT / 2 - 60);

    // Progress bar
    const barW = 400;
    const barH = 12;
    const barX = (WIDTH - barW) / 2;
    const barY = HEIGHT / 2 - 10;

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 6);
    ctx.fill();

    ctx.fillStyle = COLORS.SUCCESS;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * this.loadProgress, barH, 6);
    ctx.fill();

    // Glow on progress bar
    ctx.shadowColor = COLORS.SUCCESS;
    ctx.shadowBlur = 15;
    ctx.fillStyle = COLORS.SUCCESS;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * this.loadProgress, barH, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Flavor text
    ctx.font = '400 16px Rajdhani, sans-serif';
    ctx.fillStyle = '#7799bb';
    ctx.fillText(this.currentFlavorText, WIDTH / 2, HEIGHT / 2 + 30);
  }

  private renderCinematic(ctx: CanvasRenderingContext2D): void {
    // Deep blue-purple gradient
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#050520');
    grad.addColorStop(0.5, '#0a0830');
    grad.addColorStop(1, '#12082a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Far stars (slow layer)
    for (const star of this.cinematicStarsFar) {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = '#aabbdd';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Near stars (fast layer)
    for (const star of this.cinematicStars) {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = COLORS.STAR_WHITE;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Saturn ring silhouette — rises from below
    this.renderSaturnRing(ctx);

    // Lore text
    const baseY = 160;
    const lineHeight = 28;

    for (let i = 0; i < this.displayedLoreLines.length; i++) {
      const line = this.displayedLoreLines[i];
      if (!line) continue;
      ctx.font = '400 18px Rajdhani, sans-serif';
      ctx.fillStyle = COLORS.NEXARI_CYAN;
      ctx.textAlign = 'center';
      ctx.fillText(line, WIDTH / 2, baseY + i * lineHeight);
    }

    // Current typing line
    if (this.currentLoreText) {
      ctx.font = '400 18px Rajdhani, sans-serif';
      ctx.fillStyle = COLORS.NEXARI_CYAN;
      ctx.textAlign = 'center';
      ctx.fillText(
        this.currentLoreText,
        WIDTH / 2,
        baseY + this.displayedLoreLines.length * lineHeight,
      );
    }
  }

  private renderSaturnRing(ctx: CanvasRenderingContext2D): void {
    const riseOffset = (1 - this.saturnOpacity) * 120;
    const cx = WIDTH / 2;
    const cy = HEIGHT - 80 + riseOffset;

    ctx.save();
    ctx.globalAlpha = this.saturnOpacity * 0.7;

    // Saturn body (dark circle)
    ctx.fillStyle = '#1a1020';
    ctx.beginPath();
    ctx.arc(cx, cy, 100, 0, Math.PI * 2);
    ctx.fill();

    // Ring (ellipse with amber-gold glow)
    ctx.strokeStyle = COLORS.SATURN_RING;
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ffaa33';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 180, 30, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Second ring layer
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#d4a84a';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 200, 36, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  destroy(): void {
    if (this.handleKeyDown) {
      window.removeEventListener('keydown', this.handleKeyDown);
      this.handleKeyDown = null;
    }
  }
}
