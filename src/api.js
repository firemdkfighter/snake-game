import { MAX_LEADERS } from './constants.js'

export async function getLeaderboard() {
  try {
    const res = await fetch('/api/leaderboard')
    if (!res.ok) {return []}
    return await res.json()
  } catch {
    return []
  }
}

export async function submitScore(name, score) {
  try {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim().slice(0, 20) || 'Player', score }),
    })
    if (!res.ok) {return []}
    return await res.json()
  } catch {
    return []
  }
}

export function scoreQualifies(score, entries) {
  return entries.length < MAX_LEADERS || score > entries[entries.length - 1].score
}
