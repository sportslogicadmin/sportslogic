# SPORTSLOGIC.AI — ROADMAP

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

**Step A — Trust the abort (in flight):**
- [ ] Golf-slip silent failure root-caused and fixed (OCR unknown-sport escape + odds abort)
- [ ] Verified: golf slip → named abort message; MLB/NBA slip → clean grade, sane numbers

**Step B — Found Money core:**
- [ ] Compute best-available parlay price from per-leg best_odds/best_book (data already in engine)
- [ ] New hero output: "Pays +400 at [user's book] — best available +462. On your $X stake, that's $Y left on the table."
- [ ] Stats row reordered: FOUND MONEY is the hero, TO HIT and TAX support, grade is the headline voice
- [ ] If user's book IS the best price: say so proudly — "Best price available. Nothing left on the table." (positive state matters)
- [ ] Edge case: stake not parsed from slip → show percentage gap, prompt user to enter a stake

**Step C — Persistence (the old Phase 2, updated):**
- [ ] Prisma migration: Leg gets trueProb, impliedProb; Grade gets combinedTrueProb, combinedImpliedProb, bestParlayOdds, foundMoney, stake, settled, won
- [ ] Manual "mark won/lost" by grade owner
- [ ] Verdict template system wired (placeholder strings; final copy from Claude/Griffin)

**Step D — Share card (the old Phase 3, re-aimed):**
- [ ] Standard card hero = found money ("sportslogic found me $31"), grade + TO HIT supporting
- [ ] Win-state variant: won === true && trueProb < 0.20 → "DEFIED THE ODDS — hit at 9%"
- [ ] OG image updated to match

**Step E — Ops minimum (required before launch):**
- [ ] /api/health endpoint that authenticates both API keys (not just checks existence)
- [ ] Uptime monitor pinging it, alerting Griffin's phone
- [ ] RUNBOOK.md: the five failure modes and their fixes (seed with the dead-key saga)

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

## Parking Lot (good ideas, not now)
- Multi-book devig (beyond Pinnacle)
- SGP correlation modeling (beyond warnings)
- Automated settlement via results API
- Pikkit-style sportsbook sync
- Subscription tier ($5-8/mo) — pricing TBD at rung 2
- Golf support (requires different devig treatment — large fields, longshot bias, multiplicative vs power devig diverges hard at long odds)
- Cumulative found-money stat in journal (rung 2)
- Tout audit content series (rung 4, marketing)
- [GRIFFIN] add freely

## Operating Rules
1. No work outside the current rung. New ideas → Parking Lot.
2. Every decision gets a Decision Log line, dated.
3. Migrations and new dependencies: flag before executing.
4. Auth and share-slug system: do not touch without explicit instruction.
5. After each work session: report what changed, how verified, what's blocked.
