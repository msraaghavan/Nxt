// One shared palette keeps every sprite, tile and UI element in the same world.
// Warm, cozy top-down RPG tones with a deep plum ink instead of pure black.
export const PAL: Record<string, string> = {
  k: '#2b2135', // ink / outline
  K: '#45375a', // soft outline
  w: '#ffffff',
  W: '#fff6e0', // paper
  P: '#f0dfb8', // paper shade
  y: '#ffd23f', // gold
  Y: '#e0a526', // gold shade
  o: '#f28c28', // orange
  O: '#c4651a',
  b: '#c58a4e', // wood light
  B: '#8c5a2e', // wood
  D: '#5a3520', // wood dark
  r: '#e04848', // red
  R: '#a32d3d',
  p: '#ff7aa8', // pink
  g: '#5fb653', // green
  G: '#3c8d3f',
  j: '#2a6233', // deep green
  l: '#9be564', // lime
  c: '#4de1ff', // cyan
  C: '#3f7fd8', // blue
  n: '#2a4a8a', // navy
  v: '#8a63ff', // violet (AI magic)
  V: '#5b3fc4',
  s: '#e3a873', // skin
  S: '#c4834f', // skin shade
  h: '#33241e', // hair
  e: '#9aa0b5', // grey
  E: '#5d6378',
  L: '#d5d9e5', // light grey
  a: '#25d366', // chat green
  A: '#128c4a',
  t: '#3f7fd8', // shirt (swappable)
  T: '#2a4a8a',
  u: '#3d3550', // pants (swappable)
}

export const C = {
  ink: PAL.k,
  paper: PAL.W,
  gold: PAL.y,
  goldDark: PAL.Y,
  red: PAL.r,
  pink: PAL.p,
  green: PAL.g,
  greenDark: PAL.G,
  cyan: PAL.c,
  blue: PAL.C,
  navy: PAL.n,
  violet: PAL.v,
  violetDark: PAL.V,
}
