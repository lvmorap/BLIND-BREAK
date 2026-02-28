import type { IGame, GameInfo } from './games/IGame.ts';
import { GameManager } from './core/GameManager.ts';

// Placeholder game for registry entries until real games are implemented
class PlaceholderGame implements IGame {
  private finished: boolean = false;
  private timer: number = 0;
  private winner: 1 | 2 | null = null;
  private gameName: string;

  constructor(name: string) {
    this.gameName = name;
  }

  init(_canvas: HTMLCanvasElement, _ctx: CanvasRenderingContext2D): void {
    this.finished = false;
    this.timer = 0;
    this.winner = null;
  }

  update(dt: number): void {
    this.timer += dt;
    if (this.timer >= 5) {
      this.finished = true;
      this.winner = Math.random() < 0.5 ? 1 : 2;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.font = '700 32px Orbitron, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.gameName, w / 2, h / 2 - 20);

    ctx.font = '400 18px Rajdhani, sans-serif';
    ctx.fillStyle = '#888888';
    ctx.fillText('Coming Soon...', w / 2, h / 2 + 20);

    const remaining = Math.max(0, 5 - this.timer);
    ctx.font = '700 24px Orbitron, sans-serif';
    ctx.fillStyle = '#e0d5c0';
    ctx.fillText(Math.ceil(remaining).toString(), w / 2, h / 2 + 70);
  }

  destroy(): void {
    /* no-op */
  }

  getWinner(): 1 | 2 | null {
    return this.winner;
  }

  isFinished(): boolean {
    return this.finished;
  }
}

const gameRegistry: GameInfo[] = [
  {
    id: 'neon-pong',
    name: 'NEON PONG',
    subtitle: 'Classic reimagined',
    icon: '🏓',
    color: '#00e5ff',
    factory: (): IGame => new PlaceholderGame('NEON PONG'),
  },
  {
    id: 'turbo-volleyball',
    name: 'TURBO VOLLEYBALL',
    subtitle: 'Spike to win',
    icon: '🏐',
    color: '#ff4466',
    factory: (): IGame => new PlaceholderGame('TURBO VOLLEYBALL'),
  },
  {
    id: 'goal-rush',
    name: 'GOAL RUSH',
    subtitle: 'Score the goal',
    icon: '⚽',
    color: '#44ff66',
    factory: (): IGame => new PlaceholderGame('GOAL RUSH'),
  },
  {
    id: 'basket-brawl',
    name: 'BASKET BRAWL',
    subtitle: 'Dunk or be dunked',
    icon: '🏀',
    color: '#ff8844',
    factory: (): IGame => new PlaceholderGame('BASKET BRAWL'),
  },
  {
    id: 'disc-dash',
    name: 'DISC DASH',
    subtitle: 'Air hockey evolved',
    icon: '🥏',
    color: '#aa66ff',
    factory: (): IGame => new PlaceholderGame('DISC DASH'),
  },
  {
    id: 'sprint-clash',
    name: 'SPRINT CLASH',
    subtitle: 'Race to the finish',
    icon: '🏃',
    color: '#ffdd44',
    factory: (): IGame => new PlaceholderGame('SPRINT CLASH'),
  },
];

function main(): void {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const maybeCtx = canvas.getContext('2d');
  if (!maybeCtx) return;
  const ctx: CanvasRenderingContext2D = maybeCtx;

  canvas.width = 1280;
  canvas.height = 720;

  const manager = new GameManager(canvas, ctx, gameRegistry);
  let prevTime = 0;

  const w = canvas.width;
  const h = canvas.height;

  function gameLoop(timestamp: number): void {
    const dt = Math.min((timestamp - prevTime) / 1000, 0.05);
    prevTime = timestamp;

    ctx.clearRect(0, 0, w, h);
    manager.update(dt);
    manager.render(ctx);

    requestAnimationFrame(gameLoop);
  }

  void document.fonts.ready.then((): void => {
    requestAnimationFrame((t: number): void => {
      prevTime = t;
      gameLoop(t);
    });
  });
}

main();
