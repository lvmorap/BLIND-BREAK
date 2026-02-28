# BLIND-BREAK

You are a senior JavaScript game developer and visual designer building a complete,
polished game for an Electronic Arts Game Jam. The theme is "Reinventing Competition".

You will build a game called BLIND BREAK — a reimagining of billiards where
information is the primary resource and every shot reshapes what both players can see.

Before writing any code, read this entire prompt. Then build phase by phase.
Confirm each phase's checklist before advancing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — TECHNICAL CONSTRAINTS (ABSOLUTE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OUTPUT: One single file — index.html
Everything must be inline: HTML structure + <style> CSS + <script> JavaScript.

ALLOWED external resources (CDN only, no download):
  - Google Fonts via <link> in <head>:
    Use: "Orbitron" (geometric, futuristic) for HUD numbers and title
    Use: "Rajdhani" (clean, technical) for body text and tutorial
    Import: https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap

NO: No libraries. No Canvas libraries. No physics engines. No lodash. Nothing else.
Canvas rendering: HTML5 Canvas 2D API exclusively.
No images loaded from disk or external URLs — all visuals drawn programmatically.
No server. No backend. Runs by opening index.html directly in a browser.
Target: Chrome, Firefox, Edge, Safari (modern versions).
Canvas size: 960x600px, centered on screen with dark room background.
FPS: Stable 60fps using requestAnimationFrame with deltaTime-based updates.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — GAME CONCEPT: BLIND BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ELEVATOR PITCH:
Billiards in the dark. Your shot is your only light source.
The ball rolls — and everything it passes over gets revealed.
But what you reveal, your opponent now sees too.
Shooting blind scores triple. Information is dangerous.

THE AXIOM THIS BREAKS:
In real billiards, both players always see the entire table.
Perfect information is assumed. Strategy is purely geometric.
BLIND BREAK removes perfect information as a given.
Seeing the table is a choice — and every choice has a cost.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — THE SCENE (Visual World)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This game takes place in an underground, noir pool hall. The atmosphere is key.

