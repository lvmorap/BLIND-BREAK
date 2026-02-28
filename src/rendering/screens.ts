import { C } from '../core/constants.ts';
import { state } from '../core/state.ts';
import { ctx } from './canvas.ts';
import {
  drawBrickWall,
  drawWallSconces,
  drawTable,
  drawLamps,
  drawNeonSign,
  updateNeonFlicker,
} from './table.ts';
import { drawBalls } from './balls.ts';
import { drawScene } from './scene.ts';

let heroImg: HTMLImageElement | null = null;
let heroLoaded = false;

function loadHeroImage(): void {
  if (heroImg) return;
  heroImg = new Image();
  heroImg.onload = (): void => {
    heroLoaded = true;
  };
  heroImg.src = './assets/hero-cosmic.svg';
}

loadHeroImage();

export function drawMenu(t: number): void {
  ctx.fillStyle = '#020206';
  ctx.fillRect(0, 0, C.W, C.H);

  // Animated starfield background
  const starT = t * 0.0005;
  for (let i = 0; i < 80; i++) {
    const sx = (Math.sin(i * 7.3 + starT) * 0.5 + 0.5) * C.W;
    const sy = (Math.cos(i * 11.1 + starT * 0.7) * 0.5 + 0.5) * C.H;
    const brightness = 0.2 + 0.3 * Math.sin(t * 0.003 + i);
    ctx.fillStyle = `rgba(180,200,255,${brightness})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 0.5 + Math.sin(i) * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (heroLoaded && heroImg) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    const imgW = C.W;
    const imgH = (heroImg.height / heroImg.width) * imgW;
    const imgY = (C.H - imgH) / 2;
    ctx.drawImage(heroImg, 0, imgY, imgW, imgH);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Nebula atmosphere
  const nebulaColors = [
    { x: 0.25, y: 0.3, color: '80,20,140', r: 250 },
    { x: 0.75, y: 0.7, color: '20,40,120', r: 200 },
    { x: 0.5, y: 0.5, color: '40,15,80', r: 300 },
  ];
  for (const n of nebulaColors) {
    const ng = ctx.createRadialGradient(C.W * n.x, C.H * n.y, 10, C.W * n.x, C.H * n.y, n.r);
    ng.addColorStop(0, `rgba(${n.color},0.06)`);
    ng.addColorStop(0.5, `rgba(${n.color},0.03)`);
    ng.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ng;
    ctx.fillRect(0, 0, C.W, C.H);
  }

  const vigGrad = ctx.createRadialGradient(C.W / 2, C.H / 2, 80, C.W / 2, C.H / 2, C.W * 0.55);
  vigGrad.addColorStop(0, 'rgba(5,5,8,0)');
  vigGrad.addColorStop(1, 'rgba(5,5,8,0.85)');
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, C.W, C.H);

  // Title with cosmic glow layers
  ctx.save();
  ctx.globalAlpha = state.neonFlicker;

  // Deep purple outer glow
  ctx.font = 'bold 64px Orbitron';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#6622aa';
  ctx.shadowBlur = 60;
  ctx.fillStyle = '#6622aa';
  ctx.fillText('COSMIC BREAK', C.W / 2, 155);

  // Bright purple mid glow
  ctx.shadowColor = '#aa44ff';
  ctx.shadowBlur = 35;
  ctx.fillStyle = '#bb66ff';
  ctx.fillText('COSMIC BREAK', C.W / 2, 155);

  // White-purple core
  ctx.shadowColor = '#ddaaff';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#eeddff';
  ctx.fillText('COSMIC BREAK', C.W / 2, 155);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Subtitle
  ctx.fillStyle = '#8899aa';
  ctx.font = '18px Rajdhani';
  ctx.textAlign = 'center';
  ctx.fillText('Alien Billiards in the Cosmos', C.W / 2, 188);

  // Decorative line with glow
  ctx.save();
  ctx.shadowColor = '#aa44ff';
  ctx.shadowBlur = 8;
  ctx.strokeStyle = 'rgba(170,68,255,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(C.W / 2 - 160, 206);
  ctx.lineTo(C.W / 2 + 160, 206);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Diamond separators
  ctx.fillStyle = 'rgba(170,68,255,0.4)';
  ctx.save();
  ctx.translate(C.W / 2, 206);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-3, -3, 6, 6);
  ctx.restore();

  const col1x = C.W / 2 - 170;
  const col2x = C.W / 2 + 170;

  ctx.font = 'bold 14px Rajdhani';
  ctx.fillStyle = '#00e5ff';
  ctx.textAlign = 'center';
  ctx.fillText('THE COSMOS', col1x, 255);
  ctx.fillStyle = '#99aabb';
  ctx.font = '13px Rajdhani';
  const rules1 = [
    'The cosmos is shrouded in darkness',
    'Only the Sun (cue ball) emits light',
    'Fire energy rays to launch the Sun',
    '+1 point per planet into a black hole',
  ];
  rules1.forEach((r, i) => ctx.fillText(r, col1x, 277 + i * 20));

  ctx.font = 'bold 14px Rajdhani';
  ctx.fillStyle = '#ffd700';
  ctx.fillText('CONTROLS', col2x, 255);
  ctx.fillStyle = '#99aabb';
  ctx.font = '13px Rajdhani';
  const rules2 = [
    'Drag from Sun — aim & set power',
    'Energy ray fires in drag direction',
    'Capture a planet = extra turn',
    'ESC — pause | T — tutorial | 5s timer',
  ];
  rules2.forEach((r, i) => ctx.fillText(r, col2x, 277 + i * 20));

  const flash = 0.5 + 0.5 * Math.sin(t * 0.004);

  const btnW = 200;
  const btnH = 40;
  const btnGap = 16;
  const btnY1 = 395;
  const btnY2 = btnY1 + btnH + btnGap;
  const btnX = C.W / 2 - btnW / 2;

  const isHover1 =
    state.mouseX >= btnX &&
    state.mouseX <= btnX + btnW &&
    state.mouseY >= btnY1 &&
    state.mouseY <= btnY1 + btnH;
  const isHover2 =
    state.mouseX >= btnX &&
    state.mouseX <= btnX + btnW &&
    state.mouseY >= btnY2 &&
    state.mouseY <= btnY2 + btnH;

  // Button 1 — VS AI
  ctx.save();
  ctx.fillStyle = isHover1 ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.04)';
  ctx.fillRect(btnX, btnY1, btnW, btnH);
  ctx.strokeStyle = isHover1 ? '#00e5ff' : '#444';
  ctx.lineWidth = isHover1 ? 2 : 1;
  if (isHover1) {
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
  }
  ctx.strokeRect(btnX, btnY1, btnW, btnH);
  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(0,229,255,${0.7 + flash * 0.3})`;
  ctx.font = 'bold 16px Orbitron';
  ctx.textAlign = 'center';
  ctx.fillText('VS AI', C.W / 2, btnY1 + 26);
  ctx.restore();

  // Button 2 — 2 PLAYERS
  ctx.save();
  ctx.fillStyle = isHover2 ? 'rgba(255,68,102,0.15)' : 'rgba(255,255,255,0.04)';
  ctx.fillRect(btnX, btnY2, btnW, btnH);
  ctx.strokeStyle = isHover2 ? '#ff4466' : '#444';
  ctx.lineWidth = isHover2 ? 2 : 1;
  if (isHover2) {
    ctx.shadowColor = '#ff4466';
    ctx.shadowBlur = 10;
  }
  ctx.strokeRect(btnX, btnY2, btnW, btnH);
  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(255,68,102,${0.7 + flash * 0.3})`;
  ctx.font = 'bold 16px Orbitron';
  ctx.textAlign = 'center';
  ctx.fillText('2 PLAYERS', C.W / 2, btnY2 + 26);
  ctx.restore();

  ctx.fillStyle = '#556';
  ctx.font = '13px Rajdhani';
  ctx.textAlign = 'center';
  ctx.fillText('7 Orbits · Most captured planets wins', C.W / 2, btnY2 + btnH + 24);

  ctx.fillStyle = 'rgba(200,200,200,0.35)';
  ctx.font = '13px Rajdhani';
  ctx.textAlign = 'right';
  ctx.fillText('? TUTORIAL', C.W - 18, 28);

  updateNeonFlicker(t);
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

  const isLocal = state.gameMode === 'VS_LOCAL';
  const p1Label = isLocal ? 'ALIEN 1' : 'ALIEN';
  const p2Label = isLocal ? 'ALIEN 2' : 'AI';

  const diff = state.playerScore - state.aiScore;
  let winner: string;
  let winColor: string;
  if (isLocal) {
    if (diff >= 1) {
      winner = 'ALIEN 1 WINS!';
      winColor = '#00e5ff';
    } else if (diff <= -1) {
      winner = 'ALIEN 2 WINS!';
      winColor = '#ff4466';
    } else {
      winner = 'COSMIC TIE — WELL PLAYED';
      winColor = '#ffd700';
    }
  } else {
    if (diff >= 3) {
      winner = 'YOU WIN — MASTER OF THE COSMOS';
      winColor = '#00e5ff';
    } else if (diff >= 1) {
      winner = 'YOU WIN — CLOSE ORBIT';
      winColor = '#00e5ff';
    } else if (diff <= -1) {
      winner = 'AI WINS — RECALIBRATE';
      winColor = '#ff4466';
    } else {
      winner = 'COSMIC TIE — WELL PLAYED';
      winColor = '#ffd700';
    }
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
  ctx.fillText(p1Label, C.W / 2 - 120, 280);
  ctx.fillStyle = '#cc8899';
  ctx.fillText(p2Label, C.W / 2 + 120, 280);

  ctx.fillStyle = '#88bbcc';
  ctx.font = '15px Rajdhani';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${p1Label} — Captured: ${state.endStats.player.lit}  Scratches: ${state.endStats.player.scratches}`,
    C.W / 2,
    320,
  );
  ctx.fillStyle = '#cc8899';
  ctx.fillText(
    `${p2Label} — Captured: ${state.endStats.ai.lit}  Scratches: ${state.endStats.ai.scratches}`,
    C.W / 2,
    345,
  );

  const remainingBalls = state.balls.filter((b) => b.id > 0 && b.alive).length;
  if (remainingBalls === 0 && state.currentRound <= state.maxRounds) {
    ctx.fillStyle = '#ffd700';
    ctx.font = '13px Rajdhani';
    ctx.fillText(
      `All planets captured — early finish in orbit ${state.currentRound}`,
      C.W / 2,
      368,
    );
  }

  const flash = 0.5 + 0.5 * Math.sin(t * 0.004);
  ctx.fillStyle = `rgba(255,255,255,${flash})`;
  ctx.font = 'bold 20px Orbitron';
  ctx.fillText('PRESS SPACE FOR MENU', C.W / 2, 400);
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
  const totalSteps = C.TUTORIAL_STEPS;

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
    'Drag from the Sun to aim the energy ray.',
    'The cosmos is shrouded in total darkness.',
    'The Sun illuminates nearby space as it moves.',
    'Send a planet into a black hole for an extra turn!',
    'Scratch = lose points and your turn.',
  ];

  ctx.fillText(captions[step] ?? '', cx, cy + 140);

  if (step === 0) {
    const ax = cx - 60;
    const ay = cy;
    // Draw sun
    const sg = ctx.createRadialGradient(ax, ay, 2, ax, ay, C.BALL_R);
    sg.addColorStop(0, '#fff8e0');
    sg.addColorStop(0.5, '#ffdd44');
    sg.addColorStop(1, '#ff6600');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(ax, ay, C.BALL_R, 0, Math.PI * 2);
    ctx.fill();
    // Energy ray aim
    ctx.strokeStyle = 'rgba(80,160,255,0.7)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur = 8;
    const aimLen = 80 + Math.sin(state.tutorialAnim * 2) * 20;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + aimLen, ay - 20);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
    const pw = 0.5 + 0.5 * Math.sin(state.tutorialAnim * 1.5);
    ctx.fillStyle = 'rgba(80,140,255,0.5)';
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
    // Sun
    const sg = ctx.createRadialGradient(bx, cy, 2, bx, cy, C.BALL_R);
    sg.addColorStop(0, '#fff8e0');
    sg.addColorStop(0.5, '#ffdd44');
    sg.addColorStop(1, '#ff6600');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(bx, cy, C.BALL_R, 0, Math.PI * 2);
    ctx.fill();
    const glowR = 48;
    const glow = ctx.createRadialGradient(bx, cy, 0, bx, cy, glowR);
    glow.addColorStop(0, 'rgba(255,200,50,0.2)');
    glow.addColorStop(1, 'rgba(255,200,50,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(bx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();
  } else if (step === 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(cx - 90, cy - 45, 180, 70);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 22px Orbitron';
    ctx.fillText('EXTRA TURN!', cx, cy - 10);
    ctx.fillStyle = '#aaa';
    ctx.font = '14px Rajdhani';
    ctx.fillText('Capture a planet → shoot again', cx, cy + 14);
  } else if (step === 4) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(cx - 80, cy - 40, 160, 60);
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 22px Orbitron';
    ctx.fillText('SCRATCH', cx, cy - 8);
    ctx.fillStyle = '#aaa';
    ctx.font = '14px Rajdhani';
    ctx.fillText('-1 point & lose your turn', cx, cy + 16);
  }

  const dotY = cy + 166;
  const dotSpacing = 20;
  const totalDotsW = (totalSteps - 1) * dotSpacing;
  const dotStartX = cx - totalDotsW / 2;
  for (let i = 0; i < totalSteps; i++) {
    const dx = dotStartX + i * dotSpacing;
    const isActive = i === step;
    ctx.fillStyle = isActive ? '#00e5ff' : '#444';
    ctx.beginPath();
    ctx.arc(dx, dotY, isActive ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#555';
  ctx.font = '14px Rajdhani';
  ctx.fillText(`${step + 1} / ${totalSteps}`, cx, cy + 186);

  const flash = 0.5 + 0.5 * Math.sin(t * 0.005);
  ctx.fillStyle = `rgba(255,255,255,${flash})`;
  ctx.font = '14px Orbitron';
  ctx.fillText('Click or SPACE to continue', cx, cy + 208);
}
