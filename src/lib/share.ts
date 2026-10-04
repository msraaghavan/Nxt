import { HOOKS, WORKSHOP, type HookId } from '../config'
import { weekdayTime } from './format'

export type Lang = 'en' | 'te' | 'hi'
export const LANGS: { id: Lang; label: string; note: string }[] = [
  { id: 'en', label: 'English', note: 'English' },
  { id: 'te', label: 'Tenglish', note: 'Telugu in Roman script, how students actually text' },
  { id: 'hi', label: 'Hinglish', note: 'Hindi in Roman script' },
]

/** Base URL for share links (works under any static host / sub-path). */
export function baseUrl() {
  return `${location.origin}${location.pathname}`
}

export function inviteLink(code: string) {
  return `${baseUrl()}?ref=${encodeURIComponent(code)}`
}

export function leaderLink(code: string, hook: HookId = 'B', source = 'whatsapp') {
  return `${baseUrl()}?ref=${encodeURIComponent(code)}&utm_source=${source}&utm_medium=leader&utm_campaign=aiquest60&h=${hook}`
}

export function clubLink(club: string) {
  return `${baseUrl()}?utm_source=${encodeURIComponent(club.toLowerCase().replace(/\s+/g, '-'))}&utm_medium=club&utm_campaign=aiquest60&h=B`
}

export const waUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`
export const waBotUrl = (text: string) => `https://wa.me/${WORKSHOP.whatsappNumber}?text=${encodeURIComponent(text)}`
export const tgUrl = (link: string, text: string) => `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`
export const liUrl = (link: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`

/** Student → friend invite after registering. */
export function friendInvite(lang: Lang, link: string) {
  const when = weekdayTime()
  if (lang === 'te')
    return `Bro, ${when} ki oka FREE live workshop undi: *${WORKSHOP.title}* 🚀
Manam AI Mock-Interview Coach build chesi live lo deploy chestam, placements ki resume lo pettukovachu.
Nenu register chesa, nuvvu kuda join avvu, mana squad ga veldam 👉 ${link}`
  if (lang === 'hi')
    return `Bhai, ${when} ko ek FREE live workshop hai: *${WORKSHOP.title}* 🚀
Hum ek AI Mock-Interview Coach banayenge aur live deploy karenge, placements ke liye resume pe daal sakte ho.
Maine register kar liya, tu bhi join kar, squad mein chalte hain 👉 ${link}`
  return `Hey! I just signed up for a FREE live workshop: *${WORKSHOP.title}* 🚀
We build an AI Mock-Interview Coach and put it live. Perfect for placement prep. ${when}.
Join my squad (free, 30 sec): ${link}`
}

/** Quest Leader → class / placement WhatsApp group. */
export function groupPost(lang: Lang, link: string, hook: HookId, rank?: number) {
  const when = weekdayTime()
  const rankLine = {
    en: rank ? `\nI'm going. Our college is #${rank} in College Wars right now 🏆` : `\nI'm going. Let's get our college to #1 in College Wars 🏆`,
    te: rank ? `\nNenu veltunna. College Wars lo mana college ippudu #${rank} 🏆` : `\nNenu veltunna. College Wars lo mana college ni #1 cheddam 🏆`,
    hi: rank ? `\nMain ja raha hoon. College Wars mein abhi hamara college #${rank} hai 🏆` : `\nMain ja raha hoon. College Wars mein apna college #1 karte hain 🏆`,
  }[lang]
  const hookLine = {
    en: HOOKS[hook].line,
    te:
      hook === 'B'
        ? 'Interviews lo "AI tho emaina work chesava?" ani adugutunnaru. Sunday lopu manchi answer ready cheskondi.'
        : '60 mins lo resume ki oka real AI project build cheyyochu. Free, live, ee Sunday.',
    hi:
      hook === 'B'
        ? 'Interviews mein poochh rahe hain "AI pe kuch kaam kiya hai?". Sunday tak ek solid answer ready kar lo.'
        : '60 min mein resume ke liye ek real AI project bana sakte ho. Free, live, is Sunday.',
  }[lang]
  if (lang === 'te')
    return `📢 *Final years, oka important vishayam*
${hookLine}
NxtWave FREE live workshop: *${WORKSHOP.title}*
✅ AI Mock-Interview Coach build chestam (setup em avasaram ledu, browser lo ne)
✅ Public link + GitHub repo, resume lo pettukovachu
✅ Certificate · ${when} · 60 mins
Register (free, 30 sec): ${link}${rankLine}`
  if (lang === 'hi')
    return `📢 *Final years, ek zaroori baat*
${hookLine}
NxtWave ka FREE live workshop: *${WORKSHOP.title}*
✅ AI Mock-Interview Coach banayenge (koi setup nahi, browser mein hi)
✅ Public link + GitHub repo, resume pe daal sakte ho
✅ Certificate · ${when} · 60 mins
Register (free, 30 sec): ${link}${rankLine}`
  return `📢 *Final-years, quick one*
${hookLine}
NxtWave is running a FREE live workshop: *${WORKSHOP.title}*
✅ Build an AI Mock-Interview Coach (no setup, works in the browser)
✅ Deploy it on a public link + GitHub repo for your resume
✅ Certificate · ${when} · 60 mins
Register (free, 30 sec): ${link}${rankLine}`
}

export function personalDM(lang: Lang, link: string) {
  if (lang === 'te') return `Ra, ee Sunday 60 mins free AI workshop ki veltunna. Placements kosam AI interview coach build chestam. Naatho join avthava? ${link}`
  if (lang === 'hi') return `Yaar, is Sunday 60 min ka free AI workshop join kar raha hoon. Placements ke liye AI interview coach banayenge. Saath chalega? ${link}`
  return `Hey, I'm joining a free 60-min AI workshop this Sunday. We build an AI interview coach for placements. Come with me? ${link}`
}

export function linkedInPost(link: string) {
  return `This ${weekdayTime()}, I'm building my first AI project in 60 minutes 🚀

At NxtWave's free live workshop "${WORKSHOP.title}", we'll build an AI Mock-Interview Coach: paste a job description, and it asks you real interview questions and scores your answers.

If you're a final-year student heading into placements, come build it with me: ${link}

#AI #Placements #BuildInPublic #EngineeringStudents`
}

export function storyCaption(link: string) {
  return `Building my first AI project in 60 mins this Sunday 🤖 Free. Who's in? ${link}`
}
