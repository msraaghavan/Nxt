import { getSnapshot } from '../data/store'

// Tiny 8-bit sound effects. Off by default; only ever played on user actions.
let ac: AudioContext | null = null

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'square', vol = 0.06) {
  if (!ac) ac = new AudioContext()
  const o = ac.createOscillator()
  const g = ac.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(vol, ac.currentTime + start)
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur)
  o.connect(g).connect(ac.destination)
  o.start(ac.currentTime + start)
  o.stop(ac.currentTime + start + dur + 0.02)
}

const enabled = () => Boolean(getSnapshot().sound)

export const sfx = {
  click() {
    if (enabled()) tone(660, 0, 0.05)
  },
  coin() {
    if (!enabled()) return
    tone(988, 0, 0.08)
    tone(1319, 0.08, 0.22)
  },
  powerUp() {
    if (!enabled()) return
    ;[523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.07, 0.12))
  },
  error() {
    if (enabled()) tone(140, 0, 0.18, 'sawtooth', 0.05)
  },
}
