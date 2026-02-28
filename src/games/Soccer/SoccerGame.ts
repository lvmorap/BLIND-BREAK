import { IGame } from '../IGame.ts';
import { InputManager, PlayerInput } from '../../core/InputManager.ts';

// ─── Constants ───────────────────────────────────────────────────────────────
const CANVAS_W = 1280;
const CANVAS_H = 720;

const FIELD_W = 1000;
const FIELD_H = 560;
const FIELD_X = (CANVAS_W - FIELD_W) / 2;
const FIELD_Y = (CANVAS_H - FIELD_H) / 2;

const GOAL_HEIGHT = 120;
const GOAL_SPEED = 90;

const PLAYER_RADIUS = 18;
const PLAYER_SPEED = 280;
const PLAYER_ACCEL_LERP = 10;

const BALL_RADIUS = 10;
const BALL_RESTITUTION = 0.85;
const BALL_FRICTION = 0.995;

const KICK_RANGE = 30;
const KICK_FORCE = 600;
const KICK_COOLDOWN = 0.3;

const JUMP_DURATION = 0.6;
const JUMP_COOLDOWN = 1.0;

const MATCH_TIME = 60;

const CENTER_CIRCLE_R = 60;
const PENALTY_W = 120;
const PENALTY_H = 220;

const COLOR_BG = '#0a0a12';
const COLOR_FIELD = '#2a7a2a';
const COLOR_LINE = '#ffffff';
const COLOR_P1 = '#00e5ff';
const COLOR_P2 = '#ff4466';

// ─── Helpers ─────────────────────────────────────────────────────────────────
interface Vec2 {
  x: number;
  y: number;
}

function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