ROOM (behind the canvas game area):
  - Page background: #050508 (near-black)
  - Faint brick wall texture on the sides: draw thin horizontal/vertical lines
    at irregular intervals with 4% opacity in #334455
  - Two glowing sconce lights on left and right walls:
    Draw as vertical rectangles with radial gradient glow (warm amber #ffaa44)

THE TABLE (the main play area):
  Canvas dimensions: 960 wide × 600 tall
  Table felt area: 820 × 460px, centered in the canvas
  Felt color: #1a3020 (deep forest green) — draw with subtle noise grain
  To simulate grain: draw 2000 tiny dots (radius 0.5, opacity 0.03-0.08) randomly on felt
  Rails (border): 52px thick on all sides
  Rail color: gradient from #3d1f0a (dark mahogany) to #5c2e0e, with a thin
    brass highlight line (#c8a040, 2px) on the inner edge of each rail
  Pocket geometry: 6 circular pockets (4 corners + 2 side centers)
    Corner pockets: radius 22px, positioned at exact corners of the felt
    Side pockets: radius 19px, centered on long rails at 50% width
    Pocket visual: dark void (#000005) with a subtle inner glow ring (#222233, 3px)
    Pocket leather cushion rim: draw arc with gradient #2a1208 around each pocket opening

OVERHEAD LIGHTING (always visible, part of scene):
  Two rectangular pendant light fixtures centered above the table, drawn at top of canvas.
  Each lamp: small rectangle #c8a040 (brass), with a downward radial gradient light cone
  extending to the table. These cones create 2 permanently lit "anchor zones" 
  (oval light pools ~200px wide) near the center-left and center-right of the table.
  These always-visible zones help orient the player. Everything else is darkness.

NEON SIGN (above the table, at top of canvas):
  Draw "BLIND BREAK" letter by letter using canvas arc/line paths.
  Style: neon tube aesthetic — draw each letter twice:
    1. Outer glow: large shadowBlur (40px), color #ff3366 (hot pink-red neon)
    2. Inner bright line: strokeStyle #ff6688, lineWidth 2
  The sign should flicker: apply a sine-wave opacity oscillation (0.85 to 1.0, 
  period 3.7 seconds) with an occasional random full flicker (drop to 0.3 for 80ms).

COLOR PALETTE:
  Background void: #050508
  Table felt: #1a3020
  Rails: #3d1f0a → #5c2e0e
  Brass accent: #c8a040
  Pocket void: #000005
  Neon sign: #ff3366 / #ff6688
  Cue ball: #f5f0e8 (cream white)
  Object balls: see Section 5
  Ghost ball outlines: rgba(255,255,255,0.12)
  Illuminated zone: rgba(255,240,180,0.15) — warm golden light
  Darkness overlay: rgba(4,4,8,0.92) — near-black fog
  Aiming line: #00e5ff (electric cyan)
  HUD text: #e0d5c0 (warm off-white)
  Player score color: #00e5ff
  AI score color: #ff4466

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — THE VISIBILITY SYSTEM (Core Mechanic)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is the heart of the game. Implement it carefully.

CONCEPT:
The table is covered in darkness (a dark overlay drawn over the felt).
The only way to see through the darkness is via ILLUMINATION — areas that were
recently passed over by a rolling ball. Illumination fades after 2 full rounds.

ILLUMINATION ZONES:
Each rolling ball leaves behind an illuminated trail as it moves.
Trail implementation: As a ball moves, every frame store its position in a 
"lightMap" array as: { x, y, radius: 36, createdAtRound: currentRound, intensity: 1.0 }
When rendering, draw circles on a separate offscreen canvas that acts as the 
"light mask". The darkness overlay is drawn with composite operation 'destination-out'
to punch holes in the darkness wherever illuminated zones exist.

Illumination radius per ball type:
  - Cue ball: 48px radius trail (brighter, it's your primary tool)
  - Object balls: 28px radius trail (dimmer, secondary light)

FADING RULES (turn-based, not time-based):
  - Zones created in the CURRENT active round: full intensity (opacity 0.92)
  - Zones from 1 round ago: half intensity (opacity 0.50)
  - Zones from 2 rounds ago: ghost intensity (opacity 0.20)
  - Zones older than 2 rounds: removed from lightMap entirely (darkness returns)
  
  "Round" = one complete cycle where both player AND AI have taken a turn.

GHOST BALL POSITIONS:
When an object ball goes dark (its illumination expires), do NOT remove it visually.
Instead, draw it as a GHOST: a faint circle outline at its LAST KNOWN POSITION
(the position it was in when it was last illuminated).
Ghost visual: ctx.strokeStyle = 'rgba(255,255,255,0.10)', lineWidth 1.5
The ghost does NOT update as the ball physically moves in darkness.
If the player shoots toward a ghost position but the ball moved since,
they miss — this is intentional and correct. This IS the mechanic.

PERMANENT LIGHT ZONES:
The 2 overhead lamp cones are always lit (never covered by darkness overlay).
Each lamp cone: 200px wide × 120px tall oval at center-left and center-right.
These help players stay oriented and give them a reference frame.
The 6 pocket areas also have a subtle permanent dim glow (they must always be 
findable even in darkness, otherwise the game is unplayably frustrating).

DARKNESS RENDERING TECHNIQUE:
Use a two-canvas approach:
  1. gameCanvas: draw the full scene (table, rails, balls, UI)
  2. lightCanvas (offscreen, same size): filled with darkness color #050508 at opacity 0.92
     Then for each light zone, draw a radial gradient circle using 
     'destination-out' composite operation to cut holes in the darkness
  3. Draw lightCanvas ON TOP of gameCanvas each frame

This creates the effect of true darkness with holes of light punched through it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5 — THE BALLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use a simplified ball set (not full 15-ball rack — optimized for game jam scope):
  - 1 Cue Ball (white/cream)
  - 7 Object Balls

Ball radius: 11px for all balls.

OBJECT BALL COLORS (neon geometric aesthetic — NOT photorealistic):
  Ball 1: #ff2244 (neon red)
  Ball 2: #ff8800 (neon orange)  
  Ball 3: #ffdd00 (neon yellow)
  Ball 4: #00cc55 (neon green)
  Ball 5: #0088ff (neon blue)
  Ball 6: #aa00ff (neon purple)
  Ball 7: #ff44aa (neon pink)

BALL VISUAL DESIGN:
Each object ball is a circle with:
  - Fill: the ball's color at full opacity
  - Inner highlight: small white ellipse offset top-left (rx:4, ry:3) at 55% opacity
  - Number: ball number drawn at center in white, 9px Orbitron font, bold
  - Outer glow when lit: shadowBlur 14, shadowColor = ball's color
  - When in darkness: NOT drawn (only ghost outline if recently seen)
  - When ghost: draw circle outline only, no fill, no glow, 12% opacity

CUE BALL VISUAL:
  - Fill: #f5f0e8 (cream)
  - Subtle inner gradient: lighter at top-left (#ffffff), darker at bottom-right (#d4cfc4)
  - Small grey targeting dot at center (2px radius, #888877)
  - When rolling: leave bright trail (see Section 4)
  - Outer glow always: shadowBlur 18, shadowColor #ffffff at 60% opacity
  - The cue ball is ALWAYS visible (it's the player's active piece — it's never hidden by darkness)

BALL PHYSICS:
Implement simple 2D billiards physics — this is critical for the game to feel right.
  - Velocity: each ball has { vx, vy } velocity vector
  - Friction: apply multiplier 0.985 per frame to velocity (realistic deceleration)
  - Minimum velocity threshold: 0.15px/frame — below this, set velocity to 0 (ball stops)
  - Wall collisions: reflect velocity when ball edge reaches table cushion boundary
    (add slight energy loss on cushion bounce: multiply reflected component by 0.78)
  - Ball-to-ball collisions: detect when distance between centers < sum of radii (22px)
    Resolve with elastic collision formula preserving momentum
    Apply slight energy transfer loss (multiply resulting velocities by 0.92)
  - Pocket detection: if ball center is within 18px of any pocket center, 
    the ball is "pocketed" — remove it from play with a sink animation

POCKET ANIMATION:
When a ball is pocketed:
  - Scale the ball down from 1.0 to 0.0 over 300ms (ease-in)
  - Emit 8 small particles in the ball's color spreading outward
  - Show floating score text (see Section 6 for scoring)
  - Remove from balls array after animation completes

BALL RACK POSITION (game start):
Place the 7 object balls in a triangle rack formation in the center-right area.
Triangle tip pointing toward player's end.
Use precise hex packing math: each ball 2px apart from neighbors.
Cue ball: placed on the "baulk" position (left quarter of table, horizontal center).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6 — SCORING SYSTEM (The Reinvention)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This scoring system IS the theme "Reinventing Competition".
In normal billiards: more precision = more points.
In BLIND BREAK: more darkness = more points. Risk is the currency.

SCORING TIERS — evaluated at the moment of pocketing:

  BLIND POCKET (ball was in complete darkness, no illumination at that position):
    → 3 POINTS. Display: "+3 BLIND!" in bright gold (#ffd700), large font.
    Special effect: golden particle burst at pocket location.

  SHADOW POCKET (ball was in ghost zone — expired illumination, last known position only):
    → 2 POINTS. Display: "+2 SHADOW" in silver-white (#dddddd).
    Effect: small silver particles.

  LIT POCKET (ball was in active illumination when pocketed):
    → 1 POINT. Display: "+1" in the ball's color.
    Effect: subtle small glow pulse.

  RECON POCKET (ball pocketed during a Recon Shot — see Section 7):
    → 0 POINTS. No score popup. The trade was information, not points.

  SCRATCH (cue ball pocketed):
    → -1 POINT. Display: "-1 SCRATCH" in red (#ff3333), flashing.
    → Cue ball respawns at baulk position.
    → Opponent gets a free shot bonus (their next shot, maximum cue ball power unlocked).

SCORE POPUP ANIMATION:
  Float upward from pocket location, fade out over 1.8 seconds.
  Font: Orbitron Bold, size based on tier (BLIND = 32px, SHADOW = 26px, LIT = 20px).
  Use requestAnimationFrame for smooth animation.

HUD SCORE DISPLAY:
  Left side: Player score — large Orbitron font (48px), color #00e5ff, subtle glow.
  Right side: AI score — large Orbitron font (48px), color #ff4466, subtle glow.
  Center: Round counter "ROUND X / 7" in Rajdhani 18px.
  Below each score: small text showing "X BLIND | X SHADOW | X LIT" stat breakdown.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7 — TURN SYSTEM & SHOT MECHANICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TURN FLOW:
  1. AIMING PHASE (player's turn active):
     - Show aiming interface (see below)
     - Player drags to aim, sees preview of shot
     - Player can switch to RECON mode (see below)
     - Player clicks/releases to shoot

  2. ROLLING PHASE (balls in motion):
     - Balls move according to physics
     - Light map updates in real time as balls roll
     - Pocket detections happen
     - NO player input accepted during this phase
     - Phase ends when ALL balls have velocity < 0.15 (fully stopped)

  3. TURN RESOLUTION:
     - Score pocketed balls
     - Update round counter if both players have gone
     - Fade old illumination zones per Section 4 rules
     - Check win condition
     - Hand turn to opponent

  4. AI TURN (see Section 8 for AI behavior)

AIMING INTERFACE:
  Implement mouse-based aiming with these visual elements:

  a) AIM LINE: 
     A dashed line from cue ball extending in the aimed direction.
     Length proportional to power level (max 280px at full power).
     Color: #00e5ff with 70% opacity. Dash pattern: 8px on, 5px off.
     The line animates: dashes flow outward along the direction (moving dash offset).

  b) REFLECTION PREVIEW:
     If the aim line would hit a cushion, show where it would reflect.
     Draw the reflected line segment as a dimmer version of the aim line (35% opacity).
     Only show 1 bounce preview max (2 segments total).

  c) BALL HIT PREDICTION:
     If the aim line would hit an ILLUMINATED object ball, draw a small circle
     at the predicted impact point and a short arrow showing where that ball
     would travel. This prediction only shows for lit balls — not for dark ones.
     (You cannot predict dark ball trajectories. That's the game.)

  d) POWER METER:
     A vertical bar on the left edge of the canvas (30px wide, 200px tall).
     Player HOLDS the mouse button to charge power. Bar fills from bottom 
     upward, color transitions green (#00ff88) → yellow (#ffdd00) → red (#ff4400).
     Releasing fires at current power level.
     Power range: 3 to 22 (velocity units on cue ball).

  e) RECON SHOT MODE:
     In the top-left of the canvas, a small button labeled "RECON" (Rajdhani font).
     Each player gets exactly 1 RECON shot per game.
     When active, clicking RECON toggles recon mode.
     In recon mode: the aim line shows 3 fork beams (main direction ± 25°)
     spreading across the table to scout dark areas. 
     No ball is actually struck — the "shot" just illuminates.
     The RECON button shows "USED" (grayed out) after use.
     Tooltip on hover: "Sacrifice your turn to reveal the table. Used once."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 8 — AI OPPONENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The AI plays as the second player. It has a 1.2 second "thinking" delay before 
shooting (to feel human and allow the player to see what the AI is considering).
During this delay, show a subtle pulsing indicator: "AI THINKING..." near the AI score.

AI VISION RULES:
  The AI uses the SAME visibility system as the player. It can only "see" 
  (and therefore aim at) balls that are currently illuminated OR in ghost zones.
  It does NOT have perfect information. This is critical — it must not cheat.

AI STATE MACHINE — 4 behaviors:

  STATE 1 — HUNT LIT BALL:
    If any object ball is in an illuminated zone: aim at it, moderate power.
    The AI prefers balls near pockets. Uses basic geometric calculation:
    find the cue-ball to object-ball to pocket angle. Aim along that line.
    Activate when: lit balls exist. Priority: high.

  STATE 2 — HUNT GHOST BALL:
    If no lit balls but ghost balls exist: aim toward the ghost position.
    Since ghosts are inaccurate, add ±12° random variance to the angle.
    This simulates the AI "guessing" based on memory.
    Activate when: no lit balls but ghosts exist.

  STATE 3 — RECON SCOUT:
    AI uses its RECON shot in round 3 or 4 (randomly decided at game start).
    The AI always uses RECON at the start of the chosen round regardless of board state.
    Activate when: it's the AI's designated recon round AND recon not yet used.

  STATE 4 — RANDOM PROBE:
    If completely blind (no lit, no ghosts): aim toward the center of the rack 
    starting position with ±30° random variance at medium power.
    This is the least efficient state — it illuminates the table at cost of accuracy.
    Activate when: no other state applies.

AI DIFFICULTY NOTES:
  The AI is purposely not perfect. The ±12° variance in ghost hunting and the 
  rigid recon timing make it beatable. A skilled player who manages information 
  carefully can consistently outperform the AI. This is the correct design.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 9 — WIN CONDITION & MATCH FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Match length: 7 rounds (both players shoot each round = 14 total turns).
Win condition: Highest score after all 7 balls are pocketed OR all 7 rounds complete.
Tie condition: Equal scores = "DEAD EVEN" special ending.

GAME PHASES (state machine):
  'PRELOAD'  → loading fonts, setting up canvases
  'TUTORIAL' → interactive tutorial (first time only, or if T pressed)
  'MENU'     → animated start screen
  'COUNTDOWN'→ "3... 2... 1... BREAK!" animation
  'PLAYING'  → main game loop, alternates player/AI turns
  'ENDSCREEN'→ results display
  Phase transitions: fade in/out (300ms black fade between screens)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 10 — INTERACTIVE TUTORIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Show this tutorial the FIRST TIME the game loads (store flag in a JS variable,
reset on page refresh). The tutorial is interactive — not a text wall. 
It uses ANIMATED OVERLAYS that demonstrate each mechanic live on the actual table.

Tutorial is a series of 5 steps. Each step:
  - Dims everything except the focus area (draw semi-transparent dark overlay with a hole)
  - Shows an animated demonstration
  - Shows a short text prompt (max 12 words) in Rajdhani 20px
  - "Click or press SPACE to continue" blinking at bottom

STEP 1 — THE SHOT:
  Focus: cue ball area
  Show an animated hand cursor approaching the cue ball, dragging to aim,
  and an energy bar filling up. Text: "Drag to aim. Hold to charge power."
  Demonstration: the aim line draws itself automatically in the demo.

STEP 2 — THE DARKNESS:
  Focus: the whole table
  Start fully lit. Then watch the darkness overlay slowly close in over 2 seconds,
  consuming the table until only the lamp cone zones remain visible.
  Text: "The table is dark. You can't see what you can't reach."

STEP 3 — YOUR SHOT IS YOUR LIGHT:
  Focus: cue ball path
  Show a pre-scripted shot where the cue ball travels across the table,
  illuminating a trail in real time. Object balls appear as it passes them.
  Text: "Rolling reveals. Everything you light, they see too."

STEP 4 — GHOST MEMORY:
  Focus: one specific object ball (ball #3, yellow)
  Show it visible. Then show the darkness closing over it.
  A ghost outline remains. The ghost slowly drifts slightly off from true position.
  Text: "Ghosts fade. They remember where it was — not where it went."

STEP 5 — SCORING (the reveal):
  Show three scenarios side by side (left/center/right of canvas):
  Left: a ball pocketed in full light → "+1 LIT" popup in muted tone
  Center: a ball pocketed from ghost memory → "+2 SHADOW" popup brighter
  Right: a ball pocketed in pure darkness → "+3 BLIND!" popup in gold explosion
  Text: "Shooting blind scores more. Darkness is your ally."

After step 5: show "LET'S PLAY" in large Orbitron font.
Press SPACE or click to proceed to menu.

TUTORIAL REPLAY:
  On the pause menu (ESC during game), add option "Replay Tutorial".
  Also shown as subtle "? TUTORIAL" text in the top-right corner during menu screen.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 11 — SCREENS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

START SCREEN:
  - Background: the game table is live and visible (no balls, just the beautiful 
    empty table with darkness overlay and the permanent lamp cones glowing)
  - Neon sign "BLIND BREAK" in full flicker animation
  - Subtitle (Rajdhani, 18px, #c8c0b0): "Billiards in the Dark"
  - Two vertical columns listing the core rules (4 lines each, Rajdhani 15px):
    LEFT COLUMN — "THE RULES":
      • Your shot is your only light
      • What you reveal, they see too
      • Ghosts show where balls were — not where they are
      • Pocket in darkness. Score triple.
    RIGHT COLUMN — "CONTROLS":  
      • Mouse drag — aim direction
      • Hold button — charge power
      • Release — shoot
      • ESC — pause | T — tutorial
  - PRESS SPACE TO BEGIN (Orbitron 22px, #00e5ff, pulsing opacity 0.6→1.0 at 1.2s)
  - Small text bottom: "vs AI · 7 Rounds · First to most points wins" (Rajdhani 13px, 40% opacity)

COUNTDOWN SCREEN:
  Display 3 → 2 → 1 → BREAK! each for 700ms.
  Each number: large Orbitron 120px, centered.
  Animation: scale from 1.4 to 0.9 with simultaneous glow burst.
  "BREAK!": color #ffd700, with a particle explosion and a billiard-crack sound effect.

END SCREEN:
  - Show the full table (lit entirely for the first time in the game — 
    revealing all remaining ball positions as a dramatic reveal)
  - Final score: Player vs AI, large centered
  - Winner text variants:
    * If player wins by 3+: "YOU WIN — MASTER OF SHADOWS"
    * If player wins by 1-2: "YOU WIN — CLOSE GAME"
    * If AI wins: "AI WINS — PRACTICE MORE"
    * If tie: "DEAD EVEN — WELL PLAYED"
  - Stats panel: 
    "Your Blind Shots: X" | "Your Shadow Shots: X" | "Your Lit Shots: X"
    "AI Blind Shots: X"   | "AI Shadow Shots: X"   | "AI Lit Shots: X"
  - PRESS SPACE TO PLAY AGAIN (bottom, pulsing)
  - Particle ambient: floating billiard ball numbers drifting upward slowly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 12 — SOUND (Web Audio API)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All sounds generated with Web Audio API. Zero external files.
Wrap ALL audio code in try/catch — sound is enhancement, not requirement.
Create an AudioContext only after first user interaction (browser policy).

SOUNDS TO IMPLEMENT:

  CUE_STRIKE: 
    Short noise burst (white noise, 40ms), filtered with highpass at 800Hz.
    Quick attack (1ms), quick release (40ms). Volume: 0.4.
    Plays: when cue ball is launched.

  BALL_COLLISION:
    Sine wave click. Frequency: 900-1200Hz (randomize per collision).
    Duration: 60ms. Volume: 0.25.
    Plays: on each ball-to-ball collision. Throttle: max 3 per frame.

  CUSHION_BOUNCE:
    Lower sine wave click. Frequency: 200-300Hz.
    Duration: 80ms. Volume: 0.2.
    Plays: when any ball hits a cushion.

  POCKET_SINK:
    Descending tone sweep: 400Hz → 100Hz over 300ms. Volume: 0.35.
    Plays: when any ball is pocketed.

  BLIND_BONUS:
    Ascending 3-note chord: 440Hz + 554Hz + 659Hz, all simultaneously.
    Each sine, duration 500ms with exponential release. Volume: 0.3.
    Plays: when a BLIND POCKET is scored.

  AMBIENT_HUM:
    Very low frequency (40Hz) sine wave at 0.03 volume, looping.
    Simulates the hum of the underground room. Start on game begin.
    Add slight tremolo (±5Hz LFO at 0.3Hz rate).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 13 — PARTICLE SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Implement a general-purpose particle system used throughout the game.

PARTICLE CLASS properties:
  x, y — position
  vx, vy — velocity
  life — remaining lifetime (0.0 to 1.0, decrements each frame)
  decay — rate of life decrease per frame
  color — hex color string
  size — initial radius
  shape — 'circle' | 'diamond' | 'spark'
  gravity — optional downward pull (default 0)

PARTICLE EMITTERS:

  POCKET_BURST(color, x, y):
    Emit 12 particles: diamonds + circles mixed.
    Velocity: spread in all directions, speed 2-5.
    Color: ball's color with brighter variation.
    Life: 0.8-1.4 seconds. Gravity: 0.08.
    
  BLIND_BONUS_BURST(x, y):
    Emit 20 particles: sparks only.
    Velocity: radial spread, speed 4-8.
    Color: #ffd700 → #ffffff.
    Life: 1.0-2.0 seconds. Gravity: 0.04.
    Size: larger than normal (4-8px).

  BALL_TRAIL(ball):
    Continuous emission while ball rolls faster than 1.5px/frame.
    1-2 particles per frame. Tiny circle, 1.5px size.
    Color: ball's color at 60% opacity.
    Life: 0.3 seconds. Velocity: slight spread from ball direction.

  AMBIENT_DUST:
    Always-running system: 5 dust particles floating upward slowly.
    Spawn at random table positions every 2 seconds.
    Color: #666655. Size: 1px. Life: 4-6 seconds.
    Velocity: very slow upward drift (vy = -0.15 to -0.35) with horizontal wobble.
    This creates the underground atmosphere.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 14 — CODE ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Organize the JavaScript inside <script> tags with these clearly labeled sections.
Use JSDoc comments for all functions. Use const/let, never var.
Wrap everything in an IIFE to avoid global scope pollution.

// ============================================================
// BLIND BREAK — EA Game Jam 2025
// "Reinventing Competition: Information as the Sport"
// ============================================================

// === [1] CONSTANTS & CONFIG ===
// All magic numbers here. Colors, sizes, speeds, timing.
// Never hard-code numbers directly in draw/update functions.

// === [2] CANVAS SETUP ===
// Main canvas + offscreen lightCanvas setup
// Resize handler (recalculate table bounds on window resize)

// === [3] ASSET LOADER ===
// Load Google Fonts via FontFace API (programmatic font loading check)
// Confirm fonts loaded before first render

// === [4] BALL PHYSICS ENGINE ===
// Ball class: { x, y, vx, vy, color, number, radius, state }
// Ball.update(dt) — apply velocity, friction, bounce walls
// checkBallCollisions(balls[]) — O(n²) collision detection and resolution  
// checkPocketCollisions(ball, pockets[]) — sink detection

// === [5] LIGHT MAP SYSTEM ===
// LightZone: { x, y, radius, createdRound, intensity }
// LightMap class: manages array of zones, handles fading per round
// renderDarkness(ctx, lightCanvas) — two-canvas compositing

// === [6] GHOST BALL TRACKER ===
// GhostBall: { x, y, color, number, lastSeenRound }
// Update ghosts when balls enter/exit illuminated zones

// === [7] PARTICLE SYSTEM ===
// Particle class + emitter functions (Section 13)

// === [8] AI BRAIN ===
// AIState enum: HUNT_LIT | HUNT_GHOST | RECON | PROBE
// evaluateAIState() → returns { angle, power, useRecon }
// findBestShot(litBalls) → geometric angle calculation

// === [9] AIMING SYSTEM ===
// Mouse event handlers: mousedown, mousemove, mouseup
// calculateAimLine(cue, angle, power) → line endpoint
// calculateReflection(line, walls) → bounce point
// calculateBallPrediction(aimLine, balls) → impact preview
// renderAimInterface(ctx) → draws all aiming visual elements

// === [10] GAME STATE ===
// gameState object: {
//   phase, round, currentTurn, playerScore, aiScore,
//   balls[], pockets[], lightMap, ghosts[], particles[],
//   floatingTexts[], aimAngle, aimPower, isAiming,
//   playerReconUsed, aiReconUsed, stats{}
// }

// === [11] RENDERER ===
// drawRoom(ctx) — bricks, wall sconces, ambient
// drawTable(ctx) — felt, rails, pockets
// drawBalls(ctx) — all balls + ghosts
// drawGhosts(ctx) — ghost overlays
// drawParticles(ctx) — particle system
// drawFloatingTexts(ctx) — score popups
// drawHUD(ctx) — scores, round counter, recon button
// drawNeonSign(ctx, time) — flickering sign
// compositeLight(ctx) — apply darkness overlay
// render() — orchestrates all draw calls in correct order

// === [12] GAME LOOP ===
// update(timestamp) → calculate deltaTime, update all systems
// gameLoop(timestamp) → update + render + requestAnimationFrame

// === [13] SCREEN MANAGERS ===
// drawTutorial(ctx, step) — step-by-step tutorial renderer
// drawStartScreen(ctx) — animated menu
// drawCountdown(ctx) — 3-2-1-BREAK
// drawEndScreen(ctx) — results and stats

// === [14] SOUND ENGINE ===
// AudioContext setup (lazy init on first interaction)
// playSound(type) → dispatches to correct synth function
// Individual synth functions for each sound type

// === [15] INIT & ENTRY POINT ===
// initGame() — reset all state for new game
// window.onload → check tutorial flag → start first screen

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 15 — ACCEPTANCE CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The game is complete only when ALL of these are true:

VISUAL QUALITY:
✅ The underground pool hall scene is atmospheric and recognizable
✅ The neon "BLIND BREAK" sign flickers realistically
✅ The table has visible felt grain, mahogany rails, and brass accents
✅ Overhead lamp cones create always-lit zones on the table
✅ Darkness overlay covers the table convincingly (lightmap compositing works)
✅ Object balls are colorful, glowing, and clearly numbered
✅ The cue ball always visible with cream color and glow
✅ Ghost balls appear as faint outlines when their illumination expires
✅ All particles (pocket burst, ambient dust, blind bonus) are active and beautiful
✅ Orbitron font used for scores and title; Rajdhani for body text

MECHANICS:
✅ Clicking and dragging from the cue ball shows the aim line correctly
✅ The power bar fills while holding the mouse and fires on release
✅ The cue ball launches in the aimed direction with correct power
✅ Balls move with realistic friction and deceleration (not sudden stops)
✅ Ball-to-ball collisions resolve correctly with momentum transfer
✅ Cushion bounces work on all 4 sides of the table
✅ All 6 pockets detect and sink balls with animation
✅ As the cue ball rolls, it illuminates a trail that punches through darkness
✅ Object balls appear as they enter illuminated zones
✅ Illuminated zones fade turn-by-turn (not time-based)
✅ Ghost ball outlines remain at last-known positions after darkness returns

SCORING:
✅ Blind pocket = 3 points with gold burst animation
✅ Shadow pocket = 2 points with silver animation  
✅ Lit pocket = 1 point with muted animation
✅ Scratch = -1 point with red flash
✅ Score popups float up from pocket and fade correctly
✅ HUD shows correct scores for both player and AI at all times

AI:
✅ AI waits 1.2 seconds then shoots
✅ AI uses same fog of war rules (does not cheat with perfect information)
✅ AI aims at illuminated balls using correct geometric calculation
✅ AI aims at ghost positions with variance when no lit balls exist
✅ AI uses RECON shot exactly once in round 3 or 4

GAME FLOW:
✅ Tutorial shows on first load with 5 interactive steps
✅ Tutorial can be replayed from menu
✅ Start screen shows the animated empty table + all menu text
✅ Countdown shows 3-2-1-BREAK with animation
✅ Game runs for 7 rounds then shows end screen
✅ End screen reveals fully-lit table for the first time
✅ End screen shows correct winner and stats
✅ SPACE or click on end screen restarts fully

AUDIO:
✅ Cue strike sound plays on shot
✅ Ball collision sounds play (throttled, not spammy)
✅ Cushion bounce sounds play
✅ Pocket sink sound plays
✅ Blind bonus chord plays on 3-point pocket
✅ Ambient hum loops throughout the game
✅ No audio errors in console if Web Audio is blocked

TECHNICAL:
✅ Zero console errors on Chrome/Firefox
✅ Single file, opens directly in browser with no server
✅ Smooth 60fps — no stuttering during ball rolling
✅ deltaTime-based physics (not frame-count-based)
✅ Game works after pressing SPACE to restart (no stale state)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 16 — BUILD ORDER (Follow exactly)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build in this exact sequence. Do not proceed until each phase renders correctly.

PHASE 1 — SCENE FOUNDATION:
  - Create index.html skeleton with inline CSS and <script>
  - Load Google Fonts (Orbitron + Rajdhani) via <link>
  - Set up main canvas (960×600) and offscreen lightCanvas (same size)
  - Draw the room: near-black background, faint brick texture, wall sconces
  - Draw the table: felt with grain, mahogany rails, brass accent lines, 6 pockets
  - Draw neon sign "BLIND BREAK" with flicker animation
  - Draw overhead lamp cones (permanent lit zones)
  - CONFIRM: Table looks like a noir underground pool hall. Scene is atmospheric.

PHASE 2 — BALL PHYSICS:
  - Implement Ball class with position, velocity, color, radius
  - Implement friction, wall bounce, ball-ball collision
  - Place all 8 balls (cue + 7 object) in starting positions
  - Draw all balls with colors, inner highlight, number, glow
  - Implement pocket detection and sink animation
  - CONFIRM: All balls move correctly. Collisions look physically believable.
    Balls sink into pockets with animation. No balls escape the table.

PHASE 3 — DARKNESS & LIGHTMAP:
  - Implement LightMap system (Section 4)
  - Implement two-canvas darkness compositing
  - Draw darkness overlay on lightCanvas, punch holes for light zones
  - Add permanent lamp cone zones (always lit)
  - As cue ball moves, add light zones along its trail
  - Implement round-based fading of light zones
  - Implement ghost ball rendering (faint outlines of last-known positions)
  - CONFIRM: Table is dark. Rolling cue ball reveals trail. 
    Darkness returns after 2 rounds. Ghost outlines appear and fade.

PHASE 4 — AIMING SYSTEM:
  - Implement mouse drag aiming interface
  - Draw animated dashed aim line (flowing dash animation)
  - Draw reflection preview off cushions
  - Draw ball hit prediction for lit balls only
  - Implement power bar (hold to charge, release to fire)
  - CONFIRM: Aiming looks clean and responsive. 
    Power bar works. Ball launches in aimed direction at correct speed.

PHASE 5 — SCORING & HUD:
  - Implement scoring tiers (blind/shadow/lit/scratch)
  - Implement floating score text animations
  - Implement stat tracking (blind/shadow/lit count per player)
  - Draw full HUD (scores, round counter, RECON button)
  - CONFIRM: Correct points for each scenario.
    Score popups appear at pocket location and float up.
    HUD shows live scores.

PHASE 6 — AI OPPONENT:
  - Implement turn system (player → AI → player cycle)
  - Implement AI state machine (4 states from Section 8)
  - Implement AI aiming calculation (geometric billiards angle)
  - Add 1.2 second AI thinking delay with indicator
  - Implement AI RECON usage
  - CONFIRM: AI takes sensible shots. Uses same fog of war. Not cheating.
    AI is beatable but not trivially easy.

PHASE 7 — PARTICLES & SOUND:
  - Implement full particle system (Section 13)
  - Wire particles to: pocket sinks, blind bonus, ball trails, ambient dust
  - Implement Web Audio sound engine (Section 12)
  - Wire sounds to: shot, collision, bounce, pocket, blind bonus, ambient
  - CONFIRM: Particles look beautiful. Sounds add to atmosphere.
    No audio errors in console.

PHASE 8 — SCREENS & TUTORIAL:
  - Implement 5-step interactive tutorial (Section 10)
  - Implement start screen with live table preview
  - Implement 3-2-1-BREAK countdown
  - Implement end screen with dramatic full-table reveal
  - Implement game state machine (preload/tutorial/menu/countdown/playing/end)
  - Wire SPACE key and clicks for all screen transitions
  - CONFIRM: Full game loop works start to finish.
    Tutorial teaches the game. End screen reveals full table.
    SPACE restarts cleanly with no stale state.

PHASE 9 — POLISH & FINAL PASS:
  - Review every magic number — confirm all in CONSTANTS section
  - Test all 15 acceptance criteria sections above
  - Add pause menu (ESC key): Resume, Replay Tutorial, Restart
  - Ensure smooth 60fps — profile if needed, optimize particle count
  - Final visual pass: check every element uses correct font/color/size
  - Test Chrome, Firefox: confirm no console errors in either
  - CONFIRM: ALL checklist items from Section 15 are true.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 17 — FAKE 3D & DEPTH SYSTEM (Canvas 2D only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The game is 2D but must FEEL three-dimensional. Use these techniques
to create genuine depth using only the Canvas 2D API.

A) BALL 3D RENDERING — Each ball must look like a real sphere, not a circle.

  STEP 1 — Diffuse base: fill the circle with the ball's color.

  STEP 2 — Specular highlight:
    Draw a small filled ellipse at (ball.x - radius*0.3, ball.y - radius*0.35).
    Size: rx = radius*0.38, ry = radius*0.28.
    Fill: radial gradient from rgba(255,255,255,0.92) center → rgba(255,255,255,0) edge.
    This creates the illusion of a directional light source from upper-left.

  STEP 3 — Ambient occlusion rim:
    Draw an arc around the ball at 85% opacity.
    Use a radial gradient from transparent center to rgba(0,0,0,0.35) at the edge.
    This darkens the ball edges and gives it volume.

  STEP 4 — Ground shadow:
    Below each ball, draw a flattened ellipse (the cast shadow).
    Position: (ball.x + 3, ball.y + ball.radius * 0.85)
    Size: rx = ball.radius * 1.1, ry = ball.radius * 0.3
    Fill: radial gradient rgba(0,0,0,0.45) center → rgba(0,0,0,0) edge.
    This is the most important depth cue — do not skip it.
    Shadow scales with ball speed: faster ball = slightly larger, more blurred shadow.

  STEP 5 — Secondary bounce light:
    A very subtle second highlight at the bottom-right of the ball.
    Small ellipse: rgba(255,220,100,0.18) — simulates light reflected from the felt.

  RESULT: Each ball should look like a snooker ball in a photograph, not a flat circle.

B) RAIL PERSPECTIVE DEPTH:

  The table rails must appear to have physical thickness and depth.

  Top rail: draw 3 layered rectangles:
    - Back face (darkest): y offset +6px, color #1a0a04
    - Middle bevel face: y offset +3px, color #2d1208, width slightly narrower
    - Front face (lightest, main rail surface): no offset, color #3d1f0a
    - Brass highlight strip: 2px line at the inner bottom edge, #c8a040
    - A thin shadow band (4px, rgba(0,0,0,0.6)) at the very bottom edge of front face
  
  This stack of layers creates the visual impression of a 3D rail with depth.
  Apply the same logic to all 4 rails, adjusting light direction accordingly:
    Top rail: light from above (lighter top face)
    Bottom rail: light from above (darker top, lighter front)
    Side rails: light from upper-left (left rail brighter, right rail darker)

C) FELT PERSPECTIVE GRADIENT:

  The felt is not a flat uniform color — it has depth lighting.
  Apply a radial gradient over the entire felt area:
    Center: rgba(255,255,255,0.04) (slightly lighter — overhead light hitting center)
    Edge: rgba(0,0,0,0.18) (darker corners — falloff from lamp)
  Draw this gradient ON TOP of the felt base color every frame.
  This makes the table feel like it exists under real lighting.

D) DEPTH LAYERING RENDER ORDER (critical for visual coherence):

  Draw in this exact order each frame:
    1. Room background (bricks, walls, sconces)
    2. Table rails (back faces first, then front faces)  
    3. Felt base + felt grain
    4. Felt perspective gradient overlay
    5. Pocket voids
    6. Ball ground shadows (ALL balls, sorted by Y position — higher Y = drawn last)
    7. Ball bodies (sorted by Y position — higher Y = drawn last = "closer" to camera)
    8. Pocket rim leather arcs
    9. Darkness/lightmap overlay
    10. Aim interface (line, power bar)
    11. Particles
    12. Floating texts
    13. HUD
    14. Neon sign

  Sorting by Y creates a subtle parallax that suggests camera angle.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 18 — GAME JUICE SYSTEM (Professional Feel)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These are non-negotiable polish elements. Each one adds to "game feel."
Implement every item in this section. They are what separates a prototype
from a game that feels alive.

A) SCREEN SHAKE:

  Implement a ScreenShake system with these parameters:
    { intensity: 0, duration: 0, elapsed: 0, offsetX: 0, offsetY: 0 }

  Before every ctx.clearRect() call each frame, apply:
    ctx.save()
    ctx.translate(shake.offsetX, shake.offsetY)
    ... draw everything ...
    ctx.restore()

  Each frame, update shake:
    shake.elapsed += deltaTime
    const progress = shake.elapsed / shake.duration  (0 to 1)
    const decay = 1 - (progress * progress)  (ease-out squared)
    shake.offsetX = (Math.random() * 2 - 1) * shake.intensity * decay
    shake.offsetY = (Math.random() * 2 - 1) * shake.intensity * decay

  Trigger shake on these events:
    - Cue ball launched (power > 70%): intensity 4, duration 120ms
    - Ball-to-ball collision (speed > 8): intensity 3, duration 80ms
    - Pocket sink: intensity 6, duration 200ms
    - Blind pocket (3pts): intensity 10, duration 350ms — the big payoff
    - Scratch: intensity 8, duration 250ms, offsetX bias left (punishment feel)

  IMPORTANT: Never stack shakes — take the max intensity, not additive.
  Cap total shake intensity at 12px to avoid nausea.

B) SQUASH & STRETCH on balls:

  When a ball collides with another ball or a cushion, apply a brief
  squash-and-stretch deformation:

  Each ball has: { scaleX: 1.0, scaleY: 1.0, squashTimer: 0 }

  On collision impact, set:
    squashTimer = 180ms
    Initial squash: scaleX = 1.25, scaleY = 0.75 (flatten along impact axis)
    Then over 180ms, spring back to 1.0 using: easeOutElastic interpolation

  easeOutElastic formula:
    t = elapsed / duration
    scale = 1 + (-Math.pow(2, -10*t) * Math.sin((t*10 - 0.75) * (2*Math.PI/3)))

  When drawing a ball, apply ctx.scale(ball.scaleX, ball.scaleY) before drawing.
  The visual result: balls feel physically real, not like sliding circles.

C) CUE BALL POWER WINDUP:

  When the player is charging power (holding mouse button), animate the cue ball:
  - Scale the ball up slightly: lerp from 1.0 to 1.12 as power goes 0% → 100%
  - Add a pulsing electric ring around the ball:
    Draw an arc at radius = ballRadius * (1.4 + 0.1 * sin(time * 15))
    Color: rgba(0,229,255, powerFraction * 0.8)
    lineWidth: 2
  - The ring color transitions: cyan at low power → yellow → red at max power
  - At max power (100%), add 4 small electric spark lines radiating from the ball
    (short random jagged lines, length 8-14px, color #ffffff, regenerated each frame)

D) BALL TRAIL MOTION BLUR:

  While a ball is moving faster than 3px/frame, draw ghost copies behind it.
  For each ball, store last 4 positions in a ring buffer.
  Draw ghost copies at positions [-1], [-2], [-3] (behind current position):
    Opacity: 0.25, 0.12, 0.05 respectively
    Scale: 0.95, 0.90, 0.85 respectively
    No highlight, no shadow — just the colored circle
  This creates a motion blur trail that suggests real speed.

E) SLOW MOTION on BLIND POCKET:

  When a ball enters a pocket while in complete darkness (Blind Pocket):
  Trigger 0.3 seconds of slow motion:
    Set timeScale = 0.25 for 300ms, then lerp back to 1.0 over 200ms.
  Apply timeScale to all physics deltaTime updates.
  During slow motion: add a subtle vignette (dark border around canvas edges).
  The vignette is a radial gradient: transparent center → rgba(0,0,0,0.5) at canvas edges.
  This moment of slow time says "that was important" and makes blind shots feel epic.

F) CHROMATIC ABERRATION on impact:

  After a high-power collision (speed > 12 at moment of impact):
  For 3 frames, draw the entire canvas with a split RGB channel effect:
    Draw the scene to an offscreen buffer.
    Redraw with ctx.globalCompositeOperation = 'screen':
      - Red channel shifted +3px horizontally: tint with rgba(255,0,0,0.3)
      - Blue channel shifted -3px horizontally: tint with rgba(0,0,255,0.3)
  This is a subtle but incredibly professional-feeling visual hit effect.
  Keep it brief (3 frames max) — more than that becomes distracting.

G) BALL NUMBER BOUNCE on score:

  When a ball is pocketed, its number bounces out of the pocket as a large
  floating digit that scales from 0.5 → 1.8 → 1.0 over 600ms (overshoot spring).
  The digit then joins the floating score text system.
  Font: Orbitron Bold 36px, color = ball's color, drop shadow: black 4px.

H) POWER BAR JUICE:

  The power bar (left edge) must feel charged and alive:
  - The fill color pulses brightness with a sine wave (±15% brightness)
  - At 100% power, the bar overflows: add 6px of white glow outside the bar bounds
  - The number showing exact power % appears above the bar, animated:
    Scale from 0.8 to 1.0 as it updates (small bounce each change)
  - When released at >90% power: flash the entire bar white for 2 frames

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 19 — DIEGETIC IN-GAME INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The instructions must live INSIDE the game world — not as a separate screen.
They appear contextually, as interactive annotations on the table itself.

A) FIRST SHOT — CONTEXTUAL COACH:

  On round 1, before the player takes their first shot:
  Display a pulsing arrow pointing at the cue ball:
    Arrow: animated bounce (up/down sine, 8px amplitude, 1.2s period)
    Color: #00e5ff, glowing (shadowBlur 12)
    Below arrow: text bubble "DRAG FROM BALL TO AIM" (Rajdhani 16px, white)
    Text bubble: rounded rectangle background rgba(0,0,0,0.75), border #00e5ff 1px

  After player moves mouse: arrow and text fade out (opacity 0→ 1.0 over 300ms).

  Next, when mouse is pressed (charging), show a NEW annotation near the power bar:
    Animated pulsing text: "HOLD TO CHARGE → RELEASE TO SHOOT"
    Position: directly to the right of the power bar
    Appears: when mouse first pressed, fade out after 2 seconds

  These annotations never appear again after round 1.
  They feel like chalk marks on the table, not UI overlays.

