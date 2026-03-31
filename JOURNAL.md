# SportsLogic Build Journal

---

## March 31, 2026 — Day 2

### What was built

**Grading Engine — TypeScript rewrite**
- Rewrote entire Python grading engine in TypeScript (src/lib/grading-engine.ts)
- Now runs natively on Vercel serverless — no Python dependency
- Same math: Pinnacle devig, EV calculation, Kelly criterion, composite scoring
- Supports moneyline, spread, total, and player props
- Live on sportslogic.ai/grade — verified working in production

**Grade page improvements**
- Game selector auto-populates from live Odds API data (today + tomorrow)
- Bet picker: select your side from buttons showing live odds, auto-fills form
- "Different odds on my book" toggle for manual override
- Player props tab (points, rebounds, assists, threes, PRA)
- BUY/HOLD/SELL labels with color-coded pills
- Info tooltips on every stat (tap to open, mobile-friendly)
- Context lines explaining each grade in plain English
- "Better Options" section showing B- or better alternatives when grade is C or below
- "EdgeScore" branding for the 0-100 composite score
- Loading animation: spinner + "COMPARING 30+ BOOKS..."
- SEO metadata via grade/layout.tsx

**Grading calibration**
- EV scale tightened: +3% = 100 (was +5%). Small edges surface better.
- Weight rebalanced: EV 45%, Line 25% (was 50/20). Line value matters more.
- Line value compares against US retail books only (not Pinnacle/offshore)
- +5 bonus when positive EV + top-tier line
- Grade thresholds shifted down ~5 points
- Fixed critical team matching bug: "New York Yankees" was matching "New York Mets" outcomes

**Tonight's Trap + Sportsbook Report Card**
- Finds the worst bet across all sports, shows red card with vig percentage
- "BET THIS INSTEAD" with best alternative for same game
- Sportsbook Report Card: grades each major US book relative to each other
- Scans 450+ bets across NBA, MLB, NHL (ML, spreads, totals, props)
- 30-minute cache, live on homepage

**Homepage premium overhaul**
- Animated CSS mesh gradient in hero (two drifting green ellipses)
- Grade card: subtle float animation + enhanced green glow
- 30% more whitespace between all sections
- Step numbers with green text-shadow glow
- Satoshi heading font throughout, Inter for body
- Dual CTAs in hero: "GRADE A BET NOW" + "JOIN WAITLIST"
- Social proof: "500+ bets graded"
- Dot grid texture opacity reduced for subtlety

**SEO + Social sharing**
- Full OpenGraph tags with 1200x630 branded OG image
- Twitter card (summary_large_image)
- Keywords, theme color, robots directives
- Favicon generated from brain logo (32px + 180px apple touch)
- Proper page titles on both pages

**Code quality audit — 14 issues fixed**
- 3 division-by-zero guards in grading engine
- JSON parse error handling in grade API
- NaN odds validation
- Shared book-names module (was duplicated in 3 files)
- bookName() fallback capitalizes unknown keys
- Accessibility: aria-labels on form inputs
- .gitignore: IDE, OS, build artifacts added

