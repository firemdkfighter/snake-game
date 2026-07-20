export const COLS = 20
export const ROWS = 20

export const BASE_SPEED = 150
export const SPEED_INCREASE = 2
export const MIN_SPEED = 60
export const MAX_LEADERS = 10

export const DIRS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}

export const OPPOSITE = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
}

export const SWIPE_THRESHOLD = 10
export const FOCUS_DELAY = 100
export const HEAD_PAD = 1
export const BODY_PAD = 2
