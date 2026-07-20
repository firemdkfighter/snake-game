import { COLS, ROWS } from './game.js'

const SWIPE_THRESHOLD = 10
const FOCUS_DELAY = 100
const HEAD_PAD = 1
const BODY_PAD = 2

export class GameView {
  constructor(canvas, game) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.game = game
    this.setupResize()
    this.setupKeyboard()
    this.setupTouch()
    this.setupButtons()
    this.resize()
  }

  setupResize() {
    this._resizeBound = () => this.resize()
    window.addEventListener('resize', this._resizeBound)
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
    this.draw(this.game)
  }

  setupKeyboard() {
    document.addEventListener('keydown', (e) => this.handleKey(e))
  }

  handleKey(e) {
    const game = this.game

    if (game.state === 'PLAYING' || game.state === 'PAUSED') {
      if (e.key === 'Escape') {
        e.preventDefault()
        game.togglePause()
        return
      }
    }

    if (game.state === 'PAUSED') return

    if (game.state === 'GAME_OVER') {
      const input = document.getElementById('name-input')
      if (document.activeElement === input) {
        if (e.key === 'Enter') {
          e.preventDefault()
          game.submitScore()
        }
        return
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        game.start()
      }
      return
    }

    if (game.state === 'START') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        game.start()
      }
      return
    }

    const keyMap = {
      ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
      w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
      W: 'UP', S: 'DOWN', A: 'LEFT', D: 'RIGHT',
    }

    const dir = keyMap[e.key]
    if (dir) {
      e.preventDefault()
      game.setDirection(dir)
    }
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
      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return
      if (Math.abs(dx) > Math.abs(dy)) {
        this.game.setDirection(dx > 0 ? 'RIGHT' : 'LEFT')
      } else {
        this.game.setDirection(dy > 0 ? 'DOWN' : 'UP')
      }
    }, { passive: true })
  }

  setupButtons() {
    document.getElementById('overlay-action-btn').addEventListener('click', () => this.game.start())
    document.getElementById('save-score-btn').addEventListener('click', () => this.game.submitScore())
  }

  showPlaying() {
    document.getElementById('overlay').classList.add('hidden')
  }

  showStart() {
    const overlay = document.getElementById('overlay')
    overlay.classList.remove('hidden')
    document.getElementById('overlay-title').textContent = 'Snake'
    document.getElementById('overlay-score-row').classList.add('hidden')
    document.getElementById('overlay-hint').innerHTML = 'Arrow keys / WASD to move &middot; <kbd>Esc</kbd> to pause &middot; Enter / Space to start'
    const btn = document.getElementById('overlay-action-btn')
    btn.textContent = 'Start Game'
    btn.classList.remove('hidden')
    this.showNameInput(false)
    this.fetchAndRenderLeaderboard()
  }

  async fetchAndRenderLeaderboard() {
    try {
      const res = await fetch('/api/leaderboard')
      const entries = res.ok ? await res.json() : []
      this.renderLeaderboard('overlay-leaderboard-list', entries)
    } catch {}
  }

  showPaused(score, highScore) {
    const overlay = document.getElementById('overlay')
    overlay.classList.remove('hidden')
    document.getElementById('overlay-title').textContent = 'Paused'
    document.getElementById('overlay-score-row').classList.remove('hidden')
    document.getElementById('overlay-score').textContent = String(score)
    document.getElementById('overlay-best').textContent = String(highScore)
    document.getElementById('overlay-hint').innerHTML = 'Arrow keys / WASD to move &middot; <kbd>Esc</kbd> to resume'
    document.getElementById('overlay-action-btn').classList.add('hidden')
    this.showNameInput(false)
  }

  showGameOver(score, highScore, entries, qualifies) {
    const overlay = document.getElementById('overlay')
    overlay.classList.remove('hidden')
    document.getElementById('overlay-title').textContent = 'Game Over'
    document.getElementById('overlay-score-row').classList.remove('hidden')
    document.getElementById('overlay-score').textContent = String(score)
    document.getElementById('overlay-best').textContent = String(highScore)
    this.renderLeaderboard('overlay-leaderboard-list', entries)
    document.getElementById('overlay-hint').innerHTML = 'Arrow keys / WASD to move &middot; <kbd>Esc</kbd> to pause &middot; Enter / Space to play again'
    const btn = document.getElementById('overlay-action-btn')
    btn.textContent = 'Play Again'
    btn.classList.remove('hidden')
    if (qualifies) {
      this.showNameInput(true)
      document.getElementById('name-input').value = ''
      setTimeout(() => document.getElementById('name-input').focus(), FOCUS_DELAY)
    } else {
      this.showNameInput(false)
    }
  }

  updateScore(n) {
    document.getElementById('score-value').textContent = String(n)
  }

  getNameInput() {
    return document.getElementById('name-input').value.trim() || 'Player'
  }

  showNameInput(show) {
    document.getElementById('name-input-wrapper').classList.toggle('hidden', !show)
  }

  renderLeaderboard(listId, entries, highlightIdx = -1) {
    const listEl = document.getElementById(listId)
    if (!listEl) return
    listEl.innerHTML = ''
    entries.forEach((entry, i) => {
      const li = document.createElement('li')
      if (i === highlightIdx) li.className = 'lb-current'
      li.innerHTML = `<span class="lb-name">${this.escapeHtml(entry.name)}</span><span class="lb-score">${entry.score}</span>`
      listEl.appendChild(li)
    })
  }

  draw(game) {
    const ctx = this.ctx
    const { width, height, cellSize, offsetX, offsetY } = this
    ctx.clearRect(0, 0, width, height)
    this.drawBackground(ctx, width, height, cellSize, offsetX, offsetY)
    if (game.snake) this.drawSnake(ctx, game, cellSize, offsetX, offsetY)
    if (game.food) this.drawFood(ctx, game.food, cellSize, offsetX, offsetY)
  }

  drawBackground(ctx, width, height, cellSize, offsetX, offsetY) {
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = '#16213e'
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        if ((x + y) % 2 === 0) {
          ctx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize)
        }
      }
    }
  }

  drawSnake(ctx, game, cellSize, offsetX, offsetY) {
    const t = game.tickSpeed > 0 ? Math.min(game.accumulator / game.tickSpeed, 1) : 0
    game.snake.forEach((seg, i) => {
      const isHead = i === 0
      const pad = isHead ? HEAD_PAD : BODY_PAD

      let px, py
      if (game.prevSnake && game.prevSnake[i]) {
        const prev = game.prevSnake[i]
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

      if (isHead) this.drawSnakeEyes(ctx, game, px, py, cellSize, offsetX, offsetY)
    })
  }

  drawSnakeEyes(ctx, game, px, py, cellSize, offsetX, offsetY) {
    ctx.fillStyle = '#fff'
    const eyeSize = Math.max(2, cellSize * 0.12)
    const cx = offsetX + px * cellSize + cellSize / 2
    const cy = offsetY + py * cellSize + cellSize / 2
    const off = cellSize * 0.2
    if (game.direction === 'RIGHT' || game.direction === 'LEFT') {
      const xOff = game.direction === 'RIGHT' ? off : -off
      ctx.beginPath()
      ctx.arc(cx + xOff - eyeSize, cy - off, eyeSize, 0, Math.PI * 2)
      ctx.arc(cx + xOff - eyeSize, cy + off, eyeSize, 0, Math.PI * 2)
    } else {
      const yOff = game.direction === 'DOWN' ? off : -off
      ctx.beginPath()
      ctx.arc(cx - off, cy + yOff - eyeSize, eyeSize, 0, Math.PI * 2)
      ctx.arc(cx + off, cy + yOff - eyeSize, eyeSize, 0, Math.PI * 2)
    }
    ctx.fill()
  }

  drawFood(ctx, food, cellSize, offsetX, offsetY) {
    ctx.shadowColor = '#ffd700'
    ctx.shadowBlur = cellSize * 0.2
    ctx.fillStyle = '#ffd700'
    const cx = offsetX + food.x * cellSize + cellSize / 2
    const cy = offsetY + food.y * cellSize + cellSize / 2
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

  escapeHtml(str) {
    return str.replace(/[&<>"]/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
    )
  }
}
