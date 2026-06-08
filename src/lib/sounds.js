/**
 * Synthetic sound effects via Web Audio API — no audio files needed.
 * All sounds respect a global mute flag stored in localStorage.
 */

let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function isMuted() {
  return localStorage.getItem('sendtrack_mute') === '1'
}

export function toggleMute() {
  const next = !isMuted()
  localStorage.setItem('sendtrack_mute', next ? '1' : '0')
  return next
}

export function getMuted() { return isMuted() }

// ── Low-level tone builder ────────────────────────────────────────────────────

function tone(freq, type, startTime, duration, gainPeak, fadeOut = true) {
  const c   = getCtx()
  const osc = c.createOscillator()
  const g   = c.createGain()
  osc.connect(g)
  g.connect(c.destination)
  osc.type      = type
  osc.frequency.setValueAtTime(freq, startTime)
  g.gain.setValueAtTime(0, startTime)
  g.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01)
  if (fadeOut) g.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration + 0.05)
}

// ── Named sounds ──────────────────────────────────────────────────────────────

/**
 * New order created — ascending three-note ding (vendor/admin)
 */
export function playNewOrder() {
  if (isMuted()) return
  const c = getCtx()
  const t = c.currentTime
  tone(880, 'sine', t,        0.18, 0.35)
  tone(1100, 'sine', t + 0.18, 0.18, 0.35)
  tone(1320, 'sine', t + 0.36, 0.28, 0.4)
}

/**
 * Rider assigned — double soft ping
 */
export function playRiderAssigned() {
  if (isMuted()) return
  const c = getCtx()
  const t = c.currentTime
  tone(1047, 'sine', t,        0.2, 0.3)
  tone(1047, 'sine', t + 0.28, 0.2, 0.3)
}

/**
 * Status changed — single soft click / tick
 */
export function playStatusChanged() {
  if (isMuted()) return
  const c = getCtx()
  const t = c.currentTime
  tone(660, 'sine', t, 0.12, 0.18)
}

/**
 * Order completed — short victory chime
 */
export function playOrderCompleted() {
  if (isMuted()) return
  const c = getCtx()
  const t = c.currentTime
  tone(784,  'sine', t,        0.15, 0.3)
  tone(988,  'sine', t + 0.15, 0.15, 0.3)
  tone(1175, 'sine', t + 0.30, 0.25, 0.45)
}

/**
 * Dispatch offer to rider — urgent repeating ring
 */
export function playDispatchOffer() {
  if (isMuted()) return
  const c = getCtx()
  const t = c.currentTime
  for (let i = 0; i < 4; i++) {
    tone(880, 'square', t + i * 0.22, 0.16, 0.15)
    tone(660, 'square', t + i * 0.22 + 0.16, 0.05, 0.1)
  }
}

/**
 * Return requested — two-tone warning
 */
export function playReturnRequested() {
  if (isMuted()) return
  const c = getCtx()
  const t = c.currentTime
  tone(440, 'triangle', t,        0.2, 0.3)
  tone(370, 'triangle', t + 0.22, 0.25, 0.35)
}

/**
 * Map notification type → sound function
 */
export function playForType(type) {
  switch (type) {
    case 'order_created':    return playNewOrder()
    case 'rider_assigned':   return playRiderAssigned()
    case 'status_changed':   return playStatusChanged()
    case 'order_completed':  return playOrderCompleted()
    case 'dispatch_offer':   return playDispatchOffer()
    case 'return_requested': return playReturnRequested()
    default:                 return playStatusChanged()
  }
}
