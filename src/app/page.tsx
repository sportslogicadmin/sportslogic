import Image from "next/image";
import { EmailForm } from "./email-form";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-[2px] text-text-tertiary uppercase text-center mb-12 sm:mb-14">
      {children}
    </p>
  );
}

function Divider() {
  return (
    <div className="w-full max-w-[1080px] mx-auto px-6">
      <div className="h-px bg-border/30" />
    </div>
  );
}

const legs = [
  { name: "Chiefs ML (-145)", grade: "A", ev: "+6.1% EV", color: "bg-accent", glow: "dot-glow-green" },
  { name: "Celtics -4.5 (-110)", grade: "B+", ev: "+2.8% EV", color: "bg-accent", glow: "dot-glow-green" },
  { name: "Yankees Over 8.5 (-105)", grade: "C", ev: "-1.2% EV", color: "bg-amber", glow: "dot-glow-amber" },
  { name: "Mahomes O275.5 pass yds (-120)", grade: "D+", ev: "-4.1% EV", color: "bg-red", glow: "dot-glow-red" },
];

const betTypes = ["PARLAYS", "STRAIGHT BETS", "PLAYER PROPS", "SAME-GAME PARLAYS", "TEASERS", "FUTURES"];
const sports = ["NFL", "NBA", "MLB", "NHL", "NCAAF", "NCAAB", "EPL", "LA LIGA", "MLS"];

const freeFeatures = ["2 scans per day", "Basic grade (A–F)", "Line comparison", "Community access (read-only)"];
const proFeatures = ["Unlimited scans", "Full reports + EV breakdown", "AI swap suggestions", "Bet history + ROI tracking", "All courses + simulators", "Real-time alerts"];

