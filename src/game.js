const COLS = 20
const ROWS = 20
const BASE_SPEED = 150
const SPEED_INCREASE = 2

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

const MAX_LEADERS = 10

async function apiGet() {
  try {
    const res = await fetch('/api/leaderboard')
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

async function apiPost(name, score) {
  try {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score }),
    })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export class Game {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
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
    this.initSnake()
    this.gameLoop = this.gameLoop.bind(this)
    this.resize = this.resize.bind(this)
    this.handleKey = this.handleKey.bind(this)
    this.init()
  }

  initSnake() {
    const midX = Math.floor(COLS / 2)
    const midY = Math.floor(ROWS / 2)
    this.snake = [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY },
    ]
  }

  init() {
    window.addEventListener('resize', this.resize)
    document.addEventListener('keydown', this.handleKey)
    this.setupTouch()
    this.resize()
    this.loadHighScore()
  }

  async loadHighScore() {
    const entries = await apiGet()
    this.leaderboardEntries = entries
    if (entries.length > 0) {
      this.highScore = entries[0].score
    }
  }

  async refreshLeaderboard() {
    this.leaderboardEntries = await apiGet()
    if (this.leaderboardEntries.length > 0) {
      this.highScore = this.leaderboardEntries[0].score
    }
  }

  scoreQualifies(score, entries) {
    return entries.length < MAX_LEADERS || score > entries[entries.length - 1].score
  }

  async saveScore(name, score) {
    const entries = await apiPost(name.trim() || 'Player', score)
    this.leaderboardEntries = entries
    if (entries.length > 0) {
      this.highScore = entries[0].score
    }
    return entries
  }

  renderLeaderboard(listEl, entries, highlightIdx) {
    listEl.innerHTML = ''
    entries.forEach((entry, i) => {
      const li = document.createElement('li')
      if (i === highlightIdx) li.className = 'lb-current'
      li.innerHTML = `<span class="lb-name">${this.escapeHtml(entry.name)}</span><span class="lb-score">${entry.score}</span>`
      listEl.appendChild(li)
    })
  }

  escapeHtml(str) {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    this.width = rect.width
    this.height = rect.height
    this.canvas.width = rect.width * dpr
    this.canvas.height = rect.height * dpr
    this.canvas.style.width = `${rect.width}px`
    this.canvas.style.height = `${rect.height}px`
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.cellSize = Math.floor(Math.min(this.width / COLS, this.height / ROWS))
    this.offsetX = Math.floor((this.width - this.cellSize * COLS) / 2)
    this.offsetY = Math.floor((this.height - this.cellSize * ROWS) / 2)
    this.draw()
  }

  setupTouch() {
    let touchStart = null
    this.canvas.addEventListener('touchstart', (e) => {
      const t = e.touches[0]
      touchStart = { x: t.clientX, y: t.clientY }
    }, { passive: true })

    this.canvas.addEventListener('touchend', (e) => {
      if (!touchStart) return
      const t = e.changedTouches[0]
      const dx = t.clientX - touchStart.x
      const dy = t.clientY - touchStart.y
      touchStart = null
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
      if (Math.abs(dx) > Math.abs(dy)) {
        this.setDirection(dx > 0 ? 'RIGHT' : 'LEFT')
      } else {
        this.setDirection(dy > 0 ? 'DOWN' : 'UP')
      }
    }, { passive: true })
  }

  handleKey(e) {
    const keyMap = {
      ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
      w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
      W: 'UP', S: 'DOWN', A: 'LEFT', D: 'RIGHT',
    }

    if (this.state === 'PLAYING' || this.state === 'PAUSED') {
      if (e.key === 'Escape') {
        e.preventDefault()
        this.togglePause()
        return
      }
    }

    if (this.state === 'PAUSED') return

    if (this.state === 'GAME_OVER') {
      const input = document.getElementById('name-input')
      if (document.activeElement === input) {
        if (e.key === 'Enter') {
          e.preventDefault()
          this.submitScore()
        }
        return
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        this.start()
      }
      return
    }

    if (this.state === 'START') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        this.start()
      }
      return
    }

    const dir = keyMap[e.key]
    if (dir) {
      e.preventDefault()
      this.setDirection(dir)
    }
  }

  async togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED'
      document.getElementById('pause-score').textContent = String(this.score)
      document.getElementById('pause-best').textContent = String(this.highScore)
      document.getElementById('pause-overlay').classList.remove('hidden')
      const entries = await apiGet()
      this.renderLeaderboard(document.getElementById('pause-leaderboard-list'), entries)
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING'
      document.getElementById('pause-overlay').classList.add('hidden')
      this.lastUpdate = performance.now()
      this.accumulator = 0
      requestAnimationFrame(this.gameLoop)
    }
  }

  async submitScore() {
    if (this.nameSubmitted) return
    this.nameSubmitted = true
    const input = document.getElementById('name-input')
    const name = input.value.trim() || 'Player'
    const entries = await this.saveScore(name, this.score)
    const idx = entries.findIndex(e => e.name === name && e.score === this.score)
    this.renderLeaderboard(document.getElementById('leaderboard-list'), entries, idx >= 0 ? idx : -1)
    document.getElementById('name-input-wrapper').classList.add('hidden')
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
    this.prevSnake = this.snake.map(s => ({ x: s.x, y: s.y }))

    this.food = this.spawnFood()
    document.getElementById('start-overlay').classList.add('hidden')
    document.getElementById('game-over-overlay').classList.add('hidden')
    this.draw()
    this.lastUpdate = performance.now()
    requestAnimationFrame(this.gameLoop)
  }

  async gameOver() {
    this.state = 'GAME_OVER'
    if (this.score > this.highScore) {
      this.highScore = this.score
    }
    document.getElementById('final-score').textContent = String(this.score)
    document.getElementById('final-best').textContent = String(this.highScore)

    const entries = await apiGet()
    this.leaderboardEntries = entries
    this.renderLeaderboard(document.getElementById('leaderboard-list'), entries)

    const qualifies = this.score > 0 && this.scoreQualifies(this.score, entries)
    const nameWrapper = document.getElementById('name-input-wrapper')
    const leaderboardEl = document.getElementById('leaderboard')
    if (qualifies) {
      nameWrapper.classList.remove('hidden')
      leaderboardEl.classList.remove('hidden')
      const input = document.getElementById('name-input')
      input.value = ''
      this.nameSubmitted = false
      setTimeout(() => input.focus(), 100)
    } else {
      nameWrapper.classList.add('hidden')
      if (entries.length > 0) {
        leaderboardEl.classList.remove('hidden')
      }
    }

    document.getElementById('game-over-overlay').classList.remove('hidden')
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
    this.prevSnake = this.snake.map(s => ({ x: s.x, y: s.y }))
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
      this.tickSpeed = Math.max(60, BASE_SPEED - this.score * SPEED_INCREASE)
      document.getElementById('score-value').textContent = String(this.score)
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

    this.draw()
    requestAnimationFrame(this.gameLoop)
  }

  draw() {
    const ctx = this.ctx
    const { width, height, cellSize, offsetX, offsetY } = this
    ctx.clearRect(0, 0, width, height)

    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = '#16213e'
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        if ((x + y) % 2 === 0) {
          ctx.fillRect(
            offsetX + x * cellSize,
            offsetY + y * cellSize,
            cellSize,
            cellSize,
          )
        }
      }
    }

    if (this.snake) {
      const t = this.tickSpeed > 0 ? Math.min(this.accumulator / this.tickSpeed, 1) : 0
      this.snake.forEach((seg, i) => {
        const isHead = i === 0
        const pad = isHead ? 1 : 2

        let px, py
        if (this.prevSnake && this.prevSnake[i]) {
          const prev = this.prevSnake[i]
          px = prev.x + (seg.x - prev.x) * t
          py = prev.y + (seg.y - prev.y) * t
        } else {
          px = seg.x
          py = seg.y
        }

        ctx.shadowColor = isHead ? '#e94560' : '#4ecca3'
        ctx.shadowBlur = cellSize * 0.15
        ctx.fillStyle = isHead ? '#e94560' : (i % 2 === 0 ? '#4ecca3' : '#35b080')
        ctx.fillRect(
          offsetX + px * cellSize + pad,
          offsetY + py * cellSize + pad,
          cellSize - pad * 2,
          cellSize - pad * 2,
        )
        ctx.shadowBlur = 0

        if (isHead) {
          ctx.fillStyle = '#fff'
          const eyeSize = Math.max(2, cellSize * 0.12)
          const cx = offsetX + px * cellSize + cellSize / 2
          const cy = offsetY + py * cellSize + cellSize / 2
          const off = cellSize * 0.2
          if (this.direction === 'RIGHT' || this.direction === 'LEFT') {
            const xOff = this.direction === 'RIGHT' ? off : -off
            ctx.beginPath()
            ctx.arc(cx + xOff - eyeSize, cy - off, eyeSize, 0, Math.PI * 2)
            ctx.arc(cx + xOff - eyeSize, cy + off, eyeSize, 0, Math.PI * 2)
          } else {
            const yOff = this.direction === 'DOWN' ? off : -off
            ctx.beginPath()
            ctx.arc(cx - off, cy + yOff - eyeSize, eyeSize, 0, Math.PI * 2)
            ctx.arc(cx + off, cy + yOff - eyeSize, eyeSize, 0, Math.PI * 2)
          }
          ctx.fill()
        }
      })
    }

    if (this.food) {
      ctx.shadowColor = '#ffd700'
      ctx.shadowBlur = cellSize * 0.2
      ctx.fillStyle = '#ffd700'
      const cx = offsetX + this.food.x * cellSize + cellSize / 2
      const cy = offsetY + this.food.y * cellSize + cellSize / 2
      const r = cellSize * 0.4
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = '#ffed4a'
      ctx.beginPath()
      ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.35, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
