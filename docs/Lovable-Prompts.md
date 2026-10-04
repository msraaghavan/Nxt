# Using Lovable with this project

The code is already a standard **Vite + React + TypeScript** app (the same stack Lovable generates), so there are two ways to bring it into Lovable.

**Option A: start from this repo (recommended).**
- If your Lovable workspace offers *Import from GitHub*, import `msraaghavan/nxt` and continue with the prompts below.
- If it doesn't, create a new Lovable project, connect it to GitHub (Lovable creates a repo), copy this repo's `src/`, `index.html`, `package.json`, `tsconfig.json` and `vite.config.ts` into that repo, and push. Lovable syncs from GitHub.

**Option B: no Lovable at all.** Deploy on Vercel (import repo → Deploy). Lovable isn't required for the submission, but the prompts below are good next steps with your credits.

Use one prompt per message, and check the preview after each.

---

### 1 · Live database with Supabase (multi-user leaderboards)

```
Connect Supabase. Create three tables matching src/data/types.ts:
- registrations (all Registration fields; unique index on phone)
- leaders (code primary key, name, college, phone, day)
- events (id, ts, type, day, channel, hook)
Enable RLS: anonymous INSERT allowed on all three; anonymous SELECT only through a view
public_registrations that excludes phone and email.
Then rewrite src/data/remote.ts so pushRegistration / pushLeader / pushEvent insert into
Supabase and pullAll() reads from public_registrations and leaders. Keep the same function
signatures so nothing else changes. Subscribe to realtime inserts on registrations and merge
them into the store so College Wars updates live.
```

### 2 · Protect the Command Center

```
Add Supabase email magic-link auth. Only users whose email is in an allowlist table
growth_team can open /#/hq and download the CSV. Everyone else sees a pixel-styled
"Staff only" panel using the existing Panel and Btn components from src/components/ui.tsx.
```

### 3 · Telugu and Hindi student pages

```
Add a language toggle (EN / తెలుగు / हिन्दी) to the Nav. Translate all student-facing copy on
Landing, Join, Pass and Wars into Telugu and Hindi script. Keep the pixel fonts for
headings in English; use Noto Sans Telugu / Noto Sans Devanagari for translated body text.
Persist the choice in localStorage and default to the browser language.
```

### 4 · Post-workshop project evaluator

```
Create a Supabase edge function evaluate-project. Input: a GitHub or live URL. It fetches the
repo README and checks: the link responds, a README exists, the code calls an LLM API,
and there is a deploy link. It returns a score out of 10 with three lines of feedback.
Add a /#/submit page (pixel style, like Join) where registered students paste their link,
see the auto-review as an RPG "quest complete" screen, and get a downloadable certificate
PNG drawn on canvas like src/lib/images.ts.
```

### 5 · Real WhatsApp bot (outside Lovable)

The flow spec in `src/data/whatsappFlow.ts` maps 1:1 to an n8n workflow:

- **Webhook** (WhatsApp Cloud API): route each message by state.
- **Function:** load the student's row from the Sheet or Supabase.
- **Switch:** pick the node `id`.
- **Send message:** reply buttons from `replies`.

Then add a **Cron** node that sends the D-1, H-1 and live +10 utility templates.
