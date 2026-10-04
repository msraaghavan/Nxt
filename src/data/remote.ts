// Optional live backend: a Google Sheet behind a Google Apps Script web app.
// Set VITE_SHEETS_URL (see integrations/google-apps-script.gs). Without it the
// app runs fully client-side, which is what the demo deploy does.
import type { Leader, Registration } from './types'

const URL_ = (import.meta.env.VITE_SHEETS_URL as string | undefined)?.trim()

export const remoteEnabled = Boolean(URL_)

async function post(kind: 'registration' | 'leader' | 'event', payload: unknown) {
  if (!URL_) return
  try {
    // text/plain avoids a CORS preflight, which Apps Script cannot answer
    await fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ kind, payload }) })
  } catch (e) {
    console.warn('[remote] post failed', e)
  }
}

export const pushRegistration = (r: Registration) => post('registration', r)
export const pushLeader = (l: Leader) => post('leader', l)
export const pushEvent = (e: { type: string; day: number; channel: string; hook: string }) => post('event', e)

export async function pullAll(): Promise<{ registrations: Registration[]; leaders: Leader[] } | null> {
  if (!URL_) return null
  try {
    const res = await fetch(URL_)
    if (!res.ok) return null
    const data = await res.json()
    return { registrations: data.registrations ?? [], leaders: data.leaders ?? [] }
  } catch (e) {
    console.warn('[remote] pull failed', e)
    return null
  }
}
