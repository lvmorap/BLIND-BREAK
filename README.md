# BLIND BREAK

**Billiards in the Dark — EA Game Jam 2025**
_Theme: "Reinventing Competition"_

---

## The Premise

In real billiards, both players see the entire table at all times. Perfect information is assumed. Strategy is purely geometric.

**BLIND BREAK** removes perfect information as a given. The table is shrouded in darkness. Your shot is your only light source — as the ball rolls, everything it passes over gets revealed. But what you reveal, your opponent now sees too. Shooting blind scores triple. Information is dangerous.

Seeing the table is a choice, and every choice has a cost.

---

## The Setting

The game takes place in an underground, noir pool hall. A dark room with faint brick walls, warm amber wall sconces, and two overhead pendant lamps that cast permanent pools of golden light onto the center-left and center-right of the table — the only orientation reference in the darkness.

Above the table, a neon sign reads **"BLIND BREAK"** in hot pink-red, flickering with a subtle oscillation and occasional random full flicker. The atmosphere is key: this is not a bright arcade game — it is a tense, moody experience in a noir underground club.

The table itself features deep forest green felt with subtle grain texture, mahogany rails with brass accent lines, and six pockets — four at the corners and two centered on the long rails. Each pocket appears as a dark void with a subtle inner glow ring and leather cushion rims.

The entire scene breathes. The overhead lamps pulse gently in brightness. A micro-vignette at the canvas edges oscillates slowly. Ambient dust particles drift lazily upward. Even when nothing is happening, the room feels alive.

---

## How to Play

### Controls

| Input                    | Action                              |
| ------------------------ | ----------------------------------- |
| **Mouse drag from ball** | Aim direction                       |
| **Hold mouse button**    | Charge shot power                   |
| **Release**              | Fire                                |
| **ESC**                  | Pause (Resume / Restart / Tutorial) |
| **T**                    | View tutorial                       |
| **C**                    | Toggle colorblind mode              |
| **SPACE**                | Menu navigation / advance tutorial  |

### Aiming

When it's your turn, drag from the cue ball to aim. A flowing dashed line in electric cyan extends from the cue ball in the aimed direction, its length proportional to your current power level. If the aim line would hit a cushion, a dimmer reflection preview shows where the ball would bounce (one bounce maximum).

If the aim line would hit an illuminated ball, a small circle appears at the predicted impact point with a short arrow showing where that ball would travel. This prediction only works for lit balls — you cannot predict trajectories in the dark. That's the game.

### Power

While holding the mouse button, a vertical power bar on the left edge fills from bottom to top. The bar transitions from green (low) through yellow (mid) to red (max). At full power, the bar overflows with a white glow and electric sparks radiate from the cue ball. Releasing fires at the current power level.

The cue ball pulses and scales up slightly while charging, surrounded by an electric ring that shifts color with power level — cyan at low, yellow at mid, red at maximum.

---

## The Core Mechanic: Darkness & Light

This is the heart of BLIND BREAK.

### The Darkness

The entire table is covered in a near-black fog. You cannot see where the balls are. The only way to see through the darkness is through **illumination** — areas recently passed over by a rolling ball.

### How Light Works

Every rolling ball leaves behind an illuminated trail as it moves. The cue ball creates a wider, brighter trail; object balls leave dimmer, narrower trails. These light zones punch holes in the darkness, revealing what's beneath.

Two permanent light zones exist under the overhead lamps (center-left and center-right of the table). These help orient you and give a reference frame. The six pockets also have a subtle permanent dim glow — they must always be findable, otherwise the game is unplayably frustrating.

### Light Fading (Turn-Based, Not Time-Based)

Illumination doesn't fade in real time. It fades round by round:

| Age of Light Zone   | Visibility              |
| ------------------- | ----------------------- |
| Current round       | Full intensity          |
| 1 round ago         | Half intensity          |
| 2 rounds ago        | Ghost intensity         |
| Older than 2 rounds | Gone — darkness returns |

A **round** means one complete cycle where both the player AND the opponent have taken a turn.

### Ghost Balls

When a ball's illumination expires, it doesn't just vanish. Instead, a **ghost** appears — a faint circle outline at the ball's **last known position** (where it was when last illuminated).

The ghost does NOT update as the ball physically moves in the dark. If you shoot toward a ghost but the ball moved since it was last seen, you miss. This is intentional. This IS the mechanic — memory is unreliable, and the dark plays tricks.

Ghost outlines are clearly different from real balls: no fill, no glow, just a faint white outline at low opacity.

---

## The Balls

BLIND BREAK uses a simplified set optimized for the core experience:

