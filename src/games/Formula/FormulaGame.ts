import { InputManager, PlayerInput } from '../../core/InputManager.ts';
import type { IGame } from '../IGame.ts';

// ── Constants ────────────────────────────────────────────────────────────────
const CW = 1280;
const CH = 720;
const CX = CW / 2;
const CY = CH / 2;

const TRACK_HALF_WIDTH = 50;
const TRACK_POINTS = 120;

const CAR_W = 24;
const CAR_H = 12;
const MAX_SPEED = 300;
const ACCEL = 200;
const BRAKE = 300;
const FRICTION = 50;
const REVERSE_FACTOR = 0.3;

const LAPS_TO_WIN = 3;
const MATCH_TIME = 120;
const CHECKPOINT_COUNT = 8;

const TRAIL_SPACING = 20;
const TRAIL_LIFETIME = 1.5;
const TRAIL_SIZE = 6;

const TURBO_DURATION = 1.5;
const TURBO_COOLDOWN = 5;
const TURBO_MULTIPLIER = 2;

const STUN_DURATION = 1;
const PENALTY_DURATION = 2;
const PENALTY_SPEED_FACTOR = 0.3;

const POWERUP_SPAWN_MIN = 4;
const POWERUP_SPAWN_MAX = 8;
const POWERUP_MAX = 3;
const POWERUP_SIZE = 20;
const POWERUP_COLLECT_DIST = 18;
const MAX_POWERUP_SPAWN_ATTEMPTS = 20;

const MIRROR_DURATION = 5;
const SPEED_BOOST_DURATION = 3;
const SPEED_BOOST_MULT = 1.8;
const OBSTACLE_LIFETIME = 15;
const OBSTACLE_SLOW_DURATION = 1.5;
const OBSTACLE_SLOW_FACTOR = 0.2;

const BG_COLOR = '#0a0a12';
const TRACK_COLOR = '#333333';
const P1_COLOR = '#00e5ff';
const P2_COLOR = '#ff4466';

// ── Types ────────────────────────────────────────────────────────────────────
interface Vec2 {
  x: number;
  y: number;
}

interface TrailSegment {
  x: number;
  y: number;
  time: number;
  player: 0 | 1;
}

interface Powerup {
  x: number;
  y: number;
  type: 'mirror' | 'speed' | 'obstacle';
  angle: number;
}

interface Obstacle {
  x: number;
  y: number;
  time: number;
}

interface Car {
  x: number;
  y: number;
  angle: number;
  speed: number;
  lap: number;
  checkpoint: number;
  turboTimer: number;
  turboCooldown: number;
  stunTimer: number;
  penaltyTimer: number;
  mirrorTimer: number;
  speedBoostTimer: number;
  obstacleSlowTimer: number;
  trailDist: number;
  flashTimer: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function pointInPolygon(px: number, py: number, poly: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const pi = poly[i];
    const pj = poly[j];
    if (!pi || !pj) continue;
    if (pi.y > py !== pj.y > py && px < ((pj.x - pi.x) * (py - pi.y)) / (pj.y - pi.y) + pi.x) {
      inside = !inside;
    }
  }
  return inside;
}

function isOnTrack(px: number, py: number, outer: Vec2[], inner: Vec2[]): boolean {
  return pointInPolygon(px, py, outer) && !pointInPolygon(px, py, inner);
}

function buildTrackBoundary(offset: number): Vec2[] {
  const pts: Vec2[] = [];
  for (let i = 0; i < TRACK_POINTS; i++) {
    const t = (i / TRACK_POINTS) * Math.PI * 2;
    // Base oval
    let rx = 420;
    let ry = 230;
    // Add chicane perturbations for interesting corners
    const chicane1 = Math.sin(t * 2) * 40;
    const chicane2 = Math.cos(t * 3) * 20;
    rx += chicane1;
    ry += chicane2;
    const cx = CX + (rx + offset) * Math.cos(t);
    const cy = CY + (ry + offset) * Math.sin(t);
    pts.push({ x: cx, y: cy });
  }
  return pts;
}

function trackCenterPoint(t: number): Vec2 {
  const rx = 420 + Math.sin(t * 2) * 40;
  const ry = 230 + Math.cos(t * 3) * 20;
  return {
    x: CX + rx * Math.cos(t),
    y: CY + ry * Math.sin(t),
  };
}

