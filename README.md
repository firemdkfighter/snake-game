# Snake Game

Browser-based Snake game built with vanilla JavaScript, Canvas 2D, and Vite, served via an Express backend and Docker.

## Quick start

```bash
docker compose up -d --build
```

Open <http://localhost:8080>

## Stop

```bash
docker compose down
```

## Controls

| Key | Action |
|-----|--------|
| Arrow keys / WASD | Change direction |
| `Esc` | Pause / resume |
| Enter / Space | Start game or restart after game over |
| Enter (on game over) | Submit name (when input focused) |
| Touch / swipe | Mobile controls |
| Click "Start Game" | Start from initial screen |
| Click "Play Again" | Restart from game over |

## Game states

- **START** — initial screen with leaderboard and start button
- **PLAYING** — active gameplay with smooth interpolation
- **PAUSED** — paused via Esc, shows leaderboard
- **GAME_OVER** — collision detected, shows score, leaderboard, and name input if score qualifies for top 10

## Leaderboard

Top 10 scores are persisted on the server at `/data/leaderboard.json` (Docker bind-mounted volume). The file is obfuscated via XOR + Base64. Leaderboard is shown on the start, pause, and game over screens.

### API

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/leaderboard` | — | `[{ name, score }, ...]` (sorted desc) |
| POST | `/api/leaderboard` | `{ name, score }` | Updated array (max 10 entries) |

## Project structure

```text
.
├── index.html          # Entry point with overlays (start, pause, game over)
├── package.json        # Dependencies: express, vite
├── vite.config.js      # Vite config (base: './')
├── server.js           # Express server: static files + leaderboard API
├── Dockerfile          # Multi-stage: Vite build → Node.js runtime
├── docker-compose.yml  # Port 8080:80, volume ./data:/data
├── .gitignore          # node_modules, dist, data
├── AGENTS.md           # AI agent instructions
├── README.md           # This file
├── src/
│   ├── main.js         # Entry point, dependency injection
│   ├── game.js         # Game model (state, snake, collision, scoring)
│   ├── game-loop.js    # Game loop (requestAnimationFrame, fixed timestep)
│   ├── input-handler.js # Keyboard and touch input handling
│   ├── view.js         # Canvas rendering and DOM overlay management
│   ├── api.js          # Leaderboard API client (fetch wrapper)
│   └── style.css       # All styles
└── data/               # Bind-mounted, NOT committed to git
    └── leaderboard.json # Obfuscated leaderboard data
```

## Tech stack

- **Frontend**: Vanilla JS, Canvas 2D, CSS
- **Build**: Vite
- **Backend**: Node.js / Express
- **Container**: Docker, docker-compose
