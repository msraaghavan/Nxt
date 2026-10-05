import { World } from './world'

// One world shared by every scene on the page (and by the Quest Pass renderer).
let shared: World | null = null
export const clock = { t: 0 }
const WARMUP = 24 // seconds pre-simulated so students are already on the road

export function getWorld() {
  if (!shared) {
    shared = new World()
    for (; clock.t < WARMUP; clock.t += 0.1) shared.update(clock.t, 0.1)
  }
  return shared
}