B) SCORING REMINDER — FLOATING TOOLTIP:

  In round 1 only, when a ball first enters darkness (its illumination expires):
  Show a floating callout connected to the ghost ball by a thin dashed line:
    Box: small dark bubble at a 45° angle from the ghost
    Text: "SHOOT BLIND → 3 PTS ⚡" (Rajdhani Bold 14px, color #ffd700)
    The dashed line pulses opacity 0.4 → 1.0 rhythmically
    Auto-dismisses after 4 seconds or when player shoots

C) RECON BUTTON — HOVER TOOLTIP:

  When player hovers over the RECON button:
  Show an in-world tooltip that materializes over the table felt:
    Appears at (button.x, button.y + 40)
    Multi-line: 
      Line 1: "SACRIFICE THIS TURN" (Rajdhani Bold 15px, #ff4466)
      Line 2: "to illuminate dark zones" (Rajdhani 13px, #aaaaaa)
      Line 3: "One use only. Choose wisely." (Rajdhani 11px, 60% opacity)
    Background: dark panel with #ff4466 left border (3px)
    Entrance animation: slide in from above (translateY -10 → 0, 200ms ease-out)
    Exit: fade out 150ms on mouse leave

D) ROUND TRANSITION ANNOTATION:

  Between rounds (when all balls have stopped and score is evaluated):
  Show a brief in-world message in the CENTER of the table felt:
    Large Orbitron text fades in, holds 1.2s, then fades out
    Round 1→2: "DARKNESS DEEPENS" (color #6644aa)
    Round 3→4: "TRUST YOUR MEMORY" (color #4488ff)
    Round 5→6: "FINAL SHADOWS" (color #ff4444)
    Final round: "LAST SHOT" (color #ffd700, larger scale, screen shake on appear)
  These narrations make the match feel like a story arc.

E) AI THINKING VISUALIZATION (diegetic):

  When the AI is in its 1.2s thinking delay, instead of a text label,
  show a small animated "eye" icon near the AI's score display:
    A circle with a pupil that slowly scans left → right
    The pupil pauses on illuminated balls (as if the AI is "looking" at them)
    A subtle dotted arc connects the eye to the ball it's focused on
    Arc color: #ff4466 (AI color), opacity 40%, dashed
  This makes the AI feel like a genuine opponent, not a script.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 20 — ADVANCED VISUAL ASSETS (CDN ONLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All external resources loaded from CDN only. No downloads. No local files.

A) FONTS (already specified — confirm these are loaded):

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet">

  Font loading check: use document.fonts.ready.then() before first render.
  While fonts are loading: show only the canvas background color.
  After ready: begin the game loop. This prevents invisible-text flash.

B) PROCEDURAL TEXTURE ASSETS (generated in JS, no CDN needed):

  Generate these textures ONCE at game start, draw to offscreen canvases,
  then reuse them every frame (massive performance gain):

  FELT_TEXTURE offscreen canvas (820 × 460):
    Base fill: #1a3020
    Layer 1: 3000 dots, radius 0.4-0.8, opacity 0.03-0.07, colors sampled 
              from #1a3020 ± 15% lightness variation — simulates fabric weave
    Layer 2: Draw 200 short lines (length 2-4px) at random angles, opacity 0.02,
              color #2a4030 — simulates felt fiber direction
    Layer 3: Subtle vignette (radial gradient, transparent center → 12% black at edges)
    SAVE as ImageData. Redraw to main canvas with drawImage() each frame.
    This replaces per-frame grain drawing and runs ~40x faster.

  RAIL_WOOD_TEXTURE offscreen canvas (52 × 460 for side rails, 960 × 52 for top/bottom):
    Base fill: linear gradient #3d1f0a → #5c2e0e
    Wood grain: draw 15-20 slightly curved lines per rail panel
      Each grain line: opacity 0.06-0.12, color #7a3a12, 
      bezier curves with slight random control points
      Width varies: 0.5 to 2px
    Dark knot marks: 2-3 per panel, small oval, color #1a0a04, opacity 0.3
    This makes rails look genuinely like polished mahogany.

C) ICON ASSETS (drawn with Canvas 2D, stored as offscreen canvases):

  Create these icons once, cache them, reuse with drawImage():

  ICON_EYE (24×24): 
    Outer shape: almond/eye curve using bezier
    Iris: circle gradient, pupil: small dark circle
    Used for: AI thinking indicator, tutorial overlays

  ICON_SKULL (18×18):
    Simple geometric skull: circle head, two square eye sockets, 3 teeth
    Used for: scratch warning when cue ball near pocket

  ICON_LIGHTNING (16×28):
    Simple Z-shape lightning bolt, filled #ffd700
    Used for: blind bonus indicator, RECON button when charged

  ICON_CROSSHAIR (20×20):
    4 short lines extending from center with a small center circle
    Used for: aiming system center indicator

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 21 — ADVANCED ANIMATION SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build a reusable Tween/Animation system to drive all transitions.
This is essential for the polished feel of every screen transition.

A) TWEEN ENGINE:

  class Tween {
    constructor(target, prop, from, to, duration, easing, onComplete)
    update(deltaTime) — advances the tween, applies easing, calls onComplete
    static EASINGS: {
      linear, easeIn, easeOut, easeInOut, 
      easeOutBack (overshoot), easeOutBounce, easeOutElastic
    }
  }

  TweenManager: array of active tweens, updated each frame.
  Supports: chaining (.then()), delay (.after(ms)), repeat (.repeat(n)).

  USE THIS for every animated value in the game:
    - Score number popups (easeOutBack for overshoot bounce)
    - Screen transitions (easeInOut fade)
    - Ghost ball opacity fading (linear over round duration)
    - AI eye scanning (easeInOut back and forth)
    - Power bar fill (linear, driven by hold time)
    - Round transition text (easeOutBack in, linear hold, easeIn out)
    - Ball pocket scale-to-zero (easeIn — accelerates into void)
    - Countdown number scale pulse (easeOutElastic)

B) EASING REFERENCE (implement these exact functions):

  easeOutBack:   t => 1 + 2.70158*(t-1)^3 + 1.70158*(t-1)^2
  easeOutElastic: as defined in Section 18B above
  easeOutBounce: standard 4-segment bounce formula
  easeInOut:     t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t

