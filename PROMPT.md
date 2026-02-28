# BLIND BREAK — NEXUS ARENA UNIVERSE: COMPLETE NON-FUNCTIONAL UPGRADE PROMPT

> **READ THIS ENTIRE PROMPT BEFORE WRITING A SINGLE LINE OF CODE.**
> You are upgrading BLIND BREAK — a 2D Canvas/TypeScript multi-game tournament — to feel like a
> polished, narrative-rich sci-fi experience set in the **NEXUS ARENA** universe. This means
> transforming every non-functional aspect: visuals, story, sound, UI, animations, and per-game
> thematic redesigns. **Do NOT break any existing gameplay logic.** Only enhance what the player
> sees, hears, and reads.

---

## ━━━ SECTION 0 — UNIVERSE & NARRATIVE CONTEXT ━━━

### The Story
The **NEXUS ARENA** is the grand cosmic tournament organized by the **Nexari** — an alien
civilization that observed humanity playing sports for decades. Fascinated by "chosen competition"
(rules invented by the players themselves), they have invited Earth's greatest athletes to compete
in a six-discipline Tournament of Worlds. The games are familiar — but everything around them
has been transformed by the alien environment of deep space.

The player is Earth's champion. The tournament happens in orbit around Saturn, inside a
massive Nexari space station shaped like an interlocking ring. Six sports. Six arenas. One champion.

### Tone & Aesthetic
- **Dark, cinematic, cosmic.** Deep blacks, nebula purples and blues, glowing neon accents.
- **Tech-mystical.** Ancient-feeling alien architecture combined with holographic displays.
- **Serious but spectacular.** The games are life-or-death inter-galactic prestige events.
- **Reference palette**: Mass Effect's Citadel + Dead Space's environments + Tron's neon geometry.

---

## ━━━ SECTION 1 — INTRO SCREEN (NEW) ━━━

### Replace the current menu with a cinematic opening sequence

**Boot/Loading screen:**
- Full black canvas with a slowly appearing starfield (procedurally draw 200 white dots, some
  twinkling via opacity oscillation at random speeds)
- Centered text in Orbitron font: `ESTABLISHING NEXARI LINK...`
- Animated progress bar, hex-green on black, styled like a terminal: `[████████░░░░] 67%`
- Below the bar: rotating flavor text lines (typewriter effect, one per 1.5s):
  - `"SCANNING HUMAN SPORTS DATABASE..."`
  - `"NEXARI SIGNAL LOCK: CONFIRMED"`
  - `"LOADING TOURNAMENT BRACKETS..."`
  - `"ARENA GRAVITY: CALIBRATED"`

**Intro cinematic (plays once, skippable with SPACE after 2 seconds):**
- Full-screen space background: deep blue-purple gradient with animated star parallax (two
  layers of stars scrolling at different speeds — subtle, creates depth)
