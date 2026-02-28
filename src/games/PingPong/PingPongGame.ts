import { InputManager } from '../../core/InputManager.ts';
import type { IGame } from '../IGame.ts';

// ── Constants ──────────────────────────────────────────────────────────────
const W = 1280;
const H = 720;

const PADDLE_W = 15;
const PADDLE_H = 80;
const PADDLE_SPEED = 400;
const PADDLE_R = 6;
const PADDLE_MARGIN = 20;

const BALL_RADIUS = 8;
const BALL_INITIAL_SPEED = 350;
const BALL_MAX_SPEED = BALL_INITIAL_SPEED * 3;
const BALL_SPEED_MULT = 1.1;
const BALL_TRAIL_LENGTH = 8;

const MAX_ANGLE_DEG = 70;
const MAX_ANGLE_RAD = (MAX_ANGLE_DEG * Math.PI) / 180;

const LAUNCH_ANGLE_SPREAD_DEG = 40;
const POST_SCORE_FREEZE = 0.5;
const MATCH_DURATION = 60;

const NET_W = 4;
const STAR_COUNT = 40;
const GRID_SPACING = 60;

const BG_COLOR = '#080818';
const GRID_COLOR = '#00f5ff1a';
const P1_COLOR = '#00e5ff';
const P2_COLOR = '#ff4466';
const HUD_TEXT_COLOR = '#e0d5c0';
const HUD_BG_COLOR = 'rgba(0, 0, 0, 0.55)';

// ── Helpers ────────────────────────────────────────────────────────────────
interface Vec2 {
  x: number;
  y: number;
}

interface Paddle {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Star {
  x: number;
  y: number;
  len: number;
  opacity: number;
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

// ── Game ───────────────────────────────────────────────────────────────────
export class PingPongGame implements IGame {
  private input: InputManager = new InputManager();
  private durationMult = 1;
  private aiEnabled = false;

  // Paddles (x,y = top-left corner)
  private p1: Paddle = { x: 0, y: 0, w: PADDLE_W, h: PADDLE_H };
  private p2: Paddle = { x: 0, y: 0, w: PADDLE_W, h: PADDLE_H };

  // Ball
  private ball: Vec2 = { x: 0, y: 0 };
  private ballVx: number = 0;
  private ballVy: number = 0;
  private ballSpeed: number = BALL_INITIAL_SPEED;
  private trail: Vec2[] = [];

  // Scoring & timer
  private scoreP1: number = 0;
  private scoreP2: number = 0;
  private timer: number = MATCH_DURATION;
  private finished: boolean = false;

  // Post-score freeze
  private freezeTimer: number = 0;

  // Visuals
  private stars: Star[] = [];

  // ── IGame lifecycle ────────────────────────────────────────────────────
  setDurationMultiplier(mult: number): void {
    this.durationMult = mult;
  }

  setAIMode(enabled: boolean): void {
    this.aiEnabled = enabled;
  }

  init(_canvas: HTMLCanvasElement, _ctx: CanvasRenderingContext2D): void {
    this.input.init();
    this.timer = MATCH_DURATION * this.durationMult;

    this.stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      this.stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        len: 10 + Math.random() * 70,
        opacity: 0.3 + Math.random() * 0.3,
      });
    }

    this.p1.x = PADDLE_MARGIN;
    this.p1.y = (H - PADDLE_H) / 2;

    this.p2.x = W - PADDLE_MARGIN - PADDLE_W;
    this.p2.y = (H - PADDLE_H) / 2;

