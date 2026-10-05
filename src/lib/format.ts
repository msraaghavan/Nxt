import { nextWorkshopDate } from '../config'

export const nf = new Intl.NumberFormat('en-IN')
export const fmt = (n: number) => nf.format(Math.round(n))
export const pct = (n: number, digits = 0) => `${(n * 100).toFixed(digits)}%`
export const rupees = (n: number) => `₹${nf.format(Math.round(n))}`

const IST = 'Asia/Kolkata'

export function workshopLabel(short = false) {
  const d = nextWorkshopDate()
  const day = d.toLocaleDateString('en-IN', { weekday: short ? 'short' : 'long', day: 'numeric', month: 'short', timeZone: IST })
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: IST }).replace(':00', '').toUpperCase()
  return `${day}, ${time} IST`
}

export function weekdayTime() {
  const d = nextWorkshopDate()
  const wd = d.toLocaleDateString('en-IN', { weekday: 'long', timeZone: IST })
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: IST }).replace(':00', '').toUpperCase()
  return `${wd} ${time}`
}

export function campaignDayLabel(start: number, day: number) {
  const d = new Date(start + (day - 1) * 86400000 + 6 * 3600000)
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: IST })
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name
}

export function maskPhone(p: string) {
  const d = p.replace(/\D/g, '')
  return d.length >= 10 ? `${d.slice(0, 2)}******${d.slice(-2)}` : '••••'
}
