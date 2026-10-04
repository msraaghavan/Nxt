import { useSyncExternalStore } from 'react'

// Hash routing works on any static host (Vercel, Netlify, GitHub Pages, Lovable)
// with zero rewrite config, and keeps ?ref= query params on the real URL.
const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
const read = () => {
  const h = location.hash.replace(/^#/, '') || '/'
  return h.split('?')[0] || '/'
}

export function useRoute() {
  return useSyncExternalStore(subscribe, read)
}

export function navigate(path: string) {
  if (read() === path) return
  location.hash = path
  window.scrollTo({ top: 0 })
}

export function href(path: string) {
  return `#${path}`
}
