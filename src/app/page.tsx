import Link from "next/link";
import Image from "next/image";
import { EmailForm } from "./email-form";
import { SiteFooter } from "@/components/site-footer";
import { ShareCard } from "@/components/share-card";

const MOCK_GRADE = {
  overallGrade: "B+",
  ev: 4.2,
  legCount: 5,
  impliedProb: 0.042,
  trueProb: 0.051,
  foundMoney: 24.18,
  stake: 50,
  payout: 413,
  swapSuggestion: "Swap Nuggets -4.5 (FanDuel -118) for Nuggets -3.5 at BetMGM (-105). Same game, better number.",
  legs: [
    { label: "Lakers ML", grade: "B", ev: 3.1 },
    { label: "Nuggets -4.5", grade: "C+", ev: -0.8 },
    { label: "Yankees ML", grade: "A-", ev: 7.4 },
    { label: "Chiefs -3", grade: "B+", ev: 5.2 },
    { label: "Celtics -6.5", grade: "B", ev: 3.1 },
  ],
};

// ── Static data ────────────────────────────────────────────────────────────────

// ── Shared primitives ──────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-heading text-[11px] font-bold text-text-tertiary text-center mb-14 sm:mb-16">
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
          className="hidden sm:block text-[11px] font-semibold text-text-secondary hover:text-text-primary transition-colors"
        >
          Grade your parlay
        </Link>
        <a
          href="#waitlist"
          className="h-9 px-5 rounded-lg bg-accent text-bg text-[11px] font-semibold flex items-center hover:opacity-90 transition-all"
        >
          Get early access
        </a>
      </nav>

      {/* ── HERO ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 pt-16 sm:pt-24 pb-16 sm:pb-20 text-center relative">
        <div className="hero-mesh" />

        <h1 className="font-display relative text-[38px] sm:text-[52px] md:text-[64px] font-bold tracking-[-1.5px] leading-[1.02] max-w-[760px] mx-auto mb-6">
          Find the money your sportsbook is hiding.
        </h1>
        <p className="relative text-[15px] sm:text-[17px] text-text-secondary max-w-[480px] mx-auto leading-[1.75] mb-10">
          Every parlay graded against sharp market lines. See the dollars you&apos;re leaving on the table.
        </p>

        <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <Link
            href="/grade"
            className="inline-flex items-center justify-center h-13 w-full sm:w-auto px-8 rounded-xl bg-accent text-bg text-[12px] font-bold hover:opacity-90 transition-all"
          >
            Grade your parlay
          </Link>
          <a
            href="#waitlist"
            className="inline-flex items-center justify-center h-13 w-full sm:w-auto px-8 rounded-xl bg-transparent border border-border text-text-secondary text-[12px] font-bold hover:border-text-tertiary transition-all"
          >
            Join waitlist
          </a>
        </div>

        <p className="relative text-[11px] text-text-tertiary mb-10">
          Free · No signup · NBA · NFL · MLB · NHL · NCAAF · NCAAB
        </p>

        {/* Demo mock card */}
        <div className="relative flex justify-center">
          <p className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-text-tertiary whitespace-nowrap">
            Example grade — here&apos;s what you get
          </p>
          <div className="scale-[0.82] sm:scale-90 md:scale-100 origin-top pointer-events-none select-none">
            <ShareCard data={MOCK_GRADE} />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 py-24 sm:py-32">
        <SectionLabel>How it works</SectionLabel>
        <div className="max-w-[560px] mx-auto space-y-16 sm:space-y-20">
          {[
            {
              n: "01",
              title: "Upload your slip",
              desc: "Screenshot any parlay from your sportsbook. We read every leg automatically.",
            },
            {
              n: "02",
              title: "We find the best price",
              desc: "SportsLogic checks the market for the same parlay and finds the highest payout available across major books.",
            },
            {
              n: "03",
              title: "See the gap",
              desc: "We show you the dollar difference between what your book pays and what your bet is actually worth — leg by leg.",
            },
          ].map((step) => (
            <div key={step.n} className="flex items-start gap-6 sm:gap-10">
              <span className="font-heading text-[52px] sm:text-[56px] font-bold text-accent leading-none shrink-0 w-16 sm:w-20 text-right step-glow">
                {step.n}
              </span>
              <div className="pt-2 sm:pt-3">
                <h3 className="font-heading text-sm font-bold text-text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY SPORTSLOGIC ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 py-24 sm:py-32">
        <SectionLabel>Why SportsLogic</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[920px] mx-auto">
          {[
            {
              title: "Not picks. Just pricing.",
              desc: "We're not here to sell locks. We show you whether the number you're betting is actually worth taking.",
            },
            {
              title: "Every number has receipts.",
              desc: "Every grade is backed by live odds data and sharp-market comparison — not opinions, not vibes, not pick-of-the-day energy.",
            },
            {
              title: "Sharp friend. Not salesman.",
              desc: "We don't sell locks, charge for picks, or run a Discord. We just tell you what your bet should actually pay.",
            },
          ].map((card) => (
            <div key={card.title} className="bg-surface border border-border rounded-2xl p-7">
              <h3 className="font-heading text-[13px] font-bold text-text-primary mb-3">{card.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── OUR STORY ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 py-24 sm:py-32">
        <SectionLabel>Our story</SectionLabel>
        <div className="max-w-[520px] mx-auto text-center">
          <p className="text-[15px] text-text-secondary leading-[1.85]">
            Most bettors lose the same way — not because they&apos;re unlucky, but because the price was bad from the start. Sportsbooks count on you not noticing the gap between what your slip pays and what it&apos;s actually worth. We built SportsLogic to make that gap visible — in dollars, every time, before you bet. Less guessing. Better numbers. Fewer dollars left on the table.
          </p>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 py-24 sm:py-32 text-center">
        <SectionLabel>Pricing</SectionLabel>
        <div className="max-w-[480px] mx-auto bg-surface border border-border rounded-2xl p-10">
          <p className="font-heading text-[11px] font-bold text-accent mb-6">Free while in beta</p>
          <p className="text-[15px] text-text-primary font-medium mb-2">Every grade. Every leg. Every dollar found.</p>
          <p className="text-sm text-text-secondary mb-8">No payment, no signup wall, no tricks.</p>
          <p className="text-sm text-text-secondary leading-relaxed mb-8">
            Pro features — bet journal, found-money tracking,<br />and calibration receipts — coming soon.
          </p>
          <Link
            href="/grade"
            className="inline-flex items-center justify-center h-12 px-10 rounded-xl bg-accent text-bg text-[12px] font-bold hover:opacity-90 transition-all"
          >
            Grade your parlay
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="w-full max-w-[1080px] mx-auto px-6 py-24 sm:py-32">
        <SectionLabel>FAQ</SectionLabel>

        <div className="max-w-[600px] mx-auto">
          {[
            {
              q: "Is this legal?",
              a: "Yes. SportsLogic is an analytics platform — not a sportsbook. We analyze publicly available odds data and grade bets based on market pricing and expected value.",
            },
            {
              q: "How accurate is the grading?",
              a: "Our grading is based on live odds, no-vig pricing models, and sharp-market comparisons. The goal isn't to predict guaranteed winners — it's to measure whether you're getting a good price before you bet.",
            },
            {
              q: "What sportsbooks do you support?",
              a: "SportsLogic reads screenshots from DraftKings, FanDuel, BetMGM, Caesars, ESPN BET, and Fanatics. We currently grade NBA, NFL, MLB, NHL, college football, and college basketball — more sports coming as we expand.",
            },
          ].map((faq, i) => (
            <div key={i} className={i > 0 ? "mt-8 pt-8 border-t border-border/20" : ""}>
              <h3 className="font-heading text-[14px] font-bold text-text-primary mb-3 text-center">{faq.q}</h3>
              <p className="text-sm text-text-secondary leading-[1.75] text-center">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA / WAITLIST ── */}
      <section id="waitlist" className="w-full max-w-[1080px] mx-auto px-6 py-24 sm:py-32 text-center relative">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.04) 0%, transparent 65%)", filter: "blur(60px)" }}
        />
        <h2 className="font-display relative text-2xl sm:text-[40px] font-bold tracking-[-1px] mb-4">
          The edge is waiting.
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
