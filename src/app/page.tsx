import Image from "next/image";
import { EmailForm } from "./email-form";
import { MarketInsights } from "./market-insights";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-heading text-[11px] font-bold tracking-[3px] text-text-tertiary uppercase text-center mb-14 sm:mb-16">
      {children}
    </p>
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

export default function Home() {
  return (
    <div className="w-full">
      {/* ── NAV ── */}
      <nav className="w-full max-w-[1080px] mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="SportsLogic" width={72} height={36} className="h-9 w-auto" priority />
          <span className="font-heading text-lg font-bold text-text-primary tracking-tight">SportsLogic</span>
        </div>
        <a href="#waitlist" className="h-9 px-5 rounded-lg bg-accent text-bg text-[11px] font-semibold uppercase tracking-[0.5px] flex items-center hover:brightness-110 transition-all">
          GET EARLY ACCESS
        </a>
      </nav>

      {/* ── HERO ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 pt-28 sm:pt-40 pb-24 sm:pb-32 text-center relative">
        {/* Animated mesh gradient */}
        <div className="hero-mesh" />

        <p className="font-heading relative text-[11px] font-bold tracking-[3px] text-text-tertiary uppercase mb-8">
          THE GRADING TOOL BUILT FOR BETTORS
        </p>
        <h1 className="font-heading relative text-[38px] sm:text-[52px] md:text-[64px] font-bold uppercase tracking-[-1.5px] leading-[1.02] max-w-[760px] mx-auto mb-8">
          KNOW YOUR{" "}
          <span className="text-accent">EDGE</span> BEFORE YOU BET.
        </h1>
        <p className="relative text-[15px] sm:text-[17px] text-text-secondary max-w-[460px] mx-auto leading-[1.75] mb-10">
          Screenshot any bet slip. Get an instant grade with expected value,
          leg-by-leg analysis, and smarter alternatives.
        </p>

        {/* Dual CTAs */}
        <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <a href="/grade" className="inline-flex items-center justify-center h-13 w-full sm:w-auto px-8 rounded-xl bg-accent text-bg text-[12px] font-bold uppercase tracking-[0.5px] hover:brightness-110 transition-all">
            GRADE A BET NOW
          </a>
          <a href="#waitlist" className="inline-flex items-center justify-center h-13 w-full sm:w-auto px-8 rounded-xl bg-transparent border border-border text-text-secondary text-[12px] font-bold uppercase tracking-[0.5px] hover:border-text-tertiary transition-all">
            JOIN WAITLIST
          </a>
        </div>

        {/* Social proof */}
        <p className="relative text-[12px] text-text-secondary mb-8">
          500+ bets graded &bull; Free to start &bull; No credit card required
        </p>

        {/* Sportsbook compatibility */}
        <p className="relative text-[11px] text-text-tertiary tracking-wide">
          Works with DraftKings &bull; FanDuel &bull; BetMGM &bull; ESPN Bet &bull; Caesars
        </p>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 py-24 sm:py-32">
        <SectionLabel>HOW IT WORKS</SectionLabel>
        <div className="max-w-[560px] mx-auto space-y-16 sm:space-y-20">
          {[
            { n: "01", title: "SCREENSHOT YOUR BET", desc: "Upload a screenshot from any sportsbook app." },
            { n: "02", title: "GET YOUR GRADE", desc: "AI grades every leg with live odds from 30+ books." },
            { n: "03", title: "BET SMARTER", desc: "See which legs hurt you and get AI-powered swap suggestions." },
          ].map((step) => (
            <div key={step.n} className="flex items-start gap-6 sm:gap-10">
              <span className="font-heading text-[52px] sm:text-[56px] font-bold text-accent leading-none shrink-0 w-16 sm:w-20 text-right step-glow">
                {step.n}
              </span>
              <div className="pt-2 sm:pt-3">
                <h3 className="font-heading text-sm font-bold uppercase text-text-primary mb-2 tracking-[1px]">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY SPORTSLOGIC ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 py-24 sm:py-32">
        <SectionLabel>WHY SPORTSLOGIC</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[920px] mx-auto">
          {[
            { n: "01", title: "NOT A PICKS SERVICE", desc: "We grade the bets you're already making. No locks — just math." },
            { n: "02", title: "TRANSPARENT GRADING", desc: "Every grade is backed by EV, line comparison, and correlation analysis." },
            { n: "03", title: "BUILT BY BETTORS", desc: "We built this for ourselves first. Now it's yours." },
          ].map((card) => (
            <div key={card.n} className="bg-surface border border-border rounded-2xl p-7">
              <div className="w-9 h-9 rounded-xl bg-accent/8 flex items-center justify-center mb-5">
                <span className="font-heading text-accent text-sm font-bold">{card.n}</span>
              </div>
              <h3 className="font-heading text-[13px] font-bold uppercase text-text-primary mb-3 tracking-[0.5px]">{card.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── GRADE CARD ── */}
      <section className="w-full max-w-[1080px] mx-auto px-4 sm:px-6 py-24 sm:py-32 relative">
        <SectionLabel>SEE IT IN ACTION</SectionLabel>

        {/* Green glow behind card */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none" style={{
          background: "radial-gradient(circle, rgba(0,232,123,0.04) 0%, transparent 60%)",
          filter: "blur(60px)",
        }} />

        <div
          className="card-float max-w-[520px] mx-auto bg-surface border border-border rounded-2xl overflow-hidden relative"
          style={{ boxShadow: "0 0 100px rgba(0, 232, 123, 0.07), 0 20px 60px rgba(0,0,0,0.3)" }}
        >
          <div className="p-6 sm:p-7 pb-0" style={{ background: "linear-gradient(180deg, rgba(0, 232, 123, 0.04) 0%, transparent 100%)" }}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <span className="font-heading text-[11px] font-bold uppercase tracking-[1.5px] text-text-secondary">4-LEG PARLAY</span>
                <p className="text-[11px] text-accent mt-1.5 uppercase tracking-[1px] font-medium">OVERALL EXPECTED VALUE: +3.2%</p>
              </div>
              <span className="font-heading text-[68px] font-bold text-accent leading-none -mt-2">B+</span>
            </div>
          </div>

          <div className="px-6 sm:px-7 pb-6 sm:pb-7">
            <div className="h-px bg-border mb-5" />
            <div className="space-y-4 mb-5">
              {legs.map((leg, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${leg.color} shrink-0 ${leg.glow}`} />
                  <span className="text-sm text-text-primary flex-1 min-w-0 truncate">{leg.name}</span>
                  <span className="font-heading text-xs font-bold text-text-secondary whitespace-nowrap">{leg.grade}</span>
                  <span className={`text-xs font-mono whitespace-nowrap ${leg.ev.startsWith("+") ? "text-accent" : "text-text-tertiary"}`}>{leg.ev}</span>
                </div>
              ))}
            </div>
            <div className="h-px bg-border mb-5" />
            <div className="bg-bg/40 border border-accent/10 rounded-xl p-4 mb-5">
              <p className="text-xs text-text-secondary leading-relaxed">
                <span className="text-accent font-semibold">AI suggestion:</span>{" "}
                Swap leg 4 — Mahomes rushing yards O29.5 has +3.8% EV and
                correlates positively with Chiefs ML. This would raise your
                parlay to an A-.
              </p>
            </div>
            <p className="text-[10px] text-text-tertiary text-center uppercase tracking-[1.5px]">POWERED BY SPORTSLOGIC</p>
          </div>
        </div>

        <div className="text-center mt-10">
          <a href="/grade" className="inline-flex items-center h-13 sm:h-12 w-full sm:w-auto px-10 rounded-xl bg-accent text-bg text-[12px] font-bold uppercase tracking-[0.5px] hover:brightness-110 transition-all justify-center">
            GRADE YOUR FIRST BET FREE
          </a>
        </div>
      </section>

      {/* ── MARKET INSIGHTS (live data) ── */}
      <MarketInsights />

      {/* ── OUR STORY ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 py-24 sm:py-32">
        <SectionLabel>OUR STORY</SectionLabel>
        <div className="max-w-[520px] mx-auto text-center">
          <p className="text-[15px] text-text-secondary leading-[1.85]">
            SportsLogic started with a simple question — why do we keep
            losing money on bets that feel right? So we built models to
            calculate the real expected value behind every bet. We stopped
            guessing and started grading. Now we&apos;re building the tool
            we wish we had from day one — one that shows you exactly what
            the books don&apos;t want you to see. No math degree required.
          </p>
        </div>
      </section>

      {/* ── WHAT WE GRADE ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 py-24 sm:py-32">
        <SectionLabel>WHAT WE GRADE</SectionLabel>
        <div className="flex flex-wrap justify-center gap-2.5 mb-5 max-w-[640px] mx-auto">
          {betTypes.map((t) => (
            <span key={t} className="px-5 py-2.5 rounded-full bg-surface border border-border text-[13px] font-medium text-text-primary">{t}</span>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2.5 max-w-[640px] mx-auto">
          {sports.map((s) => (
            <span key={s} className="px-5 py-2.5 rounded-full bg-surface border border-accent/15 text-xs font-medium text-text-primary">{s}</span>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 py-24 sm:py-32">
        <SectionLabel>PRICING</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-[640px] mx-auto">
          <div className="bg-surface border border-accent/30 rounded-2xl p-7 flex flex-col order-first sm:order-last"
            style={{ boxShadow: "0 0 40px rgba(0,232,123,0.04)" }}>
            <p className="font-heading text-[11px] font-bold uppercase tracking-[1.5px] text-accent mb-5">PRO</p>
            <div className="mb-6">
              <span className="font-heading text-4xl font-bold text-text-primary">$15</span>
              <span className="text-sm text-text-secondary ml-2">/month</span>
            </div>
            <ul className="space-y-3.5 flex-1">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary"><CheckGreen />{f}</li>
              ))}
            </ul>
            <button className="w-full h-11 rounded-xl bg-accent text-bg text-[11px] font-bold uppercase tracking-[0.5px] hover:brightness-110 transition-all cursor-pointer mt-7">
              JOIN WAITLIST
            </button>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-7 flex flex-col order-last sm:order-first">
            <p className="font-heading text-[11px] font-bold uppercase tracking-[1.5px] text-text-tertiary mb-5">FREE</p>
            <div className="mb-6">
              <span className="font-heading text-4xl font-bold text-text-primary">$0</span>
              <span className="text-sm text-text-secondary ml-2">forever</span>
            </div>
            <ul className="space-y-3.5 flex-1">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary"><Check />{f}</li>
              ))}
            </ul>
            <button className="w-full h-11 rounded-xl bg-transparent border border-text-tertiary text-text-secondary text-[11px] font-bold uppercase tracking-[0.5px] hover:border-text-secondary transition-all cursor-pointer mt-7">
              START FREE
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 py-24 sm:py-32">
        <SectionLabel>FAQ</SectionLabel>
        <div className="max-w-[600px] mx-auto">
          {[
            { q: "IS THIS LEGAL?", a: "Yes. We provide analysis tools only — we never place bets on your behalf." },
            { q: "HOW ACCURATE IS THE GRADING?", a: "We measure decision quality, not outcome prediction. An A+ bet can still lose — but higher-graded bets outperform over time." },
            { q: "WHAT SPORTSBOOKS DO YOU SUPPORT?", a: "DraftKings, FanDuel, BetMGM, Caesars, ESPN Bet, and more. If you can screenshot it, we can grade it." },
          ].map((faq, i) => (
            <div key={i} className={i > 0 ? "mt-8 pt-8 border-t border-border/20" : ""}>
              <h3 className="font-heading text-[14px] font-bold uppercase text-text-primary mb-3 tracking-[0.5px] text-center">{faq.q}</h3>
              <p className="text-sm text-text-secondary leading-[1.75] text-center">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section id="waitlist" className="w-full max-w-[1080px] mx-auto px-6 py-24 sm:py-32 text-center relative">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] pointer-events-none" style={{
          background: "radial-gradient(ellipse, rgba(0,232,123,0.04) 0%, transparent 65%)",
          filter: "blur(60px)",
        }} />
        <h2 className="font-heading relative text-2xl sm:text-[40px] font-bold uppercase tracking-[-1px] mb-4">
          THE EDGE IS WAITING.
        </h2>
        <p className="relative text-sm text-text-secondary mb-10">
          Join 500+ bettors on the waitlist
        </p>
        <div className="relative max-w-[440px] mx-auto">
          <EmailForm />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="w-full max-w-[1080px] mx-auto px-6 pt-10 pb-12 border-t border-border/30">
        <p className="text-[11px] text-text-tertiary text-center sm:text-left mb-6 leading-relaxed max-w-[640px]">
          SportsLogic is not a sportsbook. We provide analysis tools for
          informational purposes only. 21+. Gambling problem? Call
          1-800-GAMBLER.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-text-tertiary">&copy; 2026 SportsLogic</p>
          <div className="flex items-center gap-8">
            <a href="#" className="text-[11px] text-text-tertiary hover:text-text-secondary transition-colors">Terms</a>
            <a href="#" className="text-[11px] text-text-tertiary hover:text-text-secondary transition-colors">Privacy</a>
            <a href="#" className="text-[11px] text-text-tertiary hover:text-text-secondary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
