# Snake Game

Browser-based Snake game built with vanilla JavaScript, Vite, and Express.

## Tech stack

- **Frontend**: Vanilla JS, Canvas 2D, CSS
- **Build**: Vite
- **Backend**: Node.js / Express (API + static serving)
- **Container**: Docker, docker-compose
- **Persistence**: JSON file at `./data/leaderboard.json` (bind-mounted volume), obfuscated via XOR + Base64

## Project structure

```
.
├── index.html          # Entry point with overlays (start, pause, game over)
├── package.json        # Dependencies: express, vite
├── vite.config.js      # Vite config (base: './')
├── server.js           # Express server: static files + leaderboard API
├── Dockerfile          # Multi-stage: Vite build → Node.js runtime
├── docker-compose.yml  # Port 8080:80, volume ./data:/data
├── .gitignore          # node_modules, dist, data
├── AGENTS.md           # This file
├── README.md           # Project README
├── src/
│   ├── main.js         # Entry point, DOM event wiring
│   ├── game.js         # Game engine (loop, rendering, collision, leaderboard)
│   └── style.css       # All styles
└── data/               # Bind-mounted, NOT committed to git
    └── leaderboard.json # Obfuscated leaderboard data
```

## IMPORTANT for AI agents

- This application MUST be built and run ONLY inside Docker.
- Do NOT run `npm run dev`, `npm run build`, or `npm run preview` directly on the host.
- To build and run: `docker compose up -d --build`
- To stop: `docker compose down`
- The game will be available at http://localhost:8080
- **After making any code changes**, rebuild and restart (`docker compose up -d --build`). Then suggest testing at http://localhost:8080.

## Controls

- Arrow keys / WASD to change direction
- `Esc` to pause / resume
- Touch/swipe on mobile devices
- Enter / Space to start or restart
- Enter to submit name on game over (when input focused)
- Click "Start Game" / "Play Again" buttons

## Game states

| State | Description |
|-------|-------------|
| `START` | Initial screen, shows leaderboard + start button |
| `PLAYING` | Active gameplay with smooth interpolation |
| `PAUSED` | Paused via Esc, shows leaderboard |
| `GAME_OVER` | Collision, shows score + leaderboard + name input if qualifies |

## Key features

### Smooth movement
Snake segments interpolate between grid cells each frame using `t = accumulator / tickSpeed`. Previous positions stored in `prevSnake`, updated each tick in `update()`.

### Leaderboard
- Top 10 scores, stored in `/data/leaderboard.json` on the server.
- File is obfuscated (XOR with key + Base64) — see `server.js` `obfuscate()`/`deobfuscate()`.
- API: `GET /api/leaderboard` returns sorted array, `POST /api/leaderboard { name, score }` adds entry.
- Docker volume `./data:/data` ensures persistence across restarts.
- Leaderboard shown on start screen, pause screen, and game over screen.
- If score qualifies for top 10, name input appears on game over.

### Pause
Press `Esc` to toggle pause. Game loop stops, accumulator resets on resume to prevent catch-up ticks. Leaderboard fetched fresh on each pause.

### Delta capping
`gameLoop` caps delta to `tickSpeed * 3` to prevent large jumps when returning from background tab.

## API

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/leaderboard` | — | `[{ name, score }, ...]` (sorted desc) |
| POST | `/api/leaderboard` | `{ name, score }` | Updated array (max 10 entries) |

## Code style

- No comments in source code unless asked.
- Follow existing patterns (ES modules, `const`/`let`, arrow functions, async/await).
- CSS: no framework, custom properties, `clamp()` for responsive sizing.

## Git

- `.gitignore` excludes: `node_modules/`, `dist/`, `data/`, `*.log`
- The `data/` directory is a bind-mounted Docker volume — never commit it.
- Write concise commit messages matching the repo style.