    this.launchBall(Math.random() < 0.5 ? 1 : -1);
  }

  update(dt: number): void {
    if (this.finished) {
      this.input.update();
      return;
    }

    // Timer
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0;
      this.finished = true;
      this.input.update();
      return;
    }

    // Post-score freeze
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      this.input.update();
      return;
    }

    // ── Paddle movement (vertical + horizontal) ──────────────────────────
    const p1In = this.input.getPlayer1();
    const p2In = this.input.getPlayer2();

    // AI override for player 2
    if (this.aiEnabled) {
      const paddleCenterY = this.p2.y + PADDLE_H / 2;
      const ballOnRightHalf = this.ball.x > W / 2;
      p2In.up = ballOnRightHalf && this.ball.y < paddleCenterY;
      p2In.down = ballOnRightHalf && this.ball.y > paddleCenterY;
    }

    if (p1In.up) this.p1.y -= PADDLE_SPEED * dt;
    if (p1In.down) this.p1.y += PADDLE_SPEED * dt;
    this.p1.y = clamp(this.p1.y, 0, H - PADDLE_H);

    if (p1In.left) this.p1.x -= PADDLE_SPEED * dt;
    if (p1In.right) this.p1.x += PADDLE_SPEED * dt;
    this.p1.x = clamp(this.p1.x, PADDLE_MARGIN, W / 2 - NET_W / 2 - PADDLE_W);

    if (p2In.up) this.p2.y -= PADDLE_SPEED * dt;
    if (p2In.down) this.p2.y += PADDLE_SPEED * dt;
    this.p2.y = clamp(this.p2.y, 0, H - PADDLE_H);

    if (p2In.left) this.p2.x -= PADDLE_SPEED * dt;
    if (p2In.right) this.p2.x += PADDLE_SPEED * dt;
    this.p2.x = clamp(this.p2.x, W / 2 + NET_W / 2, W - PADDLE_MARGIN - PADDLE_W);

    // ── Ball trail ───────────────────────────────────────────────────────
    this.trail.push({ x: this.ball.x, y: this.ball.y });
    if (this.trail.length > BALL_TRAIL_LENGTH) {
      this.trail.shift();
    }

    // ── Ball movement ────────────────────────────────────────────────────
    this.ball.x += this.ballVx * dt;
    this.ball.y += this.ballVy * dt;

    // Top/bottom wall bounce
    if (this.ball.y - BALL_RADIUS <= 0) {
      this.ball.y = BALL_RADIUS;
      this.ballVy = Math.abs(this.ballVy);
    } else if (this.ball.y + BALL_RADIUS >= H) {
      this.ball.y = H - BALL_RADIUS;
      this.ballVy = -Math.abs(this.ballVy);
    }

    // ── Paddle collisions ─────────────────────────────────────────────────
    this.checkPaddleCollision(this.p1);
    this.checkPaddleCollision(this.p2);

    // ── Scoring ──────────────────────────────────────────────────────────
    if (this.ball.x + BALL_RADIUS < 0) {
      this.scoreP2++;
      this.resetAfterScore(1);
    } else if (this.ball.x - BALL_RADIUS > W) {
      this.scoreP1++;
      this.resetAfterScore(-1);
    }

    this.input.update();
  }

  render(ctx: CanvasRenderingContext2D): void {
    // ── Deep space background ─────────────────────────────────────────────
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, W, H);

    // Star streaks
    for (const star of this.stars) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(star.x, star.y);
      ctx.lineTo(star.x + star.len, star.y);
      ctx.stroke();
    }

    // Neon grid floor
    this.drawGrid(ctx);

    // Center net (energy barrier)
    ctx.save();
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = '#00f5ff66';
    ctx.lineWidth = NET_W;
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.restore();

    // ── HUD background strip ─────────────────────────────────────────────
    ctx.fillStyle = HUD_BG_COLOR;
    ctx.fillRect(0, 0, W, 52);

    // ── Timer ────────────────────────────────────────────────────────────
    const secs = Math.ceil(this.timer);
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    const timerStr = `${mins}:${remSecs.toString().padStart(2, '0')}`;

    ctx.font = '700 24px Rajdhani, sans-serif';
    ctx.fillStyle = HUD_TEXT_COLOR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(timerStr, W / 2, 27);

    // ── Scores ───────────────────────────────────────────────────────────
    ctx.font = '700 40px Orbitron, sans-serif';

    ctx.fillStyle = P1_COLOR;
    ctx.textAlign = 'right';
    ctx.fillText(String(this.scoreP1), W / 2 - 60, 30);

    ctx.fillStyle = P2_COLOR;
    ctx.textAlign = 'left';
    ctx.fillText(String(this.scoreP2), W / 2 + 60, 30);

    // ── Ball trail (fading gradient) ─────────────────────────────────────
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      if (!t) continue;
      const frac = (i + 1) / this.trail.length;
      const alpha = frac * 0.6;
      const r = BALL_RADIUS * frac;
      ctx.beginPath();
      ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }

    // ── Pulsar orb ball ──────────────────────────────────────────────────
    this.drawBall(ctx);

    // ── Energy shield paddles ────────────────────────────────────────────
    this.drawPaddle(ctx, this.p1, P1_COLOR);
    this.drawPaddle(ctx, this.p2, P2_COLOR);

    // ── Finished overlay ─────────────────────────────────────────────────
    if (this.finished) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, W, H);

      ctx.font = '700 48px Orbitron, sans-serif';
      ctx.fillStyle = HUD_TEXT_COLOR;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const winner = this.getWinner();
      const msg = winner === 1 ? 'PLAYER 1 WINS!' : winner === 2 ? 'PLAYER 2 WINS!' : 'DRAW!';
      ctx.fillText(msg, W / 2, H / 2);
    }
  }

  destroy(): void {
    this.input.destroy();
  }

  getWinner(): 1 | 2 | null {
    if (this.scoreP1 > this.scoreP2) return 1;
    if (this.scoreP2 > this.scoreP1) return 2;
    return null;
  }

  isFinished(): boolean {
    return this.finished;
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    for (let y = GRID_SPACING; y < H; y += GRID_SPACING) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    for (let x = GRID_SPACING; x < W; x += GRID_SPACING) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
  }

  private drawBall(ctx: CanvasRenderingContext2D): void {
    // Concentric glow layers
    const layers: { radius: number; color: string }[] = [
      { radius: BALL_RADIUS * 3, color: 'rgba(255, 255, 255, 0.06)' },
      { radius: BALL_RADIUS * 2, color: 'rgba(255, 255, 255, 0.12)' },
      { radius: BALL_RADIUS * 1.4, color: 'rgba(255, 255, 255, 0.25)' },
    ];
    for (const layer of layers) {
      ctx.beginPath();
      ctx.arc(this.ball.x, this.ball.y, layer.radius, 0, Math.PI * 2);
      ctx.fillStyle = layer.color;
      ctx.fill();
    }
    // Bright white center
    ctx.save();
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }

  private drawPaddle(ctx: CanvasRenderingContext2D, paddle: Paddle, color: string): void {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, PADDLE_R);
    ctx.fill();
    ctx.restore();
  }

  private launchBall(dirX: number): void {
    this.ball.x = W / 2;
    this.ball.y = H / 2;
    this.ballSpeed = BALL_INITIAL_SPEED;
    this.trail = [];

    const angle = ((Math.random() - 0.5) * LAUNCH_ANGLE_SPREAD_DEG * Math.PI) / 180;
    this.ballVx = Math.cos(angle) * this.ballSpeed * Math.sign(dirX);
    this.ballVy = Math.sin(angle) * this.ballSpeed;
  }

  private resetAfterScore(launchDir: number): void {
    this.launchBall(launchDir);
    this.freezeTimer = POST_SCORE_FREEZE;
  }

  /** Resolve ball–paddle collision using minimum-penetration AABB. */
  private checkPaddleCollision(paddle: Paddle): void {
    const bLeft = this.ball.x - BALL_RADIUS;
    const bRight = this.ball.x + BALL_RADIUS;
    const bTop = this.ball.y - BALL_RADIUS;
    const bBottom = this.ball.y + BALL_RADIUS;

    const pLeft = paddle.x;
    const pRight = paddle.x + paddle.w;
    const pTop = paddle.y;
    const pBottom = paddle.y + paddle.h;

    if (bRight < pLeft || bLeft > pRight || bBottom < pTop || bTop > pBottom) {
      return;
    }

    // Penetration depth on each axis side
    const oL = bRight - pLeft;
    const oR = pRight - bLeft;
    const oT = bBottom - pTop;
    const oB = pBottom - bTop;
    const minO = Math.min(oL, oR, oT, oB);

    if (minO === oT || minO === oB) {
      // Top / bottom face — simple vertical bounce
      if (minO === oT) {
        this.ball.y = pTop - BALL_RADIUS;
        this.ballVy = -Math.abs(this.ballVy);
      } else {
        this.ball.y = pBottom + BALL_RADIUS;
        this.ballVy = Math.abs(this.ballVy);
      }
    } else {
      // Left / right face — pong-style angle reflection
      const reflectDirX = minO === oL ? -1 : 1;

      // Skip if ball already moving away from this face
      if (reflectDirX === -1 && this.ballVx < 0) return;
      if (reflectDirX === 1 && this.ballVx > 0) return;

      const paddleCenterY = paddle.y + paddle.h / 2;
      const relativeY = (this.ball.y - paddleCenterY) / (paddle.h / 2);
      const clampedRel = clamp(relativeY, -1, 1);
      const angle = clampedRel * MAX_ANGLE_RAD;

      this.ballSpeed = Math.min(this.ballSpeed * BALL_SPEED_MULT, BALL_MAX_SPEED);
      this.ballVx = Math.cos(angle) * this.ballSpeed * reflectDirX;
      this.ballVy = Math.sin(angle) * this.ballSpeed;

      if (reflectDirX === -1) {
        this.ball.x = pLeft - BALL_RADIUS;
      } else {
        this.ball.x = pRight + BALL_RADIUS;
      }
    }
  }
}