function vecLen(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

function vecNorm(v: Vec2): Vec2 {
  const l = vecLen(v);
  return l === 0 ? vec2(0, 0) : vec2(v.x / l, v.y / l);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

// ─── Entity types ────────────────────────────────────────────────────────────
interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  kickCooldown: number;
  jumpCooldown: number;
  jumpTimer: number;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spinAngle: number;
}

interface Goal {
  y: number;
  dir: 1 | -1;
}

// ─── SoccerGame ──────────────────────────────────────────────────────────────
export class SoccerGame implements IGame {
  private input!: InputManager;
  private durationMult = 1;
  private p1!: Player;
  private p2!: Player;
  private ball!: Ball;
  private goalL!: Goal;
  private goalR!: Goal;
  private scoreP1 = 0;
  private scoreP2 = 0;
  private timer = MATCH_TIME;
  private finished = false;
  private flashTimer = 0;
  private flashColor = '';
  private aiEnabled = false;

  // ── IGame lifecycle ──────────────────────────────────────────────────────
  setAIMode(enabled: boolean): void {
    this.aiEnabled = enabled;
  }

  setDurationMultiplier(mult: number): void {
    this.durationMult = mult;
  }

  init(_canvas: HTMLCanvasElement, _ctx: CanvasRenderingContext2D): void {
    this.input = new InputManager();
    this.input.init();
    this.resetState();
  }

  destroy(): void {
    this.input.destroy();
  }

  getWinner(): 1 | 2 | null {
    if (!this.finished) return null;
    if (this.scoreP1 > this.scoreP2) return 1;
    if (this.scoreP2 > this.scoreP1) return 2;
    return null;
  }

  isFinished(): boolean {
    return this.finished;
  }

  // ── State helpers ────────────────────────────────────────────────────────
  private resetState(): void {
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.timer = MATCH_TIME * this.durationMult;
    this.finished = false;
    this.flashTimer = 0;
    this.goalL = { y: FIELD_Y + FIELD_H / 2, dir: 1 };
    this.goalR = { y: FIELD_Y + FIELD_H / 2, dir: -1 };
    this.resetPositions();
  }

  private resetPositions(): void {
    this.p1 = this.makePlayer(FIELD_X + FIELD_W * 0.25, FIELD_Y + FIELD_H / 2);
    this.p2 = this.makePlayer(FIELD_X + FIELD_W * 0.75, FIELD_Y + FIELD_H / 2);
    this.ball = { x: FIELD_X + FIELD_W / 2, y: FIELD_Y + FIELD_H / 2, vx: 0, vy: 0, spinAngle: 0 };
  }

  private makePlayer(x: number, y: number): Player {
    return { x, y, vx: 0, vy: 0, kickCooldown: 0, jumpCooldown: 0, jumpTimer: 0 };
  }

  // ── Update ───────────────────────────────────────────────────────────────
  update(dt: number): void {
    if (this.finished) {
      this.input.update();
      return;
    }

    const p1Input = this.input.getPlayer1();
    let p2Input = this.input.getPlayer2();

    if (this.aiEnabled) {
      p2Input = this.computeAIInput();
    }

    this.updatePlayer(this.p1, p1Input, dt);
    this.updatePlayer(this.p2, p2Input, dt);
    this.updateBall(dt);
    this.updateGoals(dt);
    this.checkGoalScored();

    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
    }

    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0;
      this.finished = true;
    }

    this.input.update();
  }

  private updatePlayer(p: Player, inp: PlayerInput, dt: number): void {
    // Target velocity from input
    let tx = 0;
    let ty = 0;
    if (inp.left) tx -= 1;
    if (inp.right) tx += 1;
    if (inp.up) ty -= 1;
    if (inp.down) ty += 1;
    const tLen = Math.sqrt(tx * tx + ty * ty);
    if (tLen > 0) {
      tx = (tx / tLen) * PLAYER_SPEED;
      ty = (ty / tLen) * PLAYER_SPEED;
    }

    const t = 1 - Math.exp(-PLAYER_ACCEL_LERP * dt);
    p.vx = lerp(p.vx, tx, t);
    p.vy = lerp(p.vy, ty, t);
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Clamp inside field
    p.x = clamp(p.x, FIELD_X + PLAYER_RADIUS, FIELD_X + FIELD_W - PLAYER_RADIUS);
    p.y = clamp(p.y, FIELD_Y + PLAYER_RADIUS, FIELD_Y + FIELD_H - PLAYER_RADIUS);

    // Cooldowns
    if (p.kickCooldown > 0) p.kickCooldown -= dt;
    if (p.jumpCooldown > 0) p.jumpCooldown -= dt;
    if (p.jumpTimer > 0) p.jumpTimer -= dt;

    // Kick
    if (inp.action1 && p.kickCooldown <= 0) {
      const dx = this.ball.x - p.x;
      const dy = this.ball.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < KICK_RANGE + BALL_RADIUS) {
        const dir = vecNorm(vec2(dx, dy));
        this.ball.vx = dir.x * KICK_FORCE;
        this.ball.vy = dir.y * KICK_FORCE;
        p.kickCooldown = KICK_COOLDOWN;
      }
    }

    // Jump
    if (inp.action2 && p.jumpCooldown <= 0) {
      p.jumpTimer = JUMP_DURATION;
      p.jumpCooldown = JUMP_COOLDOWN;
    }
  }

  private updateBall(dt: number): void {
    const b = this.ball;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Friction (frame-rate independent)
    const friction = Math.pow(BALL_FRICTION, dt * 60);
    b.vx *= friction;
    b.vy *= friction;

    // Spin visual
    const speed = vecLen(vec2(b.vx, b.vy));
    b.spinAngle += speed * dt * 0.05;

    // Wall bounces
    const left = FIELD_X + BALL_RADIUS;
    const right = FIELD_X + FIELD_W - BALL_RADIUS;
    const top = FIELD_Y + BALL_RADIUS;
    const bottom = FIELD_Y + FIELD_H - BALL_RADIUS;

    if (b.y < top) {
      b.y = top;
      b.vy = Math.abs(b.vy) * BALL_RESTITUTION;
    }
    if (b.y > bottom) {
      b.y = bottom;
      b.vy = -Math.abs(b.vy) * BALL_RESTITUTION;
    }

    // Left/right walls — leave gap for goal openings
    const goalLTop = this.goalL.y - GOAL_HEIGHT / 2;
    const goalLBot = this.goalL.y + GOAL_HEIGHT / 2;
    const goalRTop = this.goalR.y - GOAL_HEIGHT / 2;
    const goalRBot = this.goalR.y + GOAL_HEIGHT / 2;

    if (b.x < left) {
      if (b.y >= goalLTop && b.y <= goalLBot) {
        // Ball inside goal opening — allow passage for goal detection
      } else {
        b.x = left;
        b.vx = Math.abs(b.vx) * BALL_RESTITUTION;
      }
    }
    if (b.x > right) {
      if (b.y >= goalRTop && b.y <= goalRBot) {
        // Ball inside goal opening — allow passage for goal detection
      } else {
        b.x = right;
        b.vx = -Math.abs(b.vx) * BALL_RESTITUTION;
      }
    }

    // Player-ball collision push
    this.pushBallFromPlayer(this.p1);
    this.pushBallFromPlayer(this.p2);
  }

  private pushBallFromPlayer(p: Player): void {
    const dx = this.ball.x - p.x;
    const dy = this.ball.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = PLAYER_RADIUS + BALL_RADIUS;
    if (dist < minDist && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;
      this.ball.x = p.x + nx * minDist;
      this.ball.y = p.y + ny * minDist;
      // Transfer some velocity
      const relVel = this.ball.vx * nx + this.ball.vy * ny;
      if (relVel < 0) {
        this.ball.vx -= relVel * nx;
        this.ball.vy -= relVel * ny;
      }
    }
  }

  private updateGoals(dt: number): void {
    this.moveGoal(this.goalL, dt);
    this.moveGoal(this.goalR, dt);
  }

  private moveGoal(g: Goal, dt: number): void {
    g.y += GOAL_SPEED * g.dir * dt;
    const minY = FIELD_Y + GOAL_HEIGHT / 2;
    const maxY = FIELD_Y + FIELD_H - GOAL_HEIGHT / 2;
    if (g.y < minY) {
      g.y = minY;
      g.dir = 1;
    }
    if (g.y > maxY) {
      g.y = maxY;
      g.dir = -1;
    }
  }

  private checkGoalScored(): void {
    const b = this.ball;

    // P2 scores on left goal (P1 defends left)
    if (b.x - BALL_RADIUS < FIELD_X) {
      const goalTop = this.goalL.y - GOAL_HEIGHT / 2;
      const goalBot = this.goalL.y + GOAL_HEIGHT / 2;
      if (b.y >= goalTop && b.y <= goalBot) {
        this.scoreP2++;
        this.flashColor = COLOR_P2;
        this.flashTimer = 0.4;
        this.resetPositions();
        return;
      }
    }

    // P1 scores on right goal (P2 defends right)
    if (b.x + BALL_RADIUS > FIELD_X + FIELD_W) {
      const goalTop = this.goalR.y - GOAL_HEIGHT / 2;
      const goalBot = this.goalR.y + GOAL_HEIGHT / 2;
      if (b.y >= goalTop && b.y <= goalBot) {
        this.scoreP1++;
        this.flashColor = COLOR_P1;
        this.flashTimer = 0.4;
        this.resetPositions();
        return;
      }
    }
  }

  // ── AI ──────────────────────────────────────────────────────────────────
  private computeAIInput(): PlayerInput {
    const goalX = FIELD_X + FIELD_W;
    const goalY = this.goalR.y;
    const fieldMid = FIELD_X + FIELD_W / 2;

    // When ball is on P2's side, position between ball and goal to defend
    const ballOnMySide = this.ball.x > fieldMid;
    let targetX: number;
    let targetY: number;

    if (ballOnMySide) {
      // Defend: stay between ball and goal center
      targetX = (this.ball.x + goalX) / 2;
      targetY = (this.ball.y + goalY) / 2;
    } else {
      // Attack: chase the ball
      targetX = this.ball.x;
      targetY = this.ball.y;
    }

    const dx = targetX - this.p2.x;
    const dy = targetY - this.p2.y;
    const deadzone = 8;

    const toBallDx = this.ball.x - this.p2.x;
    const toBallDy = this.ball.y - this.p2.y;
    const distToBall = Math.sqrt(toBallDx * toBallDx + toBallDy * toBallDy);

    return {
      left: dx < -deadzone,
      right: dx > deadzone,
      up: dy < -deadzone,
      down: dy > deadzone,
      action1: distToBall < KICK_RANGE + BALL_RADIUS + 10,
      action2: false,
    };
  }

  // ── Render ───────────────────────────────────────────────────────────────
  render(ctx: CanvasRenderingContext2D): void {
    this.drawBackground(ctx);
    this.drawField(ctx);
    this.drawGoal(ctx, 'left', this.goalL, COLOR_P1);
    this.drawGoal(ctx, 'right', this.goalR, COLOR_P2);
    this.drawBall(ctx);
    this.drawPlayer(ctx, this.p1, COLOR_P1);
    this.drawPlayer(ctx, this.p2, COLOR_P2);
    this.drawHUD(ctx);
    this.drawFlash(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  private drawField(ctx: CanvasRenderingContext2D): void {
    // Green surface
    ctx.fillStyle = COLOR_FIELD;
    ctx.fillRect(FIELD_X, FIELD_Y, FIELD_W, FIELD_H);

    ctx.strokeStyle = COLOR_LINE;
    ctx.lineWidth = 2;

    // Border
    ctx.strokeRect(FIELD_X, FIELD_Y, FIELD_W, FIELD_H);

    // Center line
    const cx = FIELD_X + FIELD_W / 2;
    const cy = FIELD_Y + FIELD_H / 2;
    ctx.beginPath();
    ctx.moveTo(cx, FIELD_Y);
    ctx.lineTo(cx, FIELD_Y + FIELD_H);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, CENTER_CIRCLE_R, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = COLOR_LINE;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    // Penalty areas
    const penaltyTop = cy - PENALTY_H / 2;
    ctx.strokeRect(FIELD_X, penaltyTop, PENALTY_W, PENALTY_H);
    ctx.strokeRect(FIELD_X + FIELD_W - PENALTY_W, penaltyTop, PENALTY_W, PENALTY_H);
  }

  private drawGoal(
    ctx: CanvasRenderingContext2D,
    side: 'left' | 'right',
    goal: Goal,
    color: string,
  ): void {
    const halfH = GOAL_HEIGHT / 2;
    const topY = goal.y - halfH;
    const botY = goal.y + halfH;
    const netDepth = 20;

    let x: number;
    let netX: number;

    if (side === 'left') {
      x = FIELD_X;
      netX = FIELD_X - netDepth;
    } else {
      x = FIELD_X + FIELD_W;
      netX = FIELD_X + FIELD_W;
    }

    // Net (hatched area)
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = color;
    if (side === 'left') {
      ctx.fillRect(netX, topY, netDepth, GOAL_HEIGHT);
    } else {
      ctx.fillRect(netX, topY, netDepth, GOAL_HEIGHT);
    }

    // Hatch lines
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    const hatchSpacing = 8;
    const nxEnd = netX + netDepth;
    for (let hy = topY; hy <= botY; hy += hatchSpacing) {
      ctx.beginPath();
      ctx.moveTo(netX, hy);
      ctx.lineTo(nxEnd, hy);
      ctx.stroke();
    }
    for (let hx = netX; hx <= nxEnd; hx += hatchSpacing) {
      ctx.beginPath();
      ctx.moveTo(hx, topY);
      ctx.lineTo(hx, botY);
      ctx.stroke();
    }
    ctx.restore();

    // Goal frame
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    if (side === 'left') {
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(netX, topY);
      ctx.lineTo(netX, botY);
      ctx.lineTo(x, botY);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x + netDepth, topY);
      ctx.lineTo(x + netDepth, botY);
      ctx.lineTo(x, botY);
      ctx.stroke();
    }

    // Posts (circles at goal line corners)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, topY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, botY, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawBall(ctx: CanvasRenderingContext2D): void {
    const b = this.ball;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(b.x + 2, b.y + 2, BALL_RADIUS, BALL_RADIUS * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ball body
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Outline
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(b.x, b.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    // Spin indicator line
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.spinAngle);
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-BALL_RADIUS * 0.6, 0);
    ctx.lineTo(BALL_RADIUS * 0.6, 0);
    ctx.stroke();
    ctx.restore();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, p: Player, color: string): void {
    const jumping = p.jumpTimer > 0;
    const scale = jumping ? 1.3 : 1.0;
    const r = PLAYER_RADIUS * scale;

    // Jump shadow
    if (jumping) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 6, PLAYER_RADIUS, PLAYER_RADIUS * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player circle
    ctx.save();
    if (p.kickCooldown > 0) {
      ctx.globalAlpha = 0.5;
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, jumping ? p.y - 8 : p.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, jumping ? p.y - 8 : p.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Direction indicator
    const speed = vecLen(vec2(p.vx, p.vy));
    if (speed > 10) {
      const dir = vecNorm(vec2(p.vx, p.vy));
      const iy = jumping ? p.y - 8 : p.y;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, iy);
      ctx.lineTo(p.x + dir.x * r * 0.8, iy + dir.y * r * 0.8);
      ctx.stroke();
    }
  }

  private drawHUD(ctx: CanvasRenderingContext2D): void {
    const hudY = FIELD_Y - 8;

    ctx.font = 'bold 36px Orbitron, sans-serif';
    ctx.textBaseline = 'bottom';

    // P1 score (left)
    ctx.fillStyle = COLOR_P1;
    ctx.textAlign = 'left';
    ctx.fillText(`${this.scoreP1}`, FIELD_X + 20, hudY);

    // P2 score (right)
    ctx.fillStyle = COLOR_P2;
    ctx.textAlign = 'right';
    ctx.fillText(`${this.scoreP2}`, FIELD_X + FIELD_W - 20, hudY);

    // Timer (center)
    ctx.fillStyle = COLOR_LINE;
    ctx.textAlign = 'center';
    const secs = Math.ceil(this.timer);
    const mins = Math.floor(secs / 60);
    const sec = secs % 60;
    const timeStr = `${mins}:${sec.toString().padStart(2, '0')}`;
    ctx.fillText(timeStr, CANVAS_W / 2, hudY);
  }

  private drawFlash(ctx: CanvasRenderingContext2D): void {
    if (this.flashTimer <= 0) return;
    const alpha = (this.flashTimer / 0.4) * 0.35;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.flashColor;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();
  }
}
