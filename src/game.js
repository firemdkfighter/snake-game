export const COLS = 20
export const ROWS = 20

const BASE_SPEED = 150
const SPEED_INCREASE = 2
const MIN_SPEED = 60
const MAX_LEADERS = 10

const DIRS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}

const OPPOSITE = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
}

export class Game {
  constructor() {
    this.state = 'START'
    this.score = 0
    this.highScore = 0
    this.direction = 'RIGHT'
    this.nextDirection = 'RIGHT'
    this.lastUpdate = 0
    this.accumulator = 0
    this.tickSpeed = BASE_SPEED
    this.leaderboardEntries = []
    this.nameSubmitted = false
    this.view = null
    this.initSnake()
    this.gameLoop = this.gameLoop.bind(this)
    this.loadHighScore()
  }

  setView(view) {
    this.view = view
    if (this.state === 'START') {
      view.showStart()
    }
  }

  initSnake() {
    const midX = Math.floor(COLS / 2)
    const midY = Math.floor(ROWS / 2)
    this.snake = [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY },
    ]
    this.snapshotSnake()
  }

  snapshotSnake() {
    this.prevSnake = this.snake.map(s => ({ x: s.x, y: s.y }))
  }

  async loadHighScore() {
    const entries = await Game.apiGet()
    this.leaderboardEntries = entries
    this.updateHighScoreFromEntries(entries)
  }

  updateHighScoreFromEntries(entries) {
    if (entries.length > 0) {
      this.highScore = entries[0].score
    }
  }

  scoreQualifies(score, entries) {
    return entries.length < MAX_LEADERS || score > entries[entries.length - 1].score
  }

  async saveScore(name, score) {
    const entries = await Game.apiPost(name, score)
    this.leaderboardEntries = entries
    this.updateHighScoreFromEntries(entries)
    return entries
  }

  setDirection(dir) {
    if (dir !== OPPOSITE[this.direction]) {
      this.nextDirection = dir
    }
  }

  start() {
    this.state = 'PLAYING'
    this.score = 0
    this.nameSubmitted = false
    this.direction = 'RIGHT'
    this.nextDirection = 'RIGHT'
    this.tickSpeed = BASE_SPEED
    this.accumulator = 0
    this.initSnake()
    this.food = this.spawnFood()
    this.view.showPlaying()
    this.view.updateScore(0)
    this.lastUpdate = performance.now()
    requestAnimationFrame(this.gameLoop)
  }

  async gameOver() {
    this.state = 'GAME_OVER'
    if (this.score > this.highScore) {
      this.highScore = this.score
    }
    const entries = await Game.apiGet()
    this.leaderboardEntries = entries
    const qualifies = this.score > 0 && this.scoreQualifies(this.score, entries)
    if (qualifies) this.nameSubmitted = false
    this.view.showGameOver(this.score, this.highScore, entries, qualifies)
  }

  spawnFood() {
    const occupied = new Set(this.snake.map(s => `${s.x},${s.y}`))
    const free = []
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        if (!occupied.has(`${x},${y}`)) free.push({ x, y })
      }
    }
    return free[Math.floor(Math.random() * free.length)]
  }

  update() {
    this.snapshotSnake()
    this.direction = this.nextDirection
    const dir = DIRS[this.direction]
    const head = this.snake[0]
    const nx = head.x + dir.x
    const ny = head.y + dir.y

    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
      this.gameOver()
      return
    }

    if (this.snake.some(s => s.x === nx && s.y === ny)) {
      this.gameOver()
      return
    }

    this.snake.unshift({ x: nx, y: ny })

    if (nx === this.food.x && ny === this.food.y) {
      this.score++
      this.tickSpeed = Math.max(MIN_SPEED, BASE_SPEED - this.score * SPEED_INCREASE)
      this.view.updateScore(this.score)
      this.food = this.spawnFood()
    } else {
      this.snake.pop()
    }
  }

  gameLoop(timestamp) {
    if (this.state !== 'PLAYING') return

    const delta = Math.min(timestamp - this.lastUpdate, this.tickSpeed * 3)
    this.lastUpdate = timestamp
    this.accumulator += delta

    while (this.accumulator >= this.tickSpeed) {
      this.accumulator -= this.tickSpeed
      this.update()
      if (this.state !== 'PLAYING') break
    }

    this.view.draw(this)
    requestAnimationFrame(this.gameLoop)
  }

  async togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED'
      this.view.showPaused(this.score, this.highScore)
      const entries = await Game.apiGet()
      this.view.renderLeaderboard('overlay-leaderboard-list', entries)
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING'
      this.view.showPlaying()
      this.lastUpdate = performance.now()
      this.accumulator = 0
      requestAnimationFrame(this.gameLoop)
    }
  }

  async submitScore() {
    if (this.nameSubmitted) return
    this.nameSubmitted = true
    const name = this.view.getNameInput()
    const entries = await this.saveScore(name, this.score)
    const idx = entries.findIndex(e => e.name === name && e.score === this.score)
    this.view.renderLeaderboard('overlay-leaderboard-list', entries, idx >= 0 ? idx : -1)
    this.view.showNameInput(false)
  }

  static async apiGet() {
    try {
      const res = await fetch('/api/leaderboard')
      if (!res.ok) return []
      return await res.json()
    } catch {
      return []
    }
  }

  static async apiPost(name, score) {
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim().slice(0, 20) || 'Player', score }),
      })
      if (!res.ok) return []
      return await res.json()
    } catch {
      return []
    }
  }
}
