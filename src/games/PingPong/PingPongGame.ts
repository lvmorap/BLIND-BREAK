import { InputManager } from '../../core/InputManager.ts';
import type { IGame } from '../IGame.ts';

// ── Constants ──────────────────────────────────────────────────────────────
const W = 1280;
const H = 720;

const PADDLE_W = 15;
const PADDLE_H = 80;
const PADDLE_SPEED = 400;
const PADDLE_MARGIN = 40;

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

const TABLE_COLOR = '#1a5c1a';
const NET_COLOR = '#ffffff';
const BALL_COLOR = '#ff8800';
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

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

// ── Game ───────────────────────────────────────────────────────────────────
export class PingPongGame implements IGame {
  private input: InputManager = new InputManager();

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

  // ── IGame lifecycle ────────────────────────────────────────────────────
  init(_canvas: HTMLCanvasElement, _ctx: CanvasRenderingContext2D): void {
    this.input.init();

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

    // ── Paddle movement ──────────────────────────────────────────────────
    const p1In = this.input.getPlayer1();
    const p2In = this.input.getPlayer2();

    if (p1In.up) this.p1.y -= PADDLE_SPEED * dt;
    if (p1In.down) this.p1.y += PADDLE_SPEED * dt;
    this.p1.y = clamp(this.p1.y, 0, H - PADDLE_H);

    if (p2In.up) this.p2.y -= PADDLE_SPEED * dt;
    if (p2In.down) this.p2.y += PADDLE_SPEED * dt;
    this.p2.y = clamp(this.p2.y, 0, H - PADDLE_H);

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

    // ── Paddle collisions (AABB) ─────────────────────────────────────────
    this.checkPaddleCollision(this.p1, 1);
    this.checkPaddleCollision(this.p2, -1);

    // ── Scoring ──────────────────────────────────────────────────────────
    if (this.ball.x + BALL_RADIUS < 0) {
      this.scoreP2++;
      this.resetAfterScore(1); // launch toward scorer (P2 → rightward)
    } else if (this.ball.x - BALL_RADIUS > W) {
      this.scoreP1++;
      this.resetAfterScore(-1); // launch toward scorer (P1 → leftward)
    }

    this.input.update();
  }

  render(ctx: CanvasRenderingContext2D): void {
    // ── Table background ─────────────────────────────────────────────────
    ctx.fillStyle = '#0d2e0d';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = TABLE_COLOR;
    ctx.fillRect(20, 20, W - 40, H - 40);

    // Table border lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Center line (dashed net)
    ctx.save();
    ctx.setLineDash([12, 8]);
    ctx.strokeStyle = NET_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2, 20);
    ctx.lineTo(W / 2, H - 20);
    ctx.stroke();
    ctx.restore();

    // Net posts
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(W / 2 - 3, 14, 6, 12);
    ctx.fillRect(W / 2 - 3, H - 26, 6, 12);

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

    // ── Ball trail ───────────────────────────────────────────────────────
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      if (!t) continue;
      const alpha = ((i + 1) / this.trail.length) * 0.35;
      const r = BALL_RADIUS * ((i + 1) / this.trail.length);
      ctx.beginPath();
      ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 136, 0, ${alpha})`;
      ctx.fill();
    }

    // ── Ball ─────────────────────────────────────────────────────────────
    ctx.save();
    ctx.shadowColor = BALL_COLOR;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = BALL_COLOR;
    ctx.fill();
    ctx.restore();

    // ── Paddles with glow ────────────────────────────────────────────────
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

  private drawPaddle(ctx: CanvasRenderingContext2D, paddle: Paddle, color: string): void {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = color;
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.restore();
  }

  private launchBall(dirX: number): void {
    this.ball.x = W / 2;
    this.ball.y = H / 2;
    this.ballSpeed = BALL_INITIAL_SPEED;
    this.trail = [];

    // Slight random angle (±20°)
    const angle = ((Math.random() - 0.5) * LAUNCH_ANGLE_SPREAD_DEG * Math.PI) / 180;
    this.ballVx = Math.cos(angle) * this.ballSpeed * Math.sign(dirX);
    this.ballVy = Math.sin(angle) * this.ballSpeed;
  }

  private resetAfterScore(launchDir: number): void {
    this.launchBall(launchDir);
    this.freezeTimer = POST_SCORE_FREEZE;
  }

  private checkPaddleCollision(paddle: Paddle, reflectDirX: number): void {
    // AABB overlap test between ball bounding-box and paddle rect
    const bLeft = this.ball.x - BALL_RADIUS;
    const bRight = this.ball.x + BALL_RADIUS;
    const bTop = this.ball.y - BALL_RADIUS;
    const bBottom = this.ball.y + BALL_RADIUS;

    const pLeft = paddle.x;
    const pRight = paddle.x + paddle.w;
    const pTop = paddle.y;
    const pBottom = paddle.y + paddle.h;

    if (bRight < pLeft || bLeft > pRight || bBottom < pTop || bTop > pBottom) {
      return; // no overlap
    }

    // Only trigger if ball is moving toward the paddle
    if (reflectDirX > 0 && this.ballVx > 0) return;
    if (reflectDirX < 0 && this.ballVx < 0) return;

    // Impact position normalized to [-1, 1] (center = 0, edges = ±1)
    const paddleCenterY = paddle.y + paddle.h / 2;
    const relativeY = (this.ball.y - paddleCenterY) / (paddle.h / 2);
    const clampedRel = clamp(relativeY, -1, 1);

    // Angle based on hit position
    const angle = clampedRel * MAX_ANGLE_RAD;

    // Accelerate
    this.ballSpeed = Math.min(this.ballSpeed * BALL_SPEED_MULT, BALL_MAX_SPEED);

    this.ballVx = Math.cos(angle) * this.ballSpeed * reflectDirX;
    this.ballVy = Math.sin(angle) * this.ballSpeed;

    // Push ball out of paddle to prevent multi-hit
    if (reflectDirX > 0) {
      this.ball.x = pRight + BALL_RADIUS;
    } else {
      this.ball.x = pLeft - BALL_RADIUS;
    }
  }
}
