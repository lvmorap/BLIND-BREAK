import type { GameConstants, Pocket, LampZone } from '../types/game.ts';

export const C: GameConstants = {
  W: 960,
  H: 600,
  TABLE_W: 820,
  TABLE_H: 460,
  RAIL: 52,
  FELT_COLOR: '#1a3020',
  BALL_R: 11,
  FRICTION: 0.985,
  MIN_VEL: 0.15,
  WALL_RESTITUTION: 0.78,
  BALL_RESTITUTION: 0.92,
  POCKET_SINK_R: 18,
  POCKET_CORNER_R: 22,
  POCKET_SIDE_R: 19,
  LIGHT_CUE_R: 48,
  LIGHT_OBJ_R: 28,
  DARKNESS_ALPHA: 0.92,
  MAX_PARTICLES: 150,
  POWER_MIN: 3,
  POWER_MAX: 22,
  ROUNDS: 7,
  NEON_COLOR: '#ff3366',
  AIM_COLOR: '#00e5ff',
  PLAYER_COLOR: '#00e5ff',
  AI_COLOR: '#ff4466',
  SCORE_BLIND: 3,
  SCORE_SHADOW: 2,
  SCORE_LIT: 1,
  AI_THINK_TIME: 1200,
  COUNTDOWN_STEP: 700,
  POPUP_DURATION: 1800,
  SHAKE_CAP: 12,
  SLOW_MO_DURATION: 300,
  SLOW_MO_SCALE: 0.25,
  TUTORIAL_STEPS: 5,
  DUST_INTERVAL: 2000,
  NOISE_DOTS: 2000,
  SQUASH_DURATION: 180,
  RACK_SPACING: 2.2,
  SCRATCH_RESPAWN_MS: 350,
  RECON_SPREAD_DEG: 25,
  AI_GHOST_VARIANCE_DEG: 12,
  AI_PROBE_VARIANCE_DEG: 30,
  CUE_LIGHT_R: 55,
  TRAIL_DURATION: 3000,
  TRAIL_LIGHT_R: 30,
  MAX_DRAG_DIST: 200,
} as const;

export const TABLE_L: number = (C.W - C.TABLE_W) / 2;
export const TABLE_T: number = (C.H - C.TABLE_H) / 2;
export const TABLE_R: number = TABLE_L + C.TABLE_W;
export const TABLE_B: number = TABLE_T + C.TABLE_H;
export const FELT_L: number = TABLE_L + C.RAIL;
export const FELT_T: number = TABLE_T + C.RAIL;
export const FELT_R: number = TABLE_R - C.RAIL;
export const FELT_B: number = TABLE_B - C.RAIL;
export const FELT_W: number = FELT_R - FELT_L;
export const FELT_H: number = FELT_B - FELT_T;
export const FELT_CX: number = (FELT_L + FELT_R) / 2;
export const FELT_CY: number = (FELT_T + FELT_B) / 2;

export const BALL_COLORS: readonly string[] = [
  '#f5f0e8',
  '#ff2244',
  '#ff8800',
  '#ffdd00',
  '#00cc55',
  '#0088ff',
  '#aa00ff',
  '#ff44aa',
];
export const BALL_NAMES: readonly string[] = ['CUE', '1', '2', '3', '4', '5', '6', '7'];
export const CB_SHAPES: readonly string[] = ['', '△', '□', '◇', '☆', '⬡', '✦', '⬟'];

export const POCKETS: readonly Pocket[] = [
  { x: FELT_L + 4, y: FELT_T + 4, r: C.POCKET_CORNER_R },
  { x: FELT_CX, y: FELT_T - 2, r: C.POCKET_SIDE_R },
  { x: FELT_R - 4, y: FELT_T + 4, r: C.POCKET_CORNER_R },
  { x: FELT_L + 4, y: FELT_B - 4, r: C.POCKET_CORNER_R },
  { x: FELT_CX, y: FELT_B + 2, r: C.POCKET_SIDE_R },
  { x: FELT_R - 4, y: FELT_B - 4, r: C.POCKET_CORNER_R },
];

export const LAMP_ZONES: readonly LampZone[] = [
  { x: FELT_CX - 140, y: FELT_CY, rx: 100, ry: 60 },
  { x: FELT_CX + 140, y: FELT_CY, rx: 100, ry: 60 },
];
