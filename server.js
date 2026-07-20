import express from 'express'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.DATA_DIR || '/data'
const DATA_FILE = join(DATA_DIR, 'leaderboard.json')
const MAX_LEADERS = 10
const PORT = parseInt(process.env.PORT || '80', 10)

const OBFUSCATE_KEY = Buffer.from('sn4k3-g4m3-2026!')

function obfuscate(text) {
  const buf = Buffer.from(text, 'utf-8')
  for (let i = 0; i < buf.length; i++) {
    buf[i] ^= OBFUSCATE_KEY[i % OBFUSCATE_KEY.length]
  }
  return buf.toString('base64')
}

function deobfuscate(encoded) {
  const buf = Buffer.from(encoded, 'base64')
  for (let i = 0; i < buf.length; i++) {
    buf[i] ^= OBFUSCATE_KEY[i % OBFUSCATE_KEY.length]
  }
  return buf.toString('utf-8')
}

const app = express()
app.use(express.json())
app.use(express.static(join(__dirname, 'dist')))

function load() {
  try {
    if (!existsSync(DATA_FILE)) {return []}
    const raw = readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(deobfuscate(raw.trim()))
  } catch {
    return []
  }
}

function save(entries) {
  if (!existsSync(DATA_DIR)) {mkdirSync(DATA_DIR, { recursive: true })}
  writeFileSync(DATA_FILE, obfuscate(JSON.stringify(entries)))
}

app.get('/api/leaderboard', (_req, res) => {
  res.json(load())
})

app.post('/api/leaderboard', (req, res) => {
  const { name, score } = req.body
  if (typeof name !== 'string' || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid data' })
  }
  const entries = load()
  entries.push({ name: name.trim().slice(0, 20) || 'Player', score })
  entries.sort((a, b) => b.score - a.score)
  if (entries.length > MAX_LEADERS) {entries.length = MAX_LEADERS}
  save(entries)
  res.json(entries)
})

app.use((_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`) // eslint-disable-line no-console
})
