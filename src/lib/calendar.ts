import { WORKSHOP, nextWorkshopDate } from '../config'

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

export function googleCalendarUrl(details: string) {
  const start = nextWorkshopDate()
  const end = new Date(start.getTime() + WORKSHOP.durationMin * 60000)
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${WORKSHOP.title} (NxtWave, free)`,
    dates: `${stamp(start)}/${stamp(end)}`,
    details,
    location: 'Online (link on WhatsApp)',
  })
  return `https://calendar.google.com/calendar/render?${p}`
}

export function downloadIcs(details: string) {
  const start = nextWorkshopDate()
  const end = new Date(start.getTime() + WORKSHOP.durationMin * 60000)
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI Quest 60//EN',
    'BEGIN:VEVENT',
    `UID:aiquest60-${start.getTime()}@example`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${WORKSHOP.title} (NxtWave)`,
    `DESCRIPTION:${details.replace(/\n/g, '\\n')}`,
    'LOCATION:Online',
    'BEGIN:VALARM',
    'TRIGGER:-PT60M',
    'ACTION:DISPLAY',
    'DESCRIPTION:AI Quest starts in 60 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'ai-quest-60.ics'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
