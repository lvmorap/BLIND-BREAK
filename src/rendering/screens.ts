import { C } from '../core/constants.ts';
import { state } from '../core/state.ts';
import { ctx } from './canvas.ts';
import { drawBrickWall, drawWallSconces, drawTable, drawLamps, drawNeonSign } from './table.ts';
import { drawBalls } from './balls.ts';
import { drawDarkness } from './darkness.ts';
import { drawScene } from './scene.ts';

export function drawMenu(t: number): void {
  drawBrickWall();
  drawWallSconces();
  drawTable();
  drawLamps();
  drawDarkness();
  drawNeonSign(t);

  ctx.save();
  ctx.globalAlpha = state.neonFlicker;
  ctx.font = 'bold 54px Orbitron';
  ctx.textAlign = 'center';
  ctx.shadowColor = C.NEON_COLOR;
  ctx.shadowBlur = 40;
  ctx.fillStyle = C.NEON_COLOR;
  ctx.fillText('BLIND BREAK', C.W / 2, 180);
  ctx.shadowBlur = 0;
  ctx.restore();

  ctx.fillStyle = '#888';
  ctx.font = '16px Rajdhani';
  ctx.textAlign = 'center';
  ctx.fillText('Billiards in the Dark', C.W / 2, 210);

  const col1x = C.W / 2 - 170;
  const col2x = C.W / 2 + 170;
  ctx.font = 'bold 14px Rajdhani';
  ctx.fillStyle = '#00e5ff';
  ctx.fillText('THE RULES', col1x, 270);
  ctx.fillStyle = '#aaa';
  ctx.font = '13px Rajdhani';
  const rules1 = [
    'Your shot is your only light',
    'What you reveal, they see too',
    'Ghosts show where balls were',
    'Pocket in darkness. Score triple.',
  ];
  rules1.forEach((r, i) => ctx.fillText(r, col1x, 292 + i * 20));

  ctx.font = 'bold 14px Rajdhani';
  ctx.fillStyle = '#ffd700';
  ctx.fillText('CONTROLS', col2x, 270);
  ctx.fillStyle = '#aaa';
  ctx.font = '13px Rajdhani';
  const rules2 = [
    'Mouse drag — aim direction',
    'Hold button — charge power',
    'Release — shoot',
    'ESC — pause | T — tutorial',
  ];
  rules2.forEach((r, i) => ctx.fillText(r, col2x, 292 + i * 20));

  const flash = 0.5 + 0.5 * Math.sin(t * 0.004);
  ctx.fillStyle = `rgba(255,255,255,${flash})`;
  ctx.font = 'bold 20px Orbitron';
  ctx.textAlign = 'center';
  ctx.fillText('PRESS SPACE TO BEGIN', C.W / 2, 460);

  ctx.fillStyle = '#555';
  ctx.font = '12px Rajdhani';
  ctx.fillText('vs AI · 7 Rounds · First to most points wins', C.W / 2, 490);

  ctx.fillStyle = 'rgba(200,200,200,0.35)';
  ctx.font = '13px Rajdhani';
  ctx.textAlign = 'right';
  ctx.fillText('? TUTORIAL', C.W - 18, 28);
}

export function drawCountdown(t: number): void {
  drawScene(t);

  ctx.fillStyle = 'rgba(5,5,8,0.6)';
  ctx.fillRect(0, 0, C.W, C.H);

  const progress = (state.countdownTimer % C.COUNTDOWN_STEP) / C.COUNTDOWN_STEP;
  const scale = 1 + (1 - progress) * 0.5;
  const alpha = progress;

  ctx.save();
  ctx.translate(C.W / 2, C.H / 2);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 120px Orbitron';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = C.NEON_COLOR;
  ctx.shadowBlur = 30;

  const text = state.countdownVal > 0 ? state.countdownVal.toString() : 'BREAK!';
  ctx.fillStyle = state.countdownVal <= 0 ? '#ffd700' : '#fff';
  ctx.fillText(text, 0, 0);
  ctx.shadowBlur = 0;
  ctx.restore();
}

