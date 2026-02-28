import type { IGame, GameInfo } from '../games/IGame.ts';
import { TweenManager, Tween, easeOutElastic } from './TweenEngine.ts';
import { InputManager } from './InputManager.ts';
import { audioManager } from './AudioManager.ts';
import { particleSystem } from './ParticleSystem.ts';
import { screenShake } from './ScreenShake.ts';
import { COLORS } from './Colors.ts';
import { StarfieldBackground } from './StarfieldBackground.ts';
import { ScreenTransition } from './ScreenTransition.ts';
import { TournamentHUD } from '../ui/TournamentHUD.ts';
import { RoundIntro } from '../ui/RoundIntro.ts';
import { EndScreen } from '../ui/EndScreen.ts';
import { MenuScreen } from '../ui/MenuScreen.ts';
import type { MenuAction } from '../ui/MenuScreen.ts';

export type GameState =
  | 'MENU'
  | 'ROUND_INTRO'
  | 'COUNTDOWN'
  | 'PLAYING'
  | 'ROUND_RESULT'
  | 'TOURNAMENT_END';

interface RoundRecord {
  gameName: string;
  icon: string;
  winner: 1 | 2 | null;
}

export class GameManager {
  private state: GameState = 'MENU';
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private inputManager: InputManager;
  private tweenManager: TweenManager;
  private registry: GameInfo[];
  private hud: TournamentHUD;
  private menuScreen: MenuScreen;
  private roundIntro: RoundIntro | null = null;
  private endScreen: EndScreen | null = null;
  private starfield: StarfieldBackground;
  private transition: ScreenTransition;

  private currentGame: IGame | null = null;
  private gameOrder: GameInfo[] = [];
  private currentRoundIndex: number = 0;
  private p1Score: number = 0;
  private p2Score: number = 0;
  private roundRecords: RoundRecord[] = [];
  private mode: 'TOURNAMENT' | 'FREE' = 'TOURNAMENT';

  private countdownValue: number = 3;
  private countdownTimer: number = 0;
  private countdownScale: number = 1;

