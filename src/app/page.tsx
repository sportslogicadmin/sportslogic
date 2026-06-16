import Link from "next/link";
import Image from "next/image";
import { EmailForm } from "./email-form";
import { MarketInsights } from "./market-insights";
import { SiteFooter } from "@/components/site-footer";

// ── Centralised marketing numbers ─────────────────────────────────────────────
const BOOKS_COMPARED = "30+";

// ── Static data ────────────────────────────────────────────────────────────────
const betTypes = ["PARLAYS", "STRAIGHT BETS", "PLAYER PROPS"];
const sports = ["NFL", "NBA", "MLB", "NHL", "NCAAF", "NCAAB"];

// ── Shared primitives ──────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-heading text-[11px] font-bold tracking-[3px] text-text-tertiary uppercase text-center mb-14 sm:mb-16">
      {children}
    </p>
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
        <Link
          href="/grade"
          className="hidden sm:block text-[11px] font-semibold uppercase tracking-[0.5px] text-text-secondary hover:text-text-primary transition-colors"
        >
          GRADE YOUR PARLAY
        </Link>
        <a
          href="#waitlist"
          className="h-9 px-5 rounded-lg bg-accent text-bg text-[11px] font-semibold uppercase tracking-[0.5px] flex items-center hover:brightness-110 transition-all"
        >
          GET EARLY ACCESS
        </a>
      </nav>

      {/* ── HERO ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 pt-28 sm:pt-40 pb-24 sm:pb-32 text-center relative">
        <div className="hero-mesh" />

        <p className="font-heading relative text-[11px] font-bold tracking-[3px] text-text-tertiary uppercase mb-8">
          BUILT FOR SMARTER BETTORS
        </p>
        <h1 className="font-heading relative text-[38px] sm:text-[52px] md:text-[64px] font-bold tracking-[-1.5px] leading-[1.02] max-w-[760px] mx-auto mb-8">
          Find the money your sportsbook is hiding.
        </h1>
        <p className="relative text-[15px] sm:text-[17px] text-text-secondary max-w-[480px] mx-auto leading-[1.75] mb-10">
          Drop in a parlay. We compare every leg across the market and show you what your bet should actually pay — and the dollars you&apos;re leaving on the table.
        </p>

        <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <Link
            href="/grade"
            className="inline-flex items-center justify-center h-13 w-full sm:w-auto px-8 rounded-xl bg-accent text-bg text-[12px] font-bold uppercase tracking-[0.5px] hover:brightness-110 transition-all"
          >
            GRADE YOUR PARLAY
          </Link>
          <a
            href="#waitlist"
            className="inline-flex items-center justify-center h-13 w-full sm:w-auto px-8 rounded-xl bg-transparent border border-border text-text-secondary text-[12px] font-bold uppercase tracking-[0.5px] hover:border-text-tertiary transition-all"
          >
            JOIN WAITLIST
          </a>
        </div>

        <p className="relative text-[12px] text-text-secondary mb-8">
          Free to use · No signup required · Currently supports NBA · NFL · MLB · NHL · NCAAF · NCAAB
        </p>
        <p className="relative text-[11px] text-text-tertiary tracking-wide">
          Works with DraftKings &bull; FanDuel &bull; BetMGM &bull; ESPN Bet &bull; Caesars
        </p>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 py-24 sm:py-32">
        <SectionLabel>HOW IT WORKS</SectionLabel>
        <div className="max-w-[560px] mx-auto space-y-16 sm:space-y-20">
          {[
            {
              n: "01",
              title: "UPLOAD YOUR SLIP",
              desc: "Screenshot any parlay from your sportsbook. We read every leg automatically.",
            },
            {
              n: "02",
              title: "WE FIND THE BEST PRICE",
              desc: "SportsLogic checks the market for the same parlay and finds the highest payout available across major books.",
            },
            {
              n: "03",
              title: "SEE THE GAP",
              desc: "We show you the dollar difference between what your book pays and what your bet is actually worth — leg by leg.",
            },
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
            {
              n: "01",
              title: "NOT PICKS. JUST PRICING.",
              desc: "We're not here to sell locks. We show you whether the number you're betting is actually worth taking.",
            },
            {
              n: "02",
              title: "EVERY NUMBER HAS RECEIPTS.",
              desc: "Every grade is backed by live odds data and sharp-market comparison — not opinions, not vibes, not pick-of-the-day energy.",
            },
            {
              n: "03",
              title: "SHARP FRIEND. NOT SALESMAN.",
              desc: "We don't sell locks, charge for picks, or run a Discord. We just tell you what your bet should actually pay.",
            },
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

      {/* ── MARKET INSIGHTS (live data) ── */}
      <MarketInsights booksCompared={BOOKS_COMPARED} />

      {/* ── OUR STORY ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 py-24 sm:py-32">
        <SectionLabel>OUR STORY</SectionLabel>
        <div className="max-w-[520px] mx-auto text-center">
          <p className="text-[15px] text-text-secondary leading-[1.85]">
            Most bettors lose the same way — not because they&apos;re unlucky, but because the price was bad from the start. Sportsbooks count on you not noticing the gap between what your slip pays and what it&apos;s actually worth. We built SportsLogic to make that gap visible — in dollars, every time, before you bet. Less guessing. Better numbers. Fewer dollars left on the table.
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
      <section className="w-full max-w-[1080px] mx-auto px-6 py-24 sm:py-32 text-center">
        <SectionLabel>PRICING</SectionLabel>
        <div className="max-w-[480px] mx-auto bg-surface border border-border rounded-2xl p-10">
          <p className="font-heading text-[11px] font-bold uppercase tracking-[2px] text-accent mb-6">FREE WHILE IN BETA</p>
          <p className="text-[15px] text-text-primary font-medium mb-2">Every grade. Every leg. Every dollar found.</p>
          <p className="text-sm text-text-secondary mb-8">No payment, no signup wall, no tricks.</p>
          <p className="text-sm text-text-secondary leading-relaxed mb-8">
            Pro features — bet journal, found-money tracking,<br />and calibration receipts — coming soon.
          </p>
          <Link
            href="/grade"
            className="inline-flex items-center justify-center h-12 px-10 rounded-xl bg-accent text-bg text-[12px] font-bold uppercase tracking-[0.5px] hover:brightness-110 transition-all"
          >
            GRADE YOUR PARLAY
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 py-24 sm:py-32">
        <SectionLabel>FAQ</SectionLabel>
        <div className="max-w-[600px] mx-auto">
          {[
            {
              q: "IS THIS LEGAL?",
              a: "Yes. SportsLogic is an analytics platform — not a sportsbook. We analyze publicly available odds data and grade bets based on market pricing and expected value.",
            },
            {
              q: "HOW ACCURATE IS THE GRADING?",
              a: "Our grading is based on live odds, no-vig pricing models, and sharp-market comparisons. The goal isn't to predict guaranteed winners — it's to measure whether you're getting a good price before you bet.",
            },
            {
              q: "WHAT SPORTSBOOKS DO YOU SUPPORT?",
              a: "SportsLogic reads screenshots from DraftKings, FanDuel, BetMGM, Caesars, ESPN BET, and Fanatics. We currently grade NBA, NFL, MLB, NHL, college football, and college basketball — more sports coming as we expand.",
            },
          ].map((faq, i) => (
            <div key={i} className={i > 0 ? "mt-8 pt-8 border-t border-border/20" : ""}>
              <h3 className="font-heading text-[14px] font-bold uppercase text-text-primary mb-3 tracking-[0.5px] text-center">{faq.q}</h3>
              <p className="text-sm text-text-secondary leading-[1.75] text-center">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA / WAITLIST ── */}
      <section id="waitlist" className="w-full max-w-[1080px] mx-auto px-6 py-24 sm:py-32 text-center relative">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(0,232,123,0.04) 0%, transparent 65%)", filter: "blur(60px)" }}
        />
        <h2 className="font-heading relative text-2xl sm:text-[40px] font-bold uppercase tracking-[-1px] mb-4">
          THE EDGE IS WAITING.
        </h2>
        <p className="relative text-sm text-text-secondary mb-10">
          Find the money your sportsbook isn&apos;t telling you about.
        </p>
        <div className="relative max-w-[440px] mx-auto">
          <EmailForm />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <SiteFooter />
    </div>
  );
}
