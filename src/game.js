import { COLS, ROWS, BASE_SPEED, SPEED_INCREASE, MIN_SPEED, DIRS, OPPOSITE } from './constants.js'
import { getLeaderboard, submitScore, scoreQualifies } from './api.js'

export class Game {
  constructor() {
    this.state = 'START'
    this.score = 0
    this.highScore = 0
    this.direction = 'RIGHT'
    this.nextDirection = 'RIGHT'
    this.accumulator = 0
    this.tickSpeed = BASE_SPEED
    this.leaderboardEntries = []
    this.nameSubmitted = false
    this.view = null
    this.loop = null
    this.initSnake()
    this.loadHighScore()
  }

  setView(view) {
    this.view = view
    if (this.state === 'START') {
      view.showStart()
      view.renderStatic(this.snake, this.direction)
    }
  }

  setLoop(loop) {
    this.loop = loop
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
    const entries = await getLeaderboard()
    this.leaderboardEntries = entries
    if (entries.length > 0) {
      this.highScore = entries[0].score
    }
  }

  async saveScore(name, score) {
    const entries = await submitScore(name, score)
    this.leaderboardEntries = entries
    if (entries.length > 0) {
      this.highScore = entries[0].score
    }
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
    this.initSnake()
    this.food = this.spawnFood()
    this.view.showPlaying()
    this.view.updateScore(0)
    this.loop.start()
  }

  async gameOver() {
    this.state = 'GAME_OVER'
    if (this.score > this.highScore) {
      this.highScore = this.score
    }
    const entries = await getLeaderboard()
    this.leaderboardEntries = entries
    const qualifies = this.score > 0 && scoreQualifies(this.score, entries)
    if (qualifies) {this.nameSubmitted = false}
    this.view.showGameOver(this.score, this.highScore, entries, qualifies)
  }

  spawnFood() {
    const occupied = new Set(this.snake.map(s => `${s.x},${s.y}`))
    const free = []
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        if (!occupied.has(`${x},${y}`)) {free.push({ x, y })}
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

  async togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED'
      this.view.showPaused(this.score, this.highScore)
      const entries = await getLeaderboard()
      this.view.renderLeaderboard('overlay-leaderboard-list', entries)
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING'
      this.view.showPlaying()
      this.accumulator = 0
      this.loop.start()
    }
  }

  async submitScore() {
    if (this.nameSubmitted) {return}
    this.nameSubmitted = true
    const name = this.view.getNameInput()
    const entries = await this.saveScore(name, this.score)
    const idx = entries.findIndex(e => e.name === name && e.score === this.score)
    this.view.renderLeaderboard('overlay-leaderboard-list', entries, idx >= 0 ? idx : -1)
    this.view.showNameInput(false)
  }
}