C) PARALLAX LAYER SYSTEM:

  The game has 3 depth layers that respond to mouse movement.
  When the player moves their mouse across the canvas, apply subtle offsets:
  
  Layer 1 (deepest — background bricks): mouse offset × 0.008
  Layer 2 (mid — table and rails): mouse offset × 0.003  
  Layer 3 (surface — balls, HUD): no offset (they're on the table surface)

  Movement range: ±6px maximum on each axis.
  Use lerp to smooth the offset: currentOffset = lerp(currentOffset, targetOffset, 0.08)
  This creates a subtle parallax depth effect that makes the scene feel 3D.
  Apply using ctx.save() + ctx.translate(layerOffset.x, layerOffset.y) per layer.

D) TABLE "BREATHING" ANIMATION:

  The overhead lamp cones have a very subtle pulsing intensity:
  Sine wave: amplitude ±8% brightness, period 4.2 seconds.
  This is barely perceptible but subconsciously creates atmosphere.
  The lamp cones' radial gradient opacity oscillates with this sine.

  Additionally, the whole scene has a micro-vignette pulse:
  A border vignette (radial gradient, transparent → black at edges)
  Oscillates from opacity 0.12 to 0.18 at 6.5 second period.
  This is the "breathing" of the underground room.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 22 — MAXIMUM QUALITY ITERATION PROTOCOL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After completing all 9 build phases from the original prompt, you MUST
