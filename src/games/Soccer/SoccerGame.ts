import { IGame } from '../IGame.ts';
import { InputManager, PlayerInput } from '../../core/InputManager.ts';
import { screenShake } from '../../core/ScreenShake.ts';

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
const COLOR_FIELD = '#0d0d1a';
const COLOR_LINE = '#00f5ff1a';
const COLOR_GRID = '#00f5ff08';
const COLOR_BALL_GLOW = '#00ff88';
const COLOR_PORTAL = '#9b00ff';
const COLOR_HAZARD = '#ff6600';
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
  private elapsed = 0;
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
    this.elapsed = 0;
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

    this.elapsed += dt;

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
        screenShake.trigger(0.3, 300);
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
        screenShake.trigger(0.3, 300);
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
    // Dark metallic floor
    ctx.fillStyle = COLOR_FIELD;
    ctx.fillRect(FIELD_X, FIELD_Y, FIELD_W, FIELD_H);

    // Glowing hexagonal grid pattern
    ctx.save();
    ctx.beginPath();
    ctx.rect(FIELD_X, FIELD_Y, FIELD_W, FIELD_H);
    ctx.clip();
    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 1;
    const hexSize = 30;
    const hexH = hexSize * Math.sqrt(3);
    const hexColStep = hexSize * 1.5;
    const maxCol = (FIELD_W + hexSize * 2) / hexColStep;
    const maxRow = (FIELD_H + hexH) / hexH;
    for (let col = -1; col < maxCol; col++) {
      for (let row = -1; row < maxRow; row++) {
        const hx = FIELD_X + col * hexSize * 1.5;
        const hy = FIELD_Y + row * hexH + (col % 2 !== 0 ? hexH / 2 : 0);
        this.drawHexagon(ctx, hx, hy, hexSize);
      }
    }
    ctx.restore();

    // Orange hazard stripes at field edges
    this.drawHazardStripes(ctx);

    // Field markings (faint cyan)
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

  private drawHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hx = cx + size * Math.cos(angle);
      const hy = cy + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();
  }

  private drawHazardStripes(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.beginPath();
    ctx.rect(FIELD_X, FIELD_Y, FIELD_W, FIELD_H);
    ctx.clip();

    const spacing = 20;
    const depth = 14;
    ctx.strokeStyle = COLOR_HAZARD;
    ctx.lineWidth = 6;
    ctx.globalAlpha = 0.25;
    ctx.shadowColor = COLOR_HAZARD;
    ctx.shadowBlur = 4;

    // Top edge
    for (let x = FIELD_X - spacing; x < FIELD_X + FIELD_W + spacing; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, FIELD_Y);
      ctx.lineTo(x + depth, FIELD_Y + depth);
      ctx.stroke();
    }
    // Bottom edge
    for (let x = FIELD_X - spacing; x < FIELD_X + FIELD_W + spacing; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, FIELD_Y + FIELD_H);
      ctx.lineTo(x + depth, FIELD_Y + FIELD_H - depth);
      ctx.stroke();
    }
    // Left edge
    for (let y = FIELD_Y - spacing; y < FIELD_Y + FIELD_H + spacing; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(FIELD_X, y);
      ctx.lineTo(FIELD_X + depth, y + depth);
      ctx.stroke();
    }
    // Right edge
    for (let y = FIELD_Y - spacing; y < FIELD_Y + FIELD_H + spacing; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(FIELD_X + FIELD_W, y);
      ctx.lineTo(FIELD_X + FIELD_W - depth, y + depth);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawGoal(
    ctx: CanvasRenderingContext2D,
    side: 'left' | 'right',
    goal: Goal,
    _color: string,
  ): void {
    ctx.save();
    const halfH = GOAL_HEIGHT / 2;
    const topY = goal.y - halfH;
    const botY = goal.y + halfH;
    const x = side === 'left' ? FIELD_X : FIELD_X + FIELD_W;
    const netDepth = 20;
    const netX = side === 'left' ? x - netDepth : x + netDepth;

    // Animate opacity flicker
    const flicker = 0.7 + 0.3 * Math.sin(this.elapsed * 3);
    ctx.globalAlpha = flicker;
    ctx.strokeStyle = COLOR_PORTAL;
    ctx.shadowColor = COLOR_PORTAL;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;

    // Vertical post at field edge
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x, botY);
    ctx.stroke();

    // Vertical line at net side
    ctx.beginPath();
    ctx.moveTo(netX, topY);
    ctx.lineTo(netX, botY);
    ctx.stroke();

    // Arc at top connecting the two verticals
    const midX = (x + netX) / 2;
    const arcR = netDepth / 2;
    ctx.beginPath();
    if (side === 'left') {
      ctx.arc(midX, topY, arcR, Math.PI, 0);
    } else {
      ctx.arc(midX, topY, arcR, Math.PI, 0);
    }
    ctx.stroke();

    ctx.restore();
  }

  private drawBall(ctx: CanvasRenderingContext2D): void {
    const b = this.ball;
    ctx.save();

    // Glow effect
    ctx.shadowColor = COLOR_BALL_GLOW;
    ctx.shadowBlur = 8;

    // Ball body (white with slight transparency)
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Neon green outline
    ctx.strokeStyle = COLOR_BALL_GLOW;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(b.x, b.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    // Procedural pentagon pattern
    ctx.shadowBlur = 0;
    ctx.translate(b.x, b.y);
    ctx.rotate(b.spinAngle);
    ctx.strokeStyle = COLOR_BALL_GLOW;
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.6;
    const pentR = BALL_RADIUS * 0.3;
    const pentDist = BALL_RADIUS * 0.5;
    for (let i = 0; i < 5; i++) {
      const a = ((Math.PI * 2) / 5) * i;
      const px = Math.cos(a) * pentDist;
      const py = Math.sin(a) * pentDist;
      ctx.beginPath();
      for (let j = 0; j < 5; j++) {
        const va = ((Math.PI * 2) / 5) * j - Math.PI / 2;
        const vx = px + Math.cos(va) * pentR;
        const vy = py + Math.sin(va) * pentR;
        if (j === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, p: Player, color: string): void {
    const jumping = p.jumpTimer > 0;
    const scale = jumping ? 1.3 : 1.0;
    const bodyW = PLAYER_RADIUS * scale;
    const bodyH = PLAYER_RADIUS * 2 * scale;
    const drawY = jumping ? p.y - 8 : p.y;

    // Jump shadow
    if (jumping) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 6, PLAYER_RADIUS, PLAYER_RADIUS * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    if (p.kickCooldown > 0) ctx.globalAlpha = 0.5;

    // Suit body (capsule shape with gradient)
    const cr = parseInt(color.slice(1, 3), 16);
    const cg = parseInt(color.slice(3, 5), 16);
    const cb = parseInt(color.slice(5, 7), 16);
    // Halve RGB values via bit-shift to produce a darker suit shade
    const darker = `rgb(${cr >> 1},${cg >> 1},${cb >> 1})`;
    const grad = ctx.createLinearGradient(p.x, drawY - bodyH / 2, p.x, drawY + bodyH / 2);
    grad.addColorStop(0, color);
    grad.addColorStop(1, darker);
    ctx.fillStyle = grad;
    const rx = p.x - bodyW / 2;
    const ry = drawY - bodyH / 2;
    const cornerR = bodyW / 2;
    ctx.beginPath();
    ctx.roundRect(rx, ry, bodyW, bodyH, cornerR);
    ctx.fill();

    // Suit border
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(rx, ry, bodyW, bodyH, cornerR);
    ctx.stroke();

    // Helmet (circle at top of capsule)
    const helmetR = bodyW * 0.35;
    const helmetY = drawY - bodyH / 2 + helmetR + 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, helmetY, helmetR, 0, Math.PI * 2);
    ctx.fill();

    // Visor highlight
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(p.x + helmetR * 0.2, helmetY - helmetR * 0.15, helmetR * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Direction indicator
    const speed = vecLen(vec2(p.vx, p.vy));
    if (speed > 10) {
      const dir = vecNorm(vec2(p.vx, p.vy));
      const pr = PLAYER_RADIUS * scale;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, drawY);
      ctx.lineTo(p.x + dir.x * pr * 0.8, drawY + dir.y * pr * 0.8);
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
    ctx.fillStyle = '#ffffff';
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
