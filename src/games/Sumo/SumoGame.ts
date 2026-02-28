import { InputManager, type PlayerInput } from '../../core/InputManager.ts';
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
const BG_COLOR = '#0a0205';

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

  private aiEnabled = false;

  private lavaImg: HTMLImageElement | null = null;
  private lavaCracksImg: HTMLImageElement | null = null;
  private stoneImg: HTMLImageElement | null = null;
  private volcanoBgImg: HTMLImageElement | null = null;
  private lavaPattern: CanvasPattern | null = null;
  private stonePattern: CanvasPattern | null = null;

  setAIMode(enabled: boolean): void {
    this.aiEnabled = enabled;
  }

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

    // Load volcano textures
    const loadImg = (src: string): HTMLImageElement => {
      const img = new Image();
      img.src = src;
      return img;
    };
    this.lavaImg = loadImg('./assets/volcano/lava.png');
    this.lavaCracksImg = loadImg('./assets/volcano/lava-cracks.png');
    this.stoneImg = loadImg('./assets/volcano/stone.png');
    this.volcanoBgImg = loadImg('./assets/volcano/volcano-bg.svg');
    this.lavaPattern = null;
    this.stonePattern = null;

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
    let inp2 = this.input.getPlayer2();

    // AI override for player 2
    if (this.aiEnabled) {
      inp2 = this.computeAIInput();
    }

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

  private computeAIInput(): PlayerInput {
    const ai = this.p2;
    const opp = this.p1;
    const center = v2(CX, CY);

    // Desired direction accumulator (weighted)
    let goal = v2(0, 0);

    // 1. Move toward the scoring zone
    const toZone = v2Sub(this.zone.pos, ai.pos);
    const zoneDist = v2Len(toZone);
    if (zoneDist > 1) {
      goal = v2Add(goal, v2Scale(v2Norm(toZone), 1.0));
    }

    // 2. Stay away from the arena edge — push toward center when close
    const toCenter = v2Sub(center, ai.pos);
    const distFromCenter = v2Len(toCenter);
    const edgeMargin = this.arenaRadius * 0.3;
    if (distFromCenter > this.arenaRadius - edgeMargin && distFromCenter > 1) {
      const urgency = (distFromCenter - (this.arenaRadius - edgeMargin)) / edgeMargin;
      goal = v2Add(goal, v2Scale(v2Norm(toCenter), 2.0 * urgency));
    }

    const dir = v2Norm(goal);

    // Convert direction to cardinal booleans (threshold at 0.3 to allow diagonals)
    const inp: PlayerInput = {
      up: dir.y < -0.3,
      down: dir.y > 0.3,
      left: dir.x < -0.3,
      right: dir.x > 0.3,
      action1: false,
      action2: false,
    };

    // 3. Dash toward player 1 when close enough and dash is ready
    const toOpp = v2Sub(opp.pos, ai.pos);
    const oppDist = v2Len(toOpp);
    if (oppDist < PLAYER_RADIUS * 6 && ai.dashCooldown <= 0) {
      inp.action1 = true;
    }

    return inp;
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
    // Volcano SVG background or dark volcanic gradient
    if (this.volcanoBgImg?.complete && this.volcanoBgImg.naturalWidth > 0) {
      ctx.drawImage(this.volcanoBgImg, -10, -10, W + 20, H + 20);
    } else {
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, BG_COLOR);
      bg.addColorStop(1, '#3a1505');
      ctx.fillStyle = bg;
      ctx.fillRect(-10, -10, W + 20, H + 20);
    }

    // Volcanic glow from crater (center-top)
    const glow = ctx.createRadialGradient(CX, 0, 0, CX, 0, H * 0.8);
    glow.addColorStop(0, 'rgba(255, 102, 0, 0.4)');
    glow.addColorStop(0.5, 'rgba(255, 60, 0, 0.12)');
    glow.addColorStop(1, 'rgba(255, 60, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-10, -10, W + 20, H + 20);

    // Floating ember particles
    for (const ember of this.embers) {
      ember.y -= ember.speed * 0.016;
      ember.x += Math.sin(this.elapsed * 2 + ember.phase) * ember.amplitude * 0.016;
      if (ember.y < -10) {
        ember.y = H + 10;
        ember.x = Math.random() * W;
      }
      const flicker = 0.5 + 0.5 * Math.sin(this.elapsed * 4 + ember.phase);
      const r = 255;
      const g = Math.floor(80 + flicker * 120);
      ctx.globalAlpha = 0.4 + flicker * 0.4;
      ctx.fillStyle = `rgb(${r}, ${g}, 0)`;
      ctx.beginPath();
      ctx.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawArena(ctx: CanvasRenderingContext2D): void {
    const r = this.arenaRadius;

    // Lava underneath (larger area)
    const lavaR = r + 40;
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, lavaR, 0, Math.PI * 2);
    if (this.lavaImg?.complete && this.lavaImg.naturalWidth > 0) {
      if (!this.lavaPattern) {
        this.lavaPattern = ctx.createPattern(this.lavaImg, 'repeat');
      }
      if (this.lavaPattern) {
        ctx.fillStyle = this.lavaPattern;
      } else {
        ctx.fillStyle = '#cc4400';
      }
    } else {
      const lavaGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, lavaR);
      lavaGrad.addColorStop(0, '#ff6600');
      lavaGrad.addColorStop(1, '#aa2200');
      ctx.fillStyle = lavaGrad;
    }
    ctx.fill();
    ctx.restore();

    // Stone platform with glowing lava edge
    ctx.save();
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(CX, CY, r + 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // Stone platform fill
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, r, 0, Math.PI * 2);
    ctx.clip();

    if (this.stoneImg?.complete && this.stoneImg.naturalWidth > 0) {
      if (!this.stonePattern) {
        this.stonePattern = ctx.createPattern(this.stoneImg, 'repeat');
      }
      if (this.stonePattern) {
        ctx.fillStyle = this.stonePattern;
      } else {
        ctx.fillStyle = '#3a3530';
      }
    } else {
      const stoneGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, r);
      stoneGrad.addColorStop(0, '#3a3530');
      stoneGrad.addColorStop(1, '#252018');
      ctx.fillStyle = stoneGrad;
    }
    ctx.fillRect(CX - r, CY - r, r * 2, r * 2);
    ctx.restore();

    // Stone border
    ctx.beginPath();
    ctx.arc(CX, CY, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#5a3a1a';
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

    // Lava encroaching: fill between current arena radius and original radius
    if (r < ARENA_RADIUS_INITIAL - 2) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(CX, CY, outerR, 0, Math.PI * 2);
      ctx.arc(CX, CY, r, 0, Math.PI * 2, true);
      ctx.clip();

      if (this.lavaCracksImg?.complete && this.lavaCracksImg.naturalWidth > 0) {
        const pattern = ctx.createPattern(this.lavaCracksImg, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
        } else {
          ctx.fillStyle = '#aa3300';
        }
      } else {
        const lavaGrad = ctx.createRadialGradient(CX, CY, r, CX, CY, outerR);
        lavaGrad.addColorStop(0, '#ff6600');
        lavaGrad.addColorStop(1, '#661100');
        ctx.fillStyle = lavaGrad;
      }
      ctx.fillRect(CX - outerR, CY - outerR, outerR * 2, outerR * 2);
      ctx.restore();
    }

    // Glowing edge of stone platform
    const edgeGlow = ctx.createRadialGradient(CX, CY, r - 15, CX, CY, r + 5);
    const edgeIntensity = 0.3 + danger * 0.5 * pulse;
    edgeGlow.addColorStop(0, 'rgba(255, 100, 0, 0)');
    edgeGlow.addColorStop(0.7, `rgba(255, 80, 0, ${edgeIntensity})`);
    edgeGlow.addColorStop(1, `rgba(255, 40, 0, ${edgeIntensity * 0.5})`);
    ctx.beginPath();
    ctx.arc(CX, CY, r + 5, 0, Math.PI * 2);
    ctx.fillStyle = edgeGlow;
    ctx.fill();

    // Animated lava bubbles popping at the edge
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
      ctx.beginPath();
      ctx.arc(bx, by, bSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 120, 0, ${alpha * 0.7})`;
      ctx.fill();
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

    // Obsidian circle
    const obsGrad = ctx.createRadialGradient(z.pos.x, z.pos.y, 0, z.pos.x, z.pos.y, r);
    obsGrad.addColorStop(0, 'rgba(42, 16, 53, 0.5)');
    obsGrad.addColorStop(1, 'rgba(42, 16, 53, 0.25)');
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
    // Orange/yellow lava-colored border flash
    const alpha = 0.3 + 0.3 * Math.sin(this.elapsed * 20);
    ctx.save();
    ctx.strokeStyle = `rgba(255, 160, 20, ${alpha})`;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, W - 6, H - 6);

    // Warning text
    ctx.font = 'bold 24px Orbitron, monospace';
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
