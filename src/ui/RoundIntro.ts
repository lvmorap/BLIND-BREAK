import { Tween, TweenManager, easeOutBack } from '../core/TweenEngine.ts';
import { StarfieldBackground } from '../core/StarfieldBackground.ts';
import { COLORS } from '../core/Colors.ts';

interface GameLoreEntry {
  description: string;
  controls: string[];
}

const LORE_MAP: Record<string, GameLoreEntry> = {
  billiards: {
    description:
      'The aliens decided to play with the solar system, turning planets into billiard balls and pocketing them into black holes — harming humanity in the process. The Human must outscore the Alien in this cosmic pool match shrouded in darkness.',
    controls: [
      'HUMAN: Drag mouse from cue ball to aim',
      'Hold to charge power — release to fire',
      'SUPERNOVA: Click button to illuminate the cosmos',
      'ESC: Pause | T: Tutorial | C: Colorblind mode',
    ],
  },
  pingpong: {
    description:
      'The aliens challenged humans to a lightspeed ping-pong match aboard a pulsar station. The Human (left paddle) must outplay the Alien (right paddle) before time runs out. The ball accelerates with each hit!',
    controls: [
      'HUMAN: W/S to move paddle up/down',
      'ALIEN: Arrow Up/Down to move paddle',
      'Ball speeds up with each rally',
      'First to lead when time expires wins',
    ],
  },
  soccer: {
    description:
      'In the zero-gravity orbital arena, the aliens challenged humans to a soccer match with no ground to stand on. The Human (left side) faces the Alien (right side). Kick the ball into the floating goals!',
    controls: [
      'HUMAN: WASD to move, F to kick, G to jump',
      'ALIEN: Arrows to move, RShift to kick, Enter to jump',
      'Goals drift in orbital decay',
      'Most goals when time expires wins',
    ],
  },
  sumo: {
    description:
      'In the heart of an active volcano, the strongest Human gladiator faces the fiercest Alien warrior. Push your opponent to the edge of the shrinking volcanic arena! Dash attacks and shockwaves decide the battle.',
    controls: [
      'HUMAN: WASD to move, F to dash attack, G to jump',
      'ALIEN: Arrows to move, RShift to dash, Enter to jump',
      'Arena shrinks over time — stay near center!',
      'Score by pushing opponent to the border',
    ],
  },
  formula: {
    description:
      "The aliens watched motorcycle races in human cinema and wanted to replicate them with their spaceships around Saturn's rings. The Human and Alien race through the rings leaving energy trails. Hit your opponent's trail to stun them!",
    controls: [
      'HUMAN: W/S accelerate/brake, A/D steer, F turbo',
      'ALIEN: Arrows to steer/accelerate, RShift turbo',
      'Collect power-ups: Speed, Mirror, Obstacle',
      'Complete laps to win — avoid going off-track!',
    ],
  },
  volleyball: {
    description:
      'The aliens watched humans play volleyball and loved it — but decided to alter gravity every few seconds! The Human (left) and Alien (right) battle across a cosmic net as gravity shifts in all directions.',
    controls: [
      'HUMAN: A/D to move, F to hit ball, G to jump',
      'ALIEN: Left/Right to move, RShift to hit, Enter to jump',
      'Gravity changes direction every 5 seconds!',
      'Ball touching your floor = opponent scores',
    ],
  },
};