continue with this mandatory refinement protocol. Do NOT stop after Phase 9.
The game is not done until this entire section is completed.

This protocol has 6 refinement passes. Run each pass fully before proceeding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFINEMENT PASS 1 — THE PHYSICS AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Simulate these 8 scenarios in your head and verify correct behavior.
For each, describe what SHOULD happen, then check if the code does it.
Fix anything that doesn't match.

Test 1 — DIRECT POCKET: Aim cue ball directly at a pocket. 
  Expected: Ball accelerates slightly into pocket, plays sink animation, score popup appears.
  
Test 2 — CUSHION CHAIN: Fire cue ball at 45° toward a corner. 
  Expected: Ball bounces predictably off corner angle, energy decreases each bounce,
  ball decelerates and stops — does NOT vibrate or clip through walls.

Test 3 — MULTI-BALL COLLISION: Cue ball hits cluster of 3 balls.
  Expected: Momentum distributes visibly, balls spread in different directions,
  each has different post-collision speed, no balls overlap after resolution.

Test 4 — SLOW ROLL TO STOP: Fire at very low power (5%).
  Expected: Ball rolls slowly, decelerates smoothly, stops cleanly (no stuttering 
  or sliding past stop threshold). Minimum velocity cutoff working.

Test 5 — DARKNESS BOUNDARY: Object ball rolls from lit zone into darkness.
  Expected: Ball visually fades out at the zone boundary (not instant disappear),
  ghost outline appears at last known position. Ghost does NOT follow the ball further.