- Animated Saturn ring silhouette fades in from below, glowing amber-gold
- Text appears line by line with typewriter effect (Rajdhani, 18px, #00f5ff):
  ```
  NEXARI TRANSMISSION — EARTH DATE: [current date]
  
  YOUR PLANET HAS BEEN SELECTED.
  
  SIX COMPETITIONS. SIX DISCIPLINES.
  WINNER EARNS THE RIGHT TO EXIST IN THIS STAR SYSTEM.
  
  PREPARE YOURSELF, CHAMPION.
  THE ARENA AWAITS.
  ```
- After final line: screen flash to white → transition to main menu
- Skip indicator at bottom: `[SPACE] Skip` pulsing at 0.8s intervals

---

## ━━━ SECTION 2 — MAIN MENU REDESIGN ━━━

### Visual Layout
- **Background**: Animated deep space. Two-layer parallax starfield. A distant glowing nebula
  (painted with radial gradients in purple/blue/cyan) pulses slowly at 50% opacity behind everything.
- **Title block (centered, upper third of screen)**:
  - Main title: `BLIND BREAK` — Orbitron 900 weight, 72px, white with cyan text-shadow glow
    (`text-shadow: 0 0 30px #00f5ff, 0 0 60px #00f5ff88`)
  - Subtitle: `NEXUS ARENA TOURNAMENT` — Orbitron 400, 24px, #9b00ff (Nexari purple)
  - Tagline below: `"SIX WORLDS. ONE CHAMPION."` — Rajdhani 600, 16px, #aabbcc, 70% opacity
- **Game cards (middle section)**: The six game cards get a full visual overhaul (see Section 4)
- **Bottom bar**: Tournament score tracker — P1 (cyan) vs P2 (magenta) score pills, glowing

### Menu Animations
- Cards animate in staggered: each card slides up from -20px with easeOutElastic, 100ms apart
- Hovered card: scale(1.04) with a 200ms ease, border glows brighter, subtle particle burst at corners
- Selected card: pulse ring animation outward, then zoom-transition into game

### Typography Rules (apply everywhere)
- **Orbitron** — titles, scores, countdowns, game names, HUD numbers
- **Rajdhani** — instructions, subtitles, tutorials, flavor text, tooltips
- Never use system fonts in the game UI

---

## ━━━ SECTION 3 — COLOR PALETTE (Apply to ALL games) ━━━

```typescript
// /src/core/Colors.ts — Single source of truth for all colors
export const COLORS = {
  // Space backgrounds
  VOID_BLACK:     '#020208',
  DEEP_SPACE:     '#080818',
  NEBULA_BG:      '#0a0a1f',

  // Nexari accent colors
  NEXARI_CYAN:    '#00f5ff',
  NEXARI_PURPLE:  '#9b00ff',
  NEXARI_GOLD:    '#ffd700',
  NEXARI_RED:     '#ff2244',

  // Player colors
  P1_CYAN:        '#00e5ff',
  P1_GLOW:        '#00aaff',
  P2_MAGENTA:     '#ff4466',
  P2_GLOW:        '#cc0055',

  // Game states
  SUCCESS:        '#00ff88',
  DANGER:         '#ff4422',
  NEUTRAL:        '#aabbcc',
  WARNING:        '#ffdd44',

  // Environment
  SATURN_RING:    '#c8944a',
  NEBULA_BLUE:    '#0a1a3a',
  STAR_WHITE:     '#e8f0ff',
} as const;
```

**Apply to all game backgrounds**: Replace `'#0a0a12'`, `'#0a0e1a'` and similar dark backgrounds
with `COLORS.NEBULA_BG` (`#0a0a1f`) as the base. Add animated starfield to all game backgrounds
(see Section 7 — Shared Visual Systems).

---

## ━━━ SECTION 4 — GAME CARD REDESIGN (Menu) ━━━

Each game card on the menu must reflect its themed universe. Replace the icon emoji with a
**drawn canvas icon** and update color, name, and description:

| Old Name | New Name | New Subtitle | Card Color | Canvas Icon |
|---|---|---|---|---|
| BLIND BREAK | **DARK NEBULA BILLIARDS** | *Shoot through the cosmic dark* | #ff3366 | 🔵 Glowing pool cue aimed at nebula orbs |
| ENDLESS RALLY | **PULSAR PING PONG** | *Reaction speed at lightspeed* | #00ccff | ⚡ Two paddles with energy ball |
| MOVING GOALS | **ZERO-G SOCCER** | *Goals drift in orbital decay* | #44ff66 | ⚽ Planet sphere with orbit ring |
| SHRINKING RING | **SUMO ORBITAL** | *Last warrior standing in the ring of Saturn* | #c4a44a | 🔮 Two warrior silhouettes on Saturn ring |
| TRON TRAIL RACE | **SATURN RING RACE** | *Spaceship racing around Saturn's rings* | #aa44ff | 🚀 Two spaceships racing on a ring curve |
| GRAVITY WALL | **COSMIC VOLLEYBALL** | *Gravity shifts every orbit* | #ffffaa | 🌌 Ball arcing through space over a net |

---

## ━━━ SECTION 5 — ROUND INTRO SCREEN UPGRADE ━━━

The `RoundIntro` component currently shows game name + subtitle. Upgrade it to:

- **Background**: Full-screen deep space with nebula pulse + starfield
- **Top bar**: `NEXUS ARENA — ROUND [N] OF [TOTAL]` in Orbitron, small, #9b00ff
- **Center**: Game name in Orbitron 900, 64px, white, with cyan glow
- **Below**: Subtitle in Rajdhani, 24px, #aabbcc
- **Universe flavor text** (unique per game, see Section 6): appears below subtitle in italics,
  Rajdhani 400, 16px, #7799bb — a single lore sentence setting the scene
- **Animated element**: a slow-rotating thematic icon or symbol drawn procedurally on canvas
  (e.g., rotating Saturn ring for the race, spinning billiard orb for billiards)
- **Bottom**: `[SPACE] Begin` pulsing prompt

---

## ━━━ SECTION 6 — PER-GAME UNIVERSE REDESIGN ━━━

### 6A — DARK NEBULA BILLIARDS (formerly Blind Break)

**Lore intro text**: *"The Nexari first observed humans playing billiards in darkened rooms.
They found the concept of 'chosen blindness' poetic — and elevated it to cosmic scale."*

**Visual changes:**
- Background: deep space with a purple-blue nebula painted with radial gradients behind the table
- Billiard table felt: replace `'#1a6b3a'` with a deep cosmic surface — dark navy `#0d1a2e`
  with a subtle grid texture drawn procedurally (faint hexagonal lines in #ffffff08)
- Table rails: glowing cyan/gold `#ffd700` borders with neon glow (`shadowBlur: 12, shadowColor: '#ffd70088'`)
- **CRITICAL FIX — Ball redesign**: Replace solid color balls with **planet-textured circles**:
  - Each ball is drawn as a `ctx.arc()` circle clipped region, then filled with a radial gradient
    that simulates planetary shading (dark on edges, bright highlight at top-left)
  - Ball 1 (cue): White/gray gas giant — gradient from `#ddeeff` to `#667799`
  - Balls 2–8: Use this planet color mapping:
    ```
    Ball 2: Mars-red     #cc4422 → #441108
    Ball 3: Jupiter-tan  #c8944a → #7a4a18
    Ball 4: Neptune-blue #2244cc → #0a1a66
    Ball 5: Saturn-gold  #ddaa44 → #886622
    Ball 6: Venus-yellow #ddcc44 → #887722
    Ball 7: Uranus-teal  #44ccbb → #1a6655
    Ball 8: Black hole   #222222 → #000000 (with glowing ring)
    ```
  - Each planet ball has a thin atmospheric glow: `shadowColor = ballColor, shadowBlur = 8`
  - Add small painted "continent" shapes using `ctx.arc()` splotches in darker tones on each ball
- Pockets: glowing purple portal rings — `#9b00ff` with pulsing opacity animation
- Fog of war: Keep existing light system but tint the dark areas blue-black `#050510` instead of black
- Cue stick: Replace with a glowing energy beam drawn as a gradient line (cyan to transparent)

**CRITICAL BUG FIX — Controls:**
The billiard controls are currently broken. Verify and fix the following:
1. **Mouse aiming**: `mousedown` sets `state.dragging = true`, records `dragStartX/Y`
2. **Power calculation**: On `mousemove` while dragging, calculate distance from cue ball and set
   `state.power = Math.min(1, dist / C.MAX_DRAG_DIST)` — verify `C.MAX_DRAG_DIST` is reasonable
   (should be ~200px)
3. **Shot firing**: On `mouseup` while dragging, calculate angle FROM ball TO dragStart (pull-back
   mechanic: drag away from ball = aim toward where you dragged from) and call `fireShot(angle, power)`
4. **Turn validation**: Ensure `isHumanTurn()` returns true during player's aim phase
5. **AI turn**: Ensure AI turn triggers automatically after human shot resolves
   (`allBallsStopped()` → `resolveTurn()` → if AI turn, call `aiThink()`)
6. Draw a **visual aim line** from cue ball through drag direction, dashed white line,
   length proportional to power, with arrow tip. Only visible during drag.

**Audio per game:**
- Background music: slow, tense, cosmic ambient (deep drone, sparse piano hits)
- SFX: `BALL_STRIKE` — hollow metallic clang + reverb; `BALL_POCKET` — deep portal whoosh + chime;
  `CUE_DRAG` — subtle energy hum when dragging; `SCRATCH` — discordant alien tone

---

### 6B — PULSAR PING PONG (formerly Endless Rally)

**Lore intro text**: *"The Nexari were baffled that humans chose to play this sport
on tables. They moved it to the void between stars, where reaction speed is everything."*

**Visual changes:**
- Background: space with horizontal star streaks (draw 40 lines, random length 10–80px, horizontal,
  white at 30–60% opacity, giving sense of warp speed)
- Table surface: instead of green `'#1a5c1a'`, draw a transparent starfield with a subtle neon
  grid floor — dark `#080818` with a perspective grid drawn in cyan `#00f5ff1a` lines
- Paddles: Replace rectangles with glowing **energy shield** shapes:
  - Draw as rounded rectangles (`ctx.roundRect`) with neon fill and outer glow
  - P1: `#00e5ff` fill + `shadowBlur: 15, shadowColor: '#00e5ff'`
  - P2: `#ff4466` fill + `shadowBlur: 15, shadowColor: '#ff4466'`
  - Add subtle vertical scanline texture on paddles (alternating 1px lines at 20% opacity)
- Ball: Replace orange circle with a **pulsar orb** — white-hot core with electric arcs:
  - Draw as bright circle `#ffffff` with multiple concentric glow layers
  - Add 4–6 thin "lightning" lines (`ctx.bezierCurveTo`) emanating 8–15px from ball, cyan/white
  - Trail: instead of simple dots, draw fading gradient trail (opacity 0.6 → 0)

**CRITICAL FIX — Player movement:**
Currently paddles only move vertically. Upgrade to allow full quadrant movement:
- P1 quadrant: left half of canvas (`x: 0` to `x: W/2 - NET_W/2`)
- P2 quadrant: right half of canvas (`x: W/2 + NET_W/2` to `x: W`)
- Add horizontal movement to both players:
  - P1: `A`/`D` keys (or arrows) for horizontal movement
  - P2: numpad or second set of keys for horizontal movement
- Add `vx` and `vy` to paddle physics, clamped within their respective quadrants
- The ball collision detection must check against the **full paddle rectangle** at any position,
  not just a fixed-x side wall
- Reflect the ball angle based on where on the paddle it hits (edge hit = steep angle,
  center hit = shallow angle) — this improves the physics feel dramatically

**Audio per game:**
- Background music: fast electronic pulse, rhythmic, 140 BPM-feel
- SFX: `PADDLE_HIT` — electric zap/crack; `WALL_BOUNCE` — deep reverb thud;
  `SCORE_POINT` — ascending chime; `BALL_WHOOSH` — high-speed spaceship fly-by

---

### 6C — ZERO-G SOCCER (formerly Moving Goals / Soccer)

**Lore intro text**: *"Zero-gravity soccer was the sport the Nexari understood least.
They kept the moving goals but removed the ground. Chaos is the true referee."*

**Visual changes:**
- Background: space station interior — dark walls with glowing orange hazard stripes at edges,
  holographic goal posts instead of solid goals
- Field: remove green turf entirely. Replace with dark metallic floor `#0d0d1a` with glowing
  hexagonal grid pattern (`#00f5ff08` lines, creating sci-fi floor tiles)
- Ball: Replace with a **holographic soccer ball** — white circle with glowing pentagon pattern
  drawn procedurally, slight transparency `0.9 alpha`, neon green outline `#00ff88`
- Goals: Glowing purple portal frames (two vertical lines `#9b00ff` + glow, connected by arc at top)
  instead of simple rectangles — animate with slow opacity flicker
- Players: elongated capsule shapes (representing space-suited athletes) with helmet visors drawn
  as small circles. P1: cyan suit; P2: magenta suit

**Audio per game:**
- Background music: sporadic, tension-building, with zero-gravity ambient effects
- SFX: `BALL_KICK` — metallic thwack; `GOAL_SCORE` — triumphant alien fanfare;
  `GOAL_MOVE` — whooshing repositioning sound

---

### 6D — SUMO ORBITAL (formerly Shrinking Ring)

**Lore intro text**: *"The Nexari found Sumo wrestling to be the sport closest to their own
combat traditions. They replicated it on a platform orbiting Saturn — surrounded by the void."*

**Visual changes:**
- Background: Saturn visible in background — draw a large tan/gold gradient ellipse (`#c8944a`) with
  procedural rings drawn as elliptical arcs at varying opacities, slightly blurred
- Arena circle: replace solid tan with:
  - Outer glow ring: golden `#ffd700`, `shadowBlur: 20`
  - Arena surface: textured radial gradient (center lighter `#c4a44a`, edges darker `#7a4a18`)
  - Danger zone (near edge): pulsing red overlay as arena shrinks
- **CRITICAL FIX — Player visuals**: Replace colored circles with **top-down sumo wrestler images**:
  - Since this is Canvas 2D, create detailed procedural "sumo from above" drawings using `ctx.arc()`,
    `ctx.ellipse()`, and `ctx.bezierCurveTo()`:
    - **Body**: Large circle (the wrestler seen from above), fills most of the PLAYER_RADIUS area
    - **Arms**: Two ellipses extending to sides, slightly rotated, suggesting outstretched arms
    - **Head**: Small circle at top of body
    - **Mawashi (belt)**: Colored band across the body's middle
    - **Shading**: Radial gradient for volume — highlight at top-left, shadow at bottom-right
  - P1 wrestler colors: Cyan `#00e5ff` mawashi, skin tone body `#d4956a`
  - P2 wrestler colors: Magenta `#ff4466` mawashi, skin tone body `#d4956a`
  - The "image" is procedurally drawn each frame, so it rotates with the player facing direction

**Audio per game:**
- Background music: heavy, percussive, taiko-drum-inspired but electronic
- SFX: `PLAYER_DASH` — energy burst; `PLAYER_COLLISION` — heavy impact thud + ring sound;
  `ARENA_SHRINK` — ominous low rumble; `PLAYER_FALL` — falling whoosh + distant thud

---

### 6E — SATURN RING RACE (formerly Tron Trail Race / Formula)

**Lore intro text**: *"The Nexari watched human racing and one question haunted them:
why race on flat surfaces? They redesigned the track around a planetary ring."*

**COMPLETE VISUAL REDESIGN — Track becomes Saturn ring:**
- **Track shape**: Replace the oval `buildTrackBoundary()` shape with a perspective-rendered
  **ring/circular track** that visually represents racing around Saturn's rings:
  - Draw the track as two concentric ellipses (simulating perspective of a ring from above at angle):
    - Outer ellipse: `rx=480, ry=220` (wider than current)
    - Inner ellipse: `rx=360, ry=165`
    - The gap between them IS the track (same logic, new shape)
  - Fill track surface: banded amber/gold `#c8944a` alternating with lighter `#ddbb66` — resembling
    ice and rock of Saturn's actual rings — using ctx path fill
  - Track edge glow: outer and inner edges glow gold `#ffd70066` with `shadowBlur: 8`
  - Background: giant Saturn visible — large tan ellipse occupying bottom-left of canvas,
    with ring bands across it, partially behind the racing track (z-order: Saturn → track → ships)

- **Cars become spaceships:**
  - Replace rectangle car drawings with **procedural spaceship silhouettes** (top-down view):
    - Main hull: elongated diamond/arrowhead shape pointing forward, 32px × 14px
    - Engines: two small rectangles at the rear
    - Cockpit: small circle near the front
    - Wing fins: two thin triangular extrusions from mid-ship
  - P1 ship: cyan hull `#00e5ff`, glowing engine flare `#0088ff`
  - P2 ship: magenta hull `#ff4466`, glowing engine flare `#ff0044`
  - Engine trail: gradient line from ship rear, cyan/magenta → transparent, 25px long, animated
  - Turbo boost: engine flare extends to 60px, ship gets bright glow `shadowBlur: 20`

- **Power-ups visual overhaul**:
  - `mirror`: Purple swirling vortex circle with arrow icons
  - `speed`: Yellow lightning bolt ring
  - `obstacle`: Red warning hexagon
  - All power-ups rotate and pulse with a sine-wave opacity animation

- **Start/Finish line**: Holographic checkered flag pattern glowing white, drawn at t=0 on ring

**Audio per game:**
- Background music: high-energy electronic race music, driving rhythm, 160 BPM-feel
- SFX: `ENGINE_IDLE` — constant spaceship engine hum (looping); `ENGINE_BOOST` — thrust roar;
  `SHIP_COLLISION` — metallic clang; `POWERUP_COLLECT` — sci-fi pickup chime;
  `LAP_COMPLETE` — triumphant sting; `OFF_TRACK` — low-frequency alarm buzz

---

### 6F — COSMIC VOLLEYBALL (formerly Gravity Wall)

**Lore intro text**: *"The concept of opposing sides separated by a net was immediately
comprehensible to the Nexari. Adding shifting gravity was their only contribution."*

**Visual changes:**
- Background: cosmic void with slowly drifting glowing particle field (draw 30 small circles,
  drifting slowly in random directions, cyan/white at 20–40% opacity)
- Court floor: metallic platform texture — dark `#0d1122` with subtle reflective gradient at bottom
- Net: glowing energy barrier instead of white line — gradient `#9b00ff → #ff00ff`, 4px wide,
  `shadowBlur: 12`, with small energy nodes at top/bottom where net meets court
- Ball: **cosmic orb** — gradient fill from bright center `#ffffff` to colored edge based on
  gravity direction (DOWN=blue, UP=red, LEFT=green, RIGHT=yellow), with orbital ring drawn around it
- Players: Space-suited athletes — draw as:
  - Body: rounded rectangle `ctx.roundRect()` with gradient (suit color top, darker bottom)
  - Helmet: circle at top with visor highlight
  - P1: cyan suit; P2: magenta suit

**CRITICAL FIX — Ball-player collision physics:**
The current volleyball collision with players is broken. Fix by:
1. Check collision between ball and each player every frame using proper `dist(ball, player_center)`
2. Calculate **collision normal** = `normalize(ball.pos - player.pos)`
3. Apply **realistic bounce**: `ball.velocity = reflect(ball.velocity, normal) * BALL_RESTITUTION`
   plus add the player's current velocity as a component: `ball.v += player.v * 0.5`
4. Apply a minimum impulse when hitting (ensure ball always bounces away from player):
   ```
   if dot(ball.velocity, normal) < 0:
     ball.velocity -= 2 * dot(ball.velocity, normal) * normal
   ```
5. Separate ball from player after collision to prevent sticking (move ball to edge of player radius)
6. Gravity changes should instantly affect ball velocity direction, not just acceleration vector

**Gravity change visual effect**: When gravity shifts, flash the background with the new
direction's color for 3 frames, and show a large directional arrow in the center of the court
that fades out over 1 second.

**Audio per game:**
- Background music: floating, ethereal space ambient with rhythmic undertones
- SFX: `BALL_HIT_PLAYER` — satisfying deep "thwack" + slight reverb; `BALL_FLOOR` — hollow boom;
  `GRAVITY_SHIFT` — deep whoosh + reverb tonal shift; `SCORE` — space chime

---

## ━━━ SECTION 7 — SHARED VISUAL SYSTEMS (Apply to ALL games) ━━━

### 7A — Universal Starfield Background
Add to the base GameManager render loop, drawn BEFORE each game's own rendering:

```typescript
// StarfieldBackground — rendered behind every game
class StarfieldBackground {
  private stars: Array<{x: number; y: number; size: number; opacity: number; twinkleSpeed: number}> = [];
  private time = 0;

  init(count = 150): void {
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 2 + 0.5,
      });
    }
  }

  render(ctx: CanvasRenderingContext2D, dt: number): void {
    this.time += dt;
    ctx.fillStyle = COLORS.NEBULA_BG;
    ctx.fillRect(0, 0, 1280, 720);

    // Nebula layer (behind stars)
    const nebula = ctx.createRadialGradient(400, 300, 50, 400, 300, 600);
    nebula.addColorStop(0, '#1a0a3a22');
    nebula.addColorStop(0.5, '#0a0a2a11');
    nebula.addColorStop(1, 'transparent');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, 1280, 720);

    for (const star of this.stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(this.time * star.twinkleSpeed);
      ctx.globalAlpha = star.opacity * (0.7 + 0.3 * twinkle);
      ctx.fillStyle = COLORS.STAR_WHITE;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
```

### 7B — Screen Shake (Existing system, ensure it's applied in all games)
The `screenShake` utility already exists. Ensure it's triggered in:
- All goal/score events: `screenShake.trigger(0.3, 300)`
- Player collision in Sumo: `screenShake.trigger(0.5, 200)`
- Race collision: `screenShake.trigger(0.2, 150)`
- Volleyball hard hit: `screenShake.trigger(0.15, 100)`

### 7C — Hit Flash Effect
When a player scores or a key event occurs, flash the scoring player's HUD element:
- Scale HUD score text from 1.0 → 1.5 → 1.0 over 400ms, easeOutElastic
- Apply `shadowBlur: 20` to the score text color for 400ms then fade back

### 7D — Particle Bursts on Score
On every score/goal/point event, emit a burst of 20 colored particles from the scoring location:
- Particles: small 3px circles, initial velocity = random direction, speed 50–150px/s
- Lifetime: 0.8s with linear opacity fade
- Color: winner's player color

### 7E — Death/Fall Flash for Sumo
When a Sumo player falls off the ring:
- Flash white overlay on full canvas (alpha 0.6) for 3 frames
- Screen shake large `(0.6, 400)`
- Show `ELIMINATED` text in Orbitron at that player's last position, fading up and out

---

## ━━━ SECTION 8 — HUD & IN-GAME UI REDESIGN ━━━

### Universal HUD changes (apply in `TournamentHUD.ts`):
- **Score display**: Large Orbitron numbers, 48px, with glowing player color underneath
- **Player labels**: `◈ P1` and `P2 ◈` in Rajdhani, with small circular avatar icons (filled circle
  in player color)
- **Round indicator**: `ROUND [N] / [TOTAL]` in Orbitron 400, 14px, top-center, subtle
- **Timer**: Large countdown in Orbitron, center-top. Pulse animation when under 10 seconds
  (scale 1.0 → 1.1 → 1.0 at 1Hz), color changes to `COLORS.DANGER` when ≤ 10s

### Per-game HUD enhancements:
- **Race**: Show lap counter as `LAP [N]/[TOTAL]` with animated chevrons `>>` before number
  when turbo is active. Turbo cooldown: circular arc progress indicator instead of bar.
- **Sumo**: Show ring size percentage `ARENA: 85%` as danger gauge — fills red as ring shrinks.
  Jump cooldown: circular arc indicator.
- **Billiards**: Show whose turn it is with animated arrow pointing to active player. Show power
  bar as segmented arc around cue ball during aiming drag.
- **Volleyball**: Show current gravity direction with large translucent arrow in background.
  Show gravity timer as progress ring.

---

## ━━━ SECTION 9 — AUDIO SYSTEM ━━━

### Audio Architecture (using existing `AudioManager.ts`):
The game currently has an `AudioManager`. Ensure it implements:

```typescript
interface AudioConfig {
  MENU_AMBIENT: AudioBuffer;       // Deep space ambient drone, looping
  GAME_MUSIC: {                    // Per-game tracks, looping
    billiards: AudioBuffer;        // Tense, sparse, 80 BPM
    pingpong: AudioBuffer;         // Fast electronic, 140 BPM  
    soccer: AudioBuffer;           // Mid-energy sporadic
    sumo: AudioBuffer;             // Heavy percussive
    formula: AudioBuffer;          // High-energy driving, 160 BPM
    volleyball: AudioBuffer;       // Floating ethereal
  };
  ROUND_INTRO_STING: AudioBuffer;  // 3-second "new round" fanfare
  SCORE_POINT: AudioBuffer;        // Per-point score chime
  COUNTDOWN: AudioBuffer;          // 3-2-1 beeps + GO! sound
  VICTORY: AudioBuffer;            // Match win fanfare
  NEXARI_TRANSMISSION: AudioBuffer;// Intro screen alien sound
}
```

### Free CC0 Audio Sources (download these and add to `/public/assets/audio/`):
- **Space ambient music**: `opengameart.org` — search "Background space track" (CC0 by celestialghost8)
- **Sci-Fi SFX pack**: `opengameart.org/content/60-cc0-sci-fi-sfx` — 60 CC0 sci-fi sound effects
- **Race music**: `opengameart.org` — search "Racing Game Menu" CC0
- **Space music collection**: `opengameart.org/content/cc0-space-music`
- **Alternative — Pixabay**: `pixabay.com/sound-effects/search/space/` for free royalty-free sounds

### Audio Implementation Rules:
- All music loops with a `0.3s` crossfade between tracks
- SFX volume: 70% of music volume maximum
- When game is paused: duck music volume to 20%
- Every button hover: play a subtle `UI_HOVER` tick (2ms blip, 30% volume)
- All audio wrapped in try/catch — game must work with no audio

---

## ━━━ SECTION 10 — COUNTDOWN SCREEN UPGRADE ━━━

Replace the current countdown with:
- Black overlay at 80% opacity
- Countdown numbers: Orbitron 900, 120px, centered
- Each number: scale from 2.0 → 1.0 with `easeOutElastic`, color:
  - `3` → `#ff4422` (red/danger)
  - `2` → `#ffdd44` (yellow/warning)
  - `1` → `#00f5ff` (cyan/ready)
  - `GO!` → `#00ff88` (green/success), holds for 0.5s before clearing
- Sound: three ascending beeps + final "GO!" electronic sting

---

## ━━━ SECTION 11 — ROUND RESULT SCREEN UPGRADE ━━━

Replace the current round result overlay with:
- Background: full-screen darkened canvas + starfield
- Centered panel (dark `#0d0d1f` with `border: 2px solid #00f5ff`, `border-radius: 4px`)
- `ROUND [N] COMPLETE` — Orbitron 400, 20px, #9b00ff, top of panel
- Winner declaration: `P1 WINS!` or `P2 WINS!` — Orbitron 900, 64px, winner's color, centered
- Score summary: both players' cumulative scores shown as glowing pill badges
- Flavor text — one of these lore lines, randomly selected:
  - *"The Nexari consul nods approvingly."*
  - *"Earth's honor remains intact... for now."*
  - *"A ripple moves through the assembled alien fleet."*
  - *"The arena logs your performance for future use."*
- After 2 seconds: pulsing `[SPACE] Continue` prompt

---

## ━━━ SECTION 12 — TOURNAMENT END SCREEN UPGRADE ━━━

Replace the current end screen with a full cinematic:
- **If P1 wins**: Cyan particle explosion fills screen, then: `EARTH CHAMPION CROWNED` in Orbitron
  900, 56px, white with gold glow. Below: `"Humanity endures. The Nexari bow."` in Rajdhani.
- **If P2 wins**: Red particle explosion, then: `CHALLENGER VICTORIOUS` in red Orbitron.
- **Scoreboard**: Animated reveal of all round results (icons + winner for each game), shown one
  at a time with 0.3s stagger
- **Stats reveal**: Each stat animates counting up: `[N] Points Scored`, `[N] Rounds Won`
- Nexari message: random cosmic lore line:
  - *"Your combat data has been archived in the Nexus Codex."*
  - *"Seven galaxies witnessed your performance today."*
  - *"The Arena remembers. The Arena adapts."*
- Bottom: `[SPACE] Play Again` and `[ESC] Return to Menu` — styled as holographic buttons

---

## ━━━ SECTION 13 — TUTORIAL / INSTRUCTION OVERLAY ━━━

Add a `?` key overlay accessible from any game (press `?` or `F1` to open):

- Semi-transparent dark panel overlaid on game canvas
- Title: `HOW TO PLAY — [GAME NAME]` in Orbitron
- Controls table: clean two-column layout, Rajdhani font:
  ```
  P1 CONTROLS          P2 CONTROLS
  ─────────────────────────────────
  WASD / Arrows        IJKL / Numpad
  [Space] Action 1     [0] Action 1
  [Shift] Action 2     [Enter] Action 2
  ```
- Game-specific rules: 3–5 bullet points, concise, Rajdhani
- Press `?` again or `ESC` to close

Per-game control descriptions:
- **Billiards**: `Click + drag cue ball to aim. Release to shoot. Power = drag distance.`
- **Ping Pong**: `Move paddle anywhere in your half. WASD/IJKL for full movement.`
- **Soccer**: `Move player with directional keys. [Space]/[0] to dash/kick.`
- **Sumo**: `Move with directional keys. [Space]/[0] to dash. [Shift]/[Enter] to jump.`
- **Race**: `Arrow/WASD to steer. [Space]/[0] for turbo. Avoid trails. Complete 3 laps.`
- **Volleyball**: `WASD/IJKL to move. [Space]/[0] to jump. Gravity changes every 5 seconds.`

---

## ━━━ SECTION 14 — ASSET DOWNLOAD INSTRUCTIONS ━━━

### Images to download and add to `/public/assets/images/`:

1. **Space background texture** (for menu + intros):
   - Source: `opengameart.org/content/seamless-space-backgrounds` (CC0)
   - Download: any 1024×1024 nebula PNG
   - Use as: tiled/scaled background for menu screens

2. **Planet textures** (for billiard balls):
   - Source: `screamingbrainstudios.itch.io` → "2D Planet Pack" (CC0)
   - Download: at least 8 planet PNGs
   - Use as: drawImage onto ball circles (clip to arc)

3. **Spaceship sprite** (for race):
   - Source: `opengameart.org` → search "spaceship top down CC0"
   - Download: two small spaceships (one per player) or use a single sprite recolored
   - Alternative: generate procedurally (described in Section 6E)

4. **Sumo wrestler icon** (top-down):
   - Source: Procedurally drawn (described in Section 6D) — no download needed
   - Alternative: `opengameart.org` → search "sumo top down CC0"

### Audio to download and add to `/public/assets/audio/`:

1. **Space ambient**: `opengameart.org/content/space-music-2` or similar CC0 track
2. **Sci-fi SFX**: `opengameart.org/content/60-cc0-sci-fi-sfx` — full 60-SFX pack
3. **Race music**: `opengameart.org` → search "racing electronic CC0"
4. **Hit/impact sounds**: `pixabay.com/sound-effects/search/impact/` — free, no attribution

### Asset loading (add to AssetLoader or GameManager init):
```typescript
// Load images
const planetTextures = await Promise.all([
  loadImage('/assets/images/planet-mars.png'),
  loadImage('/assets/images/planet-jupiter.png'),
  // etc...
]);

// Load audio (use existing AudioManager)
await audioManager.preloadAll([
  { key: 'MENU_AMBIENT', url: '/assets/audio/space-ambient.ogg' },
  { key: 'RACE_MUSIC', url: '/assets/audio/race-electronic.ogg' },
  // etc...
]);
```

---

## ━━━ SECTION 15 — ANIMATIONS & TRANSITIONS ━━━

### Screen transitions (between any two states):
- **Out**: `ctx.globalAlpha` fades from `1.0 → 0.0` over `300ms` (draw black rect over everything)
- **In**: `ctx.globalAlpha` fades from `0.0 → 1.0` over `300ms`
- Add cosmic "warp lines" during transition: 20 white lines radiating from center, each 50–200px,
  opacity 0.0 → 1.0 → 0.0 over the transition duration

### In-game animations checklist:
- [x] Countdown numbers: easeOutElastic scale-in
- [x] Score HUD: number count-up animation on point scored (existing)
- [ ] **NEW**: Ball/orb squash-and-stretch on collision:
  - On collision: `scaleX = 1.3, scaleY = 0.75` for 3 frames, then lerp back to `(1, 1)` over 150ms
  - Requires saving `squashTimer` and `squashAxis` per ball
- [ ] **NEW**: Player damage flash:
  - When player loses a life or gets hit: flash their sprite white for 2 frames
  - Implemented by drawing a white circle/shape over the player at full opacity, then 0
- [ ] **NEW**: Velocity trail on all fast-moving objects:
  - Store last 6 positions of fast-moving objects
  - Draw them as fading circles (opacity 0.5 → 0) with 2–4px radius

### Ambient animations in menu/lobby:
- Nebula pulse: `opacity = 0.4 + 0.1 * sin(time * 0.5)` — breathing nebula
- Card shimmer: every 8 seconds, a random card gets a brief shimmer animation (gradient sweep left
  to right, white at 30% opacity, 500ms)

---

## ━━━ SECTION 16 — TYPOGRAPHY SPECIFICATION ━━━

Font loading (already in `index.html`, verify these are loaded):
```html
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet">
```

Canvas font usage standards — apply these EVERYWHERE in the codebase:
```typescript
// Titles and game names:        Orbitron 900, 64px+
// Score numbers and timers:     Orbitron 700, 32–48px
// HUD labels and identifiers:   Orbitron 400, 14–20px
// Instructions and tutorials:   Rajdhani 600, 16–20px
// Flavor text and lore:         Rajdhani 400, 14–16px, 70–80% opacity
// Status effects (STUNNED etc): Rajdhani 700, 12px

// Never use: 'monospace', 'Arial', 'sans-serif' in game UI
```

---

## ━━━ SECTION 17 — SPECIAL EFFECTS CHECKLIST ━━━

Apply these effects across the relevant games:

| Effect | Games | Implementation |
|---|---|---|
| Bloom/glow on emissive elements | ALL | `ctx.shadowBlur + shadowColor` on neon elements |
| Star trail on fast objects | Race, Ping Pong | Trailing position array, fading circles |
| Impact shockwave ring | Sumo, Soccer | Expanding circle, stroke only, fades out |
| Portal absorption spiral | Billiards | Rotating arcs converging to pocket point |
| Electricity arcs | Ping Pong paddles | Bezier curves from paddle edges, cyan |
| Saturn ring refraction | Race background | Overlapping ellipses with varying opacity |
| Gravity arrow indicator | Volleyball | Large translucent directional arrow overlay |
| Score particle burst | ALL | 20 colored particles on every score event |
| Energy shield flash | Ping Pong | White flash on paddle on hit, 2 frames |
| Turbo exhaust flare | Race | Gradient from engine, extends during boost |
| Ring danger pulse | Sumo | Red glow pulsing on ring edge as it shrinks |

---

## ━━━ SECTION 18 — BUILD ORDER ━━━

Complete upgrades in this order to minimize breaking changes:

**PHASE 1 — Foundation**
- [ ] Create `/src/core/Colors.ts` with full color constants
- [ ] Create `StarfieldBackground` class, add to `GameManager` base render
- [ ] Load Orbitron/Rajdhani fonts, update all existing `ctx.font` strings
- [ ] Add screen transition fade system to `GameManager`
- [ ] ✅ PHASE 1 COMPLETE — Visual foundation in place

**PHASE 2 — Intro & Menu**
- [ ] Build intro cinematic (typewriter text, Saturn silhouette, starfield)
- [ ] Redesign main menu (space background, card overhaul, hover animations)
- [ ] Upgrade round intro screen (lore text, animated icon)
- [ ] Upgrade countdown (colored numbers, easeOutElastic)
- [ ] ✅ PHASE 2 COMPLETE — Onboarding experience complete

**PHASE 3 — Billiards Bug Fix + Polish**
- [ ] Fix mouse drag/aim/shoot controls (verify state machine flow)
- [ ] Replace balls with planet-textured procedural drawings
- [ ] Upgrade table surface and pockets
- [ ] Add aim line visualization
- [ ] ✅ PHASE 3 COMPLETE — Billiards fully playable + themed

**PHASE 4 — Ping Pong Full Quadrant + Polish**
- [ ] Add horizontal movement to both paddles
- [ ] Upgrade ball to pulsar orb with lightning arcs
- [ ] Upgrade paddles to energy shields
- [ ] ✅ PHASE 4 COMPLETE — Ping Pong enhanced

**PHASE 5 — Volleyball Physics Fix + Polish**
- [ ] Fix ball-player collision (reflect + restitution + separation)
- [ ] Upgrade court visuals
- [ ] Add gravity direction indicator arrow
- [ ] ✅ PHASE 5 COMPLETE — Volleyball physics working

**PHASE 6 — Sumo Visuals + Polish**
- [ ] Replace player circles with procedural top-down sumo wrestlers
- [ ] Add Saturn background
- [ ] Add ring danger pulse, shockwave on collision
- [ ] ✅ PHASE 6 COMPLETE — Sumo fully themed

**PHASE 7 — Race Track Redesign**
- [ ] Rebuild track as Saturn ring (elliptical shape)
- [ ] Replace cars with spaceships
- [ ] Add Saturn planet in background
- [ ] ✅ PHASE 7 COMPLETE — Race fully themed

**PHASE 8 — Audio Pass**
- [ ] Download and add all audio files
- [ ] Implement per-game music switching in `AudioManager`
- [ ] Add all SFX triggers
- [ ] ✅ PHASE 8 COMPLETE — Full audio experience

**PHASE 9 — Polish Pass**
- [ ] Add squash-and-stretch to all balls
- [ ] Add score particle bursts everywhere
- [ ] Add screen shake to all impact events
- [ ] Upgrade round result and end screen
- [ ] Add `?` help overlay to all games
- [ ] Final pass: verify all fonts, colors, and animations consistent
- [ ] ✅ PHASE 9 COMPLETE — NEXUS ARENA BLIND BREAK READY

---

## ━━━ SECTION 19 — ACCEPTANCE CRITERIA ━━━

### Visual
- [ ] Every game has a space/cosmic background — no plain dark rectangles
- [ ] All text uses Orbitron or Rajdhani — no system fonts anywhere
- [ ] Color palette from Section 3 strictly followed
- [ ] Planet-textured billiard balls (no solid colored circles)
- [ ] Spaceships in race (no rectangles)
- [ ] Top-down sumo wrestlers (not plain circles)
- [ ] Glowing neon effect on all active game elements

### Gameplay Fixes
- [ ] Billiards: player can aim and shoot with mouse drag — working 100%
- [ ] Ping Pong: both players can move anywhere in their half
- [ ] Volleyball: ball bounces correctly off both players
- [ ] Sumo: wrestlers drawn as top-down circular character images

### Story & Narrative
- [ ] Intro cinematic plays on first load
- [ ] Every game has a lore intro sentence
- [ ] Round result and end screen include Nexari universe flavor text

### Audio
- [ ] Background music plays and changes per game
- [ ] At minimum: collision sounds, score sounds, and countdown sounds present
- [ ] No audio errors in console

### Performance
- [ ] 60 FPS stable across all games
- [ ] No new memory leaks (dispose of particles and effects)
- [ ] No breaking changes to existing gameplay logic

---

## ━━━ FINAL NOTES ━━━

This upgrade transforms BLIND BREAK from a functional but plain game collection into a
**visually stunning, narratively grounded cosmic tournament** rooted in the NEXUS ARENA universe.

The priority order if time-constrained:
1. Billiards control fix (game is broken without this)
2. Volleyball physics fix (ditto)
3. Ping Pong full-quadrant movement
4. Space backgrounds + starfield on ALL games
5. Planet balls, spaceship cars, sumo wrestlers
6. Intro cinematic + lore text
7. Audio
8. Remaining polish

**Every commit should leave the game in a playable state.**
**Never remove existing game logic — only add visual layers on top.**
