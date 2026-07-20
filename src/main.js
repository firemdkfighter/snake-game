import { Game } from './game.js'
import { GameView } from './view.js'

const canvas = document.getElementById('game-canvas')
const game = new Game()
const view = new GameView(canvas, game)
game.setView(view)
