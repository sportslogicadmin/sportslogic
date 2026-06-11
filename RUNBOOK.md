# SPORTSLOGIC — RUNBOOK

Five failure modes and their fixes. Check `/api/health` first on any incident.

---

## Failure #1 — Anthropic API key dead (OCR returns 500/502)

**Symptom:** Users see "Our service is temporarily down" after uploading a slip.
`/api/parse-slip` returns 502. Vercel function logs show:
```
[parse-slip] Anthropic error: 401 ...
```
or
```
[parse-slip] Anthropic error: 400 ... insufficient_quota
```

**Causes (in order of likelihood):**
1. **No credits** — new Anthropic account starts at $0. Add credit at console.anthropic.com → Billing.
2. **Invalid key** — key was revoked, rotated, or the env var has a typo (we once had `ANTHROPIC_API_KEYsk` — the `sk` prefix of the key value was included in the variable name).
3. **Wrong model ID** — `claude-3-5-haiku-20241022` 404s on newer accounts. Current working model: `claude-haiku-4-5-20251001`.

**Fix:**
```bash
# 1. Verify key is valid and account has credits
#    → console.anthropic.com → API Keys + Billing

# 2. Rotate key in Vercel
! npx vercel env rm ANTHROPIC_API_KEY preview production
! npx vercel env add ANTHROPIC_API_KEY   # paste new key, select preview + production

# 3. Redeploy to pick up the new env var
! npx vercel --yes
! npx vercel alias <new-url> sportslogic-preview-sportslogicadmins-projects.vercel.app
```

**Verification:** Upload any supported bet slip screenshot. Should reach confirm step.

---

## Failure #2 — Odds API key dead (grading returns 422)

**Symptom:** OCR parses correctly (confirm step shows legs), but "GRADE THIS PARLAY" aborts with:
```
We couldn't find live odds for leg 1 (<team>). Check that the game is active and try again.
```
Vercel function logs show:
```
[odds-api] baseball_mlb/h2h → HTTP 401
```

**Causes (in order of likelihood):**
1. **Quota exhausted** — free tier is 500 lifetime requests. At 3–13 credits/grade this runs out fast. Check remaining quota at the-odds-api.com → Account.
2. **Key invalid/rotated** — key was regenerated on the The Odds API dashboard and Vercel still has the old one.

**Credit burn rates (for plan sizing):**
| Scenario | Credits/grade |
|---|---|
| 6-leg moneylines, same sport | 3 |
| 6-leg moneylines, mixed sports | up to 9 |
| 5-leg props, teams known | 13 |
| 5-leg props, player scan fires | up to 48 |

**Fix:**
```bash
# 1. Check quota
#    → the-odds-api.com → Account → remaining requests

# 2. If quota exhausted: upgrade plan or wait for monthly reset
#    → Starter: ~60k requests/month
#    → Standard: ~300k requests/month

# 3. If key invalid: generate new key at the-odds-api.com → Account → API Keys
! npx vercel env rm ODDS_API_KEY preview production
! npx vercel env add ODDS_API_KEY   # paste new key, select preview + production
! npx vercel --yes
! npx vercel alias <new-url> sportslogic-preview-sportslogicadmins-projects.vercel.app
```

**Note:** The `/api/health` endpoint (Step E) must make a real authenticated call to the Odds API (not just check key existence) to catch 401s before users do.

**Verification:** Grade a live pre-game slip. Should return a real grade.

---

## Failure #3 — (reserved)

---

## Failure #4 — (reserved)

---

## Failure #5 — (reserved)

---

## /api/health — what it must check (Step E)

When built, the health endpoint must verify:
1. **Anthropic** — POST a minimal message to the API and confirm 200 (not just check key existence)
2. **Odds API** — GET `/sports` endpoint with the key and confirm 200 (not just check key existence)
3. **Database** — `prisma.$queryRaw\`SELECT 1\`` and confirm it responds
4. **Response shape** — `{ status: "ok" | "degraded" | "down", checks: { anthropic, oddsApi, db } }`

Uptime monitor should ping this every 5 minutes and page Griffin's phone on non-200.
