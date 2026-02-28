import type { GameInfo } from './games/IGame.ts';
import { GameManager } from './core/GameManager.ts';
import { BlindBreakGame } from './games/BlindBreak/BlindBreakGame.ts';
import { PingPongGame } from './games/PingPong/PingPongGame.ts';
import { SoccerGame } from './games/Soccer/SoccerGame.ts';
import { SumoGame } from './games/Sumo/SumoGame.ts';
import { FormulaGame } from './games/Formula/FormulaGame.ts';
import { VolleyballGame } from './games/Volleyball/VolleyballGame.ts';

const gameRegistry: GameInfo[] = [
  {
    id: 'blind-break',
    name: 'DARK NEBULA BILLIARDS',
    subtitle: 'Shoot through the cosmic dark',
    icon: '🎱',
    color: '#ff3366',
    factory: () => new BlindBreakGame(),
  },
  {
    id: 'ping-pong',
    name: 'PULSAR PING PONG',
    subtitle: 'Reaction speed at lightspeed',
    icon: '🏓',
    color: '#00ccff',
    factory: () => new PingPongGame(),
  },
  {
    id: 'soccer',
    name: 'ZERO-G SOCCER',
    subtitle: 'Goals drift in orbital decay',
    icon: '⚽',
    color: '#44ff66',
    factory: () => new SoccerGame(),
  },
  {
    id: 'sumo',
    name: 'SUMO ORBITAL',
    subtitle: 'Last warrior standing in the ring of Saturn',
    icon: '🥋',
    color: '#c4a44a',
    factory: () => new SumoGame(),
  },
  {
    id: 'formula',
    name: 'SATURN RING RACE',
    subtitle: "Spaceship racing around Saturn's rings",
    icon: '🏎️',
    color: '#aa44ff',
    factory: () => new FormulaGame(),
  },
  {
    id: 'volleyball',
    name: 'COSMIC VOLLEYBALL',
    subtitle: 'Gravity shifts every orbit',
    icon: '🏐',
    color: '#ffffaa',
    factory: () => new VolleyballGame(),
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
