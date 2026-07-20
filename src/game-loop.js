export class GameLoop {
  constructor(game, view) {
    this.game = game
    this.view = view
    this.lastUpdate = 0
    this._loop = this._loop.bind(this)
  }

  start() {
    this.lastUpdate = performance.now()
    this.game.accumulator = 0
    requestAnimationFrame(this._loop)
  }

  _loop(timestamp) {
    if (this.game.state !== 'PLAYING') {return}

    const delta = Math.min(timestamp - this.lastUpdate, this.game.tickSpeed * 3)
    this.lastUpdate = timestamp
    this.game.accumulator += delta

    while (this.game.accumulator >= this.game.tickSpeed) {
      this.game.accumulator -= this.game.tickSpeed
      this.game.update()
      if (this.game.state !== 'PLAYING') {break}
    }

    const t = this.game.tickSpeed > 0 ? Math.min(this.game.accumulator / this.game.tickSpeed, 1) : 0
    this.view.draw(this.game, t)
    requestAnimationFrame(this._loop)
  }
}
