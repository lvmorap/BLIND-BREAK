import type { GameInfo } from '../games/IGame.ts';
import { StarfieldBackground } from '../core/StarfieldBackground.ts';
import { COLORS } from '../core/Colors.ts';

const P1_COLOR = COLORS.P1_CYAN;
const P2_COLOR = COLORS.P2_MAGENTA;

export type MenuAction = { type: 'tournament' } | { type: 'freeplay'; gameId: string } | null;

export class MenuScreen {
  private games: GameInfo[];
  private starfield: StarfieldBackground;
  private selectedIndex: number = 0;
  private mode: 'select' | 'freeplay' = 'select';
  private animTime: number = 0;
  private cardOffsets: number[];
  private cardTargets: number[];

  constructor(games: GameInfo[]) {
    this.games = games;
    this.starfield = new StarfieldBackground();
    this.starfield.init(180);
    this.cardOffsets = games.map((_, i) => 20 + i * 20);
    this.cardTargets = games.map(() => 0);
  }

  update(
    dt: number,
    upPressed: boolean,
    downPressed: boolean,
    leftPressed: boolean,
    rightPressed: boolean,
    action1Pressed: boolean,
    action2Pressed: boolean,
  ): MenuAction {
    this.animTime += dt;

    // Animate card slide-in (staggered)
    for (let i = 0; i < this.cardOffsets.length; i++) {
      const offset = this.cardOffsets[i];
      const target = this.cardTargets[i];
      if (offset !== undefined && target !== undefined) {
        this.cardOffsets[i] = offset + (target - offset) * Math.min(dt * (4 + i * 0.5), 1);
      }
    }

    if (this.mode === 'select') {
      if (action1Pressed) {
        return { type: 'tournament' };
      }
      if (action2Pressed) {
        this.mode = 'freeplay';
        return null;
      }
    } else {
      if (leftPressed && this.selectedIndex > 0) {
        this.selectedIndex--;
      }
      if (rightPressed && this.selectedIndex < this.games.length - 1) {
        this.selectedIndex++;
      }
      if (upPressed && this.selectedIndex >= 3) {
        this.selectedIndex -= 3;
      }
      if (downPressed && this.selectedIndex < this.games.length - 3) {
        this.selectedIndex += 3;
      }
      if (action1Pressed) {
        const game = this.games[this.selectedIndex];
        if (game) {
          return { type: 'freeplay', gameId: game.id };
        }
      }
      if (action2Pressed) {
        this.mode = 'select';
        return null;
      }
    }

    return null;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Starfield background
    this.starfield.render(ctx, 0.016);

    // Title: NEXARI
    ctx.textAlign = 'center';
    ctx.font = '900 72px Orbitron, sans-serif';
    ctx.save();
    ctx.shadowColor = COLORS.NEXARI_CYAN;
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('NEXARI', w / 2, 90);
    ctx.restore();

    // Subtitle: NEXUS ARENA TOURNAMENT
    ctx.font = '700 24px Orbitron, sans-serif';
    ctx.fillStyle = COLORS.NEXARI_PURPLE;
    ctx.fillText('NEXARI ARENA TOURNAMENT', w / 2, 125);

    // Tagline
    ctx.font = '400 18px Rajdhani, sans-serif';
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('"SIX WORLDS. ONE CHAMPION."', w / 2, 155);
    ctx.globalAlpha = 1;

    // Game cards - 3x2 grid
    const gridX = w / 2 - 300;
    const gridY = 180;
    const cardW = 180;
    const cardH = 140;
    const gapX = 20;
    const gapY = 16;

    for (let i = 0; i < this.games.length; i++) {
      const game = this.games[i];
      if (!game) continue;
      const col = i % 3;
      const row = Math.floor(i / 3);
      const slideOffset = this.cardOffsets[i] ?? 0;
      const cx = gridX + col * (cardW + gapX);
      const cy = gridY + row * (cardH + gapY) + slideOffset;

      const isSelected = this.mode === 'freeplay' && i === this.selectedIndex;
      const scale = isSelected ? 1.04 : 1;

      ctx.save();
      const centerX = cx + cardW / 2;
      const centerY = cy + cardH / 2;
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);
      ctx.translate(-centerX, -centerY);

      // Card background
      ctx.fillStyle = isSelected ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)';
      ctx.beginPath();
      ctx.roundRect(cx, cy, cardW, cardH, 8);
      ctx.fill();

