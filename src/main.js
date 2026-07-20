import { Game } from './game.js'
import { GameView } from './view.js'
import { GameLoop } from './game-loop.js'
import { InputHandler } from './input-handler.js'

const canvas = document.getElementById('game-canvas')
const game = new Game()
const view = new GameView(canvas)
view.setGame(game)
const loop = new GameLoop(game, view)
game.setView(view)
game.setLoop(loop)

new InputHandler(game, view)
