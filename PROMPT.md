# BLIND BREAK — NEXUS ARENA UNIVERSE: UPGRADE PROMPT

> All sections below have been **✅ IMPLEMENTED**.

## ━━━ ALL SECTIONS — ✅ IMPLEMENTED ━━━

> - **Sections 0–5**: Universe narrative, intro cinematic, main menu redesign, color palette (Colors.ts), game card redesign, round intro screen.
> - **Section 6A — Dark Nebula Billiards**: Space nebula background, planet-textured balls, cosmic table surface, glowing purple portal pockets, energy beam aim line, mouse drag controls, cue stick energy beam.
> - **Section 6B — Pulsar Ping Pong**: Star streaks background, neon grid floor, energy shield paddles with scanline texture, pulsar orb ball with lightning arcs, full quadrant movement, paddle collision physics.
> - **Section 6C — Zero-G Soccer**: Space station interior with hexagonal grid floor, orange hazard stripes, holographic soccer ball with pentagon pattern, purple portal goal frames, capsule-shaped space-suited players.
> - **Section 6D — Sumo Orbital**: Saturn background with procedural rings, golden orbital platform, radial gradient arena surface, pulsing red danger overlay, golden sparks, procedural top-down sumo wrestlers.
> - **Section 6E — Saturn Ring Race**: Deep space background with Saturn planet, amber/gold banded track with golden glow edges, procedural spaceship silhouettes (arrowhead hull, wing fins, engines), themed power-ups (vortex, lightning, hexagon), holographic start/finish line.
> - **Section 6F — Cosmic Volleyball**: Cosmic particle field background, metallic platform court, energy barrier net (#9b00ff → #ff00ff gradient), cosmic orb ball with orbital ring, space-suited players, ball-player collision physics with reflection/restitution/separation, gravity change visual effects.
> - **Section 7 — Shared Visual Systems**: StarfieldBackground class, screen shake in all games (Soccer goals, Volleyball scoring, Sumo collisions, PingPong scoring), particle bursts on score, score scale animation.
> - **Section 8 — HUD**: Orbitron/Rajdhani fonts throughout, timer pulse when ≤10s with danger color, score display with player colors.
> - **Section 9 — Audio**: Synthesized per-game ambient music via Web Audio API (oscillators + LFOs), SFX triggers (score, countdown, hit, whoosh), game music auto-starts/stops with game transitions.
> - **Section 10 — Countdown**: Color-coded numbers (3=red, 2=yellow, 1=cyan, GO!=green), easeOutElastic scale animation, Orbitron 900 120px.
> - **Section 11 — Round Result**: Darkened overlay, winner declaration, random Nexari flavor text, score scale animation.
> - **Section 12 — Tournament End**: Winner display, random Nexari cosmic lore messages.
> - **Section 13 — Tutorial**: ? key / F1 help overlay with per-game controls table, P1/P2 controls, close with ? or ESC.
> - **Section 15 — Animations & Transitions**: Screen transitions with warp lines, countdown easeOutElastic, ball trails.
> - **Section 16 — Typography**: Orbitron (titles, scores, HUD) and Rajdhani (instructions, flavor text) used throughout.
> - **Section 17 — Special Effects**: Bloom/glow on emissive elements, star trails, gravity arrow indicator, score particle bursts, ring danger pulse, engine trails, lightning arcs.
**Never remove existing game logic — only add visual layers on top.**
