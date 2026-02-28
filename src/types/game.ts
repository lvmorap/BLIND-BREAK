/**
 * Game Type Definitions for NEXARI
 * Comprehensive TypeScript interfaces and types for the pool game with darkness mechanics
 */

/**
 * Core game constants
 */
export interface GameConstants {
  readonly W: number;
  readonly H: number;
  readonly TABLE_W: number;
  readonly TABLE_H: number;
  readonly RAIL: number;
  readonly FELT_COLOR: string;
  readonly BALL_R: number;
  readonly FRICTION: number;
  readonly MIN_VEL: number;
  readonly WALL_RESTITUTION: number;
  readonly BALL_RESTITUTION: number;
  readonly POCKET_SINK_R: number;
  readonly POCKET_CORNER_R: number;
  readonly POCKET_SIDE_R: number;
  readonly LIGHT_CUE_R: number;
  readonly LIGHT_OBJ_R: number;
  readonly DARKNESS_ALPHA: number;
  readonly MAX_PARTICLES: number;
  readonly POWER_MIN: number;
  readonly POWER_MAX: number;
  readonly ROUNDS: number;
  readonly NEON_COLOR: string;
  readonly AIM_COLOR: string;
  readonly PLAYER_COLOR: string;
  readonly AI_COLOR: string;
  readonly SCORE_BLIND: number;
  readonly SCORE_SHADOW: number;
  readonly SCORE_LIT: number;
  readonly AI_THINK_TIME: number;
  readonly COUNTDOWN_STEP: number;
  readonly POPUP_DURATION: number;
  readonly SHAKE_CAP: number;
  readonly SLOW_MO_DURATION: number;
  readonly SLOW_MO_SCALE: number;
  readonly TUTORIAL_STEPS: number;
  readonly DUST_INTERVAL: number;
  readonly NOISE_DOTS: number;
  readonly SQUASH_DURATION: number;
  readonly RACK_SPACING: number;
  readonly SCRATCH_RESPAWN_MS: number;
  readonly RECON_SPREAD_DEG: number;
  readonly AI_GHOST_VARIANCE_DEG: number;
  readonly AI_PROBE_VARIANCE_DEG: number;
  readonly CUE_LIGHT_R: number;
  readonly TRAIL_DURATION: number;
  readonly TRAIL_LIGHT_R: number;
  readonly MAX_DRAG_DIST: number;
  readonly TURN_TIMER: number;
}

/**
 * Pocket definition for table layout
 */
export interface Pocket {
  readonly x: number;
  readonly y: number;
  readonly r: number;
}

/**
 * Lamp/light zone on the table
 */
export interface LampZone {
  readonly x: number;
  readonly y: number;
  readonly rx: number;
  readonly ry: number;
}

/**
 * Squash effect for ball animations
 */
export interface Squash {
  sx: number;
  sy: number;
  timer: number;
}

/**
 * Ball object representing a pool ball
 */
export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  num: string;
  alive: boolean;
  sinking: boolean;
  sinkTimer: number;
  sinkScale: number;
  trail: Array<{ x: number; y: number; a: number }>;
  squash: Squash;
  _lastLightZone: { x: number; y: number } | null;
  lastLitX?: number;
  lastLitY?: number;
  visAlpha?: number;
}

/**
 * Dynamic light zone created during gameplay
 */
export interface LightZone {
  x: number;
  y: number;
  radius: number;
  createdAtRound: number;
  intensity: number;
  createdAt: number;
}

/**
 * Ghost ball (legacy type, no longer used in gameplay)
 */
export interface GhostBall {
  id: number;
  x: number;
  y: number;
  color: string;
  round: number;
}

/**
 * Particle effect
 */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  color: string;
  size: number;
  shape: 'circle' | 'diamond';
  gravity: number;
  startLife: number;
}

/**
 * Floating score popup on screen
 */
