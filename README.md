# AI Quest 60 · NxtWave Growth Challenge

**Mission:** get 500 final-year engineering students to register for a free online workshop, *Build Your First AI Project in 60 Minutes*, in 7 days with ₹2,000.

**My answer:** don't buy reach, buy *trust*. 30 campus **Quest Leaders** post tracked links in class WhatsApp groups, **10 clubs and placement cells** co-host, and a **squad referral loop** with **College Wars** turns every registrant into a distributor. Base case: **550 registrations (10% buffer)**, with 75% of the budget paid only on results and a Day-3 tripwire if it falls behind.

The asset is the pixel-art growth engine that runs all three channels: registration with attribution, shareable Quest Passes, leaderboards, a Quest Leader kit, a WhatsApp journey and a Command Center that tracks the plan's numbers day by day.

---

## Submission map

| Deliverable | Where |
|---|---|
| **1. Growth Plan** (5 slides) | [`docs/Growth-Plan.pdf`](docs/Growth-Plan.pdf) · live at `/#/plan` |
| **2. Working asset** | The deployed site (see *Deploy*). Start at `/`, then `/#/hq` |
| **3. AI + Learning Notes** | [`docs/AI-Learning-Notes.md`](docs/AI-Learning-Notes.md) · live at `/#/notes` |
| **4. 3-minute video** | Script + shot list: [`docs/Video-Script.md`](docs/Video-Script.md). Silent screen-recorded walkthrough to narrate over: [`docs/demo-walkthrough.mp4`](docs/demo-walkthrough.mp4) |
| The three questions | Answered in the AI Notes (doc + page) |
| Lovable prompts | [`docs/Lovable-Prompts.md`](docs/Lovable-Prompts.md) |

## Reviewer tour (5 minutes)

1. **`/`** Landing page. The pixel campus is live: every student who walks into the AI Lab pops a `+1`. The hero copy changes with the A/B hook bucket you were assigned.
2. **`/#/join`** Register (use test details). Try opening `/?ref=QL-…` with a leader code from `/#/hq` first: the form shows who invited you.
3. **`/#/pass`** Your Quest Pass image (QR → your invite link), invite copy in English / Tenglish / Hinglish. Press **+ Friend joins** a few times to watch loot unlock.
4. **`/#/wars`** College Wars, top squad builders, Quest Leaders.
5. **`/#/leaders`** Create a Quest Leader kit: tracked link with A/B hook, ready-to-post messages, printable QR poster, club co-host link generator.
6. **`/#/whatsapp`** Chat with QuestBot: register inside WhatsApp, then jump through D-1 / H-1 / live / post-workshop messages, with Meta pricing per step.
7. **`/#/hq`** Command Center. Press **▶ Play 7 days** to replay the campaign: funnel, channel pace vs plan, A/B significance, forecast, leader nudges, budget, CSV export.

The **Sim day** selector in the top bar moves the whole site through the 7-day simulation.

> **Honesty note:** this is a simulation, as the brief asks. Dashboard numbers come from a seeded model of the plan's funnel (`src/data/simulate.ts`). Anything you register is stored in your browser, or in a Google Sheet if the backend below is enabled. It is not an official NxtWave page.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
```

## Deploy (pick one)

- **Vercel:** import the GitHub repo → framework *Vite* is auto-detected → Deploy. No config needed (hash routing).
- **Netlify:** drag-and-drop the `dist/` folder after `npm run build`, or connect the repo (build `npm run build`, publish `dist`).
- **GitHub Pages:** `npm run build` and publish `dist/` (the build uses relative paths, so it works under `/<repo>/`).
- **Lovable:** see [`docs/Lovable-Prompts.md`](docs/Lovable-Prompts.md).

## Optional: make it multi-user with a Google Sheet

By default everything runs client-side. To share registrations and leaderboards across devices:

1. Paste [`integrations/google-apps-script.gs`](integrations/google-apps-script.gs) into a Google Sheet's Apps Script and deploy it as a Web app (*Anyone* can access).
2. Set `VITE_SHEETS_URL=<the /exec URL>` in your host's environment variables and redeploy.

Registrations, leaders and funnel events then land in the Sheet. The public endpoint never returns phone numbers or emails.

## How it's built

- **Vite + React + TypeScript**, no UI framework. Everything visual is hand-built pixel art:
  - `src/pixel/world.ts` generates the campus per pixel (value-noise grass, smoothed dirt paths, a pond with a shoreline, shaded trees, buildings with shingle roofs), then animates students, ducks, smoke, a campfire, butterflies and a night mode.
  - `src/pixel/sprites.ts` holds hand-drawn 16×16 icons and 12×16 characters as string grids, rendered as crisp SVG or canvas.
- **One config, no drift:** `src/config.ts` holds the channels, funnel rates, daily targets, rewards and budget. The slides, dashboard and simulation all read from it.
- **Attribution:** `?ref=` (student or `QL-` leader code), `utm_source` / `utm_medium` (`leader`, `club`, `tnp`) and `h=A|B` (message hook) are captured first-touch in `src/data/store.ts`.
- **Shareables:** Quest Pass (1080×1920) and the A4 leader poster are drawn on canvas with real QR codes (`src/lib/images.ts`). On phones, *Share to Status* opens the native share sheet.
- **WhatsApp journey:** `src/data/whatsappFlow.ts` is a declarative state machine. The simulator runs it, and it maps 1:1 to n8n nodes on the WhatsApp Cloud API.
- **Accessibility:** keyboard-focusable controls, reduced-motion support (the world pauses), text alternatives for canvases, and a colour-validated chart palette (CVD-safe on the dark dashboard).

```
src/
  config.ts            campaign numbers (single source of truth)
  pixel/               world generator, sprites, palette, renderers
  data/                store, attribution, simulation, analytics, WhatsApp flow spec
  lib/                 share copy (EN/Tenglish/Hinglish), images, calendar, sound
  components/          pixel UI kit, charts, chrome
  pages/               Landing, Join, Pass, Wars, Leaders, WhatsApp, HQ, Plan, Notes
integrations/          Google Apps Script backend
docs/                  Growth Plan PDF, AI notes, video script, Lovable prompts
```
