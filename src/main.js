import { Game } from './game.js'

const canvas = document.getElementById('game-canvas')
const game = new Game(canvas)

document.getElementById('start-btn').addEventListener('click', () => game.start())
document.getElementById('restart-btn').addEventListener('click', () => game.start())
document.getElementById('save-score-btn').addEventListener('click', () => game.submitScore())

async function loadStartLeaderboard() {
  try {
    const res = await fetch('/api/leaderboard')
    const entries = res.ok ? await res.json() : []
    const list = document.getElementById('start-leaderboard-list')
    if (!list) return
    list.innerHTML = ''
    entries.forEach((entry) => {
      const li = document.createElement('li')
      const name = document.createElement('span')
      name.className = 'lb-name'
      name.textContent = entry.name
      const score = document.createElement('span')
      score.className = 'lb-score'
      score.textContent = String(entry.score)
      li.appendChild(name)
      li.appendChild(score)
      list.appendChild(li)
    })
  } catch {}
}

loadStartLeaderboard()