Test 6 — SCRATCH AND RESPAWN: Pocket the cue ball.
  Expected: Score shows -1, cue ball respawns at baulk position, 
  AI gets free shot indicator, game continues correctly.

Test 7 — BLIND POCKET SCORING: Pocket a ball that's in complete darkness.
  Expected: 3 points awarded, golden particle burst, screen shake intensity 10,
  slow motion triggers (0.25x for 300ms), "+3 BLIND!" text floats and fades.

Test 8 — ROUND TRANSITION LIGHTING: Play through a full round.
  Expected: After both players shoot, light zones from LAST round fade from 
  full→half opacity. Zones from 2 rounds ago fade from half→ghost. 
  Zones from 3+ rounds ago are completely removed (full darkness returns there).
  Ghost ball outlines remain at last known positions.

After running each test mentally, output:
  "🔬 PHYSICS AUDIT: [X/8 tests passing] — [list of any fixes made]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFINEMENT PASS 2 — THE VISUAL QUALITY AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Review every visual system against these standards. Fix anything below bar.

BALLS: 
  □ Do all 7 object balls have: specular highlight, ambient rim, ground shadow?
  □ Does the cue ball look distinctly different from object balls (brighter, more glow)?
  □ Do ball numbers render crisp at small sizes (11px radius)?
  □ Does squash/stretch trigger correctly on collision and look smooth?
  □ Do ghost balls look clearly "remembered" — not confused with live balls?
  