- **1 Cue Ball** — cream white with a subtle inner gradient, always visible (it's your active piece, never hidden by darkness). The cue ball has a permanent outer glow and leaves the brightest trail.
- **7 Object Balls** — neon-colored with a geometric aesthetic:

| Ball | Color       |
| ---- | ----------- |
| 1    | Neon Red    |
| 2    | Neon Orange |
| 3    | Neon Yellow |
| 4    | Neon Green  |
| 5    | Neon Blue   |
| 6    | Neon Purple |
| 7    | Neon Pink   |

Each ball looks like a polished sphere with highlights, shading, and a ground shadow — not a flat circle. When lit, balls glow with their color. When in complete darkness, they are invisible. When their light expires, only a ghost outline remains.

### Starting Positions

The 7 object balls begin in a triangle rack formation in the center-right area of the table, tip pointing toward the player. The cue ball starts at the "baulk" position — the left quarter of the table, centered vertically.

### Ball Physics

The balls move with realistic 2D billiards physics:

- **Friction** causes smooth, gradual deceleration — balls don't stop suddenly
- **Cushion bounces** absorb some energy on each impact
- **Ball-to-ball collisions** transfer momentum realistically — hit a cluster and balls spread in different directions at different speeds
- **Squash & stretch** deformation on impact makes collisions feel physical
- **Motion blur trails** appear behind fast-moving balls (ghost copies at decreasing opacity)
- When a ball's speed drops below a minimum threshold, it stops cleanly — no stuttering

---

## Scoring System — The Reinvention

In normal billiards: more precision = more points.
In BLIND BREAK: **more darkness = more points**. Risk is the currency.

The scoring tier is evaluated at the moment a ball is pocketed, based on the visibility conditions:

### Scoring Tiers

| Tier              | Condition                                     | Points | Visual Feedback                                                                            |
| ----------------- | --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| **BLIND POCKET**  | Ball was in complete darkness                  | **+3** | Gold "+3 BLIND!" text, golden particle burst, massive screen shake, slow motion            |
| **SHADOW POCKET** | Ball was in ghost zone (expired illumination)  | **+2** | Silver "+2 SHADOW" text, silver particles                                                  |
| **LIT POCKET**    | Ball was in active illumination                | **+1** | "+1" text in ball's color, subtle glow pulse                                               |
| **RECON POCKET**  | Ball pocketed during a Recon Shot              | **0**  | No score popup — the trade was information, not points                                     |
| **SCRATCH**       | Cue ball pocketed                              | **-1** | Red "-1 SCRATCH" flashing text, heavy screen shake, red flash overlay                      |

Score popups float upward from the pocket location and fade out. The text size varies by tier — BLIND is the largest and most dramatic, LIT is the most subdued.

### The Blind Pocket — The Hero Moment

Pocketing a ball in complete darkness is the most rewarding moment in the game. When it happens:

1. Time slows to 25% speed for 300 milliseconds
2. A golden particle explosion bursts from the pocket
3. The screen shakes with maximum intensity
4. A triumphant three-note chord plays
5. The "+3 BLIND!" text appears in large gold letters

This moment of slow time and sensory overload says "that was important" — it makes blind shots feel epic and worth the risk.

### Scratch Penalty

If you pocket the cue ball:

- Lose 1 point
- Cue ball respawns at the baulk position
- Your opponent gets a free shot bonus (maximum power unlocked for their next shot)

---

## The Recon Shot — Strategic Sacrifice

Each player gets exactly **one Recon shot per game**. It's a sacrifice: you give up your turn to gather information.

When activated, the shot doesn't hit any balls. Instead, three light beams spread across the table (main direction ± 25°), illuminating dark zones and revealing hidden ball positions. The RECON button in the top-left shows "USED" (grayed out) after use.

The strategic question: **when do you use it?** Early, to plan your approach? Late, to find the last hidden balls? The timing matters.

Hovering over the RECON button shows a tooltip:

> _"SACRIFICE THIS TURN to illuminate dark zones. One use only. Choose wisely."_

---

## Turn System

The game alternates between player and opponent:

### 1. Aiming Phase

You position and aim your shot. A 5-second turn timer applies.

### 2. Rolling Phase

Balls are in motion. The light map updates in real time as balls roll, revealing the table. Pockets detect incoming balls. No input is accepted during this phase. The phase ends when all balls have fully stopped.

### 3. Turn Resolution

Pocketed balls are scored. The round counter updates if both players have gone. Old illumination zones fade per the round-based rules. Win condition is checked. Turn passes to the opponent.

### 4. Opponent's Turn

The cycle repeats.

---

## The AI Opponent

The AI plays as the second player. It has a 1.2-second "thinking" delay before each shot — during which a small animated eye icon appears near its score, with its pupil scanning across the table and pausing on illuminated balls. A subtle dotted arc connects the eye to whichever ball it's focused on.

### Fair Play: The AI Does NOT Cheat

The AI uses the **exact same fog of war rules** as the player. It can only aim at balls that are currently illuminated or in ghost zones. It does NOT have perfect information. This is critical — it must play fair.

### AI Behavior States

The AI has four behaviors, chosen based on what it can see:

| State              | Trigger                                            | Behavior                                                                          |
| ------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Hunt Lit**       | Illuminated balls exist                            | Aims at the best ball-to-pocket angle, moderate power                             |
| **Hunt Ghost**     | No lit balls, but ghost positions exist             | Aims toward ghost position with ±12° random variance (guessing from memory)       |
| **Recon Scout**    | It's the AI's designated recon round (3 or 4)      | Uses its one-time Recon shot to illuminate the table                              |
| **Random Probe**   | Completely blind — no lit, no ghosts               | Aims toward the center of the original rack position with ±30° variance (fishing) |

### AI Difficulty

The AI is purposely imperfect. The ±12° variance in ghost hunting and the rigid recon timing make it beatable. The AI doesn't respond to the score — it only responds to visibility. A skilled player who manages information carefully can consistently outperform it. This is the correct design.

---

## Match Structure

| Parameter          | Value                                                                      |
| ------------------ | -------------------------------------------------------------------------- |
| **Match length**   | 7 rounds (both players shoot each round = 14 total turns)                  |
| **Win condition**  | Highest score after all 7 balls are pocketed OR all 7 rounds complete      |
| **Tie condition**  | Equal scores = "DEAD EVEN" special ending                                  |
| **Early finish**   | If all 7 balls are pocketed before round 7, the game ends immediately      |

---

## Game Screens

### Start Screen

The game table is live and visible in the background — empty, dark, with the permanent lamp cones glowing. The neon sign flickers above. Two columns display:

**THE RULES:**

- Your shot is your only light
- What you reveal, they see too
- Ghosts show where balls were — not where they are
- Pocket in darkness. Score triple.

**CONTROLS:**

- Mouse drag — aim direction
- Hold button — charge power
- Release — shoot
- ESC — pause | T — tutorial

_"PRESS SPACE TO BEGIN"_ pulses at the bottom. Small text reads: _"vs AI · 7 Rounds · First to most points wins."_

### Countdown

**3 → 2 → 1 → BREAK!** Each number appears large and centered, scaling down with a glow burst. "BREAK!" appears in gold with a particle explosion and a billiard-crack sound.

### End Screen

For the first time in the game, the full table is **completely lit** — revealing all remaining ball positions as a dramatic reveal. Final scores display large and centered with winner text:

| Outcome            | Message                       |
| ------------------ | ----------------------------- |
| Player wins by 3+  | "YOU WIN — MASTER OF SHADOWS" |
| Player wins by 1-2 | "YOU WIN — CLOSE GAME"        |
| AI wins            | "AI WINS — PRACTICE MORE"     |
| Tie                | "DEAD EVEN — WELL PLAYED"     |

A stats panel shows the breakdown: Blind Shots, Shadow Shots, and Lit Shots for both player and AI. Press SPACE to play again.

---

## Interactive Tutorial

The tutorial runs on first load and teaches the game in 5 interactive steps, each with animated demonstrations directly on the table — not a text wall.

### Step 1 — The Shot

_"Drag to aim. Hold to charge power."_
An animated hand approaches the cue ball, drags to aim, and the power bar fills.

### Step 2 — The Darkness

_"The table is dark. You can't see what you can't reach."_
The table starts fully lit, then darkness slowly closes in over 2 seconds until only the lamp cones remain.

### Step 3 — Your Shot Is Your Light

_"Rolling reveals. Everything you light, they see too."_
A pre-scripted shot sends the cue ball across the table, illuminating a trail in real time. Object balls appear as it passes them.

### Step 4 — Ghost Memory

_"Ghosts fade. They remember where it was — not where it went."_
A ball is visible, then darkness covers it. A ghost outline remains — and slowly drifts slightly off from the ball's true position.

### Step 5 — Scoring

Three scenarios play side by side:

- **Left:** Ball pocketed in light → "+1 LIT" (muted)
- **Center:** Ball pocketed from ghost memory → "+2 SHADOW" (brighter)
- **Right:** Ball pocketed in pure darkness → "+3 BLIND!" (gold explosion)

_"Shooting blind scores more. Darkness is your ally."_

After step 5: **"LET'S PLAY"** appears. The tutorial can be replayed anytime via the pause menu or by pressing T.

---

## In-Game Coaching

Instructions live inside the game world as contextual annotations — not separate UI screens.

### First Shot (Round 1 Only)

A pulsing arrow bounces above the cue ball: _"DRAG FROM BALL TO AIM"_. When you start charging, text appears near the power bar: _"HOLD TO CHARGE → RELEASE TO SHOOT"_. These never appear again after round 1.

### Scoring Reminder (Round 1 Only)

When a ball first enters darkness, a floating callout connects to the ghost ball: _"SHOOT BLIND → 3 PTS ⚡"_. Auto-dismisses after 4 seconds or when you shoot.

### Round Transitions

Between rounds, a brief narrative message appears in the center of the table:

| Transition  | Message            |
| ----------- | ------------------ |
| Round 1 → 2 | "DARKNESS DEEPENS" |
| Round 3 → 4 | "TRUST YOUR MEMORY" |
| Round 5 → 6 | "FINAL SHADOWS"    |
| Final round | "LAST SHOT" (with screen shake) |

These narrations make the match feel like a story arc with rising tension.

---

## Game Feel & Effects

Every player action has layered feedback — visual effects, screen response, and sound working together:

### Screen Shake

Proportional to impact significance:

- **Cue ball launch** (high power): light shake
- **Ball collision** (high speed): medium shake
- **Pocket sink**: strong shake
- **Blind pocket** (3 pts): maximum shake — the big payoff
- **Scratch**: heavy, punishment-style shake

### Slow Motion

Blind pocket triggers a brief time-dilation: everything slows to 25% speed for 300ms, then smoothly returns to normal. A dark vignette appears at the canvas edges during this moment.

### Chromatic Aberration

High-power collisions trigger a brief RGB split effect — a professional-feeling visual hit that lasts just 3 frames.

### Pocket Animation

When a ball is pocketed, it scales down to nothing, emits particles in its color, and its number bounces out of the pocket as a large floating digit.

### Particle Effects

- **Pocket bursts** — colored particles spray from sunk balls
- **Golden explosion** — blind pocket celebration
- **Ball trails** — tiny particles follow fast-moving balls
- **Ambient dust** — slow-drifting particles create underground atmosphere

### Sound Design

All sounds are synthesized — no audio files. The soundtrack is the room itself:

| Sound              | Description                                            |
| ------------------ | ------------------------------------------------------ |
| **Cue strike**     | Sharp noise burst when the cue ball is launched        |
| **Ball collision** | Quick click tone on each ball-to-ball impact           |
| **Cushion bounce** | Lower tone on wall impacts                             |
| **Pocket sink**    | Descending tone sweep — the ball falling into the void |
| **Blind bonus**    | Ascending three-note chord — the triumph sound         |
| **Ambient hum**    | Very low-frequency drone with tremolo — the room itself breathes |

Sound is an enhancement, never a requirement. The game plays fully with sound off.

---

## Accessibility

### Colorblind Mode (Press C)

Toggles distinct shape markers inside each ball so they're identifiable without relying on color alone. An on-screen notification confirms the toggle.

### Visual Safety

All animated flashes (chromatic aberration, screen shake, red scratch flash) are capped at safe intensities and brief durations.

### Pause System

ESC opens a full pause overlay with three options: Resume, Restart, Tutorial. The game world freezes completely during pause.

### Input Gating

During the rolling phase (balls in motion), all player input is completely ignored. The cursor changes to indicate the non-interactive state. You cannot accidentally fire a shot while physics are resolving.

---

## Edge Cases & Special Rules

- **All 7 balls pocketed early:** Game ends immediately — highest score wins. No need to play remaining rounds.
- **Last ball pocketed on a blind shot:** Full celebration plays (slow motion, gold particles) THEN the end screen appears — no abrupt cut.
- **Cue ball stuck near a wall:** Automatically repositioned slightly toward center to prevent dead states.
- **Attempting to aim during rolling phase:** Input completely ignored.
- **Opponent's free shot after scratch:** Maximum cue ball power is unlocked for their next turn.

---

## The Philosophy

BLIND BREAK reinvents billiards competition by making **information the primary resource**. In traditional pool, skill means geometry — calculating angles with full visibility. Here, skill means **managing what you know and what you reveal**.

Every shot is a dilemma:

- Shoot through darkness for triple points, risking a miss?
- Illuminate the table to find balls, giving your opponent the same intel?
- Save your Recon for the final rounds, or use it now when you're blind?
- Trust a ghost's position, or probe to update your information?

The best players aren't the best aimers — they're the best **information managers**. They remember where balls were, calculate where they might have drifted, and choose darkness over light when the risk-reward is right.

**Darkness is your ally. The dark rewards the brave.**
