import { InputManager } from '../../core/InputManager.ts';
import type { IGame } from '../IGame.ts';
import { screenShake } from '../../core/ScreenShake.ts';

// Canvas
const W = 1280;
const H = 720;
const CX = W / 2;
const CY = H / 2;

// Arena
const ARENA_RADIUS_INITIAL = 280;
const ARENA_RADIUS_FINAL = ARENA_RADIUS_INITIAL * 0.4; // 112
const ARENA_SHRINK_DURATION = 60; // seconds
const BG_COLOR = '#020210';

// Players
const PLAYER_RADIUS = 20;
const PLAYER_SPEED = 250;
const P1_COLOR = '#00e5ff';
const P2_COLOR = '#ff4466';

// Shockwave
const SHOCKWAVE_DURATION = 0.4;

// Embers
const EMBER_COUNT = 30;

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
const ZONE_COLOR = '#8844cc';

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

interface Shockwave {
  x: number;
  y: number;
  timer: number;
  maxTimer: number;
}

interface Ember {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
  amplitude: number;
}

interface LavaBubble {
  angle: number;
  timer: number;
  maxTimer: number;
  size: number;
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
  private durationMult = 1;
  private effectiveShrinkDuration = ARENA_SHRINK_DURATION;
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

  private shockwaves: Shockwave[] = [];
  private collisionShakeTimer = 0;
  private collisionShakeOffset: Vec2 = v2(0, 0);
  private embers: Ember[] = [];
  private lavaBubbles: LavaBubble[] = [];

  setDurationMultiplier(mult: number): void {
    this.durationMult = mult;
  }