TABLE:
  □ Are the rails visually 3D (3-layer depth stack)?
  □ Is the felt texture visible but subtle (not distracting)?
  □ Do the 6 pockets look like real pocket openings (leather rim + void)?
  □ Are the overhead lamp cones visible and creating warm light zones?
  □ Does the darkness overlay properly cover everything except lit zones?

ATMOSPHERE:
  □ Is the neon sign flickering naturally (not obviously looped)?
  □ Are the ambient dust particles slow and subtle (not snowstorm)?
  □ Does the parallax layer effect trigger on mouse move (subtle, not nauseating)?
  □ Does the underground room feel noir and atmospheric, not generic?

ANIMATIONS:
  □ Do score popups use easeOutBack (bounce into view, not just appear)?
  □ Do screen transitions fade smoothly (not cut)?
  □ Does the countdown use easeOutElastic per number?
  □ Does the power bar transition colors smoothly (not jump)?

HUD:
  □ Are all fonts Orbitron (numbers/title) and Rajdhani (body/instructions)?
  □ Is the score readable from a normal viewing distance?
  □ Does the RECON button clearly show available/used states?
  □ Is the round counter unambiguous?

Output: "🎨 VISUAL AUDIT: [list all fixes made in this pass]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFINEMENT PASS 3 — THE JUICE AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Evaluate every player action and confirm it has appropriate feedback.
The rule: every action must have at least 2 of: sound, visual effect, screen feedback.

ACTION: Player charges power
  Must have: power bar fill (visual) + ball pulse glow (visual) + subtle tone pitch-rise (audio)
  Check: ✓/✗ — fix if missing

ACTION: Player fires shot
  Must have: cue strike sound + screen shake (proportional to power) + aim line disappears
  Check: ✓/✗ — fix if missing

ACTION: Ball-ball collision  
  Must have: collision sound + squash/stretch on both balls + chromatic aberration (high speed)
  Check: ✓/✗ — fix if missing

ACTION: Ball hits cushion
  Must have: bounce sound + squash/stretch along impact axis
  Check: ✓/✗ — fix if missing

ACTION: Ball enters illuminated zone  
  Must have: ball fades IN (opacity 0 → 1 over 200ms, not instant appear) + subtle chime
  Check: ✓/✗ — fix if missing

