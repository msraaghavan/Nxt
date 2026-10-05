# AI + Learning Notes

Three moments where AI gave me a reasonable-sounding answer and I changed it.
Format: **what I asked → what AI suggested → what I changed → why.**

---

## 1 · Channel mix

**I asked:** "Plan a 7-day campaign to get 500 final-year engineering students to register for a free AI workshop. Budget ₹2,000."

**AI suggested:** Split the budget across Instagram/Meta ads targeting engineering students in Hyderabad, LinkedIn posts, a cold email blast to college placement officers, and a Google Form.

**What I changed:** I did the cost-per-lead math first. Even at an optimistic ₹15–40 per paid student sign-up, ₹2,000 buys 50–130 registrations, and paid sign-ups show up less. So I dropped ads entirely, moved 75% of the budget into prizes paid only on results (Quest Leaders + top referrers), and built the plan on people who already sit inside class WhatsApp groups.

**Why:** The constraint was never reach, it was trust. A batchmate's message in the class group gets opened; a brand ad gets scrolled past.

## 2 · The WhatsApp message

**I asked:** "Write the WhatsApp message Quest Leaders will post in class groups."

**AI suggested:** Polished English copy, lots of emojis, "🚨 LIMITED SEATS! Only 50 spots left, register NOW!", and a long feature list.

**What I changed:**
- Rewrote it in **Tenglish and Hinglish** (Roman script), which is how students actually text.
- Killed the fake scarcity. It's a Zoom call with no real seat limit, and if students catch it, the Quest Leader who forwarded it loses credibility. Real deadlines replace it: College Wars closes Day 6, registration closes Day 7.
- Instead of picking one hook, set up an **A/B test** between an outcome hook and a placement-pressure hook, tracked through the links (`h=A|B`).

**Why:** Copy that sounds like an ad gets treated like an ad. And I'd rather let 600 visits decide than my own opinion.

## 3 · Referral rewards

**I asked:** "What rewards should students get for referring friends?"

**AI suggested:** A lucky draw for an iPad / AirPods for anyone who refers 3+ friends, plus Amazon vouchers for every referral.

**What I changed:** Chose rewards only the target user values:
- 1 friend: a placement prompt pack.
- 3 friends: live project review + certificate of excellence.
- 5 friends: a 1:1 mentor review.

Cash is limited to the top referrer and the top 3 Quest Leaders, inside the ₹2,000. The College Wars prize (an on-campus AI Build Day) is itself a growth channel for NxtWave.

**Why:** An iPad attracts people who want an iPad: fake and duplicate sign-ups that never show up. A self-selecting reward keeps the 500 real.

---

# The three questions

## What changed between your first idea and final solution?

**First idea:** a good-looking landing page, ₹2,000 of Instagram ads and an email blast. Basically "make a nice page and buy traffic".

**Final:** a peer-distribution system. 30 Quest Leaders post in class WhatsApp groups, 10 clubs and placement cells co-host, and a squad referral loop runs with College Wars. One asset powers all of it and tracks every link back to a person.

**What moved me:**
1. The CPL math killed paid ads.
2. I reframed the problem from awareness to trust.
3. I stopped optimising for sign-ups alone. 500 registrations with 15% attendance is a failed workshop, so the WhatsApp flow and the D-1 setup nudge are part of the plan, not an afterthought.

The asset also changed: from "a landing page" to the tools each channel needs (leader kit, pass + invites, leaderboard, dashboard).

## If you had another 24 hours, what would you improve?

1. **Test the hook with real students before Day 1.** DM both message versions to 20 final-years and compare reply rates, instead of discovering the winner mid-campaign.
2. **Wire the live backend.** Connect the included Google Sheets script (or Supabase via Lovable) so leaderboards update across every device, not just one browser.
3. **Build the real WhatsApp bot** in n8n + WhatsApp Cloud API from the flow spec that already drives the simulator.
4. **Automate project evaluation after the workshop:** auto-check submitted repos (link works, README, LLM call), then issue certificates. Every shipped project becomes proof for the next cohort's campaign.
5. **Translate the student pages** into Telugu and Hindi script, not just the messages.

## What did AI suggest that you deliberately rejected, and why?

- **An iPad lucky draw for referrals.** It optimises for the wrong person: prize-hunters and duplicate sign-ups who never attend. I kept rewards that only matter to someone who actually wants to build.
- **"Only 50 seats left!" urgency.** It's an online session with no real limit. Faking scarcity spends the Quest Leaders' credibility, which is the plan's main asset. Real deadlines do the same job honestly.
- **Paid Instagram ads with the whole budget.** The math doesn't reach 500, and paid sign-ups attend less.
- **Building an LMS-style platform** with logins and AI grading as "the asset". Impressive, but it doesn't move registrations, which is the goal of this challenge.

---

### How AI was used

Claude Code built the app (React + TypeScript + canvas pixel art), checked facts (e.g. WhatsApp's Oct 2026 India utility template rate of ₹0.145 + GST) and pressure-tested the plan. Every number in the plan is computed from one config file (`src/config.ts`), so the slides, dashboard and simulation can't disagree.