**Competitive research**
- Analyzed OddsJam, PlayerProps.ai, ParlaSavant
- Key takeaways implemented: direct tool CTA, branded scoring, loading states
- Identified price advantage ($15 vs competitors' $50-80)

### Bug fixes
- TypeScript engine odds: team matching now uses exact substring + last-word fallback
- Top grades odds mismatch: display now uses best_odds from engine, not seeded price
- NCAAB filtering: 48hr window + dedup removes conditional/futures matchups
- Started games filtered from game selector
- Rate limit bumped for development (50/day)
- Vercel build: added missing `description` field on Outcome type

### Known issues
- Top grades scan uses quickGradeProp (single-book devig) for props — won't find cross-book edges
- ElevenLabs API key still needs rotation (exposed in Day 1 chat)
- No user accounts or persistent grade history yet
- No parlay grading UI on /grade page yet

---

## March 30, 2026 — Day 1

### What was built

**Landing page (sportslogic.ai)**
- Next.js + Tailwind CSS, deployed on Vercel with auto-deploy from GitHub
- Domain purchased (sportslogic.ai) via Namecheap, DNS configured, SSL active
- www redirect working (handled by Vercel, not next.config)
- Dark premium design: #0C0E14 bg, #00E87B accent, Inter font, dot grid texture
- 9 sections: hero, how it works, why sportslogic, grade card, our story, what we grade, pricing, FAQ, final CTA
- Email waitlist via Formspree (endpoint: https://formspree.io/f/mpqodyda)
- All headings uppercase, body text sentence case
- Fully responsive, tested at 375px mobile width
- No animations (stripped after mobile Safari rendering bug)

**Branding**
- Brain logo designed (split AI/human brain, green + white on dark)
- Logo PNG with transparent background in public/logo.png
- Social accounts created: @sportslogicai on Instagram, TikTok, X
- First content posted across all three platforms

**Video pipeline (tools/quick_video.py)**
- ElevenLabs TTS API (Liam voice, turbo v2.5 model)
- Word-level timestamp extraction for subtitle sync
- ASS subtitle generation (72px bold, sentence-aware pauses)
- FFmpeg rendering: static background + audio + burned subtitles = 1080x1920 MP4
- Background: dark bg, dot grid, green glow at top/bottom, logo centered, sportslogic.ai text
- 4 videos batched and ready for daily posting:
  - promo_v5.mp4 — product explainer
  - sportsbook_edge.mp4 — parlay vig roast
  - sharps_secret.mp4 — sharps vs casual comparison
  - one_stat.mp4 — expected value hook

**Grading engine (tools/grading_engine.py)**
- Live odds from The Odds API (38+ books per game)
- Pinnacle devig for true probability (multiplicative method)
- Expected value calculation
- Kelly criterion sizing
- Composite scoring: 50% EV, 20% line value, 15% market sharpness, 15% situational
- Grade thresholds calibrated (C = average, B+ = real value)
- Supports: moneyline, spread, total, player props (points, rebounds, assists, threes, PRA)
- Player props via event-level Odds API endpoint with all-lines comparison
- CLI with --json output mode

**Grade page (sportslogic.ai/grade)**
- Sport picker → live game dropdown (today + tomorrow) → bet type tabs → side picker with auto-filled odds
- Player props tab with manual entry
- "Different odds on my book" toggle for manual override
- Results card: big letter grade, BUY/HOLD/SELL label, EV%, true probability, fair odds, best available line + book, Kelly criterion, score breakdown bars
- Context lines explaining each grade in plain English
- Rate limiting: 50/day for dev (2/day for production)
- Games API filters out tipped-off games

**Competitive research**
- PropGPT: 60K users, $10/week, mobile-only, buggy, basic analysis
- PlayerProps.ai: 250K users, $60/month, $1M+ ARR, FSGA award winner, community-driven
- Key insight: education + community > picks. BetScore/BUY-SELL pattern works.

### Accounts & credentials (keys in .env, not here)

| Service | Details |
|---------|---------|
| Namecheap | sportslogic.ai domain |
| Vercel | sportslogic project, auto-deploy from main branch |
| GitHub | sportslogicadmin/sportslogic (public repo) |
| Formspree | Waitlist form endpoint |
| ElevenLabs | Creator plan ($22/mo), Liam voice |
| The Odds API | Shared key from kalshi-bot, ~5000 requests/mo remaining |
| TikTok | @sportslogicai |
| Instagram | @sportslogicai |
| X/Twitter | @sportslogicai |

### Known issues
- Python grading engine runs via child_process — doesn't work on Vercel serverless. Need Railway/Fly.io deployment.
- /grade page only works on localhost until engine is deployed externally
- ElevenLabs API key was exposed in chat — needs rotation
- Logo still has faint edge artifacts at certain zoom levels
- Prop grading only finds exact line matches — no fuzzy matching for close lines
- No user accounts or persistent grade history yet