      // Border glow
      if (isSelected) {
        ctx.save();
        ctx.shadowColor = game.color;
        ctx.shadowBlur = 18;
        ctx.strokeStyle = game.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cx, cy, cardW, cardH, 8);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cx, cy, cardW, cardH, 8);
        ctx.stroke();
      }

      // Icon
      ctx.font = '40px serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(game.icon, cx + cardW / 2, cy + 52);

      // Name
      ctx.font = '600 14px Rajdhani, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(game.name, cx + cardW / 2, cy + 85);

      // Subtitle
      ctx.font = '400 12px Rajdhani, sans-serif';
      ctx.fillStyle = '#888888';
      ctx.fillText(game.subtitle, cx + cardW / 2, cy + 105);

      ctx.restore();
    }

    // Buttons area
    const btnY = gridY + 2 * (cardH + gapY) + 30;

    if (this.mode === 'select') {
      this.drawButton(ctx, w / 2 - 170, btnY, 150, 44, 'TOURNAMENT', P1_COLOR);
      this.drawButton(ctx, w / 2 + 20, btnY, 150, 44, 'FREE PLAY', P2_COLOR);

      ctx.font = '400 14px Rajdhani, sans-serif';
      ctx.fillStyle = '#e0d5c0';
      ctx.textAlign = 'center';
      ctx.fillText('P1: F = Tournament  |  P1: G = Free Play', w / 2, btnY + 70);
    } else {
      ctx.font = '500 18px Rajdhani, sans-serif';
      ctx.fillStyle = '#e0d5c0';
      ctx.textAlign = 'center';
      ctx.fillText('SELECT A GAME — WASD/Arrows to navigate, F/RShift to confirm', w / 2, btnY);
      ctx.font = '400 14px Rajdhani, sans-serif';
      ctx.fillStyle = '#888888';
      ctx.fillText('G / Enter to go back', w / 2, btnY + 24);
    }

    // Bottom bar: P1 vs P2 score tracker pills
    const pillW = 120;
    const pillH = 28;
    const pillY = h - 44;

    // P1 pill
    ctx.fillStyle = P1_COLOR + '33';
    ctx.strokeStyle = P1_COLOR;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(20, pillY, pillW, pillH, 14);
    ctx.fill();
    ctx.stroke();
    ctx.font = '600 14px Rajdhani, sans-serif';
    ctx.fillStyle = P1_COLOR;
    ctx.textAlign = 'center';
    ctx.fillText('● HUMAN: WASD', 20 + pillW / 2, pillY + 19);

    // P2 pill
    ctx.fillStyle = P2_COLOR + '33';
    ctx.strokeStyle = P2_COLOR;
    ctx.beginPath();
    ctx.roundRect(w - 20 - pillW, pillY, pillW, pillH, 14);
    ctx.fill();
    ctx.stroke();
    ctx.font = '600 14px Rajdhani, sans-serif';
    ctx.fillStyle = P2_COLOR;
    ctx.textAlign = 'center';
    ctx.fillText('ALIEN: Arrows ●', w - 20 - pillW / 2, pillY + 19);
  }

  private drawButton(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    bw: number,
    bh: number,
    label: string,
    color: string,
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, bw, bh, 6);
    ctx.stroke();

    ctx.fillStyle = color + '18';
    ctx.fill();

    ctx.font = '700 16px Orbitron, sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(label, x + bw / 2, y + bh / 2 + 6);
  }
}
