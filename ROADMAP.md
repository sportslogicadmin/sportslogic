# SPORTSLOGIC.AI — ROADMAP

## Pre-existing features (built before ROADMAP, retroactively documented)
ROADMAP.md started 2026-06-10. Everything below shipped earlier (Day 1–2,
March 2026) and was tracked only in JOURNAL.archive.md, which this section
now absorbs. Cataloged 2026-06-16 as part of the JOURNAL/ROADMAP reconciliation.
- Email waitlist integration (Formspree) — `src/app/email-form.tsx` posts to a Formspree endpoint; live on the homepage waitlist CTA.
- Domain/infra — sportslogic.ai purchased via Namecheap, DNS + SSL configured, Vercel auto-deploy from GitHub `main`, www redirect.
- Brand identity — logo, dark premium design system (#0C0E14 bg / #00E87B accent, Inter + Satoshi headings, dot-grid texture), social accounts @sportslogicai (Instagram/TikTok/X).
- Video content pipeline (`tools/quick_video.py`, `tools/make_video.py`) — ElevenLabs TTS + FFmpeg rendering for short-form social video. Standalone tooling, not part of the deployed web app.
- Legacy Python grading engine (`tools/grading_engine.py`) — superseded by the TypeScript rewrite (`src/lib/grading-engine.ts`); file still present in repo but unused/undeployed.
- `/grade` page core UX — live game/odds picker, manual "different odds on my book" override, player props tab, EdgeScore composite-score branding, BUY/HOLD/SELL labels, info tooltips, "Better Options" alternative-bet suggestions, dev/production rate limiting.
- Grading calibration constants — EV-scale curve, factor weighting (EV/line/market-sharpness/situational), grade thresholds — live in `grading-engine.ts`, not restated in the methodology section above.
- SEO + social sharing — OpenGraph + Twitter card metadata, branded OG image, favicon set, in `src/app/layout.tsx`.
- Shared book-name formatting module (`src/lib/book-names.ts`) — used by `/grade` and `/grade/[slug]`.
- Share-card / persistence infrastructure — `shareSlug` generation, Grade + Leg DB writes on every `/api/grade` call, public `/grade/[slug]` read route. Already shipped, currently working in production.

## Removed features
- **Tonight's Trap + Sportsbook Report Card** (removed 2026-06-16) — publicly graded ESPN Bet, FanDuel, DraftKings, and BetMGM by letter grade on the homepage. Reason: publicly grading named sportsbooks by letter grade conflicts with affiliate program eligibility — those operators' programs reject affiliates who publish negative comparative content. Removing preserves the affiliate path planned for fall 2026. Was built 2026-03-31, predates ROADMAP.
- **Clerk auth + /dashboard system** (built 2026-05-15, commit `b03fad3`; removed 2026-05-15, commit `1d52355`) — signed-in users, sign-in/up pages, grade history dashboard. Reason: site was down on production.

## North Star
Scan your slip before you bet it — we tell you what it should pay.
The hero metric is FOUND MONEY: the dollar gap between the user's book price
and the best available price for the identical parlay. The grade (A–F) remains
as voice and judgment; dollars are the payoff. Sharp friend, data-first,
anti-casino energy. We grade the price, never predict the outcome.

## How We Grade (methodology)
Fair probabilities come from devigging sharp market lines (Pinnacle), the same
fair-value method used by professional betting tools. The grade measures the gap
between true probability and the price the user's book is paying. We never claim
to predict outcomes — an F that wins is a low-probability hit, not a wrong grade.
Known limits (tracked in Parking Lot): leg correlation in SGPs, softer prop
lines, single-source devig.

## Scope Ladder — build one rung at a time, in order
1. **GRADER (current):** screenshot → grade → share card. Live, tested, viral-ready.
2. **JOURNAL:** every grade accrues into the user's real record (ROI, by sport, over time).
3. **CALIBRATION PAGE:** public receipts — "our F grades hit X% of the time."
4. **AFFILIATE:** monetize traffic via sportsbook referral programs.

A rung does not begin until the previous rung's Definition of Done is met.

## Current Phase: Rung 1 — Grader (Found Money edition)
Build order is strict. A step does not start until the previous step is verified.

**Step A — Trust the abort (closed):**
- [x] Golf-slip silent failure root-caused and fixed (OCR unknown-sport escape + odds abort)
- [x] Odds API key status confirmed at the-odds-api.com (active + sufficient quota), or rotated, before any further grade attempts.
- [x] Verified: golf slip → named abort message; MLB/NBA slip → clean grade, sane numbers

**Step B — Found Money core (current):**
- [ ] Compute best-available parlay price from per-leg best_odds/best_book (data already in engine)
- [ ] New hero output: "Pays +400 at [user's book] — best available +462. On your $X stake, that's $Y left on the table."
- [ ] Stats row reordered: FOUND MONEY is the hero, TO HIT and TAX support, grade is the headline voice
- [ ] If user's book IS the best price: say so proudly — "Best price available. Nothing left on the table." (positive state matters)
- [ ] Edge case: stake not parsed from slip → show percentage gap, prompt user to enter a stake

**Step C — Persistence (the old Phase 2, updated):**
- [x] Core infrastructure already shipped pre-ROADMAP (2026-05-15, commit `b03fad3`): Grade + Leg models, DB writes on every `/api/grade` call, `shareSlug` generation, `/grade/[slug]` public read route. See Pre-existing features.
- [ ] Prisma migration: Leg gets trueProb, impliedProb; Grade gets combinedTrueProb, combinedImpliedProb, bestParlayOdds, foundMoney, stake, settled, won — current schema has neither set of fields
- [ ] Manual "mark won/lost" by grade owner — no settled/won field exists yet to set
- [ ] Verdict template system wired (placeholder strings; final copy from Claude/Griffin) — no verdict-related code in repo yet

**Step D — Share card (the old Phase 3, re-aimed):**
- [ ] Standard card hero = found money ("sportslogic found me $31"), grade + TO HIT supporting
- [ ] Win-state variant: won === true && trueProb < 0.20 → "DEFIED THE ODDS — hit at 9%"
- [ ] OG image updated to match

**Step E — Ops minimum (required before launch):**
- [x] /api/health endpoint — real authenticated calls to Anthropic + Odds API + DB, not just key existence checks. Shape: `{ status, checks: { anthropic, oddsApi, db } }`. See RUNBOOK.md. Shipped 2026-06-15.
- [ ] Uptime monitor pinging /api/health every 5 min, alerting Griffin's phone on non-200
- [ ] RUNBOOK.md: five failure modes (entries #1 Anthropic, #2 Odds API written; #3–5 TBD)
- [x] Odds caching: shipped ahead of Step E (2026-06-11). Next.js `next: { revalidate: 300 }` on fetchOdds, fetchEvents, fetchPropOdds — shared across serverless instances via Vercel Data Cache. Timing logged (ms) to distinguish cache hits (~0ms) from real fetches (~100-500ms).

**Step F — Launch:**
- [ ] Final verdict copy shipped
- [ ] Homepage headline updated to found-money framing
- [ ] Merged to prod; Griffin grades a real slip on the live site
- [ ] [GRIFFIN] launch criterion: ___

## Decision Log
- 2026-06-10 — Grade = price quality, never outcome prediction. Predictive language banned.
- 2026-06-10 — Tax = absolute gap in percentage points (impliedProb − trueProb).
- 2026-06-10 — Verdict copy = static templates with interpolated numbers, no LLM in grading path.
- 2026-06-10 — Settlement = manual "mark won/lost" by grade owner. No automation yet.
- 2026-06-10 — Win-state card triggers at won === true && trueProb < 0.20.
- 2026-06-10 — Deploy rule: branch → preview → Griffin verifies personally → then prod. No exceptions.
- 2026-06-10 — Verification standard: "compiles" ≠ "done." Done = works end-to-end on a deploy.
- 2026-06-10 — No grade renders without resolved odds for every leg. Missing data = loud, specific abort.
- 2026-06-10 — Every failure state gets a specific honest message.
- 2026-06-10 — Supported sports at launch: NBA, NFL, MLB, NHL, NCAAB, NCAAF. Golf parked.
- 2026-06-11 — Found Money (dollar gap vs. best available price) is the hero metric. Grade remains as voice. Approved after overnight consideration.
- 2026-06-11 — Journal will track cumulative found money ("found you $412 this season") — rung 2 scope, noted now.
- 2026-06-11 — Tout auditing → Parking Lot as rung-4 content/marketing idea. Not product. Public free picks only if ever.
- 2026-06-11 — OCR parses slips as units (singles vs. priced groups). Group units abort with a named message until SGP pricing exists. Boosted slips store both baseOdds and paidOdds; sport check fires before SGP check.
- 2026-06-11 — SportsLogic is a pre-game tool; in-play/settled slips get a specific "game already started" message, not a grade.
- 2026-06-11 — Odds caching pulled forward from Step E. fetch({ next: { revalidate: 300 } }) on all three Odds API fetch functions. Per-grade cost drops from 3–48 credits to near-zero marginal after first hit. Step E retains health endpoint + monitor.
- 2026-06-11 — Step A golf abort verified on preview; ROADMAP not updated at the time, retroactively recorded 2026-06-15.
- 2026-06-15 — Homepage copy v2 (Found Money positioning, lies stripped) promoted to production.
- 2026-06-15 — /api/health pulled forward from Step E (operational diagnostic value justifies it now). Real authenticated pings: Anthropic 1-token message, Odds API /v4/sports, Prisma SELECT 1. 60s in-memory + CDN cache.
- 2026-06-15 — Compliance pages (Privacy, ToS, Affiliate Disclosure, Responsible Gambling, 21+ age gate) built ahead of affiliate applications. Required for FTC/state compliance and as a prerequisite for any sportsbook affiliate program application.
- 2026-06-16 — hasGameStarted() rewritten: requires team match + commence_time check + completed status. Stale-matchup case (back-to-back series with identical team names) fixed.
- 2026-06-16 — Ambiguous game match falls through, never aborts. "Already started" requires a confident, single, unambiguous match.
- 2026-06-16 — First end-to-end successful grade rendered. 7-leg moneyline parlay graded D+, -32.2% EV. Pinnacle devig + cross-market comparison + smart swap all functioning. Step A closes.
- 2026-06-16 — Prop grading bug fixed: client was sending bet_type ("prop") instead of prop_type ("hr"/"hits"/etc.) to the engine, causing every prop leg to send malformed markets=prop to Odds API and 422. One-line fix at grade/page.tsx:272.
- 2026-06-16 — Tonight's Trap and Sportsbook Report Card removed from homepage. Reason: publicly grading named sportsbooks by letter grade conflicts with affiliate program eligibility — those operators' programs reject affiliates who publish negative comparative content. Removing preserves the affiliate path planned for fall 2026.
- 2026-06-16 — JOURNAL.md and ROADMAP.md reconciled. ROADMAP is now the sole source of truth going forward. Pre-ROADMAP features cataloged. JOURNAL.md archived (read-only historical record, no new entries).
- 2026-06-16 — Discovered during reconciliation: share-card and persistence infrastructure (shareSlug, grade/leg DB writes, share route) is already live and functional, despite ROADMAP Step C/D listing it as not-started. ROADMAP updated to reflect actual state. Step C/D scope re-evaluation pending — the journal build is closer than we thought.
- 2026-06-16 — Discovered new failure mode: OCR returned prop_type: null for a clear HR prop leg, client passed null forward, Odds API 422'd, generic error rendered. Three fixes shipped: client-side validation gates broken units before API call, parse-slip prompt audited for HR-prop phrasings, structured logging added to parse-slip route.
- 2026-06-16 — Six-issue grade-page polish pass. Root cause for the player-name bugs (share card legs, "Hurting You Most"): both built their display strings from leg.team/leg.betType (server-side fields with no player name and raw lowercase market keys) instead of correlating by array index back to the client's parsed singleUnits (which have player + formatted market) — the upper-page leg breakdown already did this correlation correctly, the share card and weakest-leg callout didn't. Fixed by reusing that index-correlation pattern plus a new shared src/lib/prop-labels.ts (used by both client and grading-engine.ts) so prop labels can't drift out of sync between the two again. Swap-suggestion logic was recommending team-level alternatives (e.g. a moneyline/spread) for prop legs; scoped it to same-player-same-market alternate lines only, returning null if none beats the original — never a cross-market suggestion. Subhead copy changed from grade-first ("Screenshot your bet slip. We grade every leg.") to found-money-first ("Find the money your sportsbook is hiding. We grade every leg.") to match homepage voice. Share-card aesthetics reworked: grade letter is now the hero (96px) with EV demoted to a subordinate stat (18px), more vertical breathing room in leg rows, wordmark given a clean bottom treatment with its own divider — all using existing brand tokens, no new colors or fonts. Found but did not fix: the persisted /grade/[slug] public page has the identical team-vs-player display bug, but its Leg Prisma model has no player column at all — fixing it needs a schema migration, flagged per Operating Rule 3, not done in this pass.
- 2026-06-16 — Three follow-up fixes after preview review. Share-card leg-label truncation root cause was unused flex space (maxWidth:158 capped the label well below the ~210px the row's flex layout actually allowed), not just text length — fixed by dropping the redundant "(o0.5)" suffix on the share card specifically (kept on the upper-page breakdown) and widening maxWidth to 195. Added a one-line Found Money verdict sentence to the share card itself ("You're paying like it's X%. We price it at Y%.") between the EV stat and the leg list, using data already in the grade response. Replaced gradeContext() on the upper /grade page only (not the share card, not the separate /grade/[slug] page) — old predictive-language strings ("Below average. Weak legs dragging you down.") swapped for price-only Found Money framing per grade tier, consistent with the 2026-06-10 predictive-language ban.
- 2026-06-16 — Visual polish pass on /grade result page + share card, from a concrete contrast/hierarchy/spacing spec (exact hex values, no new colors invented). Global text tokens in globals.css bumped to fix sitewide gray-on-gray: --color-text-primary #E2E4EA→#F4F4F5 (zinc-100), --color-text-secondary #8A8FA3→#A1A1AA (zinc-400), --color-text-tertiary #4F5468→#71717A (zinc-500, the new floor — nothing dimmer is allowed on body text). This single change also fixes contrast on the homepage, footer, and all legal pages, which share the same token system. Dot-grid background opacity halved (rgba alpha 0.6→0.3) so it stops competing with content. On /grade: the four result-step containers were differentiated (grade card gets a stronger grade-tinted border + soft inset glow; leg breakdown recedes to a plain bg-zinc-900/40 card; "Hurting You Most" gets a red-500/30 border as a warning callout; share card treated separately, see below). Grade letter got presence: a color-matched radial glow behind it, tighter letter-spacing, and a muted "GRADE" eyebrow label. Content column widened from 520px (with an inconsistent 640px nav) to a uniform 720px to kill the "narrow column, empty desktop" feel. Share card (renders via html-to-image with inline styles, not Tailwind classes — every spec item translated to raw CSS): background is now a zinc-900→black diagonal gradient with a stronger zinc-700 border and a heavier black/50 shadow; top wordmark recolored to brand green; leg rows get a thin zinc-800 top border as separators instead of pure gap spacing; padding widened; bottom wordmark bumped to 13px. Card height bumped 485→495 to absorb the wider padding without squeezing the leg list. Not done: a full per-element tier audit of every string on the homepage/legal pages — relied on the token-level fix instead, which resolves the actual complaint (low contrast) without a file-by-file sweep.

## Parking Lot (good ideas, not now)
- Multi-book devig (beyond Pinnacle)
- SGP correlation modeling (beyond warnings)
- Automated settlement via results API
- Pikkit-style sportsbook sync
- Subscription tier ($5-8/mo) — pricing TBD at rung 2
- Golf support (requires different devig treatment — large fields, longshot bias, multiplicative vs power devig diverges hard at long odds)
- Cumulative found-money stat in journal (rung 2)
- HTTP 422 on a prop-odds fetch (event ff1934, seen 2026-06-16) — not addressed, needs verification next time it recurs. Could be market not yet posted, SPORT_MAP gap, or stale event ID.
- Tout audit content series (rung 4, marketing)
- [GRIFFIN] add freely

## Operating Rules
1. No work outside the current rung. New ideas → Parking Lot.
2. Every decision gets a Decision Log line, dated.
3. Migrations and new dependencies: flag before executing.
4. Auth and share-slug system: do not touch without explicit instruction.
5. After each work session: report what changed, how verified, what's blocked.
6. Any new feature, page, route, or integration requires a ROADMAP entry before code is written. No exceptions, regardless of how small.
