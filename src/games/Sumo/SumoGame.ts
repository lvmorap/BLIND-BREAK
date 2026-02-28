import { InputManager } from '../../core/InputManager.ts';
import type { IGame } from '../IGame.ts';

// Canvas
const W = 1280;
const H = 720;
const CX = W / 2;
const CY = H / 2;

// Arena
const ARENA_RADIUS_INITIAL = 280;
const ARENA_RADIUS_FINAL = ARENA_RADIUS_INITIAL * 0.4; // 112
const ARENA_SHRINK_DURATION = 60; // seconds
const ARENA_COLOR = '#c4a44a';
const DANGER_COLOR_R = 204;
const DANGER_COLOR_G = 34;
const DANGER_COLOR_B = 0;
const BG_COLOR = '#0a0a12';

// Players
const PLAYER_RADIUS = 20;
const PLAYER_SPEED = 250;
const P1_COLOR = '#00e5ff';
const P2_COLOR = '#ff4466';

// Dash
const DASH_IMPULSE = 700;
const DASH_HIT_RANGE = 30;
const DASH_PUSH_FORCE = 500;
const DASH_COOLDOWN = 1.5;
const DASH_DURATION = 0.15;

// Jump
const JUMP_DURATION = 0.5;
const JUMP_COOLDOWN = 2;

// Scoring zone
const ZONE_SPEED = 120;
const ZONE_DIRECTION_INTERVAL = 2.5;
const ZONE_SIZE_INTERVAL = 4;
const ZONE_RADIUS_SMALL = 25;
const ZONE_RADIUS_LARGE = 50;
const ZONE_PTS_PER_SEC = 2;
const ZONE_COLOR = '#44cc44';

// Earthquakes
const QUAKE_INTERVAL = 6;
const QUAKE_WARN_TIME = 1;
const QUAKE_IMPULSE = 200;

// Border scoring
const BORDER_TOUCH_DIST = 5;

// Physics
const MIN_PUSH = 100;
const FRICTION = 4; // velocity decay factor per second

// Timer
const GAME_DURATION = 60;

interface Vec2 {
  x: number;
  y: number;
}

interface Fighter {
  pos: Vec2;
  vel: Vec2;
  facing: Vec2;
  dashCooldown: number;
  dashTimer: number;
  jumpCooldown: number;
  jumpTimer: number;
  atBorder: boolean;
  score: number;
}

interface ScoringZone {
  pos: Vec2;
  vel: Vec2;
  radius: number;
  dirTimer: number;
  sizeTimer: number;
  large: boolean;
}

// --- Vector helpers ---
function v2(x: number, y: number): Vec2 {
  return { x, y };
}

function v2Add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

function v2Sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

function v2Scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

