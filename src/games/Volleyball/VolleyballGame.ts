import { IGame } from '../IGame.ts';
import { InputManager, PlayerInput } from '../../core/InputManager.ts';

// ── Constants ──────────────────────────────────────────────────────────────────
const CANVAS_W = 1280;
const CANVAS_H = 720;

const COURT_W = 1100;
const COURT_H = 550;
const COURT_X = (CANVAS_W - COURT_W) / 2;
const COURT_Y = (CANVAS_H - COURT_H) / 2;

const NET_W = 4;
const NET_HEIGHT_RATIO = 0.45;
const NET_X = COURT_X + COURT_W / 2 - NET_W / 2;

const PLAYER_W = 32;
const PLAYER_H = 48;
const PLAYER_SPEED = 250;
const JUMP_VELOCITY = 450;

const BALL_RADIUS = 12;
const BALL_RESTITUTION = 0.7;
const BALL_FRICTION = 0.998;
const HIT_RANGE = 50;
const HIT_FORCE = 600;
const HIT_COOLDOWN = 0.3;

const GRAVITY_STRENGTH = 700;
const GRAVITY_INTERVAL = 5;
const GRAVITY_WARNING_TIME = 1;

const GAME_DURATION = 60;

const COLOR_BG = '#0a0a1f';
const COLOR_FLOOR = '#0d1122';
const COLOR_P1 = '#00e5ff';
const COLOR_P2 = '#ff4466';

// ── Types ──────────────────────────────────────────────────────────────────────
type GravityDir = 'DOWN' | 'UP' | 'LEFT' | 'RIGHT';

const GRAVITY_COLORS: Record<GravityDir, string> = {
  DOWN: '#4488ff',
  UP: '#ff4444',
  LEFT: '#44ff44',
  RIGHT: '#ffff44',
};

interface Vec2 {
  x: number;
  y: number;
}

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hitCooldown: number;
  side: 1 | 2;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: Vec2[];
  lastHitBy: 1 | 2 | 0;
}

interface CosmicParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function gravityVec(dir: GravityDir): Vec2 {
  switch (dir) {
    case 'DOWN':
      return { x: 0, y: GRAVITY_STRENGTH };
    case 'UP':
      return { x: 0, y: -GRAVITY_STRENGTH };
    case 'LEFT':
      return { x: -GRAVITY_STRENGTH, y: 0 };
    case 'RIGHT':
      return { x: GRAVITY_STRENGTH, y: 0 };
  }
}

function pickNewGravity(current: GravityDir): GravityDir {
  const dirs: GravityDir[] = ['DOWN', 'UP', 'LEFT', 'RIGHT'];
  const filtered = dirs.filter((d) => d !== current);
  return filtered[Math.floor(Math.random() * filtered.length)] ?? 'DOWN';
}

function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: -1 };
  return { x: v.x / len, y: v.y / len };
}

// ── VolleyballGame ─────────────────────────────────────────────────────────────
export class VolleyballGame implements IGame {
  private input: InputManager = new InputManager();
  private durationMult = 1;

  private p1!: Player;
  private p2!: Player;
  private ball!: Ball;

  private scoreP1 = 0;
  private scoreP2 = 0;
  private timer = GAME_DURATION;
  private finished = false;
  private elapsed = 0;

  private gravity: GravityDir = 'DOWN';
  private nextGravity: GravityDir = 'UP';
  private gravityTimer = 0;
  private showArrow = false;
  private flashTimer = 0;
  private gravityChangeArrowTimer = 0;
  private cosmicParticles: CosmicParticle[] = [];

  private freezeTimer = 0;
  private aiEnabled = false;

  // ── IGame lifecycle ────────────────────────────────────────────────────────

  setAIMode(enabled: boolean): void {
    this.aiEnabled = enabled;
  }

  setDurationMultiplier(mult: number): void {
    this.durationMult = mult;
  }

  init(_canvas: HTMLCanvasElement, _ctx: CanvasRenderingContext2D): void {
    this.input.init();
    this.gravity = 'DOWN';
    this.nextGravity = pickNewGravity(this.gravity);
    this.gravityTimer = 0;
    this.showArrow = false;
    this.flashTimer = 0;
    this.gravityChangeArrowTimer = 0;
    this.initCosmicParticles();
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.timer = GAME_DURATION * this.durationMult;
    this.finished = false;
    this.freezeTimer = 0;
    this.resetPlayers();
    this.resetBall();
  }