export function drawEndScreen(t: number): void {
  drawBrickWall();
  drawWallSconces();
  drawTable();
  drawLamps();
  drawBalls();
  drawNeonSign(t);

  ctx.fillStyle = 'rgba(5,5,8,0.4)';
  ctx.fillRect(0, 0, C.W, C.H);

  const diff = state.playerScore - state.aiScore;
  let winner: string;
  let winColor: string;
  if (diff >= 3) {
    winner = 'YOU WIN — MASTER OF SHADOWS';
    winColor = '#00e5ff';
  } else if (diff >= 1) {
    winner = 'YOU WIN — CLOSE GAME';
    winColor = '#00e5ff';
  } else if (diff <= -1) {
    winner = 'AI WINS — PRACTICE MORE';
    winColor = '#ff4466';
  } else {
    winner = 'DEAD EVEN — WELL PLAYED';
    winColor = '#ffd700';
  }

  ctx.fillStyle = winColor;
  ctx.font = 'bold 36px Orbitron';
  ctx.textAlign = 'center';
  ctx.shadowColor = winColor;
  ctx.shadowBlur = 30;
  ctx.fillText(winner, C.W / 2, 150);
  ctx.shadowBlur = 0;

  ctx.fillStyle = C.PLAYER_COLOR;
  ctx.font = 'bold 72px Orbitron';
  ctx.fillText(state.playerScore.toString(), C.W / 2 - 120, 260);
  ctx.fillStyle = '#666';
  ctx.font = 'bold 36px Orbitron';
  ctx.fillText('vs', C.W / 2, 250);
  ctx.fillStyle = C.AI_COLOR;
  ctx.font = 'bold 72px Orbitron';
  ctx.fillText(state.aiScore.toString(), C.W / 2 + 120, 260);

  ctx.fillStyle = '#88bbcc';
  ctx.font = '14px Rajdhani';
  ctx.fillText('PLAYER', C.W / 2 - 120, 280);
  ctx.fillStyle = '#cc8899';
  ctx.fillText('AI', C.W / 2 + 120, 280);

  ctx.fillStyle = '#88bbcc';
  ctx.font = '15px Rajdhani';
  ctx.textAlign = 'center';
  ctx.fillText(
    `Player — Blind: ${state.endStats.player.blind}  Shadow: ${state.endStats.player.shadow}  Lit: ${state.endStats.player.lit}  Scratches: ${state.endStats.player.scratches}`,
    C.W / 2,
    320,
  );
  ctx.fillStyle = '#cc8899';
  ctx.fillText(
    `AI — Blind: ${state.endStats.ai.blind}  Shadow: ${state.endStats.ai.shadow}  Lit: ${state.endStats.ai.lit}  Scratches: ${state.endStats.ai.scratches}`,
    C.W / 2,
    345,
  );

  const remainingBalls = state.balls.filter((b) => b.id > 0 && b.alive).length;
  if (remainingBalls === 0 && state.currentRound <= C.ROUNDS) {
    ctx.fillStyle = '#ffd700';
    ctx.font = '13px Rajdhani';
    ctx.fillText(`All balls pocketed — early finish in round ${state.currentRound}`, C.W / 2, 368);
  }

  const flash = 0.5 + 0.5 * Math.sin(t * 0.004);
  ctx.fillStyle = `rgba(255,255,255,${flash})`;
  ctx.font = 'bold 20px Orbitron';
  ctx.fillText('PRESS SPACE TO PLAY AGAIN', C.W / 2, 400);
}

export function drawPauseMenu(): void {
  ctx.fillStyle = 'rgba(5,5,8,0.82)';
  ctx.fillRect(0, 0, C.W, C.H);

  ctx.fillStyle = '#e0d5c0';
  ctx.font = 'bold 36px Orbitron';
  ctx.textAlign = 'center';
  ctx.shadowColor = C.NEON_COLOR;
  ctx.shadowBlur = 20;
  ctx.fillText('PAUSED', C.W / 2, 200);
  ctx.shadowBlur = 0;

  const opts = [
    { label: 'RESUME', key: 'SPACE', color: '#00e5ff' },
    { label: 'RESTART', key: 'R', color: '#ff8800' },
    { label: 'TUTORIAL', key: 'T', color: '#aaaaaa' },
  ];
  opts.forEach((o, i) => {
    const oy = 265 + i * 50;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(C.W / 2 - 110, oy - 18, 220, 36);
    ctx.strokeStyle = o.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(C.W / 2 - 110, oy - 18, 220, 36);
    ctx.fillStyle = o.color;
    ctx.font = 'bold 18px Orbitron';
    ctx.fillText(o.label, C.W / 2, oy + 6);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '11px Rajdhani';
    ctx.fillText(`[${o.key}]`, C.W / 2, oy + 22);
  });
}

