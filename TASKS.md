# Подзадачи рефакторинга

## 1. Создать `src/view.js` — GameView ✅
- [x] Canvas: `draw()`, `drawBackground()`, `drawSnake()`, `drawSnakeEyes()`, `drawFood()`
- [x] DOM: `showStart()`, `showPlaying()`, `showPaused()`, `showGameOver()`
- [x] DOM: `updateScore()`, `fetchAndRenderLeaderboard()`
- [x] DOM: leaderboard rendering (`renderLeaderboard`)
- [x] DOM: name input show/focus/reset
- [x] Events: `setupKeyboard()`, `setupTouch()`, `setupButtons()`, `setupResize()`
- [x] Resize: canvas dpr + cellSize + offsetX/Y

## 2. Переписать `src/game.js` — чистая логика ✅
- [x] Убрать draw/ отрисовку — передано в View
- [x] Убрать все `document.getElementById`
- [x] Убрать duplicate `loadHighScore()` / `refreshLeaderboard()`
- [x] Вынести `snapshotSnake()` (было prevSnake map)
- [x] Вынести константы: `MIN_SPEED`, `FOCUS_DELAY`, `HEAD_PAD`, `BODY_PAD`
- [x] `apiGet()`/`apiPost()` → `static` методы
- [x] Добавить `setView(view)` — вызывает `view.showStart()` для START
- [x] Привязать view в `start()`, `gameOver()`, `togglePause()`, `gameLoop()`, `submitScore()`, `update()`

## 3. Обновить `src/main.js` ✅
- [x] Создать экземпляры Game + GameView
- [x] Вызвать `game.setView(view)`

## 4. Обновить `index.html` ✅
- [x] Три оверлея (`#start-overlay`, `#pause-overlay`, `#game-over-overlay`) → один `#overlay`
- [x] Все id лидербордов → один `#overlay-leaderboard-list`
- [x] `#start-btn` / `#restart-btn` → `#overlay-action-btn`
- [x] `#final-score` / `#pause-score` → `#overlay-score`
- [x] `#final-best` / `#pause-best` → `#overlay-best`

## 5. Обновить `src/style.css` ✅
- [x] `:root {}` custom properties для частых цветов
- [x] Свести дублирующие id-селекторы к `.lb-section`

## 6. Сборка и проверка ✅
- [x] `docker compose up -d --build`
- [x] Проверить http://localhost:8080