  init(_canvas: HTMLCanvasElement, _ctx: CanvasRenderingContext2D): void {
    this.input = new InputManager();
    this.input.init();

    this.timer = GAME_DURATION * this.durationMult;
    this.effectiveShrinkDuration = ARENA_SHRINK_DURATION * this.durationMult;
    this.finished = false;
    this.winner = null;
    this.arenaRadius = ARENA_RADIUS_INITIAL;
    this.quakeTimer = QUAKE_INTERVAL;
    this.quakeWarning = false;
    this.quakeShakeTimer = 0;
    this.quakeShakeOffset = v2(0, 0);

    this.shockwaves = [];
    this.collisionShakeTimer = 0;
    this.collisionShakeOffset = v2(0, 0);
    this.embers = [];
    this.lavaBubbles = [];
    for (let i = 0; i < EMBER_COUNT; i++) {
      this.embers.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: 1 + Math.random() * 2.5,
        speed: 20 + Math.random() * 40,
        phase: Math.random() * Math.PI * 2,
        amplitude: 10 + Math.random() * 20,
      });
    }

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
    const elapsed = GAME_DURATION * this.durationMult - this.timer;
    const t = Math.min(elapsed / this.effectiveShrinkDuration, 1);
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

    // Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      if (!sw) continue;
      sw.timer -= dt;
      if (sw.timer <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Collision screen shake
    if (this.collisionShakeTimer > 0) {
      this.collisionShakeTimer -= dt;
      const amp = 4 * (this.collisionShakeTimer / 0.15);
      const t = this.elapsed * 1000;
      this.collisionShakeOffset = v2(Math.sin(t * 0.07) * amp, Math.cos(t * 0.09) * amp);
    } else {
      this.collisionShakeOffset = v2(0, 0);
    }
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

      // Shockwave at midpoint
      const mid = v2Scale(v2Add(this.p1.pos, this.p2.pos), 0.5);
      this.shockwaves.push({
        x: mid.x,
        y: mid.y,
        timer: SHOCKWAVE_DURATION,
        maxTimer: SHOCKWAVE_DURATION,
      });

      // Collision screen shake
      this.collisionShakeTimer = 0.15;
      screenShake.trigger(0.5, 200);
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
    const ox = this.quakeShakeOffset.x + this.collisionShakeOffset.x;
    const oy = this.quakeShakeOffset.y + this.collisionShakeOffset.y;

    ctx.save();
    ctx.translate(ox, oy);

    this.drawBackground(ctx);
    this.drawArena(ctx);
    this.drawDangerGlow(ctx);
    this.drawZone(ctx);
    this.drawShockwaves(ctx);
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
    ctx.save();

    // Deep space background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(-10, -10, W + 20, H + 20);

    // Saturn in bottom-left, partially visible
    const saturnX = -60;
    const saturnY = H + 40;
    const saturnRx = 320;
    const saturnRy = 280;

    // Saturn body – tan/gold gradient
    ctx.save();
    ctx.filter = 'blur(2px)';
    const satGrad = ctx.createRadialGradient(
      saturnX + saturnRx * 0.15,
      saturnY - saturnRy * 0.15,
      saturnRy * 0.1,
      saturnX,
      saturnY,
      saturnRy,
    );
    satGrad.addColorStop(0, '#e0bd6e');
    satGrad.addColorStop(0.5, '#c8944a');
    satGrad.addColorStop(1, '#6a4420');
    ctx.beginPath();
    ctx.ellipse(saturnX, saturnY, saturnRx, saturnRy, 0, 0, Math.PI * 2);
    ctx.fillStyle = satGrad;
    ctx.fill();
    ctx.restore();

    // Saturn rings – elliptical arcs at varying opacities
    ctx.save();
    ctx.filter = 'blur(1px)';
    const ringColors = [
      { rx: saturnRx * 1.55, ry: saturnRy * 0.35, alpha: 0.35, w: 12, color: '#d4aa60' },
      { rx: saturnRx * 1.45, ry: saturnRy * 0.3, alpha: 0.25, w: 8, color: '#c89850' },
      { rx: saturnRx * 1.35, ry: saturnRy * 0.26, alpha: 0.2, w: 6, color: '#b08040' },
      { rx: saturnRx * 1.65, ry: saturnRy * 0.4, alpha: 0.15, w: 18, color: '#c0a060' },
    ];
    for (const ring of ringColors) {
      ctx.beginPath();
      ctx.ellipse(saturnX, saturnY, ring.rx, ring.ry, -0.15, Math.PI + 0.3, Math.PI * 2 - 0.3);
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = ring.alpha;
      ctx.lineWidth = ring.w;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    ctx.restore();

    // Dim star-like particles (white/blue, small)
    ctx.save();
    for (const ember of this.embers) {
      ember.y -= ember.speed * 0.016;
      ember.x += Math.sin(this.elapsed * 2 + ember.phase) * ember.amplitude * 0.016;
      if (ember.y < -10) {
        ember.y = H + 10;
        ember.x = Math.random() * W;
      }
      const twinkle = 0.5 + 0.5 * Math.sin(this.elapsed * 3 + ember.phase);
      ctx.globalAlpha = 0.2 + twinkle * 0.2;
      // Mix white and blue
      const blue = Math.floor(200 + twinkle * 55);
      ctx.fillStyle = `rgb(${180 + Math.floor(twinkle * 75)}, ${200 + Math.floor(twinkle * 55)}, ${blue})`;
      ctx.beginPath();
      ctx.arc(ember.x, ember.y, Math.min(ember.size, 2), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.restore();
  }

  private drawArena(ctx: CanvasRenderingContext2D): void {
    const r = this.arenaRadius;

    // Outer glow ring – golden
    ctx.save();
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(CX, CY, r + 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // Arena surface – textured radial gradient (golden orbital platform)
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, r, 0, Math.PI * 2);
    ctx.clip();

    const surfGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, r);
    surfGrad.addColorStop(0, '#c4a44a');
    surfGrad.addColorStop(0.6, '#9a7a30');
    surfGrad.addColorStop(1, '#7a4a18');
    ctx.fillStyle = surfGrad;
    ctx.fillRect(CX - r, CY - r, r * 2, r * 2);
    ctx.restore();

    // Arena border – golden stroke
    ctx.beginPath();
    ctx.arc(CX, CY, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  private drawDangerGlow(ctx: CanvasRenderingContext2D): void {
    const r = this.arenaRadius;
    const outerR = ARENA_RADIUS_INITIAL + 20;

    // Danger level: 0 at full size, 1 at minimum size
    const danger = Math.max(
      0,
      Math.min(
        1,
        1 - (this.arenaRadius - ARENA_RADIUS_FINAL) / (ARENA_RADIUS_INITIAL - ARENA_RADIUS_FINAL),
      ),
    );
    const pulse = 0.5 + 0.5 * Math.sin(this.elapsed * (4 + danger * 8));

    // Pulsing red overlay between current and original radius
    if (r < ARENA_RADIUS_INITIAL - 2) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(CX, CY, outerR, 0, Math.PI * 2);
      ctx.arc(CX, CY, r, 0, Math.PI * 2, true);
      ctx.clip();

      const dangerGrad = ctx.createRadialGradient(CX, CY, r, CX, CY, outerR);
      dangerGrad.addColorStop(0, `rgba(200, 30, 30, ${0.3 + danger * 0.4})`);
      dangerGrad.addColorStop(1, `rgba(80, 10, 10, ${0.1 + danger * 0.2})`);
      ctx.fillStyle = dangerGrad;
      ctx.fillRect(CX - outerR, CY - outerR, outerR * 2, outerR * 2);
      ctx.restore();
    }

    // Glowing edge – transitions from orange to red as danger increases
    const edgeGlow = ctx.createRadialGradient(CX, CY, r - 15, CX, CY, r + 5);
    const edgeIntensity = 0.3 + danger * 0.5 * pulse;
    const redComp = Math.floor(255 - danger * 55);
    const greenComp = Math.floor(100 - danger * 80);
    edgeGlow.addColorStop(0, `rgba(${redComp}, ${greenComp}, 0, 0)`);
    edgeGlow.addColorStop(
      0.7,
      `rgba(${redComp}, ${Math.floor(greenComp * 0.8)}, 0, ${edgeIntensity})`,
    );
    edgeGlow.addColorStop(
      1,
      `rgba(${redComp}, ${Math.floor(greenComp * 0.4)}, 0, ${edgeIntensity * 0.5})`,
    );
    ctx.beginPath();
    ctx.arc(CX, CY, r + 5, 0, Math.PI * 2);
    ctx.fillStyle = edgeGlow;
    ctx.fill();

    // Golden sparks at the edge (replacing lava bubbles)
    while (this.lavaBubbles.length < 4) {
      this.lavaBubbles.push({
        angle: Math.random() * Math.PI * 2,
        timer: Math.random() * 1.5,
        maxTimer: 0.8 + Math.random() * 0.7,
        size: 3 + Math.random() * 5,
      });
    }
    for (let i = this.lavaBubbles.length - 1; i >= 0; i--) {
      const b = this.lavaBubbles[i];
      if (!b) continue;
      b.timer -= 0.016;
      if (b.timer <= 0) {
        b.angle = Math.random() * Math.PI * 2;
        b.timer = b.maxTimer;
        b.size = 3 + Math.random() * 5;
      }
      const progress = 1 - b.timer / b.maxTimer;
      const bx = CX + Math.cos(b.angle) * (r + 5);
      const by = CY + Math.sin(b.angle) * (r + 5);
      const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
      const bSize = b.size * (0.5 + progress * 0.5);
      ctx.save();
      ctx.beginPath();
      ctx.arc(bx, by, bSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.7})`;
      ctx.fill();
      ctx.restore();
    }
  }

  private drawZone(ctx: CanvasRenderingContext2D): void {
    const z = this.zone;
    const pulse = 1 + Math.sin(this.elapsed * 6) * 0.1;
    const r = z.radius * pulse;

    // Violet glow
    const grad = ctx.createRadialGradient(z.pos.x, z.pos.y, 0, z.pos.x, z.pos.y, r * 1.4);
    grad.addColorStop(0, 'rgba(136, 68, 204, 0.35)');
    grad.addColorStop(1, 'rgba(136, 68, 204, 0)');
    ctx.beginPath();
    ctx.arc(z.pos.x, z.pos.y, r * 1.4, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Amber/golden inner circle
    const obsGrad = ctx.createRadialGradient(z.pos.x, z.pos.y, 0, z.pos.x, z.pos.y, r);
    obsGrad.addColorStop(0, 'rgba(200, 160, 60, 0.5)');
    obsGrad.addColorStop(1, 'rgba(120, 80, 20, 0.25)');
    ctx.beginPath();
    ctx.arc(z.pos.x, z.pos.y, r, 0, Math.PI * 2);
    ctx.fillStyle = obsGrad;
    ctx.fill();
    ctx.strokeStyle = ZONE_COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, f: Fighter, color: string): void {
    const r = PLAYER_RADIUS;
    const jumping = f.jumpTimer > 0;
    const jumpProgress = jumping ? Math.sin((f.jumpTimer / JUMP_DURATION) * Math.PI) : 0;

    // Facing angle for rotation
    const angle = Math.atan2(f.facing.y, f.facing.x);

    ctx.save();
    ctx.translate(f.pos.x, f.pos.y);

    // Jump shadow
    if (jumping) {
      const shadowScale = 1 - jumpProgress * 0.3;
      ctx.save();
      ctx.scale(shadowScale, shadowScale * 0.5);
      ctx.beginPath();
      ctx.arc(0, r * 0.5, r * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();
      ctx.restore();
    }

    // Float offset when jumping
    const floatY = jumping ? -jumpProgress * 12 : 0;
    ctx.translate(0, floatY);

    // Rotate to facing direction (offset by -PI/2 so "up" on the body faces the direction)
    ctx.rotate(angle + Math.PI / 2);

    const bodyR = r * 0.75;
    const skinTone = '#d4956a';

    // --- Arms (ellipses extending to sides) ---
    ctx.save();
    // Left arm
    ctx.save();
    ctx.translate(-bodyR * 0.85, -bodyR * 0.1);
    ctx.rotate(-0.3);
    ctx.beginPath();
    ctx.ellipse(0, 0, bodyR * 0.55, bodyR * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = skinTone;
    ctx.fill();
    ctx.restore();
    // Right arm
    ctx.save();
    ctx.translate(bodyR * 0.85, -bodyR * 0.1);
    ctx.rotate(0.3);
    ctx.beginPath();
    ctx.ellipse(0, 0, bodyR * 0.55, bodyR * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = skinTone;
    ctx.fill();
    ctx.restore();
    ctx.restore();

    // --- Body (main circle with shading) ---
    const bodyGrad = ctx.createRadialGradient(-bodyR * 0.3, -bodyR * 0.3, bodyR * 0.1, 0, 0, bodyR);
    bodyGrad.addColorStop(0, '#e8b080');
    bodyGrad.addColorStop(0.7, skinTone);
    bodyGrad.addColorStop(1, '#a06838');
    ctx.beginPath();
    ctx.arc(0, 0, bodyR, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // --- Mawashi (belt) across body middle ---
    ctx.beginPath();
    ctx.rect(-bodyR * 0.85, -bodyR * 0.15, bodyR * 1.7, bodyR * 0.35);
    ctx.fillStyle = color;
    ctx.fill();

    // --- Head (small circle at top/front of body) ---
    const headR = bodyR * 0.45;
    const headY = -bodyR * 0.75;
    const headGrad = ctx.createRadialGradient(
      -headR * 0.25,
      headY - headR * 0.25,
      headR * 0.1,
      0,
      headY,
      headR,
    );
    headGrad.addColorStop(0, '#e8b080');
    headGrad.addColorStop(1, '#b07848');
    ctx.beginPath();
    ctx.arc(0, headY, headR, 0, Math.PI * 2);
    ctx.fillStyle = headGrad;
    ctx.fill();

    // Topknot (chonmage)
    ctx.beginPath();
    ctx.ellipse(0, headY - headR * 0.8, headR * 0.25, headR * 0.35, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2a1a0a';
    ctx.fill();

    ctx.restore();

    // Dash cooldown indicator (arc around player, drawn without rotation)
    if (f.dashCooldown > 0) {
      const frac = f.dashCooldown / DASH_COOLDOWN;
      ctx.beginPath();
      ctx.arc(f.pos.x, f.pos.y + floatY, r + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      ctx.strokeStyle = '#ffffff66';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  private drawShockwaves(ctx: CanvasRenderingContext2D): void {
    for (const sw of this.shockwaves) {
      const progress = 1 - sw.timer / sw.maxTimer;
      const radius = 10 + progress * 60;
      const alpha = 1 - progress;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.lineWidth = 3 * (1 - progress) + 1;
      ctx.stroke();
    }
  }

  private drawHUD(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.font = 'bold 28px Orbitron, Rajdhani, sans-serif';
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
    ctx.font = '16px Orbitron, Rajdhani, sans-serif';
    ctx.fillStyle = ZONE_COLOR;
    ctx.fillText('● ZONE +2/s', CX, 55);

    ctx.restore();
  }

  private drawEarthquakeWarning(ctx: CanvasRenderingContext2D): void {
    // Orange/yellow lava-colored border flash
    const alpha = 0.3 + 0.3 * Math.sin(this.elapsed * 20);
    ctx.save();
    ctx.strokeStyle = `rgba(255, 160, 20, ${alpha})`;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, W - 6, H - 6);

    // Warning text
    ctx.font = 'bold 24px Orbitron, Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = `rgba(255, 140, 40, ${0.6 + 0.4 * Math.sin(this.elapsed * 15)})`;
    ctx.fillText('⚠ ERUPTION', CX, H - 20);

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
