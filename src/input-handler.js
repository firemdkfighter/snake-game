import { SWIPE_THRESHOLD } from './constants.js'

export class InputHandler {
  constructor(game, view) {
    this.game = game
    this.view = view
    this.setupKeyboard()
    this.setupTouch()
    this.setupMobileControls()
    this.setupButtons()
    this.setupInputMode()
  }

  setupInputMode() {
    let touchTimeout
    document.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') {
        clearTimeout(touchTimeout)
        this.view.setInputMode('touch')
      }
    }, { passive: true })

    document.addEventListener('keydown', () => {
      clearTimeout(touchTimeout)
      this.view.setInputMode('keyboard')
    })
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

    if (game.state === 'PAUSED') {return}

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
      KeyW: 'UP', KeyS: 'DOWN', KeyA: 'LEFT', KeyD: 'RIGHT',
    }

    const dir = keyMap[e.code]
    if (dir) {
      e.preventDefault()
      game.setDirection(dir)
    }
  }

  setupMobileControls() {
    const game = this.game

    document.querySelectorAll('.dpad-btn').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        if (game.state === 'PLAYING' || game.state === 'PAUSED') {
          game.setDirection(btn.dataset.dir)
        }
      })
    })

    document.getElementById('pause-btn').addEventListener('pointerdown', (e) => {
      e.preventDefault()
      if (game.state === 'PLAYING' || game.state === 'PAUSED') {
        game.togglePause()
      }
    })
  }

  setupTouch() {
    let touchStart = null
    this.view.canvas.addEventListener('touchstart', (e) => {
      const t = e.touches[0]
      touchStart = { x: t.clientX, y: t.clientY }
    }, { passive: true })

    this.view.canvas.addEventListener('touchend', (e) => {
      if (!touchStart) {return}
      const t = e.changedTouches[0]
      const dx = t.clientX - touchStart.x
      const dy = t.clientY - touchStart.y
      touchStart = null
      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {return}
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
}
