import { COLS, ROWS, FOCUS_DELAY } from './constants.js'
import { getLeaderboard } from './api.js'

export class GameView {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.game = null
    this._inputMode = 'keyboard'
    this._activeHint = null
    this.setupResize()
    this.resize()
  }

  setInputMode(mode) {
    this._inputMode = mode
    if (this.game && this.game.state === 'PLAYING') {
      document.getElementById('mobile-controls').classList.toggle('hidden', mode !== 'touch')
      document.getElementById('pause-btn').classList.remove('hidden')
    }
    if (this._activeHint) {
      this._setHint(this._activeHint)
    }
  }

  _setHint(key) {
    this._activeHint = key
    const hints = {
      start: [
        'Swipe or tap arrows to move &middot; Tap ❚❚ to pause &middot; Tap Start to begin',
        'Arrow keys / WASD to move &middot; <kbd>Esc</kbd> to pause &middot; Enter / Space to start',
      ],
      paused: [
        'Swipe or tap arrows to move &middot; Tap ❚❚ to resume',
        'Arrow keys / WASD to move &middot; <kbd>Esc</kbd> or ❚❚ to resume',
      ],
      gameOver: [
        'Swipe or tap arrows to move &middot; Tap ❚❚ to pause &middot; Tap Play Again',
        'Arrow keys / WASD to move &middot; <kbd>Esc</kbd> to pause &middot; Enter / Space to play again',
      ],
    }
    const pair = hints[key]
    if (pair) {
      document.getElementById('overlay-hint').innerHTML = this._inputMode === 'touch' ? pair[0] : pair[1]
    }
  }

  setGame(game) {
    this.game = game
  }

  setupResize() {
    let timer
    this._resizeBound = () => {
      clearTimeout(timer)
      timer = setTimeout(() => this.resize(), 100)
    }
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
    this.redrawGame()
  }

  redrawGame() {
    if (!this.game || !this.game.snake) {
      this.drawBackground(this.ctx, this.cellSize, this.offsetX, this.offsetY)
      return
    }
    this.draw(this.game, 0)
  }

  renderStatic(snake, direction) {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)
    this.drawBackground(ctx, this.cellSize, this.offsetX, this.offsetY)
    if (snake) {
      this.drawSnake(ctx, { snake, prevSnake: snake, direction }, 0, this.cellSize, this.offsetX, this.offsetY)
    }
  }

  showPlaying() {
    document.getElementById('overlay').classList.add('hidden')
    document.getElementById('pause-btn').classList.remove('hidden')
    document.getElementById('mobile-controls').classList.toggle('hidden', this._inputMode !== 'touch')
  }

  hideMobileControls() {
    document.getElementById('mobile-controls').classList.add('hidden')
  }

  showStart() {
    this.hideMobileControls()
    document.getElementById('pause-btn').classList.add('hidden')
    const overlay = document.getElementById('overlay')
    overlay.classList.remove('hidden')
    document.getElementById('overlay-title').textContent = 'Snake'
    document.getElementById('overlay-score-row').classList.add('hidden')
    this._setHint('start')
    const btn = document.getElementById('overlay-action-btn')
    btn.textContent = 'Start Game'
    btn.classList.remove('hidden')
    this.showNameInput(false)
    this.renderLeaderboard('overlay-leaderboard-list', [])
    this.loadLeaderboard()
  }

  async loadLeaderboard() {
    const entries = await getLeaderboard()
    this.renderLeaderboard('overlay-leaderboard-list', entries)
  }

  showPaused(score, highScore) {
    document.getElementById('mobile-controls').classList.add('hidden')
    document.getElementById('pause-btn').classList.remove('hidden')
    const overlay = document.getElementById('overlay')
    overlay.classList.remove('hidden')
    document.getElementById('overlay-title').textContent = 'Paused'
    document.getElementById('overlay-score-row').classList.remove('hidden')
    document.getElementById('overlay-score').textContent = String(score)
    document.getElementById('overlay-best').textContent = String(highScore)
    this._setHint('paused')
    document.getElementById('overlay-action-btn').classList.add('hidden')
    this.showNameInput(false)
  }

  showGameOver(score, highScore, entries, qualifies) {
    this.hideMobileControls()
    document.getElementById('pause-btn').classList.add('hidden')
    const overlay = document.getElementById('overlay')
    overlay.classList.remove('hidden')
    document.getElementById('overlay-title').textContent = 'Game Over'
    document.getElementById('overlay-score-row').classList.remove('hidden')
    document.getElementById('overlay-score').textContent = String(score)
    document.getElementById('overlay-best').textContent = String(highScore)
    this.renderLeaderboard('overlay-leaderboard-list', entries)
    this._setHint('gameOver')
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
    if (!listEl) {return}
    listEl.innerHTML = ''
    entries.forEach((entry, i) => {
      const li = document.createElement('li')
      if (i === highlightIdx) {li.className = 'lb-current'}
      li.innerHTML = `<span class="lb-name">${this.escapeHtml(entry.name)}</span><span class="lb-score">${entry.score}</span>`
      listEl.appendChild(li)
    })
  }

  draw(game, t) {
    const ctx = this.ctx
    const { width, height, cellSize, offsetX, offsetY } = this
    ctx.clearRect(0, 0, width, height)
    this.drawBackground(ctx, cellSize, offsetX, offsetY)
    if (game.snake) {this.drawSnake(ctx, game, t, cellSize, offsetX, offsetY)}
    if (game.food) {this.drawFood(ctx, game.food, cellSize, offsetX, offsetY)}
  }

  drawBackground(ctx, cellSize, offsetX, offsetY) {
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, this.width, this.height)

    ctx.fillStyle = '#16213e'
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        if ((x + y) % 2 === 0) {
          ctx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize)
        }
      }
    }
  }

  drawSnake(ctx, game, t, cellSize, offsetX, offsetY) {
    const lastIdx = game.snake.length - 1

    game.snake.forEach((seg, i) => {
      let px, py
      if (game.prevSnake && game.prevSnake[i]) {
        const prev = game.prevSnake[i]
        px = prev.x + (seg.x - prev.x) * t
        py = prev.y + (seg.y - prev.y) * t
      } else {
        px = seg.x
        py = seg.y
      }

      const x = offsetX + px * cellSize
      const y = offsetY + py * cellSize

      if (i === 0) {
        this.drawSnakeHead(ctx, x, y, cellSize, game.direction)
      } else if (i === lastIdx) {
        this.drawSnakeTail(ctx, x, y, cellSize)
      } else {
        this.drawSnakeBody(ctx, x, y, cellSize, i)
      }
    })
  }

  drawSnakeHead(ctx, x, y, cellSize, direction) {
    const pad = cellSize * 0.08
    const r = cellSize * 0.28

    ctx.shadowColor = '#e94560'
    ctx.shadowBlur = cellSize * 0.2
    ctx.fillStyle = '#e94560'
    ctx.beginPath()
    ctx.roundRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2, r)
    ctx.fill()
    ctx.shadowBlur = 0

    this.drawSnakeEyes(ctx, x, y, cellSize, direction)
  }

  drawSnakeTail(ctx, x, y, cellSize) {
    const pad = cellSize * 0.18
    const r = cellSize * 0.15

    ctx.shadowColor = '#2d8a6e'
    ctx.shadowBlur = cellSize * 0.08
    ctx.fillStyle = '#2d8a6e'
    ctx.beginPath()
    ctx.roundRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2, r)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  drawSnakeBody(ctx, x, y, cellSize, index) {
    const pad = cellSize * 0.1
    const r = cellSize * 0.2
    const color = index % 2 === 0 ? '#4ecca3' : '#3db88b'

    ctx.shadowColor = '#4ecca3'
    ctx.shadowBlur = cellSize * 0.08
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2, r)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  drawSnakeEyes(ctx, x, y, cellSize, direction) {
    const eyeSize = Math.max(3, cellSize * 0.14)
    const pupilSize = Math.max(1.5, eyeSize * 0.55)
    const cx = x + cellSize / 2
    const cy = y + cellSize / 2
    const off = cellSize * 0.18

    let e1x, e1y, e2x, e2y
    if (direction === 'RIGHT') {
      e1x = cx + off; e1y = cy - off
      e2x = cx + off; e2y = cy + off
    } else if (direction === 'LEFT') {
      e1x = cx - off; e1y = cy - off
      e2x = cx - off; e2y = cy + off
    } else if (direction === 'DOWN') {
      e1x = cx - off; e1y = cy + off
      e2x = cx + off; e2y = cy + off
    } else {
      e1x = cx - off; e1y = cy - off
      e2x = cx + off; e2y = cy - off
    }

    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(e1x, e1y, eyeSize, 0, Math.PI * 2)
    ctx.arc(e2x, e2y, eyeSize, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#111'
    const pupilOff = cellSize * 0.025
    const dx = direction === 'RIGHT' ? pupilOff : direction === 'LEFT' ? -pupilOff : 0
    const dy = direction === 'DOWN' ? pupilOff : direction === 'UP' ? -pupilOff : 0
    ctx.beginPath()
    ctx.arc(e1x + dx, e1y + dy, pupilSize, 0, Math.PI * 2)
    ctx.arc(e2x + dx, e2y + dy, pupilSize, 0, Math.PI * 2)
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
