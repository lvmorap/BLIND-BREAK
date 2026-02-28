import type { GameInfo } from '../games/IGame.ts';

const P1_COLOR = '#00e5ff';
const P2_COLOR = '#ff4466';
const TEXT_COLOR = '#e0d5c0';
const BG_COLOR = '#050508';

interface MenuParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export type MenuAction = { type: 'tournament' } | { type: 'freeplay'; gameId: string } | null;

export class MenuScreen {
  private games: GameInfo[];
  private particles: MenuParticle[] = [];
  private selectedIndex: number = 0;
  private mode: 'select' | 'freeplay' = 'select';
  private animTime: number = 0;

  constructor(games: GameInfo[]) {
    this.games = games;
    this.initParticles();
  }

  private initParticles(): void {
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.3 + 0.05,
      });
    }
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

    // Update particles
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 0 || p.x > 1280) p.vx *= -1;
      if (p.y < 0 || p.y > 720) p.vy *= -1;
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
      // Free play mode - navigate game cards
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

    // Background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    // Particles
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Title
    ctx.textAlign = 'center';
    ctx.font = '700 52px Orbitron, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SPORT FUSION', w / 2, 90);
    ctx.font = '700 36px Orbitron, sans-serif';
    ctx.fillStyle = P1_COLOR;
    ctx.fillText('ARENA', w / 2, 132);

    // Game cards - 3x2 grid
    const gridX = w / 2 - 300;
    const gridY = 170;
    const cardW = 180;
    const cardH = 140;
    const gapX = 20;
    const gapY = 16;

    for (let i = 0; i < this.games.length; i++) {
      const game = this.games[i];
      if (!game) continue;
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = gridX + col * (cardW + gapX);
      const cy = gridY + row * (cardH + gapY);

      const isSelected = this.mode === 'freeplay' && i === this.selectedIndex;

      // Card background
      ctx.fillStyle = isSelected ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)';
      ctx.strokeStyle = isSelected ? game.color : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(cx, cy, cardW, cardH, 8);
      ctx.fill();
      ctx.stroke();

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
    }

    // Buttons area
    const btnY = gridY + 2 * (cardH + gapY) + 30;

    if (this.mode === 'select') {
      // Tournament button
      this.drawButton(ctx, w / 2 - 170, btnY, 150, 44, 'TOURNAMENT', P1_COLOR);
      // Free play button
      this.drawButton(ctx, w / 2 + 20, btnY, 150, 44, 'FREE PLAY', P2_COLOR);

      ctx.font = '400 14px Rajdhani, sans-serif';
      ctx.fillStyle = TEXT_COLOR;
      ctx.textAlign = 'center';
      ctx.fillText('P1: F = Tournament  |  P1: G = Free Play', w / 2, btnY + 70);
    } else {
      ctx.font = '500 18px Rajdhani, sans-serif';
      ctx.fillStyle = TEXT_COLOR;
      ctx.textAlign = 'center';
      ctx.fillText('SELECT A GAME — WASD/Arrows to navigate, F/RShift to confirm', w / 2, btnY);
      ctx.font = '400 14px Rajdhani, sans-serif';
      ctx.fillStyle = '#888888';
      ctx.fillText('G / Enter to go back', w / 2, btnY + 24);
    }

    // Player colors legend
    ctx.font = '500 14px Rajdhani, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = P1_COLOR;
    ctx.fillText('● P1: WASD + F/G', 20, h - 20);
    ctx.textAlign = 'right';
    ctx.fillStyle = P2_COLOR;
    ctx.fillText('P2: Arrows + RShift/Enter ●', w - 20, h - 20);
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