function trackCenterTangent(t: number): number {
  const dt = 0.001;
  const a = trackCenterPoint(t);
  const b = trackCenterPoint(t + dt);
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function makeDefaultCar(): Car {
  return {
    x: 0,
    y: 0,
    angle: 0,
    speed: 0,
    lap: 0,
    checkpoint: 0,
    turboTimer: 0,
    turboCooldown: 0,
    stunTimer: 0,
    penaltyTimer: 0,
    mirrorTimer: 0,
    speedBoostTimer: 0,
    obstacleSlowTimer: 0,
    trailDist: 0,
    flashTimer: 0,
  };
}

// ── FormulaGame ──────────────────────────────────────────────────────────────
export class FormulaGame implements IGame {
  private input = new InputManager();
  private durationMult = 1;
  private effectiveMatchTime = MATCH_TIME;
  private effectiveLaps = LAPS_TO_WIN;
  private outerTrack: Vec2[] = [];
  private innerTrack: Vec2[] = [];
  private centerLine: Vec2[] = [];
  private checkpoints: Vec2[] = [];
  private checkpointAngles: number[] = [];
  private cars: [Car, Car] = [makeDefaultCar(), makeDefaultCar()];
  private trails: TrailSegment[] = [];
  private powerups: Powerup[] = [];
  private obstacles: Obstacle[] = [];
  private timer = 0;
  private finished = false;
  private winner: 1 | 2 | null = null;
  private powerupSpawnTimer = 0;
  private nextPowerupDelay = 0;
  private startAngle = 0;

  // ── IGame lifecycle ──────────────────────────────────────────────────────
  setDurationMultiplier(mult: number): void {
    this.durationMult = mult;
  }

  init(_canvas: HTMLCanvasElement, _ctx: CanvasRenderingContext2D): void {
    this.input.init();
    this.effectiveMatchTime = MATCH_TIME * this.durationMult;
    this.effectiveLaps = Math.ceil(LAPS_TO_WIN * this.durationMult);
    this.outerTrack = buildTrackBoundary(TRACK_HALF_WIDTH);
    this.innerTrack = buildTrackBoundary(-TRACK_HALF_WIDTH);
    this.centerLine = [];
    for (let i = 0; i < TRACK_POINTS; i++) {
      const t = (i / TRACK_POINTS) * Math.PI * 2;
      this.centerLine.push(trackCenterPoint(t));
    }

    // Checkpoints evenly spaced
    this.checkpoints = [];
    this.checkpointAngles = [];
    for (let i = 0; i < CHECKPOINT_COUNT; i++) {
      const t = (i / CHECKPOINT_COUNT) * Math.PI * 2;
      this.checkpoints.push(trackCenterPoint(t));
      this.checkpointAngles.push(trackCenterTangent(t));
    }

    // Start position (t=0 on the track)
    this.startAngle = trackCenterTangent(0);
    const startPt = trackCenterPoint(0);
    const perpAngle = this.startAngle + Math.PI / 2;

    // P1 slightly ahead (offset along track tangent)
    this.cars[0] = makeDefaultCar();
    this.cars[0].x = startPt.x + Math.cos(this.startAngle) * 15 + Math.cos(perpAngle) * 14;
    this.cars[0].y = startPt.y + Math.sin(this.startAngle) * 15 + Math.sin(perpAngle) * 14;
    this.cars[0].angle = this.startAngle;

    // P2 slightly behind
    this.cars[1] = makeDefaultCar();
    this.cars[1].x = startPt.x - Math.cos(this.startAngle) * 15 - Math.cos(perpAngle) * 14;
    this.cars[1].y = startPt.y - Math.sin(this.startAngle) * 15 - Math.sin(perpAngle) * 14;
    this.cars[1].angle = this.startAngle;

    this.trails = [];
    this.powerups = [];
    this.obstacles = [];
    this.timer = 0;
    this.finished = false;
    this.winner = null;
    this.powerupSpawnTimer = 0;
    this.nextPowerupDelay = this.randomPowerupDelay();
  }

  update(dt: number): void {
    if (this.finished) {
      this.input.update();
      return;
    }

    this.timer += dt;
    if (this.timer >= this.effectiveMatchTime) {
      this.endByTimeout();
      this.input.update();
      return;
    }

    const p1Input = this.input.getPlayer1();
    const p2Input = this.input.getPlayer2();
    this.updateCar(0, p1Input, dt);
    this.updateCar(1, p2Input, dt);

    this.updateTrails(dt);
    this.updatePowerups(dt);
    this.updateObstacles(dt);
    this.checkTrailCollisions();
    this.checkPowerupCollection();
    this.checkObstacleCollisions();
    this.checkCheckpoints();
    this.checkWinCondition();

    this.input.update();
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, CW, CH);

    this.renderTrack(ctx);
    this.renderStartLine(ctx);
    this.renderCheckpoints(ctx);
    this.renderObstacles(ctx);
    this.renderTrails(ctx);
    this.renderPowerups(ctx);
    this.renderCars(ctx);
    this.renderHUD(ctx);
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

  // ── Car update ─────────────────────────────────────────────────────────
  private updateCar(idx: 0 | 1, inp: PlayerInput, dt: number): void {
    const car = this.cars[idx];

    // Tick timers
    car.turboTimer = Math.max(0, car.turboTimer - dt);
    car.turboCooldown = Math.max(0, car.turboCooldown - dt);
    car.stunTimer = Math.max(0, car.stunTimer - dt);
    car.penaltyTimer = Math.max(0, car.penaltyTimer - dt);
    car.mirrorTimer = Math.max(0, car.mirrorTimer - dt);
    car.speedBoostTimer = Math.max(0, car.speedBoostTimer - dt);
    car.obstacleSlowTimer = Math.max(0, car.obstacleSlowTimer - dt);
    if (car.penaltyTimer > 0) {
      car.flashTimer += dt * 10;
    }

    if (car.stunTimer > 0) {
      car.speed = 0;
      return;
    }

    // Determine effective left/right (mirror power-up inverts)
    let steerLeft = inp.left;
    let steerRight = inp.right;
    if (car.mirrorTimer > 0) {
      const tmp = steerLeft;
      steerLeft = steerRight;
      steerRight = tmp;
    }

    // Steering — rate scales with speed for realistic feel
    const speedRatio = Math.abs(car.speed) / MAX_SPEED;
    const steerRate = 2.5 * Math.min(speedRatio + 0.15, 1.0);
    if (steerLeft) car.angle -= steerRate * dt;
    if (steerRight) car.angle += steerRate * dt;

    // Acceleration / braking
    if (inp.up) {
      car.speed += ACCEL * dt;
    } else if (inp.down) {
      if (car.speed > 0) {
        car.speed -= BRAKE * dt;
      } else {
        car.speed -= ACCEL * 0.5 * dt;
      }
    } else {
      // Friction
      if (car.speed > 0) {
        car.speed = Math.max(0, car.speed - FRICTION * dt);
      } else if (car.speed < 0) {
        car.speed = Math.min(0, car.speed + FRICTION * dt);
      }
    }

    // Turbo activation
    if (inp.action1 && car.turboCooldown <= 0 && car.turboTimer <= 0) {
      car.turboTimer = TURBO_DURATION;
      car.turboCooldown = TURBO_COOLDOWN;
    }

    // Max speed calculation
    let maxSpd = MAX_SPEED;
    if (car.turboTimer > 0) maxSpd *= TURBO_MULTIPLIER;
    if (car.speedBoostTimer > 0) maxSpd *= SPEED_BOOST_MULT;
    if (car.penaltyTimer > 0) maxSpd = MAX_SPEED * PENALTY_SPEED_FACTOR;
    if (car.obstacleSlowTimer > 0) maxSpd = MAX_SPEED * OBSTACLE_SLOW_FACTOR;
    const maxReverse = MAX_SPEED * REVERSE_FACTOR;
    car.speed = clamp(car.speed, -maxReverse, maxSpd);

    // Move
    const dx = Math.cos(car.angle) * car.speed * dt;
    const dy = Math.sin(car.angle) * car.speed * dt;
    car.x += dx;
    car.y += dy;

    // Keep in canvas bounds
    car.x = clamp(car.x, 0, CW);
    car.y = clamp(car.y, 0, CH);

    // Off-track check
    if (!isOnTrack(car.x, car.y, this.outerTrack, this.innerTrack)) {
      if (car.penaltyTimer <= 0) {
        car.penaltyTimer = PENALTY_DURATION;
      }
    }

    // Trail placement
    const moved = Math.sqrt(dx * dx + dy * dy);
    car.trailDist += moved;
    if (car.trailDist >= TRAIL_SPACING) {
      car.trailDist -= TRAIL_SPACING;
      this.trails.push({
        x: car.x - Math.cos(car.angle) * 10,
        y: car.y - Math.sin(car.angle) * 10,
        time: TRAIL_LIFETIME,
        player: idx,
      });
    }
  }

  // ── Trail ──────────────────────────────────────────────────────────────
  private updateTrails(dt: number): void {
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const seg = this.trails[i];
      if (!seg) continue;
      seg.time -= dt;
      if (seg.time <= 0) {
        this.trails.splice(i, 1);
      }
    }
  }

  private checkTrailCollisions(): void {
    for (const car of this.cars) {
      if (car.stunTimer > 0) continue;
    }
    for (const seg of this.trails) {
      const otherIdx: 0 | 1 = seg.player === 0 ? 1 : 0;
      const otherCar = this.cars[otherIdx];
      if (otherCar.stunTimer > 0) continue;
      if (dist(otherCar.x, otherCar.y, seg.x, seg.y) < TRAIL_SIZE + CAR_H / 2) {
        otherCar.stunTimer = STUN_DURATION;
        otherCar.speed = 0;
      }
    }
  }

  // ── Power-ups ──────────────────────────────────────────────────────────
  private updatePowerups(dt: number): void {
    this.powerupSpawnTimer += dt;
    if (this.powerupSpawnTimer >= this.nextPowerupDelay && this.powerups.length < POWERUP_MAX) {
      this.spawnPowerup();
      this.powerupSpawnTimer = 0;
      this.nextPowerupDelay = this.randomPowerupDelay();
    }
    for (const p of this.powerups) {
      p.angle += dt * 3;
    }
  }

  private spawnPowerup(): void {
    // Place on track at random position
    for (let attempt = 0; attempt < MAX_POWERUP_SPAWN_ATTEMPTS; attempt++) {
      const t = Math.random() * Math.PI * 2;
      const pt = trackCenterPoint(t);
      // Slight random offset from center
      const off = (Math.random() - 0.5) * TRACK_HALF_WIDTH * 0.6;
      const tang = trackCenterTangent(t);
      const perpAngle = tang + Math.PI / 2;
      const px = pt.x + Math.cos(perpAngle) * off;
      const py = pt.y + Math.sin(perpAngle) * off;
      if (isOnTrack(px, py, this.outerTrack, this.innerTrack)) {
        const types: Array<'mirror' | 'speed' | 'obstacle'> = ['mirror', 'speed', 'obstacle'];
        const type = types[Math.floor(Math.random() * types.length)] ?? 'mirror';
        this.powerups.push({ x: px, y: py, type, angle: 0 });
        return;
      }
    }
  }

  private checkPowerupCollection(): void {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      if (!p) continue;
      for (let ci = 0; ci < 2; ci++) {
        const car = this.cars[ci];
        if (!car) continue;
        if (dist(car.x, car.y, p.x, p.y) < POWERUP_COLLECT_DIST) {
          this.applyPowerup(ci as 0 | 1, p.type);
          this.powerups.splice(i, 1);
          break;
        }
      }
    }
  }

  private applyPowerup(collector: 0 | 1, type: 'mirror' | 'speed' | 'obstacle'): void {
    const opponent: 0 | 1 = collector === 0 ? 1 : 0;
    switch (type) {
      case 'mirror':
        this.cars[opponent].mirrorTimer = MIRROR_DURATION;
        break;
      case 'speed':
        this.cars[collector].speedBoostTimer = SPEED_BOOST_DURATION;
        break;
      case 'obstacle': {
        // Place obstacle behind the collector car
        const car = this.cars[collector];
        const ox = car.x - Math.cos(car.angle) * 30;
        const oy = car.y - Math.sin(car.angle) * 30;
        this.obstacles.push({ x: ox, y: oy, time: OBSTACLE_LIFETIME });
        break;
      }
    }
  }

  // ── Obstacles ──────────────────────────────────────────────────────────
  private updateObstacles(dt: number): void {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const ob = this.obstacles[i];
      if (!ob) continue;
      ob.time -= dt;
      if (ob.time <= 0) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  private checkObstacleCollisions(): void {
    for (const ob of this.obstacles) {
      for (const car of this.cars) {
        if (car.obstacleSlowTimer > 0) continue;
        if (dist(car.x, car.y, ob.x, ob.y) < 14) {
          car.obstacleSlowTimer = OBSTACLE_SLOW_DURATION;
        }
      }
    }
  }

  // ── Checkpoints & Laps ────────────────────────────────────────────────
  private checkCheckpoints(): void {
    for (let ci = 0; ci < 2; ci++) {
      const car = this.cars[ci];
      if (!car) continue;
      const cp = this.checkpoints[car.checkpoint];
      if (!cp) continue;
      if (dist(car.x, car.y, cp.x, cp.y) < TRACK_HALF_WIDTH + 10) {
        car.checkpoint++;
        if (car.checkpoint >= CHECKPOINT_COUNT) {
          car.checkpoint = 0;
          car.lap++;
        }
      }
    }
  }

  private checkWinCondition(): void {
    for (let ci = 0; ci < 2; ci++) {
      const car = this.cars[ci];
      if (car && car.lap >= this.effectiveLaps) {
        this.winner = (ci + 1) as 1 | 2;
        this.finished = true;
        return;
      }
    }
  }

  private endByTimeout(): void {
    this.finished = true;
    const c0 = this.cars[0];
    const c1 = this.cars[1];
    if (c0.lap > c1.lap) {
      this.winner = 1;
    } else if (c1.lap > c0.lap) {
      this.winner = 2;
    } else if (c0.checkpoint > c1.checkpoint) {
      this.winner = 1;
    } else if (c1.checkpoint > c0.checkpoint) {
      this.winner = 2;
    } else {
      this.winner = null; // tie
    }
  }

  private randomPowerupDelay(): number {
    return POWERUP_SPAWN_MIN + Math.random() * (POWERUP_SPAWN_MAX - POWERUP_SPAWN_MIN);
  }

  // ── Rendering ──────────────────────────────────────────────────────────
  private renderTrack(ctx: CanvasRenderingContext2D): void {
    // Outer fill
    ctx.beginPath();
    for (const [i, p] of this.outerTrack.entries()) {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fillStyle = TRACK_COLOR;
    ctx.fill();

    // Cut out inner
    ctx.beginPath();
    for (const [i, p] of this.innerTrack.entries()) {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fillStyle = BG_COLOR;
    ctx.fill();

    // Outer edge (white + kerb)
    this.renderKerbEdge(ctx, this.outerTrack);
    // Inner edge
    this.renderKerbEdge(ctx, this.innerTrack);
  }

  private renderKerbEdge(ctx: CanvasRenderingContext2D, poly: Vec2[]): void {
    ctx.beginPath();
    for (const [i, p] of poly.entries()) {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Kerb pattern (red/white dashes)
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = '#cc2222';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private renderStartLine(ctx: CanvasRenderingContext2D): void {
    const pt = trackCenterPoint(0);
    const tang = this.startAngle;
    const perpAngle = tang + Math.PI / 2;
    const half = TRACK_HALF_WIDTH;
    const size = 8;
    const count = Math.floor((half * 2) / size);

    ctx.save();
    ctx.translate(pt.x, pt.y);
    ctx.rotate(perpAngle);

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < count; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(-half + c * size, -size + r * size, size, size);
      }
    }
    ctx.restore();
  }

  private renderCheckpoints(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = 0.15;
    for (const cp of this.checkpoints) {
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private renderTrails(ctx: CanvasRenderingContext2D): void {
    for (const seg of this.trails) {
      const alpha = clamp(seg.time / TRAIL_LIFETIME, 0, 1);
      const color = seg.player === 0 ? P1_COLOR : P2_COLOR;
      ctx.globalAlpha = alpha * 0.7;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = color;
      ctx.fillRect(seg.x - TRAIL_SIZE / 2, seg.y - TRAIL_SIZE / 2, TRAIL_SIZE, TRAIL_SIZE);
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  private renderPowerups(ctx: CanvasRenderingContext2D): void {
    for (const p of this.powerups) {
      let color: string;
      switch (p.type) {
        case 'mirror':
          color = '#aa44ff';
          break;
        case 'speed':
          color = '#ffdd44';
          break;
        case 'obstacle':
          color = '#ff4444';
          break;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = color;
      ctx.fillRect(-POWERUP_SIZE / 2, -POWERUP_SIZE / 2, POWERUP_SIZE, POWERUP_SIZE);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  private renderObstacles(ctx: CanvasRenderingContext2D): void {
    for (const ob of this.obstacles) {
      ctx.save();
      ctx.translate(ob.x, ob.y);
      // Cone: orange triangle
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(-7, 8);
      ctx.lineTo(7, 8);
      ctx.closePath();
      ctx.fillStyle = '#ff8822';
      ctx.fill();
      ctx.strokeStyle = '#ffcc44';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderCars(ctx: CanvasRenderingContext2D): void {
    const carColors: [string, string] = [P1_COLOR, P2_COLOR];
    for (let ci = 0; ci < 2; ci++) {
      const car = this.cars[ci as 0 | 1];
      const color = carColors[ci as 0 | 1];

      // Flash when penalized
      if (car.penaltyTimer > 0 && Math.sin(car.flashTimer) > 0) {
        continue; // skip rendering for flash effect
      }

      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);

      // Car body
      ctx.fillStyle = color;
      if (car.turboTimer > 0 || car.speedBoostTimer > 0) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
      }
      ctx.fillRect(-CAR_W / 2, -CAR_H / 2, CAR_W, CAR_H);

      // Windshield accent
      ctx.fillStyle = '#ffffff44';
      ctx.fillRect(CAR_W / 2 - 6, -CAR_H / 2 + 2, 4, CAR_H - 4);

      ctx.shadowBlur = 0;
      ctx.restore();

      // Turbo speed lines
      if (car.turboTimer > 0) {
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        for (let l = 0; l < 4; l++) {
          const spread = (l - 1.5) * 6;
          const bx = car.x - Math.cos(car.angle) * 20 + Math.cos(car.angle + Math.PI / 2) * spread;
          const by = car.y - Math.sin(car.angle) * 20 + Math.sin(car.angle + Math.PI / 2) * spread;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx - Math.cos(car.angle) * 15, by - Math.sin(car.angle) * 15);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // Status text above car
      this.renderCarStatusText(ctx, car, ci);
    }
  }

  private renderCarStatusText(ctx: CanvasRenderingContext2D, car: Car, _ci: number): void {
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    const textY = car.y - 14;

    if (car.stunTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillText('STUNNED', car.x, textY);
    } else if (car.penaltyTimer > 0) {
      ctx.fillStyle = '#ff6666';
      ctx.fillText('PENALTY', car.x, textY);
    } else if (car.mirrorTimer > 0) {
      ctx.fillStyle = '#aa44ff';
      ctx.fillText('MIRROR', car.x, textY);
    } else if (car.obstacleSlowTimer > 0) {
      ctx.fillStyle = '#ff8822';
      ctx.fillText('SLOW', car.x, textY);
    }
  }

  private renderHUD(ctx: CanvasRenderingContext2D): void {
    // Timer
    const remaining = Math.max(0, this.effectiveMatchTime - this.timer);
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(timeStr, CX, 30);

    // P1 info — left
    this.renderPlayerHUD(ctx, 0, 20);
    // P2 info — right
    this.renderPlayerHUD(ctx, 1, CW - 160);
  }

  private renderPlayerHUD(ctx: CanvasRenderingContext2D, idx: 0 | 1, baseX: number): void {
    const car = this.cars[idx];
    const color = idx === 0 ? P1_COLOR : P2_COLOR;
    const label = idx === 0 ? 'P1' : 'P2';

    ctx.textAlign = 'left';
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = color;
    ctx.fillText(
      `${label}  LAP ${Math.min(car.lap + 1, this.effectiveLaps)}/${this.effectiveLaps}`,
      baseX,
      30,
    );

    // Turbo cooldown bar
    ctx.fillStyle = '#444444';
    ctx.fillRect(baseX, 38, 100, 6);
    if (car.turboCooldown <= 0) {
      ctx.fillStyle = color;
      ctx.fillRect(baseX, 38, 100, 6);
    } else {
      const ratio = 1 - car.turboCooldown / TURBO_COOLDOWN;
      ctx.fillStyle = color;
      ctx.fillRect(baseX, 38, ratio * 100, 6);
    }
    ctx.font = '9px monospace';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(car.turboCooldown <= 0 ? 'TURBO READY' : 'TURBO CD', baseX, 56);

    // Checkpoint indicator
    ctx.fillStyle = '#666666';
    ctx.font = '10px monospace';
    ctx.fillText(`CP ${car.checkpoint}/${CHECKPOINT_COUNT}`, baseX, 68);
  }
}