export function drawTutorial(t: number): void {
  drawBrickWall();
  drawWallSconces();
  drawTable();
  drawLamps();

  ctx.fillStyle = 'rgba(5,5,8,0.82)';
  ctx.fillRect(0, 0, C.W, C.H);

  state.tutorialAnim += 0.016;

  const step = state.tutorialStep;
  const cx = C.W / 2;
  const cy = C.H / 2;

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  const fg = ctx.createRadialGradient(cx, cy, 60, cx, cy, 180);
  fg.addColorStop(0, 'rgba(0,0,0,1)');
  fg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fg;
  ctx.fillRect(cx - 180, cy - 180, 360, 360);
  ctx.restore();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Orbitron';
  ctx.textAlign = 'center';

  const captions = [
    'Drag to aim. Hold to charge power.',
    "The table is dark. You can't see what you can't reach.",
    'Rolling reveals. Everything you light, they see too.',
    'Ghosts fade. They remember where — not where it went.',
    'Score: +1 Lit  |  +2 Shadow  |  +3 Blind',
  ];

  ctx.fillText(captions[step] ?? '', cx, cy + 140);

  if (step === 0) {
    const ax = cx - 60;
    const ay = cy;
    ctx.fillStyle = '#f5f0e8';
    ctx.beginPath();
    ctx.arc(ax, ay, C.BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,229,255,0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    ctx.lineDashOffset = -t * 0.05;
    const aimLen = 80 + Math.sin(state.tutorialAnim * 2) * 20;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + aimLen, ay - 20);
    ctx.stroke();
    ctx.setLineDash([]);
    const pw = 0.5 + 0.5 * Math.sin(state.tutorialAnim * 1.5);
    ctx.fillStyle = 'rgba(0,255,68,0.5)';
    ctx.fillRect(cx + 100, cy - 40, 15, 80 * pw);
  } else if (step === 1) {
    const darkR = 120 + 40 * Math.sin(state.tutorialAnim * 1.5);
    const dg = ctx.createRadialGradient(cx, cy, darkR * 0.3, cx, cy, darkR);
    dg.addColorStop(0, 'rgba(5,5,8,0)');
    dg.addColorStop(1, 'rgba(5,5,8,0.9)');
    ctx.fillStyle = dg;
    ctx.fillRect(cx - 200, cy - 120, 400, 240);
  } else if (step === 2) {
    const bx = cx - 100 + (state.tutorialAnim % 4) * 50;
    ctx.fillStyle = '#ff8800';
    ctx.beginPath();
    ctx.arc(bx, cy, C.BALL_R, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      const tx = bx - i * 15;
      ctx.fillStyle = `rgba(255,136,0,${0.1 - i * 0.015})`;
      ctx.beginPath();
      ctx.arc(tx, cy, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (step === 3) {
    const ghostAlphas = [0.15, 0.1, 0.05];
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(255,255,255,${ghostAlphas[i]})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx - 60 + i * 60, cy, C.BALL_R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#555';
      ctx.font = '10px Rajdhani';
      ctx.fillText(`Round -${i}`, cx - 60 + i * 60, cy + 25);
    }
  } else if (step === 4) {
    const scenarios = [
      { x: cx - 140, label: '+1 LIT', color: '#00cc55', bg: 'rgba(255,255,200,0.1)' },
      { x: cx, label: '+2 SHADOW', color: '#dddddd', bg: 'rgba(200,200,255,0.05)' },
      { x: cx + 140, label: '+3 BLIND!', color: '#ffd700', bg: 'rgba(5,5,8,0.5)' },
    ];
    for (const s of scenarios) {
      ctx.fillStyle = s.bg;
      ctx.fillRect(s.x - 45, cy - 40, 90, 60);
      ctx.fillStyle = s.color;
      ctx.font = 'bold 16px Orbitron';
      ctx.fillText(s.label, s.x, cy);
    }
  }

  const dotY = cy + 166;
  const dotSpacing = 20;
  const totalDotsW = (C.TUTORIAL_STEPS - 1) * dotSpacing;
  const dotStartX = cx - totalDotsW / 2;
  for (let i = 0; i < C.TUTORIAL_STEPS; i++) {
    const dx = dotStartX + i * dotSpacing;
    const isActive = i === step;
    ctx.fillStyle = isActive ? '#00e5ff' : '#444';
    ctx.beginPath();
    ctx.arc(dx, dotY, isActive ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#555';
  ctx.font = '14px Rajdhani';
  ctx.fillText(`${step + 1} / ${C.TUTORIAL_STEPS}`, cx, cy + 186);

  const flash = 0.5 + 0.5 * Math.sin(t * 0.005);
  ctx.fillStyle = `rgba(255,255,255,${flash})`;
  ctx.font = '14px Orbitron';
  ctx.fillText('Click or SPACE to continue', cx, cy + 208);
}