ACTION: Ball exits illuminated zone
  Must have: ball fades OUT (opacity 1 → 0 over 400ms) + ghost outline fades IN simultaneously
  Check: ✓/✗ — fix if missing

ACTION: Pocket sink (lit ball)
  Must have: sink animation (scale to 0) + pocket sound + particle burst + score popup
  Check: ✓/✗ — fix if missing

ACTION: Pocket sink (BLIND — the hero moment)
  Must have: ALL of above + screen shake 10 + slow motion + golden particles + chord sound
  Check: ✓/✗ — fix if missing

ACTION: Scratch
  Must have: red flash on screen (rgba(255,0,0,0.15) full canvas for 3 frames) 
             + heavy shake + "-1 SCRATCH" popup in red
  Check: ✓/✗ — fix if missing

ACTION: Round ends, lights fade
  Must have: visible fade animation on light zones (not instant) + subtle ambient shift
  Check: ✓/✗ — fix if missing

Output: "⚡ JUICE AUDIT: [X/10 actions fully juiced] — [list of additions made]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFINEMENT PASS 4 — THE AI BEHAVIOR AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Simulate 7 complete AI turns mentally. Trace the state machine logic.

AI Turn Simulation 1 — Round 1, cue ball and all balls in starting position, 
  all balls illuminated from opening break:
  Expected state: HUNT_LIT. AI aims at a ball near a pocket.
  AI calculates angle: cue → ball → pocket.
  Should fire at moderate power (60-80%). Does this happen?

AI Turn Simulation 2 — Round 3, only 2 ghost balls remain visible, none lit:
  Expected state: HUNT_GHOST. AI aims toward ghost position with ±12° variance.
  Should NOT fire at full power toward an empty dark area.

AI Turn Simulation 3 — AI's designated RECON round (3 or 4):
  Expected: AI enters RECON state regardless of board state.
  Uses RECON shot (sets aiReconUsed = true).
  Three light beams illuminate sections of the table.
  AI's own turn ends — no ball is moved.
  On NEXT AI turn, uses newly revealed information.

AI Turn Simulation 4 — Round 5, all balls in complete darkness, no ghosts:
  Expected state: PROBE. AI aims toward original rack position ±30°.
  This is a "fishing" shot — AI knows it's unlikely to pocket but tries to illuminate.

AI Turn Simulation 5 — AI's light zones expire, its ghost disappeared 2 rounds ago:
  Expected: AI does NOT aim at the old ghost position (it's gone from ghost array).
  AI falls back to PROBE state.

AI Turn Simulation 6 — 1 ball remaining, it's in AI's illuminated zone, 
  path to pocket partially blocked by another ball:
  Expected: AI attempts the shot. If blocked, cue ball hits the blocker instead.
  AI is NOT omniscient — it aims at where it CAN see, not around corners.

AI Turn Simulation 7 — Player is winning by 4 points, round 6 of 7:
  Expected: AI behavior does NOT change based on score (it has no score awareness).
  AI plays the same way regardless of win/loss — it only responds to visibility.
  This is correct and intentional.

After simulating, verify code matches all 7 expected behaviors. Fix any deviations.
Output: "🤖 AI AUDIT: [X/7 behaviors correct] — [list of fixes made]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFINEMENT PASS 5 — THE TUTORIAL EXPERIENCE AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Walk through the tutorial as a new player would (no prior knowledge).

Step by step, answer these questions:

STEP 1 (aiming):
  - Is the animated demonstration clear without words?
  - Does the focus overlay dim everything except the cue ball and aim area?
  - Is the max 12-word caption actually under 12 words? Count them.
  - Does "click or press SPACE" prompt appear and blink?

STEP 2 (darkness):
  - Is the darkness closing animation slow enough to understand (2 full seconds)?
  - After darkness closes, can you still see the lamp cone zones?
  - Does this step viscerally communicate "you are now mostly blind"?
  
STEP 3 (rolling reveals):
  - Is the pre-scripted shot trajectory interesting — does it cross multiple object balls?
  - Does the light trail appear in REAL TIME as the ball moves (not all at once)?
  - Does the player understand that THEY caused the revelation by rolling?

STEP 4 (ghost memory):
  - Is there a visible delay between darkness falling and ghost appearing?
  - Does the ghost visually drift to show it's inaccurate? (subtle, 5-10px drift over 3s)
  - Is the ghost clearly different from a real ball? (outline only, lower opacity)

STEP 5 (scoring reveal):
  - Are the 3 scenarios legible simultaneously on screen (not overlapping)?
  - Is the "+3 BLIND!" clearly the most exciting of the three?
  - Do the animated score popups actually animate (not static)?

OVERALL TUTORIAL:
  - Does the entire tutorial take under 90 seconds at normal reading pace?
  - Is there a visual progress indicator (5 dots, current step highlighted)?
  - If player presses SPACE rapidly through all 5 steps: does it skip gracefully?
  - Does the tutorial feel like part of the game world, not a PowerPoint?

Fix anything that doesn't meet these standards.
Specifically: if ANY step takes more than 20 seconds to read, rewrite the text to be shorter.
Output: "📚 TUTORIAL AUDIT: [list all improvements made]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFINEMENT PASS 6 — THE FINAL POLISH SWEEP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is the last pass. Every item here is a detail that separates
a good game from a professional one. Check all of them.

MICRO-INTERACTIONS:
  □ When the player hovers over the canvas during aiming, cursor is 'crosshair'
  □ When the player hovers over RECON button, cursor is 'pointer'
  □ When balls are rolling (non-interactive phase), cursor is 'wait' or 'default'
  □ Pressing ESC during play opens a minimal pause overlay (semi-transparent)
     with 3 options drawn as styled text buttons (not HTML buttons):
     "RESUME", "RESTART", "TUTORIAL"
     Pause overlay has the same noir dark aesthetic as the game

PERFORMANCE:
  □ All procedural textures (felt grain, rail wood) are pre-rendered to offscreen 
    canvases at startup — NOT regenerated every frame
  □ Particle array is capped at 150 total particles (oldest removed if exceeded)
  □ Light zone array is pruned every round-end (remove expired zones)
  □ Ball collision loop is O(n²) — with only 8 balls this is fine, but confirm
    it's not running on every single particle or ghost

EDGE CASES:
  □ What happens if ALL 7 balls are pocketed before round 7 ends?
    Expected: game ends immediately, winner is whoever has more points
    The end screen should show "X balls remaining — early finish"
  □ What if player pockets the last ball on a blind shot?
    Expected: slow motion + golden particles + then end screen — not instant cut
  □ What if the cue ball gets stuck in a corner (velocity < threshold, near wall)?
    Expected: teleport it 15px toward center to prevent dead state (log this)
  □ What if player attempts to drag-aim while balls are rolling?
    Expected: input completely ignored, cursor shows default state

ACCESSIBILITY:
  □ Color-blind mode toggle: pressing C during game switches ball colors to
    shapes with distinct markers (ball 1 = circle, ball 2 = triangle outline inside, etc.)
    This is a simple overlay — draw a small shape inside each ball when mode active
  □ All animated flashes (chromatic aberration, screen shake, red scratch flash) 
    cap at a safe intensity. Document which can be reduced with an in-game toggle.

FINAL VISUAL CHECK:
  □ Open the game and look at it for 10 seconds without touching anything.
    Does the scene feel alive? (lamp pulse, neon flicker, ambient dust drifting)
  □ Take one shot. Does it feel satisfying? (sound, shake, ball response)
  □ Pocket a ball from darkness. Is it the best moment in the game?
  □ Does the end screen feel like a proper conclusion (full table reveal)?

After completing ALL 6 passes, output this exact block:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ BLIND BREAK — REFINEMENT COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Physics:  [X/8 tests passing]
Visuals:  [list of final state of all visual systems]
Juice:    [X/10 actions fully juiced]
AI:       [X/7 behaviors verified]
Tutorial: [confirmation all 5 steps working]
Polish:   [list of edge cases handled]

TOTAL LINES OF CODE: [count]
TOTAL FUNCTIONS: [count]
ESTIMATED PLAY SESSION: [X minutes]
BLIND POCKETS POSSIBLE PER MATCH: [X]

The game is ready for EA Game Jam submission.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT: Do not output this completion block until ALL 6 refinement passes
are genuinely complete with real fixes applied. If any audit finds problems,
fix them before marking that pass done. The bar is high — this is EA.

Now begin. Start with PHASE 1.
After completing each phase, output:
  "✅ PHASE [N] COMPLETE — [one sentence summary of what was built]"
Then immediately begin the next phase without waiting for permission.