  private resultTimer: number = 0;
  private resultWinner: 1 | 2 | null = null;
  private shakeOffset: { ox: number; oy: number } = { ox: 0, oy: 0 };
  private lastDt: number = 0;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, registry: GameInfo[]) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.registry = registry;
    this.inputManager = new InputManager();
    this.tweenManager = new TweenManager();
    this.hud = new TournamentHUD();
    this.menuScreen = new MenuScreen(registry);
    this.starfield = new StarfieldBackground();
    this.transition = new ScreenTransition();
    this.starfield.init();
    this.inputManager.init();
  }

  startTournament(): void {
    this.mode = 'TOURNAMENT';
    this.p1Score = 0;
    this.p2Score = 0;
    this.roundRecords = [];
    this.currentRoundIndex = 0;
    this.gameOrder = this.shuffleGames(this.registry);
    this.beginRoundIntro();
  }

  startFreePlay(gameId: string): void {
    this.mode = 'FREE';
    this.p1Score = 0;
    this.p2Score = 0;
    this.roundRecords = [];
    this.currentRoundIndex = 0;
    const game = this.registry.find((g) => g.id === gameId);
    if (!game) return;
    this.gameOrder = [game];
    this.beginRoundIntro();
  }

  getCurrentState(): GameState {
    return this.state;
  }

  getScores(): { p1: number; p2: number } {
    return { p1: this.p1Score, p2: this.p2Score };
  }

  getMode(): 'TOURNAMENT' | 'FREE' {
    return this.mode;
  }

  private shuffleGames(games: GameInfo[]): GameInfo[] {
    const shuffled = [...games];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      const other = shuffled[j];
      if (temp && other) {
        shuffled[i] = other;
        shuffled[j] = temp;
      }
    }
    return shuffled;
  }

  private beginRoundIntro(): void {
    this.state = 'ROUND_INTRO';
    this.tweenManager.clear();
    const info = this.gameOrder[this.currentRoundIndex];
    if (!info) return;
    this.roundIntro = new RoundIntro(
      info.icon,
      info.name,
      info.subtitle,
      this.currentRoundIndex + 1,
      this.gameOrder.length,
      this.tweenManager,
    );
    this.hud.setRound(this.currentRoundIndex + 1, this.gameOrder.length, info.name);
    this.hud.setScores(this.p1Score, this.p2Score);
  }

  private beginCountdown(): void {
    this.state = 'COUNTDOWN';
    this.countdownValue = 3;
    this.countdownTimer = 0;
    this.countdownScale = 1;
    this.tweenManager.clear();
    this.startCountdownTween();
    audioManager.playCountdown();
  }

  private startCountdownTween(): void {
    this.tweenManager.add(
      Tween.create(2, 1, 0.8, easeOutElastic, (v: number): void => {
        this.countdownScale = v;
      }),
    );
  }

  private beginPlaying(): void {
    this.state = 'PLAYING';
    this.tweenManager.clear();
    const info = this.gameOrder[this.currentRoundIndex];
    if (!info) return;
    this.currentGame = info.factory();
    this.currentGame.init(this.canvas, this.ctx);
    audioManager.playWhistle();
  }

  private beginResult(): void {
    this.state = 'ROUND_RESULT';
    this.resultTimer = 0;
    this.resultWinner = this.currentGame?.getWinner() ?? null;

    const info = this.gameOrder[this.currentRoundIndex];
    if (info) {
      this.roundRecords.push({
        gameName: info.name,
        icon: info.icon,
        winner: this.resultWinner,
      });
    }

    if (this.resultWinner === 1) {
      this.p1Score++;
    } else if (this.resultWinner === 2) {
      this.p2Score++;
    }

    this.hud.setScores(this.p1Score, this.p2Score);
    audioManager.playScore();

    if (this.currentGame) {
      this.currentGame.destroy();
      this.currentGame = null;
    }
  }

  private beginTournamentEnd(): void {
    this.state = 'TOURNAMENT_END';
    this.endScreen = new EndScreen(this.p1Score, this.p2Score, this.roundRecords);
  }

  update(dt: number): void {
    this.lastDt = dt;
    switch (this.state) {
      case 'MENU':
        this.updateMenu(dt);
        break;
      case 'ROUND_INTRO':
        this.updateRoundIntro(dt);
        break;
      case 'COUNTDOWN':
        this.updateCountdown(dt);
        break;
      case 'PLAYING':
        this.updatePlaying(dt);
        break;
      case 'ROUND_RESULT':
        this.updateRoundResult(dt);
        break;
      case 'TOURNAMENT_END':
        this.updateTournamentEnd(dt);
        break;
    }

    particleSystem.update(dt);
    this.shakeOffset = screenShake.update(dt);
    this.transition.update(dt);
    this.inputManager.update();
  }

  private updateMenu(dt: number): void {
    const p1 = this.inputManager.getPlayer1();
    const p2 = this.inputManager.getPlayer2();
    const action: MenuAction = this.menuScreen.update(
      dt,
      p1.up || p2.up,
      p1.down || p2.down,
      p1.left || p2.left,
      p1.right || p2.right,
      p1.action1 || p2.action1,
      p1.action2 || p2.action2,
    );

    if (action) {
      audioManager.playMenuSelect();
      if (action.type === 'tournament') {
        this.startTournament();
      } else {
        this.startFreePlay(action.gameId);
      }
    }
  }

  private updateRoundIntro(dt: number): void {
    if (this.roundIntro?.update(dt)) {
      this.roundIntro = null;
      this.beginCountdown();
    }
  }

  private updateCountdown(dt: number): void {
    this.countdownTimer += dt;
    this.tweenManager.update(dt);

    if (this.countdownTimer >= 1) {
      this.countdownTimer -= 1;
      this.countdownValue--;
      this.tweenManager.clear();

      if (this.countdownValue <= 0) {
        this.beginPlaying();
      } else {
        this.startCountdownTween();
        audioManager.playCountdown();
      }
    }
  }

  private updatePlaying(dt: number): void {
    if (this.currentGame) {
      this.currentGame.update(dt);
      if (this.currentGame.isFinished()) {
        this.beginResult();
      }
    }
  }

  private updateRoundResult(dt: number): void {
    this.resultTimer += dt;
    if (this.resultTimer >= 3) {
      this.currentRoundIndex++;
      if (this.currentRoundIndex < this.gameOrder.length) {
        this.beginRoundIntro();
      } else {
        this.beginTournamentEnd();
      }
    }
  }

  private updateTournamentEnd(dt: number): void {
    this.endScreen?.update(dt);
    const p1 = this.inputManager.getPlayer1();
    const p2 = this.inputManager.getPlayer2();
    if (p1.action1 || p1.action2 || p2.action1 || p2.action2) {
      this.state = 'MENU';
      this.menuScreen = new MenuScreen(this.registry);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.shakeOffset.ox, this.shakeOffset.oy);

    this.starfield.render(ctx, this.lastDt);

    switch (this.state) {
      case 'MENU':
        this.menuScreen.render(ctx);
        break;
      case 'ROUND_INTRO':
        this.roundIntro?.render(ctx);
        break;
      case 'COUNTDOWN':
        this.renderCountdown(ctx);
        break;
      case 'PLAYING':
        this.currentGame?.render(ctx);
        this.hud.render(ctx);
        break;
      case 'ROUND_RESULT':
        this.renderRoundResult(ctx);
        break;
      case 'TOURNAMENT_END':
        this.endScreen?.render(ctx);
        break;
    }

    particleSystem.render(ctx);
    this.transition.render(ctx);
    ctx.restore();
  }

  private renderCountdown(ctx: CanvasRenderingContext2D): void {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // 80% opacity black overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(this.countdownScale, this.countdownScale);

    const label = this.countdownValue > 0 ? `${this.countdownValue}` : 'GO!';

    // Colored numbers: 3=DANGER, 2=WARNING, 1=NEXARI_CYAN, GO!=SUCCESS
    let color: string;
    if (this.countdownValue === 3) {
      color = COLORS.DANGER;
    } else if (this.countdownValue === 2) {
      color = COLORS.WARNING;
    } else if (this.countdownValue === 1) {
      color = COLORS.NEXARI_CYAN;
    } else {
      color = COLORS.SUCCESS;
    }

    ctx.font = '700 120px Orbitron, sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);

    ctx.restore();
  }

  private renderRoundResult(ctx: CanvasRenderingContext2D): void {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ctx.fillStyle = 'rgba(5, 5, 8, 0.92)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';

    if (this.resultWinner === 1) {
      ctx.font = '700 48px Orbitron, sans-serif';
      ctx.fillStyle = '#00e5ff';
      ctx.fillText('PLAYER 1 WINS!', w / 2, h / 2 - 20);
    } else if (this.resultWinner === 2) {
      ctx.font = '700 48px Orbitron, sans-serif';
      ctx.fillStyle = '#ff4466';
      ctx.fillText('PLAYER 2 WINS!', w / 2, h / 2 - 20);
    } else {
      ctx.font = '700 48px Orbitron, sans-serif';
      ctx.fillStyle = '#e0d5c0';
      ctx.fillText('DRAW!', w / 2, h / 2 - 20);
    }

    ctx.font = '700 36px Orbitron, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${this.p1Score} - ${this.p2Score}`, w / 2, h / 2 + 40);

    this.hud.render(ctx);
  }

  destroy(): void {
    this.inputManager.destroy();
    this.currentGame?.destroy();
    this.tweenManager.clear();
    particleSystem.clear();
    screenShake.reset();
  }
}
