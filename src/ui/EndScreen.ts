interface RoundResult {
  gameName: string;
  icon: string;
  winner: 1 | 2 | null;
}

const P1_COLOR = '#00e5ff';
const P2_COLOR = '#ff4466';
const TEXT_COLOR = '#e0d5c0';

export class EndScreen {
  private p1Score: number;
  private p2Score: number;
  private rounds: RoundResult[];
  private elapsed: number = 0;
  private nexariMessage: string;

  private static readonly NEXARI_MESSAGES: string[] = [
    'Your combat data has been archived in the Nexus Codex.',
    'Seven galaxies witnessed your performance today.',
    'The Arena remembers. The Arena adapts.',
  ];

  constructor(p1Score: number, p2Score: number, rounds: RoundResult[]) {
    this.p1Score = p1Score;
    this.p2Score = p2Score;
    this.rounds = rounds;
    this.nexariMessage =
      EndScreen.NEXARI_MESSAGES[Math.floor(Math.random() * EndScreen.NEXARI_MESSAGES.length)] ??
      EndScreen.NEXARI_MESSAGES[0] ??
      '';
  }

  update(dt: number): void {
    this.elapsed += dt;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Background
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, w, h);

    // Winner declaration
    const winner = this.p1Score > this.p2Score ? 1 : this.p2Score > this.p1Score ? 2 : 0;
    ctx.textAlign = 'center';

    ctx.font = '700 24px Rajdhani, sans-serif';
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText('TOURNAMENT COMPLETE', w / 2, 60);

    ctx.font = '700 48px Orbitron, sans-serif';
    if (winner === 1) {
      ctx.fillStyle = P1_COLOR;
      ctx.fillText('PLAYER 1 WINS!', w / 2, 120);
    } else if (winner === 2) {
      ctx.fillStyle = P2_COLOR;
      ctx.fillText('PLAYER 2 WINS!', w / 2, 120);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillText("IT'S A TIE!", w / 2, 120);
    }

    // Nexari lore message
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.font = '400 14px Rajdhani, sans-serif';
    ctx.fillStyle = '#aabbcc';
    ctx.fillText(this.nexariMessage, w / 2, 148);
    ctx.restore();

    // Final scores
    ctx.font = '700 64px Orbitron, sans-serif';
    ctx.fillStyle = P1_COLOR;
    ctx.textAlign = 'right';
    ctx.fillText(`${this.p1Score}`, w / 2 - 30, 200);

    ctx.fillStyle = TEXT_COLOR;
    ctx.textAlign = 'center';
    ctx.font = '400 32px Rajdhani, sans-serif';
    ctx.fillText('-', w / 2, 195);

    ctx.font = '700 64px Orbitron, sans-serif';
    ctx.fillStyle = P2_COLOR;
    ctx.textAlign = 'left';
    ctx.fillText(`${this.p2Score}`, w / 2 + 30, 200);

    // Round results list
    ctx.textAlign = 'center';
    ctx.font = '600 18px Rajdhani, sans-serif';
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText('ROUND RESULTS', w / 2, 250);

    const startY = 280;
    const lineHeight = 32;
    for (let i = 0; i < this.rounds.length; i++) {
      const round = this.rounds[i];
      if (!round) continue;
      const y = startY + i * lineHeight;

      ctx.font = '24px serif';
      ctx.fillText(round.icon, w / 2 - 120, y);

      ctx.font = '500 16px Rajdhani, sans-serif';
      ctx.fillStyle = TEXT_COLOR;
      ctx.textAlign = 'left';
      ctx.fillText(round.gameName, w / 2 - 90, y);

      ctx.textAlign = 'right';
      if (round.winner === 1) {
        ctx.fillStyle = P1_COLOR;
        ctx.fillText('P1', w / 2 + 120, y);
      } else if (round.winner === 2) {
        ctx.fillStyle = P2_COLOR;
        ctx.fillText('P2', w / 2 + 120, y);
      } else {
        ctx.fillStyle = '#888888';
        ctx.fillText('DRAW', w / 2 + 120, y);
      }

      ctx.textAlign = 'center';
    }

    // Play again prompt
    const promptY = startY + this.rounds.length * lineHeight + 50;
    ctx.font = '600 22px Rajdhani, sans-serif';
    ctx.fillStyle = TEXT_COLOR;
    ctx.globalAlpha = 0.6 + Math.sin(this.elapsed * 2) * 0.4;
    ctx.fillText('PRESS ANY KEY TO PLAY AGAIN', w / 2, promptY);
    ctx.globalAlpha = 1;
  }
}