function Check() {
  return (
    <svg className="w-4 h-4 text-text-tertiary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CheckGreen() {
  return (
    <svg className="w-4 h-4 text-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

/* ── Phone mockup with a bet slip inside ── */
function PhoneMockup() {
  return (
    <div className="w-[200px] sm:w-[220px] mx-auto">
      {/* Phone frame */}
      <div className="bg-[#1a1a1a] rounded-[24px] p-2 border border-[#333] shadow-2xl">
        {/* Notch */}
        <div className="flex justify-center mb-1">
          <div className="w-16 h-1.5 bg-[#333] rounded-full" />
        </div>
        {/* Screen */}
        <div className="bg-[#0f1116] rounded-[16px] p-3 text-[10px] space-y-2">
          <p className="text-text-tertiary text-[8px] uppercase tracking-wider text-center">4-Leg Parlay</p>
          <div className="space-y-1.5">
            <div className="flex justify-between bg-[#161923] rounded-md px-2 py-1.5">
              <span className="text-text-primary text-[9px]">Chiefs ML</span>
              <span className="text-text-secondary text-[9px]">-145</span>
            </div>
            <div className="flex justify-between bg-[#161923] rounded-md px-2 py-1.5">
              <span className="text-text-primary text-[9px]">Celtics -4.5</span>
              <span className="text-text-secondary text-[9px]">-110</span>
            </div>
            <div className="flex justify-between bg-[#161923] rounded-md px-2 py-1.5">
              <span className="text-text-primary text-[9px]">Yankees O8.5</span>
              <span className="text-text-secondary text-[9px]">-105</span>
            </div>
            <div className="flex justify-between bg-[#161923] rounded-md px-2 py-1.5">
              <span className="text-text-primary text-[9px]">Mahomes O275</span>
              <span className="text-text-secondary text-[9px]">-120</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-border">
            <span className="text-text-tertiary text-[8px]">Payout</span>
            <span className="text-accent text-[10px] font-bold">+892</span>
          </div>
          <div className="bg-accent rounded-md py-1.5 text-center">
            <span className="text-bg text-[9px] font-bold uppercase">Place bet</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mini grade card for How It Works step 2 ── */
function MiniGradeCard() {
  return (
    <div className="w-[200px] sm:w-[220px] mx-auto bg-surface border border-border rounded-xl p-3 text-[10px]"
      style={{ boxShadow: "0 0 40px rgba(0, 232, 123, 0.06)" }}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[8px] text-text-secondary uppercase tracking-wider">4-Leg Parlay</span>
        <span className="text-3xl font-bold text-accent leading-none">B+</span>
      </div>
      <div className="h-px bg-border mb-2" />
      <div className="space-y-1.5">
        {[
          { name: "Chiefs ML", grade: "A", dot: "bg-accent" },
          { name: "Celtics -4.5", grade: "B+", dot: "bg-accent" },
          { name: "Yankees O8.5", grade: "C", dot: "bg-amber" },
          { name: "Mahomes O275", grade: "D+", dot: "bg-red" },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${l.dot}`} />
            <span className="text-text-primary flex-1 text-[9px]">{l.name}</span>
            <span className="text-text-secondary text-[9px] font-semibold">{l.grade}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Mini suggestion box for How It Works step 3 ── */
function MiniSuggestion() {
  return (
    <div className="w-[200px] sm:w-[220px] mx-auto bg-surface border border-border rounded-xl p-3"
      style={{ boxShadow: "0 0 40px rgba(0, 232, 123, 0.06)" }}>
      <div className="bg-bg/60 border border-accent/20 rounded-lg p-3 mb-2">
        <p className="text-[9px] text-text-secondary leading-relaxed">
          <span className="text-accent font-semibold">AI suggestion:</span>{" "}
          Swap leg 4 — Mahomes rush yds O29.5 has +3.8% EV. Raises parlay to A-.
        </p>
      </div>
      <div className="flex items-center gap-2 justify-center">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[8px] text-accent font-semibold uppercase tracking-wider">SMARTER BET</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="mt-2 bg-[#161923] rounded-md p-2">
        <div className="flex justify-between text-[9px]">
          <span className="text-text-primary">Mahomes rush O29.5</span>
          <span className="text-accent font-bold">A-</span>
        </div>
        <div className="text-[8px] text-accent mt-0.5">+3.8% EV</div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="w-full">
      {/* ── NAV ── */}
      <nav className="w-full max-w-[1080px] mx-auto flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="SportsLogic"
            width={72}
            height={36}
            className="h-9 w-auto"
            priority
          />
          <span className="text-lg font-bold text-text-primary tracking-tight">
            SportsLogic
          </span>
        </div>
        <a
          href="#waitlist"
          className="h-9 px-4 rounded-lg bg-accent text-bg text-xs font-semibold uppercase tracking-[0.5px] flex items-center hover:brightness-110 transition-all"
        >
          GET EARLY ACCESS
        </a>
      </nav>

      {/* ── SECTION 1: HERO ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 pt-24 sm:pt-32 pb-20 sm:pb-24 text-center relative">
        <div
          className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(0, 232, 123, 0.07) 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />

        <p className="relative text-xs font-semibold tracking-[2px] text-text-tertiary uppercase mb-6">
          THE GRADING TOOL BUILT FOR BETTORS
        </p>
        <h1 className="relative text-[36px] sm:text-[48px] md:text-[60px] font-bold uppercase tracking-[-1px] leading-[1.05] max-w-[720px] mx-auto mb-6">
          KNOW YOUR{" "}
          <span className="text-accent">EDGE</span> BEFORE YOU BET.
        </h1>
        <p className="relative text-sm sm:text-[17px] text-text-secondary max-w-[540px] mx-auto leading-[1.7] mb-10">
          Screenshot any bet slip. Our AI breaks it down in seconds —
          expected value, leg-by-leg analysis, and smarter alternatives.
          The grading tool built for bettors who want to win.
        </p>
        <div id="waitlist" className="relative">
          <EmailForm />
        </div>
        <p className="relative text-xs text-text-tertiary mt-4 uppercase tracking-wide">
          FREE TO START. NO CREDIT CARD REQUIRED.
        </p>
        <p className="relative text-xs text-text-tertiary mt-6">
          Works with DraftKings &bull; FanDuel &bull; BetMGM &bull; ESPN Bet &bull; Caesars
        </p>
      </section>

      <Divider />

      {/* ── SECTION 2: HOW IT WORKS (visual product demo) ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 pt-20 sm:pt-24 pb-16 sm:pb-20">
        <SectionLabel>HOW IT WORKS</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6 items-start">
          {/* Step 1 — Phone mockup */}
          <div className="text-center relative">
            <PhoneMockup />
            <p className="text-xs font-mono text-text-tertiary mt-5 mb-2">01</p>
            <h3 className="text-sm font-bold uppercase text-text-primary mb-2 tracking-wide">
              SCREENSHOT YOUR BET
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed max-w-[260px] mx-auto">
              Open any sportsbook app. Screenshot your bet slip and upload it.
            </p>
            {/* Arrow */}
            <div className="hidden md:block absolute right-0 top-[120px] translate-x-1/2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-tertiary">
                <path d="M5 12h14m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Step 2 — Grade card */}
          <div className="text-center relative">
            <MiniGradeCard />
            <p className="text-xs font-mono text-text-tertiary mt-5 mb-2">02</p>
            <h3 className="text-sm font-bold uppercase text-text-primary mb-2 tracking-wide">
              AI GRADES EVERY LEG
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed max-w-[260px] mx-auto">
              Get an overall grade plus a leg-by-leg EV breakdown in seconds.
            </p>
            {/* Arrow */}
            <div className="hidden md:block absolute right-0 top-[120px] translate-x-1/2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-tertiary">
                <path d="M5 12h14m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Step 3 — Suggestion */}
          <div className="text-center">
            <MiniSuggestion />
            <p className="text-xs font-mono text-text-tertiary mt-5 mb-2">03</p>
            <h3 className="text-sm font-bold uppercase text-text-primary mb-2 tracking-wide">
              GET SMARTER ALTERNATIVES
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed max-w-[260px] mx-auto">
              See which legs are hurting you and get AI-powered swap suggestions.
            </p>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── SECTION 3: WHY SPORTSLOGIC ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 pt-20 sm:pt-24 pb-16 sm:pb-20">
        <SectionLabel>WHY SPORTSLOGIC</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[900px] mx-auto">
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <span className="text-accent text-sm font-bold">01</span>
            </div>
            <h3 className="text-sm font-bold uppercase text-text-primary mb-3 tracking-wide">
              NOT A PICKS SERVICE
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              We don&apos;t tell you what to bet. We grade the bets you&apos;re
              already making. No locks, no guaranteed winners, just math.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <span className="text-accent text-sm font-bold">02</span>
            </div>
            <h3 className="text-sm font-bold uppercase text-text-primary mb-3 tracking-wide">
              TRANSPARENT GRADING
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Every grade is backed by expected value, line comparison across
              books, correlation analysis, and situational factors. You see
              exactly why a bet scored the way it did.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <span className="text-accent text-sm font-bold">03</span>
            </div>
            <h3 className="text-sm font-bold uppercase text-text-primary mb-3 tracking-wide">
              BUILT BY BETTORS
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              We built this because we were tired of losing money on parlays
              that looked good but weren&apos;t. SportsLogic started as a tool
              we made for ourselves.
            </p>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── SECTION 4: SAMPLE GRADE CARD ── */}
      <section className="w-full max-w-[1080px] mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-16 sm:pb-20">
        <SectionLabel>SEE IT IN ACTION</SectionLabel>

        <div
          className="max-w-[520px] mx-auto bg-surface border border-border rounded-xl overflow-hidden"
          style={{ boxShadow: "0 0 80px rgba(0, 232, 123, 0.08)" }}
        >
          <div
            className="p-5 sm:p-6 pb-0"
            style={{ background: "linear-gradient(180deg, rgba(0, 232, 123, 0.05) 0%, transparent 100%)" }}
          >
            <div className="flex items-start justify-between mb-1">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[1px] text-text-secondary">
                  4-LEG PARLAY
                </span>
                <p className="text-xs text-accent mt-1 uppercase tracking-wide">
                  OVERALL EXPECTED VALUE: +3.2%
                </p>
              </div>
              <span className="text-[64px] font-bold text-accent leading-none -mt-2">
                B+
              </span>
            </div>
          </div>

          <div className="px-5 sm:px-6 pb-5 sm:pb-6">
            <div className="h-px bg-border mb-5" />

            <div className="space-y-4 mb-5">
              {legs.map((leg, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${leg.color} shrink-0 ${leg.glow}`} />
                  <span className="text-sm text-text-primary flex-1 min-w-0 truncate">
                    {leg.name}
                  </span>
                  <span className="text-xs font-semibold text-text-secondary whitespace-nowrap">
                    {leg.grade}
                  </span>
                  <span
                    className={`text-xs font-mono whitespace-nowrap ${
                      leg.ev.startsWith("+") ? "text-accent" : "text-text-secondary"
                    }`}
                  >
                    {leg.ev}
                  </span>
                </div>
              ))}
            </div>

            <div className="h-px bg-border mb-5" />

            <div className="bg-bg/60 border border-border rounded-lg p-4 mb-4">
              <p className="text-xs text-text-secondary leading-relaxed">
                <span className="text-accent font-semibold">AI suggestion:</span>{" "}
                Swap leg 4 — Mahomes rushing yards O29.5 has +3.8% EV and
                correlates positively with Chiefs ML. This would raise your
                parlay to an A-.
              </p>
            </div>

            <p className="text-[11px] text-text-tertiary text-center uppercase tracking-wide">
              POWERED BY SPORTSLOGIC
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <button className="h-12 w-full sm:w-auto px-8 rounded-lg bg-accent text-bg text-xs font-semibold uppercase tracking-[0.5px] hover:brightness-110 transition-all cursor-pointer">
            GRADE YOUR FIRST BET FREE
          </button>
        </div>
      </section>

      <Divider />

      {/* ── SECTION 5: OUR STORY ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 pt-20 sm:pt-24 pb-16 sm:pb-20">
        <SectionLabel>OUR STORY</SectionLabel>
        <div className="max-w-[600px] mx-auto text-center">
          <p className="text-sm sm:text-base text-text-secondary leading-[1.8]">
            SportsLogic started with a simple question — why are we losing
            money on bets that feel right? We started building models to
            calculate the real expected value behind every bet. We stopped
            guessing and started grading. The results changed everything.
            Now we&apos;re turning that same system into a tool anyone can use.
            No experience needed. No math degree required. Just screenshot
            your bet and we&apos;ll show you what the books don&apos;t want
            you to see.
          </p>
        </div>
      </section>

      <Divider />

      {/* ── SECTION 6: WHAT WE GRADE ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 pt-20 sm:pt-24 pb-16 sm:pb-20">
        <SectionLabel>WHAT WE GRADE</SectionLabel>

        <div className="flex flex-wrap justify-center gap-2.5 mb-5 max-w-[640px] mx-auto">
          {betTypes.map((t) => (
            <span
              key={t}
              className="px-4 py-2 rounded-full bg-surface border border-border text-sm font-medium text-text-primary"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2.5 max-w-[640px] mx-auto">
          {sports.map((s) => (
            <span
              key={s}
              className="px-4 py-2 rounded-full bg-surface border border-accent/20 text-xs font-medium text-text-primary"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── SECTION 7: PRICING ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 pt-20 sm:pt-24 pb-16 sm:pb-20">
        <SectionLabel>PRICING</SectionLabel>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-[640px] mx-auto">
          {/* Pro */}
          <div className="bg-surface border border-accent rounded-xl p-6 flex flex-col order-first sm:order-last">
            <p className="text-xs font-semibold uppercase tracking-[1px] text-accent mb-4">PRO</p>
            <div className="mb-5">
              <span className="text-3xl font-bold text-text-primary">$15</span>
              <span className="text-sm text-text-secondary ml-1.5">/month</span>
            </div>
            <ul className="space-y-3 flex-1">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <CheckGreen />
                  {f}
                </li>
              ))}
            </ul>
            <button className="w-full h-10 rounded-lg bg-accent text-bg text-xs font-semibold uppercase tracking-[0.5px] hover:brightness-110 transition-all cursor-pointer mt-6">
              JOIN WAITLIST
            </button>
          </div>

          {/* Free */}
          <div className="bg-surface border border-border rounded-xl p-6 flex flex-col order-last sm:order-first">
            <p className="text-xs font-semibold uppercase tracking-[1px] text-text-tertiary mb-4">FREE</p>
            <div className="mb-5">
              <span className="text-3xl font-bold text-text-primary">$0</span>
              <span className="text-sm text-text-secondary ml-1.5">forever</span>
            </div>
            <ul className="space-y-3 flex-1">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <Check />
                  {f}
                </li>
              ))}
            </ul>
            <button className="w-full h-10 rounded-lg bg-transparent border border-text-tertiary text-text-secondary text-xs font-semibold uppercase tracking-[0.5px] hover:border-text-secondary transition-all cursor-pointer mt-6">
              START FREE
            </button>
          </div>
        </div>
      </section>

      {/* ── SECTION 8: FAQ ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 pt-20 sm:pt-24 pb-16 sm:pb-20">
        <SectionLabel>FAQ</SectionLabel>
        <div className="max-w-[640px] mx-auto text-center">
          <div className="pb-6">
            <h3 className="text-base font-bold uppercase text-text-primary mb-2">
              IS THIS LEGAL?
            </h3>
            <p className="text-sm text-text-secondary leading-[1.7]">
              Yes. SportsLogic provides analysis and information tools only — we
              never place bets on your behalf. We&apos;re a research tool, like
              a calculator for your bets.
            </p>
          </div>
          <div className="h-px bg-border/30 mb-6" />
          <div className="pb-6">
            <h3 className="text-base font-bold uppercase text-text-primary mb-2">
              HOW ACCURATE IS THE GRADING?
            </h3>
            <p className="text-sm text-text-secondary leading-[1.7]">
              Our grades measure decision quality, not outcome prediction. We
              compare your bet against sharp market consensus and mathematical
              expected value. An A+ bet can still lose — but over time,
              higher-graded bets outperform lower-graded ones.
            </p>
          </div>
          <div className="h-px bg-border/30 mb-6" />
          <div>
            <h3 className="text-base font-bold uppercase text-text-primary mb-2">
              WHAT SPORTSBOOKS DO YOU SUPPORT?
            </h3>
            <p className="text-sm text-text-secondary leading-[1.7]">
              We can read screenshots from DraftKings, FanDuel, BetMGM, Caesars,
              ESPN Bet, and more. If you can screenshot it, we can grade it.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 9: FINAL CTA + FOOTER ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 pt-20 sm:pt-24 pb-16 sm:pb-20 text-center">
        <h2 className="text-2xl sm:text-4xl font-bold uppercase tracking-[-0.5px] mb-4">
          THE EDGE IS WAITING.
        </h2>
        <p className="text-sm text-text-secondary mb-8">
          Join 100+ bettors on the waitlist
        </p>
        <EmailForm />
      </section>

      <footer className="w-full max-w-[1080px] mx-auto px-6 pt-8 pb-10 border-t border-border">
        <p className="text-[12px] text-text-tertiary text-center sm:text-left mb-6 leading-relaxed max-w-[640px]">
          SportsLogic is not a sportsbook. We provide analysis tools for
          informational purposes only. 21+. Gambling problem? Call
          1-800-GAMBLER.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-tertiary">&copy; 2026 SportsLogic</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-text-tertiary hover:text-text-secondary transition-colors">
              Terms
            </a>
            <a href="#" className="text-xs text-text-tertiary hover:text-text-secondary transition-colors">
              Privacy
            </a>
            <a href="#" className="text-xs text-text-tertiary hover:text-text-secondary transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