export interface ScorePopup {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

/**
 * Screen shake effect
 */
export interface ScreenShake {
  intensity: number;
  duration: number;
  timer: number;
  ox: number;
  oy: number;
}

/**
 * Bouncing number popup for scoring events
 */
export interface NumberBouncePopup {
  num: string;
  x: number;
  y: number;
  vy: number;
  scale: number;
  alpha: number;
  color: string;
  timer: number;
}

/**
 * Recon beam animation state
 */
export interface ReconBeamAnim {
  angle: number;
  startTime: number;
  duration: number;
  cx: number;
  cy: number;
}

/**
 * Round transition message
 */
export interface RoundTransMsg {
  text: string;
  color: string;
  timer: number;
  maxTimer: number;
}

/**
 * Scoring reminder for ghost balls
 */
export interface ScoringReminder {
  x: number;
  y: number;
  ghostId: number;
  timer: number;
  maxTimer: number;
}

/**
 * End game statistics
 */
export interface EndStats {
  player: { blind: number; shadow: number; lit: number; scratches: number };
  ai: { blind: number; shadow: number; lit: number; scratches: number };
}

/**
 * Overall game state
 */
export type GameState = 'PRELOAD' | 'MENU' | 'TUTORIAL' | 'COUNTDOWN' | 'PLAYING' | 'ENDSCREEN';

/**
 * Game mode selection
 */
export type GameMode = 'VS_AI' | 'VS_LOCAL';

/**
 * Turn ownership
 */
export type TurnOwner = 'PLAYER' | 'AI';

/**
 * Phase of a turn
 */
export type TurnPhase = 'AIM' | 'ROLLING' | 'RESOLVE';

/**
 * AI thinking state
 */
export type AIState = 'IDLE' | 'THINKING';

/**
 * Sound effect types
 */
export type SoundType = 'CUE_STRIKE' | 'BALL_COLLISION' | 'CUSHION' | 'POCKET' | 'BLIND_BONUS';

/**
 * Options for creating particles
 */
export interface ParticleOptions {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  life?: number;
  decay?: number;
  color?: string;
  size?: number;
  shape?: 'circle' | 'diamond';
  gravity?: number;
}

/**
 * Complete game state data structure
 */
export interface GameState_Data {
  gameState: GameState;
  prevTime: number;
  timeScale: number;
  slowMoTimer: number;
  tutorialSeen: boolean;
  tutorialStep: number;
  tutorialAnim: number;
  colorBlind: boolean;
  paused: boolean;
  currentRound: number;
  currentTurn: TurnOwner;
  turnPhase: TurnPhase;
  playerScore: number;
  aiScore: number;
  playerReconUsed: boolean;
  aiReconUsed: boolean;
  aiReconRound: number;
  countdownVal: number;
  countdownTimer: number;
  neonFlicker: number;
  neonDropTimer: number;
  dashOffset: number;
  dustTimer: number;
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
  dragging: boolean;
  dragStartX: number;
  dragStartY: number;
  power: number;
  charging: boolean;
  chargeTime: number;
  reconMode: boolean;
  aiState: AIState;
  aiThinkTimer: number;
  aiAimAngle: number;
  aiPower: number;
  aiScanAnim: number;
  endStats: EndStats;
  settleTimer: number;
  reconBeamAnim: ReconBeamAnim | null;
  firstShotCoach: boolean;
  roundTransMsg: RoundTransMsg | null;
  scoringReminder: ScoringReminder | null;
  scoringReminderShown: boolean;
  audioCtx: AudioContext | null;
  audioInited: boolean;
  ambientNode: OscillatorNode | null;
  ambientGain: GainNode | null;
  collisionSoundCount: number;
  parallaxX: number;
  parallaxY: number;
  parallaxTargetX: number;
  parallaxTargetY: number;
  chromaticTimer: number;
  breathTimer: number;
  numberBouncePopups: NumberBouncePopup[];
  scratchFlashTimer: number;
  balls: Ball[];
  lightZones: LightZone[];
  ghostBalls: GhostBall[];
  particles: Particle[];
  scorePopups: ScorePopup[];
  screenShake: ScreenShake;
  squashEffects: unknown[];
}
