# Snake Game

This is a browser-based Snake game built with vanilla JavaScript and Vite.

## IMPORTANT for AI agents

- This application MUST be built and run ONLY inside Docker.
- Do NOT run `npm run dev`, `npm run build`, or `npm run preview` directly on the host.
- To build and run: `docker compose up -d --build`
- To stop: `docker compose down`
- The game will be available at http://localhost:8080
- **After making any code changes**, rebuild and restart (`docker compose up -d --build`). Then suggest testing at http://localhost:8080.

## Controls

- Arrow keys or WASD to change direction
- Touch/swipe on mobile devices
- Click "Play Again" or press Enter/Space after game over
