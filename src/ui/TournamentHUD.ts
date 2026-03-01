const P1_COLOR = '#00e5ff';
const P2_COLOR = '#ff4466';
const TEXT_COLOR = '#e0d5c0';
const BG_COLOR = 'rgba(10, 10, 15, 0.7)';

export class TournamentHUD {
  private p1Score: number = 0;
  private p2Score: number = 0;
  private roundNum: number = 0;
  private totalRounds: number = 0;
  private gameName: string = '';
  private timer: number = 0;

  setScores(p1: number, p2: number): void {
    this.p1Score = p1;
    this.p2Score = p2;
  }

  setRound(num: number, total: number, name: string): void {
    this.roundNum = num;
    this.totalRounds = total;
    this.gameName = name;
  }

  setTimer(t: number): void {
    this.timer = t;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = ctx.canvas.width;

    // Top bar background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, 52);

    // Player 1 score (left)
    ctx.font = '700 28px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = P1_COLOR;
    ctx.fillText(`${this.p1Score}`, 20, 38);

    ctx.font = '500 14px Rajdhani, sans-serif';
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText('P1', 20, 16);

    // Player 2 score (right)
    ctx.font = '700 28px Orbitron, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = P2_COLOR;
    ctx.fillText(`${this.p2Score}`, w - 20, 38);

    ctx.font = '500 14px Rajdhani, sans-serif';
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText('P2', w - 20, 16);

    // Center - round info
    ctx.textAlign = 'center';
    ctx.font = '500 14px Rajdhani, sans-serif';
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText(`ROUND ${this.roundNum}/${this.totalRounds}`, w / 2, 16);

    ctx.font = '600 18px Rajdhani, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.gameName, w / 2, 36);

    // Timer (if > 0)
    if (this.timer > 0) {
      const danger = this.timer <= 10;
      ctx.save();
      if (danger) {
        // Pulse scale 1.0 → 1.1 → 1.0 at 1 Hz
        const pulse = 1.0 + 0.1 * Math.abs(Math.sin((performance.now() / 1000) * Math.PI));
        ctx.translate(w / 2, 50);
        ctx.scale(pulse, pulse);
        ctx.translate(-w / 2, -50);
      }
      ctx.font = '700 20px Orbitron, sans-serif';
      ctx.fillStyle = danger ? '#ff4422' : TEXT_COLOR;
      ctx.fillText(Math.ceil(this.timer).toString(), w / 2, 50);
      ctx.restore();
    }
  }
}