  update(dt: number): void {
    this.elapsed += dt;
    if (this.finished) {
      this.input.update();
      return;
    }

    // Freeze after score
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      this.input.update();
      return;
    }

    // Game timer
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0;
      this.finished = true;
      this.input.update();
      return;
    }

    // Gravity timer
    this.gravityTimer += dt;
    this.showArrow = this.gravityTimer >= GRAVITY_INTERVAL - GRAVITY_WARNING_TIME;
    if (this.gravityTimer >= GRAVITY_INTERVAL) {
      this.gravity = this.nextGravity;
      this.nextGravity = pickNewGravity(this.gravity);
      this.gravityTimer = 0;
      this.showArrow = false;
      this.flashTimer = 0.15;
      this.gravityChangeArrowTimer = 1.0;
      this.snapPlayersToFloor();
    }

    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.gravityChangeArrowTimer > 0) this.gravityChangeArrowTimer -= dt;
    this.updateCosmicParticles(dt);

    // Input
    const p1In = this.input.getPlayer1();
    let p2In = this.input.getPlayer2();

    if (this.aiEnabled) {
      p2In = this.computeAIInput(this.p2);
    }

    this.handlePlayerInput(this.p1, p1In, dt);
    this.handlePlayerInput(this.p2, p2In, dt);

    // Apply gravity to ball
    const gv = gravityVec(this.gravity);
    this.ball.vx += gv.x * dt;
    this.ball.vy += gv.y * dt;

    // Air friction
    this.ball.vx *= BALL_FRICTION;
    this.ball.vy *= BALL_FRICTION;

    // Move ball
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;

    // Ball trail
    this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
    if (this.ball.trail.length > 8) this.ball.trail.shift();

    // Ball collisions
    this.collideBallWalls();
    this.collideBallNet();
    this.collideBallPlayers();
    this.checkScoring();

    this.input.update();
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Background
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    this.drawCosmicParticles(ctx);
    this.drawCourt(ctx);
    this.drawActiveFloor(ctx);
    this.drawNet(ctx);
    this.drawBall(ctx);
    this.drawPlayer(ctx, this.p1, COLOR_P1);
    this.drawPlayer(ctx, this.p2, COLOR_P2);
    this.drawGravityArrow(ctx);
    this.drawHUD(ctx);

    // Screen flash on gravity change
    if (this.flashTimer > 0) {
      ctx.save();
      ctx.globalAlpha = (this.flashTimer / 0.15) * 0.25;
      ctx.fillStyle = GRAVITY_COLORS[this.gravity];
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();
    }

    // Large directional arrow fading out after gravity change
    if (this.gravityChangeArrowTimer > 0) {
      this.drawGravityChangeArrow(ctx);
    }

    if (this.finished) {
      this.drawFinishOverlay(ctx);
    }
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

  // ── Player logic ───────────────────────────────────────────────────────────

  private resetPlayers(): void {
    this.p1 = {
      x: COURT_X + COURT_W * 0.25 - PLAYER_W / 2,
      y: COURT_Y + COURT_H - PLAYER_H,
      vx: 0,
      vy: 0,
      hitCooldown: 0,
      side: 1,
    };
    this.p2 = {
      x: COURT_X + COURT_W * 0.75 - PLAYER_W / 2,
      y: COURT_Y + COURT_H - PLAYER_H,
      vx: 0,
      vy: 0,
      hitCooldown: 0,
      side: 2,
    };
  }

  private handlePlayerInput(player: Player, inp: PlayerInput, dt: number): void {
    player.hitCooldown = Math.max(0, player.hitCooldown - dt);
    const gv = gravityVec(this.gravity);
    const isVerticalGravity = this.gravity === 'DOWN' || this.gravity === 'UP';

    // Movement along floor surface
    if (isVerticalGravity) {
      let move = 0;
      if (player.side === 1) {
        if (inp.left) move -= 1;
        if (inp.right) move += 1;
      } else {
        if (inp.left) move -= 1;
        if (inp.right) move += 1;
      }
      player.x += move * PLAYER_SPEED * dt;
    } else {
      let move = 0;
      if (player.side === 1) {
        if (inp.up) move -= 1;
        if (inp.down) move += 1;
      } else {
        if (inp.up) move -= 1;
        if (inp.down) move += 1;
      }
      player.y += move * PLAYER_SPEED * dt;
    }

    // Jump (action2) — opposite to gravity
    if (inp.action2) {
      if (this.isPlayerOnFloor(player)) {
        player.vx = -Math.sign(gv.x) * JUMP_VELOCITY;
        player.vy = -Math.sign(gv.y) * JUMP_VELOCITY;
      }
    }

    // Apply gravity to player (off-floor axis)
    player.vx += gv.x * dt;
    player.vy += gv.y * dt;

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Constrain to court and floor
    this.constrainPlayer(player);

    // Hit (action1)
    if (inp.action1 && player.hitCooldown <= 0) {
      this.tryHit(player);
    }
  }

  private computeAIInput(player: Player): PlayerInput {
    const inp: PlayerInput = {
      up: false,
      down: false,
      left: false,
      right: false,
      action1: false,
      action2: false,
    };
    const pcx = player.x + PLAYER_W / 2;
    const pcy = player.y + PLAYER_H / 2;
    const isVertical = this.gravity === 'DOWN' || this.gravity === 'UP';
    const trackThreshold = 10;

    if (isVertical) {
      // Move left/right to track ball X
      if (this.ball.x < pcx - trackThreshold) inp.left = true;
      else if (this.ball.x > pcx + trackThreshold) inp.right = true;

      // Jump when ball is above (DOWN gravity) or below (UP gravity)
      const verticalDist = this.gravity === 'DOWN' ? pcy - this.ball.y : this.ball.y - pcy;
      if (verticalDist > PLAYER_H * 1.5) inp.action2 = true;
    } else {
      // Move up/down to track ball Y
      if (this.ball.y < pcy - trackThreshold) inp.up = true;
      else if (this.ball.y > pcy + trackThreshold) inp.down = true;

      // Jump when ball is beside player (LEFT: ball to right; RIGHT: ball to left)
      if (this.gravity === 'LEFT' && this.ball.x > pcx + PLAYER_W * 1.5) inp.action2 = true;
      else if (this.gravity === 'RIGHT' && this.ball.x < pcx - PLAYER_W * 1.5) inp.action2 = true;
    }

    // Hit when close to ball
    const d = dist({ x: pcx, y: pcy }, { x: this.ball.x, y: this.ball.y });
    if (d < HIT_RANGE * 1.5) inp.action1 = true;

    return inp;
  }

  private isPlayerOnFloor(player: Player): boolean {
    const tolerance = 2;
    switch (this.gravity) {
      case 'DOWN':
        return player.y + PLAYER_H >= COURT_Y + COURT_H - tolerance;
      case 'UP':
        return player.y <= COURT_Y + tolerance;
      case 'LEFT':
        return player.x <= COURT_X + tolerance;
      case 'RIGHT':
        return player.x + PLAYER_W >= COURT_X + COURT_W - tolerance;
    }
  }

  private constrainPlayer(player: Player): void {
    const netLeft = NET_X;
    const netRight = NET_X + NET_W;
    const netH = COURT_H * NET_HEIGHT_RATIO;
    const isVerticalGravity = this.gravity === 'DOWN' || this.gravity === 'UP';

    // Court bounds
    if (player.x < COURT_X) {
      player.x = COURT_X;
      player.vx = 0;
    }
    if (player.x + PLAYER_W > COURT_X + COURT_W) {
      player.x = COURT_X + COURT_W - PLAYER_W;
      player.vx = 0;
    }
    if (player.y < COURT_Y) {
      player.y = COURT_Y;
      player.vy = 0;
    }
    if (player.y + PLAYER_H > COURT_Y + COURT_H) {
      player.y = COURT_Y + COURT_H - PLAYER_H;
      player.vy = 0;
    }

    // Net constraint — players cannot cross
    if (isVerticalGravity) {
      // Net extends from floor. For DOWN: from bottom up. For UP: from top down.
      const netTop = this.gravity === 'DOWN' ? COURT_Y + COURT_H - netH : COURT_Y;
      const netBottom = this.gravity === 'DOWN' ? COURT_Y + COURT_H : COURT_Y + netH;

      const playerInNetVertical = player.y + PLAYER_H > netTop && player.y < netBottom;

      if (playerInNetVertical) {
        if (player.side === 1 && player.x + PLAYER_W > netLeft) {
          player.x = netLeft - PLAYER_W;
          player.vx = 0;
        } else if (player.side === 2 && player.x < netRight) {
          player.x = netRight;
          player.vx = 0;
        }
      }
    } else {
      // Lateral gravity: net extends from the gravity-floor wall
      const netStart = this.gravity === 'LEFT' ? COURT_X : COURT_X + COURT_W - netH;
      const netEnd = this.gravity === 'LEFT' ? COURT_X + netH : COURT_X + COURT_W;

      const playerInNetHorizontal = player.x + PLAYER_W > netStart && player.x < netEnd;

      if (playerInNetHorizontal) {
        if (player.side === 1 && player.y + PLAYER_H > COURT_Y + COURT_H / 2 - NET_W / 2) {
          player.y = COURT_Y + COURT_H / 2 - NET_W / 2 - PLAYER_H;
          player.vy = 0;
        } else if (player.side === 2 && player.y < COURT_Y + COURT_H / 2 + NET_W / 2) {
          player.y = COURT_Y + COURT_H / 2 + NET_W / 2;
          player.vy = 0;
        }
      }
    }

    // Floor sticking (gravity direction)
    switch (this.gravity) {
      case 'DOWN':
        if (player.y + PLAYER_H > COURT_Y + COURT_H) {
          player.y = COURT_Y + COURT_H - PLAYER_H;
          player.vy = 0;
        }
        break;
      case 'UP':
        if (player.y < COURT_Y) {
          player.y = COURT_Y;
          player.vy = 0;
        }
        break;
      case 'LEFT':
        if (player.x < COURT_X) {
          player.x = COURT_X;
          player.vx = 0;
        }
        break;
      case 'RIGHT':
        if (player.x + PLAYER_W > COURT_X + COURT_W) {
          player.x = COURT_X + COURT_W - PLAYER_W;
          player.vx = 0;
        }
        break;
    }
  }

  private snapPlayersToFloor(): void {
    for (const player of [this.p1, this.p2]) {
      player.vx = 0;
      player.vy = 0;
      switch (this.gravity) {
        case 'DOWN':
          player.y = COURT_Y + COURT_H - PLAYER_H;
          break;
        case 'UP':
          player.y = COURT_Y;
          break;
        case 'LEFT':
          player.x = COURT_X;
          break;
        case 'RIGHT':
          player.x = COURT_X + COURT_W - PLAYER_W;
          break;
      }
      // Also maintain net side constraint
      if (player.side === 1) {
        if (player.x + PLAYER_W > NET_X) player.x = NET_X - PLAYER_W;
      } else {
        if (player.x < NET_X + NET_W) player.x = NET_X + NET_W;
      }
      // Keep within court
      player.x = Math.max(COURT_X, Math.min(player.x, COURT_X + COURT_W - PLAYER_W));
      player.y = Math.max(COURT_Y, Math.min(player.y, COURT_Y + COURT_H - PLAYER_H));
    }
  }

  private tryHit(player: Player): void {
    const px = player.x + PLAYER_W / 2;
    const py = player.y + PLAYER_H / 2;
    const d = dist({ x: px, y: py }, { x: this.ball.x, y: this.ball.y });
    if (d > HIT_RANGE) return;

    player.hitCooldown = HIT_COOLDOWN;
    const dir = normalize({
      x: this.ball.x - px,
      y: this.ball.y - py,
    });

    // Add strong component away from active floor
    const gv = gravityVec(this.gravity);
    const awayX = -Math.sign(gv.x);
    const awayY = -Math.sign(gv.y);

    const combinedX = dir.x + awayX * 0.5;
    const combinedY = dir.y + awayY * 0.5;
    const combined = normalize({ x: combinedX, y: combinedY });

    this.ball.vx = combined.x * HIT_FORCE;
    this.ball.vy = combined.y * HIT_FORCE;
    this.ball.lastHitBy = player.side;
  }

  private collideBallPlayers(): void {
    for (const player of [this.p1, this.p2]) {
      const px = player.x + PLAYER_W / 2;
      const py = player.y + PLAYER_H / 2;
      const collisionRadius = BALL_RADIUS + Math.max(PLAYER_W, PLAYER_H) / 2;
      const d = dist({ x: this.ball.x, y: this.ball.y }, { x: px, y: py });
      if (d < collisionRadius && d > 0) {
        const normal = normalize({ x: this.ball.x - px, y: this.ball.y - py });
        const dotProduct = this.ball.vx * normal.x + this.ball.vy * normal.y;
        if (dotProduct < 0) {
          this.ball.vx -= 2 * dotProduct * normal.x;
          this.ball.vy -= 2 * dotProduct * normal.y;
        }
        // Player velocity contribution
        this.ball.vx += player.vx * 0.3;
        this.ball.vy += player.vy * 0.3;
        // Separate ball from player
        const overlap = collisionRadius - d;
        this.ball.x += normal.x * overlap;
        this.ball.y += normal.y * overlap;
      }
    }
  }

  // ── Ball logic ─────────────────────────────────────────────────────────────

  private resetBall(): void {
    const gv = gravityVec(this.gravity);
    this.ball = {
      x: COURT_X + COURT_W / 2,
      y: COURT_Y + COURT_H / 2,
      vx: (Math.random() - 0.5) * 100,
      vy: -Math.sign(gv.y || -1) * 300,
      trail: [],
      lastHitBy: 0,
    };
    // For lateral gravity, launch perpendicular
    if (this.gravity === 'LEFT' || this.gravity === 'RIGHT') {
      this.ball.vx = -Math.sign(gv.x) * 300;
      this.ball.vy = (Math.random() - 0.5) * 100;
    }
  }

  private collideBallWalls(): void {
    const r = BALL_RADIUS;
    // Left wall
    if (this.ball.x - r < COURT_X) {
      this.ball.x = COURT_X + r;
      this.ball.vx = Math.abs(this.ball.vx) * BALL_RESTITUTION;
    }
    // Right wall
    if (this.ball.x + r > COURT_X + COURT_W) {
      this.ball.x = COURT_X + COURT_W - r;
      this.ball.vx = -Math.abs(this.ball.vx) * BALL_RESTITUTION;
    }
    // Top wall
    if (this.ball.y - r < COURT_Y) {
      this.ball.y = COURT_Y + r;
      this.ball.vy = Math.abs(this.ball.vy) * BALL_RESTITUTION;
    }
    // Bottom wall
    if (this.ball.y + r > COURT_Y + COURT_H) {
      this.ball.y = COURT_Y + COURT_H - r;
      this.ball.vy = -Math.abs(this.ball.vy) * BALL_RESTITUTION;
    }
  }

  private collideBallNet(): void {
    const r = BALL_RADIUS;
    const isVerticalGravity = this.gravity === 'DOWN' || this.gravity === 'UP';

    if (isVerticalGravity) {
      const netH = COURT_H * NET_HEIGHT_RATIO;
      const netTop = this.gravity === 'DOWN' ? COURT_Y + COURT_H - netH : COURT_Y;
      const netBottom = this.gravity === 'DOWN' ? COURT_Y + COURT_H : COURT_Y + netH;

      // Ball vs net rectangle
      if (
        this.ball.x + r > NET_X &&
        this.ball.x - r < NET_X + NET_W &&
        this.ball.y + r > netTop &&
        this.ball.y - r < netBottom
      ) {
        // Push out horizontally
        if (this.ball.vx > 0) {
          this.ball.x = NET_X - r;
        } else {
          this.ball.x = NET_X + NET_W + r;
        }
        this.ball.vx = -this.ball.vx * BALL_RESTITUTION;
      }
    } else {
      // Lateral gravity: net is horizontal across the middle of the court
      const netMidY = COURT_Y + COURT_H / 2;
      const netH = COURT_H * NET_HEIGHT_RATIO;
      const netStart = this.gravity === 'LEFT' ? COURT_X : COURT_X + COURT_W - netH;
      const netEnd = this.gravity === 'LEFT' ? COURT_X + netH : COURT_X + COURT_W;

      if (
        this.ball.x + r > netStart &&
        this.ball.x - r < netEnd &&
        this.ball.y + r > netMidY - NET_W / 2 &&
        this.ball.y - r < netMidY + NET_W / 2
      ) {
        if (this.ball.vy > 0) {
          this.ball.y = netMidY - NET_W / 2 - r;
        } else {
          this.ball.y = netMidY + NET_W / 2 + r;
        }
        this.ball.vy = -this.ball.vy * BALL_RESTITUTION;
      }
    }
  }

  private checkScoring(): void {
    const isVerticalGravity = this.gravity === 'DOWN' || this.gravity === 'UP';
    const r = BALL_RADIUS;
    let scored = false;

    if (isVerticalGravity) {
      // Active floor based on gravity
      const ballOnFloor =
        this.gravity === 'DOWN'
          ? this.ball.y + r >= COURT_Y + COURT_H - 1
          : this.ball.y - r <= COURT_Y + 1;

      if (ballOnFloor) {
        // Which side of net?
        if (this.ball.x < NET_X + NET_W / 2) {
          // P1 side → P2 scores
          this.scoreP2++;
          scored = true;
        } else {
          // P2 side → P1 scores
          this.scoreP1++;
          scored = true;
        }
      }
    } else {
      // Lateral gravity
      const ballOnFloor =
        this.gravity === 'LEFT'
          ? this.ball.x - r <= COURT_X + 1
          : this.ball.x + r >= COURT_X + COURT_W - 1;

      if (ballOnFloor) {
        // Determine side by vertical position relative to horizontal net
        const netMidY = COURT_Y + COURT_H / 2;
        if (this.ball.y < netMidY) {
          // P1 side → P2 scores
          this.scoreP2++;
          scored = true;
        } else {
          // P2 side → P1 scores
          this.scoreP1++;
          scored = true;
        }
      }
    }

    if (scored) {
      this.freezeTimer = 0.6;
      this.resetBall();
      this.snapPlayersToFloor();
    }
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  private initCosmicParticles(): void {
    this.cosmicParticles = [];
    for (let i = 0; i < 30; i++) {
      this.cosmicParticles.push({
        x: Math.random() * CANVAS_W,
        y: Math.random() * CANVAS_H,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        radius: 1 + Math.random() * 2,
        opacity: 0.2 + Math.random() * 0.2,
        color: Math.random() > 0.5 ? '#00ffff' : '#ffffff',
      });
    }
  }

  private updateCosmicParticles(dt: number): void {
    for (const p of this.cosmicParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 0) p.x += CANVAS_W;
      if (p.x > CANVAS_W) p.x -= CANVAS_W;
      if (p.y < 0) p.y += CANVAS_H;
      if (p.y > CANVAS_H) p.y -= CANVAS_H;
    }
  }

  private drawCosmicParticles(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const p of this.cosmicParticles) {
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawCourt(ctx: CanvasRenderingContext2D): void {
    // Metallic platform
    ctx.fillStyle = COLOR_FLOOR;
    ctx.fillRect(COURT_X, COURT_Y, COURT_W, COURT_H);

    // Subtle reflective gradient at bottom
    const grad = ctx.createLinearGradient(
      COURT_X,
      COURT_Y + COURT_H - 60,
      COURT_X,
      COURT_Y + COURT_H,
    );
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(255,255,255,0.04)');
    ctx.fillStyle = grad;
    ctx.fillRect(COURT_X, COURT_Y + COURT_H - 60, COURT_W, 60);

    // Court border
    ctx.strokeStyle = '#1a2040';
    ctx.lineWidth = 2;
    ctx.strokeRect(COURT_X, COURT_Y, COURT_W, COURT_H);
  }

  private drawActiveFloor(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = 0.35;
    const halfW = COURT_W / 2 - NET_W / 2;
    const stripThickness = 4;

    switch (this.gravity) {
      case 'DOWN': {
        const y = COURT_Y + COURT_H - stripThickness;
        ctx.fillStyle = COLOR_P1;
        ctx.fillRect(COURT_X, y, halfW, stripThickness);
        ctx.fillStyle = COLOR_P2;
        ctx.fillRect(NET_X + NET_W, y, halfW, stripThickness);
        break;
      }
      case 'UP': {
        const y = COURT_Y;
        ctx.fillStyle = COLOR_P1;
        ctx.fillRect(COURT_X, y, halfW, stripThickness);
        ctx.fillStyle = COLOR_P2;
        ctx.fillRect(NET_X + NET_W, y, halfW, stripThickness);
        break;
      }
      case 'LEFT': {
        const x = COURT_X;
        const halfH = COURT_H / 2 - NET_W / 2;
        ctx.fillStyle = COLOR_P1;
        ctx.fillRect(x, COURT_Y, stripThickness, halfH);
        ctx.fillStyle = COLOR_P2;
        ctx.fillRect(x, COURT_Y + COURT_H / 2 + NET_W / 2, stripThickness, halfH);
        break;
      }
      case 'RIGHT': {
        const x = COURT_X + COURT_W - stripThickness;
        const halfH = COURT_H / 2 - NET_W / 2;
        ctx.fillStyle = COLOR_P1;
        ctx.fillRect(x, COURT_Y, stripThickness, halfH);
        ctx.fillStyle = COLOR_P2;
        ctx.fillRect(x, COURT_Y + COURT_H / 2 + NET_W / 2, stripThickness, halfH);
        break;
      }
    }
    ctx.restore();
  }

  private drawNet(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const isVerticalGravity = this.gravity === 'DOWN' || this.gravity === 'UP';

    ctx.shadowColor = '#cc00ff';
    ctx.shadowBlur = 12;

    if (isVerticalGravity) {
      const netH = COURT_H * NET_HEIGHT_RATIO;
      const netTop = this.gravity === 'DOWN' ? COURT_Y + COURT_H - netH : COURT_Y;

      const grad = ctx.createLinearGradient(NET_X, netTop, NET_X, netTop + netH);
      grad.addColorStop(0, '#9b00ff');
      grad.addColorStop(1, '#ff00ff');
      ctx.fillStyle = grad;
      ctx.fillRect(NET_X, netTop, NET_W, netH);
    } else {
      const netMidY = COURT_Y + COURT_H / 2 - NET_W / 2;
      const netLength = COURT_H * NET_HEIGHT_RATIO;
      const netStart = this.gravity === 'LEFT' ? COURT_X : COURT_X + COURT_W - netLength;

      const grad = ctx.createLinearGradient(netStart, netMidY, netStart + netLength, netMidY);
      grad.addColorStop(0, '#9b00ff');
      grad.addColorStop(1, '#ff00ff');
      ctx.fillStyle = grad;
      ctx.fillRect(netStart, netMidY, netLength, NET_W);
    }
    ctx.restore();
  }

  private drawBall(ctx: CanvasRenderingContext2D): void {
    const edgeColor = GRAVITY_COLORS[this.gravity];

    // Trail
    ctx.save();
    for (let i = 0; i < this.ball.trail.length; i++) {
      const t = this.ball.trail[i];
      if (!t) continue;
      const alpha = ((i + 1) / this.ball.trail.length) * 0.3;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = edgeColor;
      ctx.beginPath();
      const trailR = BALL_RADIUS * ((i + 1) / this.ball.trail.length) * 0.7;
      ctx.arc(t.x, t.y, trailR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Cosmic orb
    ctx.save();
    ctx.shadowColor = edgeColor;
    ctx.shadowBlur = 14;
    const grad = ctx.createRadialGradient(
      this.ball.x,
      this.ball.y,
      0,
      this.ball.x,
      this.ball.y,
      BALL_RADIUS,
    );
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, edgeColor);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Orbital ring
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.ellipse(
      this.ball.x,
      this.ball.y,
      BALL_RADIUS + 4,
      BALL_RADIUS * 0.4,
      this.elapsed * 2,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    ctx.restore();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, player: Player, color: string): void {
    ctx.save();
    const bx = player.x;
    const by = player.y;
    const helmetR = PLAYER_W * 0.45;

    // Body — rounded rectangle with gradient
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    const bodyGrad = ctx.createLinearGradient(bx, by + helmetR * 2, bx + PLAYER_W, by + PLAYER_H);
    bodyGrad.addColorStop(0, color);
    bodyGrad.addColorStop(1, '#111122');
    ctx.fillStyle = bodyGrad;
    const bodyTop = by + helmetR * 1.5;
    const bodyH = PLAYER_H - helmetR * 1.5;
    const cr = 4;
    ctx.beginPath();
    ctx.moveTo(bx + cr, bodyTop);
    ctx.lineTo(bx + PLAYER_W - cr, bodyTop);
    ctx.quadraticCurveTo(bx + PLAYER_W, bodyTop, bx + PLAYER_W, bodyTop + cr);
    ctx.lineTo(bx + PLAYER_W, bodyTop + bodyH - cr);
    ctx.quadraticCurveTo(bx + PLAYER_W, bodyTop + bodyH, bx + PLAYER_W - cr, bodyTop + bodyH);
    ctx.lineTo(bx + cr, bodyTop + bodyH);
    ctx.quadraticCurveTo(bx, bodyTop + bodyH, bx, bodyTop + bodyH - cr);
    ctx.lineTo(bx, bodyTop + cr);
    ctx.quadraticCurveTo(bx, bodyTop, bx + cr, bodyTop);
    ctx.closePath();
    ctx.fill();

    // Helmet — circle at top
    ctx.shadowBlur = 0;
    const hx = bx + PLAYER_W / 2;
    const hy = by + helmetR;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(hx, hy, helmetR, 0, Math.PI * 2);
    ctx.fill();

    // Visor
    ctx.fillStyle = 'rgba(200,230,255,0.7)';
    ctx.beginPath();
    ctx.arc(hx + (player.side === 1 ? 2 : -2), hy, helmetR * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawGravityArrow(ctx: CanvasRenderingContext2D): void {
    // Always show small gravity indicator in HUD area
    this.drawGravityIndicator(ctx);

    // Warning arrow before change
    if (!this.showArrow) return;

    ctx.save();
    const cx = CANVAS_W / 2;
    const cy = CANVAS_H / 2;
    const pulse = 0.6 + 0.4 * Math.sin(this.elapsed * 10);

    ctx.globalAlpha = pulse * 0.7;
    ctx.fillStyle = GRAVITY_COLORS[this.nextGravity];
    ctx.translate(cx, cy);

    // Rotate based on next gravity direction
    let angle = 0;
    switch (this.nextGravity) {
      case 'DOWN':
        angle = Math.PI / 2;
        break;
      case 'UP':
        angle = -Math.PI / 2;
        break;
      case 'LEFT':
        angle = Math.PI;
        break;
      case 'RIGHT':
        angle = 0;
        break;
    }
    ctx.rotate(angle);

    // Arrow pointing right (rotated to direction)
    const size = 40;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.3, -size * 0.6);
    ctx.lineTo(-size * 0.3, -size * 0.2);
    ctx.lineTo(-size, -size * 0.2);
    ctx.lineTo(-size, size * 0.2);
    ctx.lineTo(-size * 0.3, size * 0.2);
    ctx.lineTo(-size * 0.3, size * 0.6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private drawGravityIndicator(ctx: CanvasRenderingContext2D): void {
    const ix = CANVAS_W / 2;
    const iy = 50;
    const sz = 10;

    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = GRAVITY_COLORS[this.gravity];
    ctx.translate(ix, iy);

    let angle = 0;
    switch (this.gravity) {
      case 'DOWN':
        angle = Math.PI / 2;
        break;
      case 'UP':
        angle = -Math.PI / 2;
        break;
      case 'LEFT':
        angle = Math.PI;
        break;
      case 'RIGHT':
        angle = 0;
        break;
    }
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(sz, 0);
    ctx.lineTo(-sz * 0.5, -sz * 0.6);
    ctx.lineTo(-sz * 0.5, sz * 0.6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private drawGravityChangeArrow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const cx = CANVAS_W / 2;
    const cy = CANVAS_H / 2;
    const alpha = Math.max(0, this.gravityChangeArrowTimer);
    const color = GRAVITY_COLORS[this.gravity];

    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = color;
    ctx.translate(cx, cy);

    let angle = 0;
    switch (this.gravity) {
      case 'DOWN':
        angle = Math.PI / 2;
        break;
      case 'UP':
        angle = -Math.PI / 2;
        break;
      case 'LEFT':
        angle = Math.PI;
        break;
      case 'RIGHT':
        angle = 0;
        break;
    }
    ctx.rotate(angle);

    const size = 60;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.3, -size * 0.6);
    ctx.lineTo(-size * 0.3, -size * 0.2);
    ctx.lineTo(-size, -size * 0.2);
    ctx.lineTo(-size, size * 0.2);
    ctx.lineTo(-size * 0.3, size * 0.2);
    ctx.lineTo(-size * 0.3, size * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawHUD(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Timer
    const timeStr = Math.ceil(this.timer).toString();
    ctx.font = '700 22px Orbitron, monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(timeStr, CANVAS_W / 2, 14);

    // Scores
    ctx.font = '700 32px Orbitron, monospace';
    ctx.fillStyle = COLOR_P1;
    ctx.textAlign = 'right';
    ctx.fillText(this.scoreP1.toString(), CANVAS_W / 2 - 60, 14);

    ctx.fillStyle = COLOR_P2;
    ctx.textAlign = 'left';
    ctx.fillText(this.scoreP2.toString(), CANVAS_W / 2 + 60, 14);

    ctx.restore();
  }

  private drawFinishOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 48px Orbitron, monospace';

    const winner = this.getWinner();
    if (winner === 1) {
      ctx.fillStyle = COLOR_P1;
      ctx.fillText('HUMAN WINS', CANVAS_W / 2, CANVAS_H / 2 - 20);
    } else if (winner === 2) {
      ctx.fillStyle = COLOR_P2;
      ctx.fillText('ALIEN WINS', CANVAS_W / 2, CANVAS_H / 2 - 20);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillText('DRAW', CANVAS_W / 2, CANVAS_H / 2 - 20);
    }

    ctx.font = '400 24px Orbitron, monospace';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(`${this.scoreP1} - ${this.scoreP2}`, CANVAS_W / 2, CANVAS_H / 2 + 30);

    ctx.restore();
  }
}