function getGameLoreKey(gameId: string): string {
  if (gameId.includes('blind') || gameId.includes('billiard') || gameId.includes('nebula'))
    return 'billiards';
  if (gameId.includes('ping') || gameId.includes('pulsar')) return 'pingpong';
  if (gameId.includes('soccer') || gameId.includes('zero')) return 'soccer';
  if (gameId.includes('sumo') || gameId.includes('orbital') || gameId.includes('volcan'))
    return 'sumo';
  if (
    gameId.includes('formula') ||
    gameId.includes('race') ||
    gameId.includes('saturn') ||
    gameId.includes('jupiter')
  )
    return 'formula';
  if (gameId.includes('volley') || gameId.includes('cosmic') || gameId.includes('gravity'))
    return 'volleyball';
  return '';
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
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
  private loreEntry: GameLoreEntry | null;
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
    this.loreEntry = LORE_MAP[loreKey] ?? null;

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

    if (this.timer >= 2) {
      this.canSkip = true;
    }

    if (this.spacePressed || this.timer >= 10) {
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

    // Top bar: NEXARI ARENA — ROUND N OF TOTAL
    ctx.font = '600 16px Orbitron, sans-serif';
    ctx.fillStyle = COLORS.NEXARI_PURPLE;
    ctx.textAlign = 'center';
    ctx.fillText(`NEXARI ARENA \u2014 ROUND ${this.roundNum} OF ${this.totalRounds}`, w / 2, 30);

    ctx.save();
    ctx.translate(w / 2, 140);
    ctx.scale(this.scale, this.scale);

    // Icon
    ctx.font = '54px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.icon, 0, -20);

    // Game name with cyan glow
    ctx.save();
    ctx.shadowBlur = 30;
    ctx.shadowColor = COLORS.NEXARI_CYAN;
    ctx.font = '900 42px Orbitron, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.gameName, 0, 30);
    ctx.restore();

    // Subtitle
    ctx.font = '400 18px Rajdhani, sans-serif';
    ctx.fillStyle = '#a0a0a0';
    ctx.fillText(this.subtitle, 0, 55);

    ctx.restore();

    // Description and controls
    if (this.loreEntry) {
      const descY = 230;
      const maxTextW = w * 0.75;

      // Description
      ctx.font = 'italic 15px Rajdhani, sans-serif';
      ctx.fillStyle = '#7799bb';
      ctx.textAlign = 'center';
      const descLines = wrapText(ctx, this.loreEntry.description, maxTextW);
      for (let i = 0; i < descLines.length; i++) {
        const line = descLines[i];
        if (line) ctx.fillText(line, w / 2, descY + i * 18);
      }

      // Controls section
      const ctrlY = descY + descLines.length * 18 + 20;
      ctx.font = '700 14px Orbitron, sans-serif';
      ctx.fillStyle = COLORS.NEXARI_CYAN;
      ctx.fillText('CONTROLS', w / 2, ctrlY);

      // Controls background
      const ctrlBoxH = this.loreEntry.controls.length * 22 + 16;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.roundRect(w / 2 - maxTextW / 2, ctrlY + 6, maxTextW, ctrlBoxH, 6);
      ctx.fill();

      ctx.font = '500 14px Rajdhani, sans-serif';
      ctx.fillStyle = '#ccddee';
      for (let i = 0; i < this.loreEntry.controls.length; i++) {
        const ctrl = this.loreEntry.controls[i];
        if (ctrl) ctx.fillText(ctrl, w / 2, ctrlY + 24 + i * 22);
      }

      // Player labels
      const labelY = ctrlY + ctrlBoxH + 24;
      ctx.font = '600 14px Rajdhani, sans-serif';
      ctx.fillStyle = '#00e5ff';
      ctx.textAlign = 'right';
      ctx.fillText('🧑 HUMAN (Player 1)', w / 2 - 20, labelY);
      ctx.fillStyle = '#ff4466';
      ctx.textAlign = 'left';
      ctx.fillText('👾 ALIEN (Player 2)', w / 2 + 20, labelY);
      ctx.textAlign = 'center';
    }

    // Pulsing [SPACE] Skip prompt — blinking
    if (this.canSkip) {
      const blink = Math.sin(this.timer * 5) > 0;
      if (blink) {
        ctx.font = '600 18px Rajdhani, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('>>> PRESS SPACE TO SKIP <<<', w / 2, h - 30);
      }
    }

    // Countdown timer in bottom-right
    const remaining = Math.max(0, Math.ceil(10 - this.timer));
    ctx.font = '400 14px Rajdhani, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'right';
    ctx.fillText(`${remaining}s`, w - 20, h - 20);
    ctx.textAlign = 'center';
  }

  private destroy(): void {
    if (this.handleKeyDown) {
      window.removeEventListener('keydown', this.handleKeyDown);
      this.handleKeyDown = null;
    }
  }
}
