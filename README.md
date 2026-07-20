# Snake Game

Browser-based Snake game built with vanilla JavaScript, Canvas 2D, and Vite, served via an Express backend and Docker.

## Quick start

```bash
docker compose up -d --build
```

Open http://localhost:8080

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

## Development

```bash
# Build and run in Docker (do NOT run directly on host)
docker compose up -d --build

# Rebuild after changes
docker compose up -d --build
```

## Tech stack

- **Frontend**: Vanilla JS, Canvas 2D, CSS
- **Build**: Vite
- **Backend**: Node.js / Express
- **Container**: Docker, docker-compose
