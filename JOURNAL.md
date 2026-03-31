# SportsLogic Build Journal

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