function v2Len(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

function v2Norm(v: Vec2): Vec2 {
  const l = v2Len(v);
  if (l < 0.0001) return { x: 0, y: 0 };
  return { x: v.x / l, y: v.y / l };
}

function v2Dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

function v2Dist(a: Vec2, b: Vec2): number {
  return v2Len(v2Sub(a, b));
}

function randomAngle(): number {
  return Math.random() * Math.PI * 2;
}

function randomDir(): Vec2 {
  const a = randomAngle();
  return { x: Math.cos(a), y: Math.sin(a) };
}

export class SumoGame implements IGame {
  private input!: InputManager;
  private timer = GAME_DURATION;
  private finished = false;
  private winner: 1 | 2 | null = null;
  private elapsed = 0;

  private arenaRadius = ARENA_RADIUS_INITIAL;
  private p1!: Fighter;
  private p2!: Fighter;
  private zone!: ScoringZone;

  private quakeTimer = QUAKE_INTERVAL;
  private quakeWarning = false;
  private quakeShakeTimer = 0;
  private quakeShakeOffset: Vec2 = v2(0, 0);

  init(_canvas: HTMLCanvasElement, _ctx: CanvasRenderingContext2D): void {
    this.input = new InputManager();
    this.input.init();

    this.timer = GAME_DURATION;
    this.finished = false;
    this.winner = null;
    this.arenaRadius = ARENA_RADIUS_INITIAL;
    this.quakeTimer = QUAKE_INTERVAL;
    this.quakeWarning = false;
    this.quakeShakeTimer = 0;
    this.quakeShakeOffset = v2(0, 0);

    this.p1 = this.createFighter(-ARENA_RADIUS_INITIAL * 0.5, 0);
    this.p2 = this.createFighter(ARENA_RADIUS_INITIAL * 0.5, 0);

    this.zone = this.createZone();
  }

  private createFighter(offX: number, offY: number): Fighter {
    return {
      pos: v2(CX + offX, CY + offY),
      vel: v2(0, 0),
      facing: v2(offX > 0 ? -1 : 1, 0),
      dashCooldown: 0,
      dashTimer: 0,
      jumpCooldown: 0,
      jumpTimer: 0,
      atBorder: false,
      score: 0,
    };
  }

  private createZone(): ScoringZone {
    const angle = randomAngle();
    const dist = Math.random() * (this.arenaRadius - ZONE_RADIUS_LARGE - 10);
    return {
      pos: v2(CX + Math.cos(angle) * dist, CY + Math.sin(angle) * dist),
      vel: v2Scale(randomDir(), ZONE_SPEED),
      radius: ZONE_RADIUS_LARGE,
      dirTimer: ZONE_DIRECTION_INTERVAL,
      sizeTimer: ZONE_SIZE_INTERVAL,
      large: true,
    };
  }

  update(dt: number): void {
    if (this.finished) return;

    this.elapsed += dt;
    this.input.update();

    // Timer
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0;
      this.endGame();
      return;
    }

    // Arena shrink
    const elapsed = GAME_DURATION - this.timer;
    const t = Math.min(elapsed / ARENA_SHRINK_DURATION, 1);
    this.arenaRadius = ARENA_RADIUS_INITIAL + (ARENA_RADIUS_FINAL - ARENA_RADIUS_INITIAL) * t;

    // Input
    const inp1 = this.input.getPlayer1();
    const inp2 = this.input.getPlayer2();

    // Movement
    this.applyMovement(this.p1, inp1.up, inp1.down, inp1.left, inp1.right, dt);
    this.applyMovement(this.p2, inp2.up, inp2.down, inp2.left, inp2.right, dt);

    // Dash
    this.handleDash(this.p1, inp1.action1, dt);
    this.handleDash(this.p2, inp2.action1, dt);

    // Jump
    this.handleJump(this.p1, inp1.action2, dt);
    this.handleJump(this.p2, inp2.action2, dt);

    // Dash collision
    this.checkDashHit(this.p1, this.p2);
    this.checkDashHit(this.p2, this.p1);

    // Apply velocity + friction
    this.applyPhysics(this.p1, dt);
    this.applyPhysics(this.p2, dt);

    // Player-player collision
    this.resolvePlayerCollision();

    // Clamp to arena
    this.clampToArena(this.p1);
    this.clampToArena(this.p2);

    // Border scoring
    this.checkBorderScoring(this.p1, this.p2);
    this.checkBorderScoring(this.p2, this.p1);

    // Scoring zone update
    this.updateZone(dt);

    // Zone scoring
    this.checkZoneScoring(this.p1, dt);
    this.checkZoneScoring(this.p2, dt);

    // Earthquakes
    this.updateEarthquake(dt);
  }

  private applyMovement(
    f: Fighter,
    up: boolean,
    down: boolean,
    left: boolean,
    right: boolean,
    dt: number,
  ): void {
    const dir = v2(0, 0);
    if (up) dir.y -= 1;
    if (down) dir.y += 1;
    if (left) dir.x -= 1;
    if (right) dir.x += 1;

    if (v2Len(dir) > 0.001) {
      const norm = v2Norm(dir);
      f.facing = norm;
      f.vel = v2Add(f.vel, v2Scale(norm, PLAYER_SPEED * dt * 8));
    }
  }

  private handleDash(f: Fighter, action: boolean, dt: number): void {
    f.dashCooldown = Math.max(0, f.dashCooldown - dt);
    f.dashTimer = Math.max(0, f.dashTimer - dt);

    if (action && f.dashCooldown <= 0) {
      f.vel = v2Add(f.vel, v2Scale(f.facing, DASH_IMPULSE));
      f.dashCooldown = DASH_COOLDOWN;
      f.dashTimer = DASH_DURATION;
    }
  }

  private handleJump(f: Fighter, action: boolean, dt: number): void {
    f.jumpCooldown = Math.max(0, f.jumpCooldown - dt);
    f.jumpTimer = Math.max(0, f.jumpTimer - dt);

    if (action && f.jumpCooldown <= 0) {
      f.jumpTimer = JUMP_DURATION;
      f.jumpCooldown = JUMP_COOLDOWN;
    }
  }

  private checkDashHit(attacker: Fighter, target: Fighter): void {
    if (attacker.dashTimer <= 0) return;
    if (target.jumpTimer > 0) return; // invulnerable

    const dist = v2Dist(attacker.pos, target.pos);
    if (dist < DASH_HIT_RANGE + PLAYER_RADIUS * 2) {
      const dir = v2Norm(v2Sub(target.pos, attacker.pos));
      target.vel = v2Add(target.vel, v2Scale(dir, DASH_PUSH_FORCE));
      attacker.dashTimer = 0; // consume the dash hit
    }
  }

  private applyPhysics(f: Fighter, dt: number): void {
    f.pos = v2Add(f.pos, v2Scale(f.vel, dt));
    // Friction to bring velocity toward zero
    const decay = Math.exp(-FRICTION * dt);
    f.vel = v2Scale(f.vel, decay);
  }

  private resolvePlayerCollision(): void {
    const dist = v2Dist(this.p1.pos, this.p2.pos);
    const minDist = PLAYER_RADIUS * 2;
    if (dist < minDist && dist > 0.001) {
      const normal = v2Norm(v2Sub(this.p2.pos, this.p1.pos));
      // Separate
      const overlap = minDist - dist;
      this.p1.pos = v2Add(this.p1.pos, v2Scale(normal, -overlap / 2));
      this.p2.pos = v2Add(this.p2.pos, v2Scale(normal, overlap / 2));

      // Push based on relative velocity
      const relVel = v2Sub(this.p1.vel, this.p2.vel);
      const relSpeed = v2Dot(relVel, normal);

      if (relSpeed > 0) {
        const pushMag = Math.max(relSpeed, MIN_PUSH);
        this.p1.vel = v2Add(this.p1.vel, v2Scale(normal, -pushMag));
        this.p2.vel = v2Add(this.p2.vel, v2Scale(normal, pushMag));
      } else {
        // Still push with minimum
        this.p1.vel = v2Add(this.p1.vel, v2Scale(normal, -MIN_PUSH));
        this.p2.vel = v2Add(this.p2.vel, v2Scale(normal, MIN_PUSH));
      }
    }
  }

  private clampToArena(f: Fighter): void {
    const dx = f.pos.x - CX;
    const dy = f.pos.y - CY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = this.arenaRadius - PLAYER_RADIUS;
    if (dist > maxDist && dist > 0.001) {
      const scale = maxDist / dist;
      f.pos.x = CX + dx * scale;
      f.pos.y = CY + dy * scale;

      // Cancel outward velocity component
      const norm = v2Norm(v2Sub(f.pos, v2(CX, CY)));
      const outward = v2Dot(f.vel, norm);
      if (outward > 0) {
        f.vel = v2Sub(f.vel, v2Scale(norm, outward));
      }
    }
  }

  private checkBorderScoring(player: Fighter, opponent: Fighter): void {
    const dist = v2Dist(player.pos, v2(CX, CY));
    const borderDist = this.arenaRadius - PLAYER_RADIUS - dist;
    const touching = borderDist <= BORDER_TOUCH_DIST;

    if (touching && !player.atBorder) {
      opponent.score += 1;
      player.atBorder = true;
    } else if (!touching) {
      player.atBorder = false;
    }
  }

  private updateZone(dt: number): void {
    // Direction change
    this.zone.dirTimer -= dt;
    if (this.zone.dirTimer <= 0) {
      this.zone.dirTimer = ZONE_DIRECTION_INTERVAL;
      this.zone.vel = v2Scale(randomDir(), ZONE_SPEED);
    }

    // Size change
    this.zone.sizeTimer -= dt;
    if (this.zone.sizeTimer <= 0) {
      this.zone.sizeTimer = ZONE_SIZE_INTERVAL;
      this.zone.large = !this.zone.large;
      this.zone.radius = this.zone.large ? ZONE_RADIUS_LARGE : ZONE_RADIUS_SMALL;
    }

    // Move
    this.zone.pos = v2Add(this.zone.pos, v2Scale(this.zone.vel, dt));

    // Bounce off arena boundary
    const dFromCenter = v2Dist(this.zone.pos, v2(CX, CY));
    const maxZoneDist = this.arenaRadius - this.zone.radius;
    if (dFromCenter > maxZoneDist && dFromCenter > 0.001) {
      // Clamp
      const norm = v2Norm(v2Sub(this.zone.pos, v2(CX, CY)));
      this.zone.pos = v2Add(v2(CX, CY), v2Scale(norm, maxZoneDist));

      // Reflect velocity
      const dot = v2Dot(this.zone.vel, norm);
      if (dot > 0) {
        this.zone.vel = v2Sub(this.zone.vel, v2Scale(norm, 2 * dot));
      }
    }
  }

  private checkZoneScoring(f: Fighter, dt: number): void {
    const dist = v2Dist(f.pos, this.zone.pos);
    if (dist < this.zone.radius + PLAYER_RADIUS) {
      f.score += ZONE_PTS_PER_SEC * dt;
    }
  }

  private updateEarthquake(dt: number): void {
    this.quakeTimer -= dt;

    this.quakeWarning = this.quakeTimer <= QUAKE_WARN_TIME && this.quakeTimer > 0;

    if (this.quakeWarning) {
      // Shake offset oscillation
      const freq = 30;
      const amp = 3;
      this.quakeShakeOffset = v2(
        Math.sin(this.quakeTimer * freq * Math.PI * 2) * amp,
        Math.cos(this.quakeTimer * freq * Math.PI * 2 * 1.3) * amp,
      );
    } else {
      this.quakeShakeOffset = v2(0, 0);
    }

    if (this.quakeTimer <= 0) {
      // Apply earthquake
      this.p1.vel = v2Add(this.p1.vel, v2Scale(randomDir(), QUAKE_IMPULSE));
      this.p2.vel = v2Add(this.p2.vel, v2Scale(randomDir(), QUAKE_IMPULSE));
      this.quakeTimer = QUAKE_INTERVAL;
      this.quakeWarning = false;
      this.quakeShakeTimer = 0.3; // brief post-shake visual
    }

    if (this.quakeShakeTimer > 0) {
      this.quakeShakeTimer -= dt;
      const amp = 2 * (this.quakeShakeTimer / 0.3);
      const t = this.elapsed * 1000;
      this.quakeShakeOffset = v2(Math.sin(t * 0.05) * amp, Math.cos(t * 0.07) * amp);
    }
  }

  private endGame(): void {
    this.finished = true;
    const s1 = this.p1.score;
    const s2 = this.p2.score;
    if (s1 > s2) this.winner = 1;
    else if (s2 > s1) this.winner = 2;
    else this.winner = null;
  }

  // --- Rendering ---

  render(ctx: CanvasRenderingContext2D): void {
    const ox = this.quakeShakeOffset.x;
    const oy = this.quakeShakeOffset.y;

    ctx.save();
    ctx.translate(ox, oy);

    this.drawBackground(ctx);
    this.drawArena(ctx);
    this.drawDangerGlow(ctx);
    this.drawZone(ctx);
    this.drawPlayer(ctx, this.p1, P1_COLOR);
    this.drawPlayer(ctx, this.p2, P2_COLOR);

    ctx.restore();

    // HUD drawn without shake
    this.drawHUD(ctx);

    if (this.quakeWarning) {
      this.drawEarthquakeWarning(ctx);
    }
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(-10, -10, W + 20, H + 20);
  }

  private drawArena(ctx: CanvasRenderingContext2D): void {
    const r = this.arenaRadius;

    // Gradient fill
    const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, r);
    grad.addColorStop(0, '#d4b45a');
    grad.addColorStop(0.7, ARENA_COLOR);
    grad.addColorStop(1, '#8a7230');

    ctx.beginPath();
    ctx.arc(CX, CY, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Ring border
    ctx.strokeStyle = '#6b5820';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  private drawDangerGlow(ctx: CanvasRenderingContext2D): void {
    const r = this.arenaRadius;
    const outerR = r + 60;

    const grad = ctx.createRadialGradient(CX, CY, r, CX, CY, outerR);
    grad.addColorStop(0, `rgba(${DANGER_COLOR_R}, ${DANGER_COLOR_G}, ${DANGER_COLOR_B}, 0.5)`);
    grad.addColorStop(1, `rgba(${DANGER_COLOR_R}, ${DANGER_COLOR_G}, ${DANGER_COLOR_B}, 0)`);

    ctx.beginPath();
    ctx.arc(CX, CY, outerR, 0, Math.PI * 2);
    ctx.arc(CX, CY, r, 0, Math.PI * 2, true);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  private drawZone(ctx: CanvasRenderingContext2D): void {
    const z = this.zone;
    const pulse = 1 + Math.sin(this.elapsed * 6) * 0.1;
    const r = z.radius * pulse;

    // Glow
    const grad = ctx.createRadialGradient(z.pos.x, z.pos.y, 0, z.pos.x, z.pos.y, r * 1.4);
    grad.addColorStop(0, 'rgba(68, 204, 68, 0.35)');
    grad.addColorStop(1, 'rgba(68, 204, 68, 0)');
    ctx.beginPath();
    ctx.arc(z.pos.x, z.pos.y, r * 1.4, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Main circle
    ctx.beginPath();
    ctx.arc(z.pos.x, z.pos.y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(68, 204, 68, 0.3)';
    ctx.fill();
    ctx.strokeStyle = ZONE_COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, f: Fighter, color: string): void {
    const r = PLAYER_RADIUS;
    const jumping = f.jumpTimer > 0;
    const drawR = jumping ? r * (1 + 0.3 * Math.sin(f.jumpTimer * 20)) : r;

    // Player circle
    ctx.beginPath();
    ctx.arc(f.pos.x, f.pos.y, drawR, 0, Math.PI * 2);
    ctx.fillStyle = jumping ? color + '99' : color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff44';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Direction indicator triangle
    const tipDist = drawR + 8;
    const tipX = f.pos.x + f.facing.x * tipDist;
    const tipY = f.pos.y + f.facing.y * tipDist;
    const perpX = -f.facing.y;
    const perpY = f.facing.x;
    const baseBack = 5;
    const baseWidth = 5;

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      f.pos.x + f.facing.x * (tipDist - baseBack) + perpX * baseWidth,
      f.pos.y + f.facing.y * (tipDist - baseBack) + perpY * baseWidth,
    );
    ctx.lineTo(
      f.pos.x + f.facing.x * (tipDist - baseBack) - perpX * baseWidth,
      f.pos.y + f.facing.y * (tipDist - baseBack) - perpY * baseWidth,
    );
    ctx.closePath();
    ctx.fillStyle = '#ffffffcc';
    ctx.fill();

    // Dash cooldown indicator (arc around player)
    if (f.dashCooldown > 0) {
      const frac = f.dashCooldown / DASH_COOLDOWN;
      ctx.beginPath();
      ctx.arc(f.pos.x, f.pos.y, drawR + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      ctx.strokeStyle = '#ffffff66';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  private drawHUD(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.font = 'bold 28px Orbitron, monospace';
    ctx.textBaseline = 'top';

    // P1 score (top-left)
    ctx.fillStyle = P1_COLOR;
    ctx.textAlign = 'left';
    ctx.fillText(`P1: ${Math.floor(this.p1.score)}`, 30, 20);

    // P2 score (top-right)
    ctx.fillStyle = P2_COLOR;
    ctx.textAlign = 'right';
    ctx.fillText(`P2: ${Math.floor(this.p2.score)}`, W - 30, 20);

    // Timer (center)
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    const secs = Math.ceil(this.timer);
    ctx.fillText(`${secs}s`, CX, 20);

    // Zone indicator
    ctx.font = '16px Orbitron, monospace';
    ctx.fillStyle = ZONE_COLOR;
    ctx.fillText('● ZONE +2/s', CX, 55);

    ctx.restore();
  }

  private drawEarthquakeWarning(ctx: CanvasRenderingContext2D): void {
    // Red border flash
    const alpha = 0.3 + 0.3 * Math.sin(this.elapsed * 20);
    ctx.save();
    ctx.strokeStyle = `rgba(255, 40, 40, ${alpha})`;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, W - 6, H - 6);

    // Warning text
    ctx.font = 'bold 24px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = `rgba(255, 80, 80, ${0.6 + 0.4 * Math.sin(this.elapsed * 15)})`;
    ctx.fillText('⚠ EARTHQUAKE', CX, H - 20);

    ctx.restore();
  }

  destroy(): void {
    this.input.destroy();
  }

  getWinner(): 1 | 2 | null {
    return this.winner;
  }

  isFinished(): boolean {
    return this.finished;
  }
}
