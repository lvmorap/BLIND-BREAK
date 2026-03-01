# NEXARI

**6-Game Cosmic Tournament — EA Game Jam 2025**

> _Theme: "Reinventing Competition"_

**[▶ Play Now](https://lvmorap.github.io/NEXARI/)**

<iframe width="560" height="315" src="https://www.youtube.com/embed/7rlH8M2BfO4" 
        title="YouTube video player" frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
</iframe>


---

## About

NEXARI is a local multiplayer tournament game where a **Human** faces an **Alien** across six wildly different cosmic sports. Each game reinvents a classic competition — billiards in darkness, volleyball with shifting gravity, sumo on a volcano, and more.

Play solo against AI or locally with a friend. The tournament shuffles the game order, and every win counts toward the final score.

Built entirely in the browser with **TypeScript**, **HTML Canvas**, and **zero external assets** — all audio is procedurally synthesized via the Web Audio API.

---

## The Games

| # | Game | Description |
|---|------|-------------|
| 🎱 | **Dark Nebula Billiards** | Pocket planets into black holes in a cosmic pool table shrouded in darkness. Your shot is your only light — what you reveal, the Alien sees too. Blind shots score triple. |
| 🏓 | **Pulsar Ping Pong** | A lightspeed ping-pong match aboard a pulsar station. The ball accelerates with every hit. First to lead when time runs out wins. |
| ⚽ | **Zero-G Soccer** | Soccer with no ground to stand on. Kick the ball into floating goals in a zero-gravity orbital arena. |
| 🌋 | **Volcanic Sumo** | Push the Alien off a shrinking volcanic arena. Dash attacks and shockwaves decide the battle as the ring closes in. |
| 🏎️ | **Jupiter Ring Race** | Race spaceships through Saturn's rings leaving energy trails. Hit your opponent's trail to stun them. Collect power-ups to gain an edge. |
| 🏐 | **Cosmic Volleyball** | Volleyball where gravity shifts direction every few seconds. Adapt fast or lose the rally. |

---

## Controls

### Menu Navigation

| Input | Action |
|-------|--------|
| **F** / **Right Shift** | Select VS AI mode |
| **G** / **Enter** | Select 2-Player mode |
| **WASD** | Navigate menus |
| **F** | Confirm selection |

### In-Game — Player 1 (Human)

| Input | Action |
|-------|--------|
| **W / A / S / D** | Move |
| **F** | Action 1 (kick, dash, hit, turbo) |
| **G** | Action 2 (jump, secondary action) |

### In-Game — Player 2 (Alien)

| Input | Action |
|-------|--------|
| **Arrow Keys** | Move |
| **Right Shift** | Action 1 |
| **Enter** | Action 2 |

### Dark Nebula Billiards (Special)

| Input | Action |
|-------|--------|
| **Mouse drag** | Aim from cue ball |
| **Hold mouse** | Charge power |
| **Release** | Fire |
| **ESC** | Pause |
| **T** | Tutorial |
| **C** | Colorblind mode |

---

## Tournament Flow

```
INTRO → MENU → AI SELECT → ROUND INTRO → COUNTDOWN → PLAYING → ROUND RESULT → ... → TOURNAMENT END
```

- **Tournament Mode**: 12 rounds (each game played twice in shuffled order, at 50% duration)
- **Free Play**: Pick any single game at full duration
- **Scoring**: +1 point per round win. Highest score at the end wins the tournament.

---

## Tech Stack

| | |
|---|---|
| **Language** | TypeScript 5.9 |
| **Renderer** | HTML Canvas 2D (1280×720) |
| **Bundler** | Vite 7.3 |
| **Audio** | Web Audio API (fully procedural — zero audio files) |
| **Fonts** | Orbitron + Rajdhani (Google Fonts) |
| **Deployment** | GitHub Pages via GitHub Actions |

---

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
git clone https://github.com/lvmorap/NEXARI.git
cd NEXARI
npm install
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build locally |
| `npm run typecheck` | Run TypeScript type checking (`tsc --noEmit`) |
| `npm run lint` | Run ESLint with zero warnings policy |
| `npm run format` | Auto-format code with Prettier |
| `npm run format:check` | Check formatting without modifying files |

### CI Pipeline

Every push to `main` triggers the deploy workflow:

1. **Type check** → `npm run typecheck`
2. **Lint** → `npm run lint`
3. **Format check** → `npm run format:check`
4. **Build** → `vite build`
5. **Deploy** → GitHub Pages

---

## Project Structure

```
src/
├── core/            # GameManager, InputManager, AudioManager, ParticleSystem, etc.
├── games/
│   ├── BlindBreak/  # Dark Nebula Billiards
│   ├── PingPong/    # Pulsar Ping Pong
│   ├── Soccer/      # Zero-G Soccer
│   ├── Sumo/        # Volcanic Sumo
│   ├── Formula/     # Jupiter Ring Race
│   ├── Volleyball/  # Cosmic Volleyball
│   └── IGame.ts     # Shared game interface
├── ui/              # MenuScreen, RoundIntro, TournamentHUD, EndScreen, IntroCinematic
├── types/           # Type definitions
└── main.ts          # Entry point & game registry
```

Every game implements the **IGame** interface:

```typescript
interface IGame {
  init(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  destroy(): void;
  getWinner(): 1 | 2 | null;
  isFinished(): boolean;
  setDurationMultiplier?(mult: number): void;
  setAIMode?(enabled: boolean): void;
}
```

