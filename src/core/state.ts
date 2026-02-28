import type {
  Ball,
  LightZone,
  GhostBall,
  Particle,
  ScorePopup,
  ScreenShake,
  NumberBouncePopup,
  ReconBeamAnim,
  RoundTransMsg,
  ScoringReminder,
  EndStats,
  GameState,
  TurnOwner,
  TurnPhase,
  AIState,
} from '../types/game.ts';
import { C, FELT_L, FELT_W, FELT_CY, BALL_COLORS, BALL_NAMES } from './constants.ts';

function createEndStats(): EndStats {
  return {
    player: { blind: 0, shadow: 0, lit: 0, scratches: 0 },
    ai: { blind: 0, shadow: 0, lit: 0, scratches: 0 },
  };
}

function createScreenShake(): ScreenShake {
  return { intensity: 0, duration: 0, timer: 0, ox: 0, oy: 0 };
}

export const state = {
  gameState: 'PRELOAD' as GameState,
  prevTime: 0,
  timeScale: 1.0,
  slowMoTimer: 0,
  tutorialSeen: false,
  tutorialStep: 0,
  tutorialAnim: 0,
  colorBlind: false,
  paused: false,
  currentRound: 1,
  currentTurn: 'PLAYER' as TurnOwner,
  turnPhase: 'AIM' as TurnPhase,
  playerScore: 0,
  aiScore: 0,
  playerReconUsed: false,
  aiReconUsed: false,
  aiReconRound: Math.random() < 0.5 ? 3 : 4,
  countdownVal: 3,
  countdownTimer: 0,
  neonFlicker: 1.0,
  neonDropTimer: 0,
  dashOffset: 0,
  dustTimer: 0,
  mouseX: 0,
  mouseY: 0,
  mouseDown: false,
  dragging: false,
  dragStartX: 0,
  dragStartY: 0,
  power: 0,
  charging: false,
  chargeTime: 0,
  reconMode: false,
  aiState: 'IDLE' as AIState,
  aiThinkTimer: 0,
  aiAimAngle: 0,
  aiPower: 0,
  aiScanAnim: 0,
  endStats: createEndStats(),
  settleTimer: 0,
  reconBeamAnim: null as ReconBeamAnim | null,
  firstShotCoach: true,
  roundTransMsg: null as RoundTransMsg | null,
  scoringReminder: null as ScoringReminder | null,
  scoringReminderShown: false,
  audioCtx: null as AudioContext | null,
  audioInited: false,
  ambientNode: null as OscillatorNode | null,
  ambientGain: null as GainNode | null,
  collisionSoundCount: 0,
  parallaxX: 0,
  parallaxY: 0,
  parallaxTargetX: 0,
  parallaxTargetY: 0,
  chromaticTimer: 0,
  breathTimer: 0,
  numberBouncePopups: [] as NumberBouncePopup[],
  scratchFlashTimer: 0,

  balls: [] as Ball[],
  lightZones: [] as LightZone[],
  ghostBalls: [] as GhostBall[],
  particles: [] as Particle[],
  scorePopups: [] as ScorePopup[],
  screenShake: createScreenShake(),
  squashEffects: [] as unknown[],
};

export function resetBalls(): void {
  state.balls = [];
  const baulkX = FELT_L + FELT_W * 0.25;
  state.balls.push({
    id: 0,
    x: baulkX,
    y: FELT_CY,
    vx: 0,
    vy: 0,
    color: BALL_COLORS[0] ?? '#f5f0e8',
    num: '',
    alive: true,
    sinking: false,
    sinkTimer: 0,
    sinkScale: 1,
    trail: [],
    squash: { sx: 1, sy: 1, timer: 0 },
    _lastLightZone: null,
  });

  const rackX = FELT_L + FELT_W * 0.72;
  const rackY = FELT_CY;
  const spacing = C.BALL_R * C.RACK_SPACING;
  const positions: [number, number][] = [
    [0, 0],
    [-1, -0.5],
    [-1, 0.5],
    [-2, -1],
    [-2, 0],
    [-2, 1],
    [-3, -0.5],
  ];

  for (let i = 0; i < 7; i++) {
    const p = positions[i];
    if (!p) continue;
    const bx = rackX + p[0] * spacing;
    const by = rackY + p[1] * spacing;
    state.balls.push({
      id: i + 1,
      x: bx,
      y: by,
      vx: 0,
      vy: 0,
      color: BALL_COLORS[i + 1] ?? '#ffffff',
      num: BALL_NAMES[i + 1] ?? '',
      lastLitX: bx,
      lastLitY: by,
      alive: true,
      sinking: false,
      sinkTimer: 0,
      sinkScale: 1,
      trail: [],
      squash: { sx: 1, sy: 1, timer: 0 },
      visAlpha: 1.0,
      _lastLightZone: null,
    });
  }
}

export function resetGame(): void {
  resetBalls();
  state.lightZones = [];
  state.ghostBalls = [];
  state.particles = [];
  state.scorePopups = [];
  state.currentRound = 1;
  state.currentTurn = 'PLAYER';
  state.turnPhase = 'AIM';
  state.playerScore = 0;
  state.aiScore = 0;
  state.playerReconUsed = false;
  state.aiReconUsed = false;
  state.aiReconRound = Math.random() < 0.5 ? 3 : 4;
  state.endStats = createEndStats();
  state.settleTimer = 0;
  state.reconBeamAnim = null;
  state.firstShotCoach = true;
  state.roundTransMsg = null;
  state.scoringReminder = null;
  state.scoringReminderShown = false;
  state.power = 0;
  state.charging = false;
  state.chargeTime = 0;
  state.reconMode = false;
  state.aiState = 'IDLE';
  state.screenShake = createScreenShake();
  state.squashEffects = [];
  state.timeScale = 1.0;
  state.slowMoTimer = 0;
  state.chromaticTimer = 0;
  state.numberBouncePopups = [];
  state.scratchFlashTimer = 0;
}

export function getCueBall(): Ball {
  const cue = state.balls[0];
  if (!cue) {
    throw new Error('Cue ball not found');
  }
  return cue;
}
