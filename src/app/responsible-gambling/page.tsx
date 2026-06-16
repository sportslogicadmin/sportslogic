import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Responsible Gambling" };

export default function ResponsibleGamblingPage() {
  return (
    <div className="w-full min-h-screen flex flex-col">
      <nav className="w-full max-w-[1080px] mx-auto flex items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="SportsLogic" width={56} height={28} className="h-7 w-auto" />
          <span className="font-heading text-base font-bold text-text-primary tracking-tight">SportsLogic</span>
        </Link>
        <Link href="/" className="text-[11px] text-text-tertiary hover:text-text-secondary transition-colors uppercase tracking-wide">
          HOME
        </Link>
      </nav>

      <div className="flex-1 w-full max-w-[720px] mx-auto px-6 py-16">
        <p className="font-heading text-[11px] font-bold tracking-[3px] text-text-tertiary uppercase mb-6">
          PLAYER WELFARE
        </p>
        <h1 className="font-heading text-[28px] sm:text-[36px] font-bold uppercase text-text-primary mb-6 tracking-tight">
          Responsible Gambling
        </h1>

        {/* Help callout — most prominent element */}
        <div className="bg-surface border border-accent/30 rounded-2xl p-7 mb-10">
          <p className="font-heading text-[11px] font-bold tracking-[2px] text-accent uppercase mb-3">
            FREE HELP AVAILABLE 24/7
          </p>
          <p className="text-[22px] font-bold text-text-primary mb-1">1-800-GAMBLER</p>
          <p className="text-sm text-text-secondary mb-4">(1-800-426-2537) — call or text, free and confidential</p>
          <a
            href="https://www.ncpgambling.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-accent hover:brightness-110 transition-all underline underline-offset-2"
          >
            ncpgambling.org — National Council on Problem Gambling
          </a>
          <p className="text-[11px] text-text-tertiary mt-4">
            Crisis Text Line: Text HOME to 741741
          </p>
        </div>

        <div className="border-t border-border/30 pt-8 mt-8">
          <h2 className="font-heading text-[13px] font-bold uppercase text-text-primary tracking-[0.5px] mb-4">
            Gambling Involves Real Risk
          </h2>
          <div className="space-y-4 text-sm text-text-secondary leading-[1.8]">
            <p>
              SportsLogic helps you understand the price you&apos;re getting on a bet. We analyze odds, identify value gaps, and grade slips against the market. We do not predict outcomes. No analytics tool — including ours — can guarantee that a bet will win.
            </p>
            <p>
              <span className="text-text-primary font-medium">Betting is not a reliable source of income.</span> Even sharp bettors who consistently identify good prices lose money in any given week, month, or year. A good grade means the price is fair — it does not mean the bet will hit.
            </p>
          </div>
        </div>

        <div className="border-t border-border/30 pt-8 mt-8">
          <h2 className="font-heading text-[13px] font-bold uppercase text-text-primary tracking-[0.5px] mb-4">
            Betting Responsibly
          </h2>
          <div className="space-y-3 text-sm text-text-secondary leading-[1.8]">
            {[
              "Set a budget before you bet and stick to it — only bet what you can afford to lose.",
              "Treat betting as entertainment, not a way to make money.",
              "Don't chase losses. Losing is a normal part of sports betting, even at good prices.",
              "Set time limits and take breaks.",
              "Never bet while impaired or under emotional distress.",
              "Keep betting separate from financial obligations like rent, bills, or savings.",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-accent font-bold text-xs mt-0.5 shrink-0">—</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border/30 pt-8 mt-8">
          <h2 className="font-heading text-[13px] font-bold uppercase text-text-primary tracking-[0.5px] mb-4">
            Warning Signs of Problem Gambling
          </h2>
          <p className="text-sm text-text-secondary leading-[1.8] mb-4">
            Problem gambling can affect anyone. These are some of the signs to watch for:
          </p>
          <div className="space-y-3 text-sm text-text-secondary leading-[1.8]">
            {[
              "Betting with money needed for essential expenses",
              "Hiding gambling activity from family or friends",
              "Borrowing money or selling possessions to fund gambling",
              "Feeling anxious, depressed, or irritable when not gambling",
              "Gambling to escape stress or other problems",
              "Continuing to bet despite repeated losses or negative consequences",
              "Repeatedly failing to stick to betting limits you set for yourself",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-red font-bold text-xs mt-0.5 shrink-0">—</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-text-secondary leading-[1.8] mt-6">
            If you recognize any of these patterns in yourself or someone you know, reach out for help. Problem gambling is treatable, and support is available at no cost.
          </p>
        </div>

        <div className="border-t border-border/30 pt-8 mt-8">
          <h2 className="font-heading text-[13px] font-bold uppercase text-text-primary tracking-[0.5px] mb-4">
            Self-Exclusion
          </h2>
          <div className="space-y-4 text-sm text-text-secondary leading-[1.8]">
            <p>
              Every licensed sportsbook in the United States is required to offer self-exclusion programs that let you restrict or block your own access to gambling. If you feel you need a break, contact your sportsbook directly or reach out to your state&apos;s gaming commission to initiate a self-exclusion.
            </p>
            <p>
              The National Council on Problem Gambling maintains a directory of state-level resources at{" "}
              <a
                href="https://www.ncpgambling.org/help-treatment/national-helpline/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:brightness-110 transition-all underline underline-offset-2"
              >
                ncpgambling.org
              </a>
              .
            </p>
          </div>
        </div>

        <div className="border-t border-border/30 pt-8 mt-8">
          <h2 className="font-heading text-[13px] font-bold uppercase text-text-primary tracking-[0.5px] mb-4">
            Our Commitment
          </h2>
          <div className="space-y-4 text-sm text-text-secondary leading-[1.8]">
            <p>
              SportsLogic is designed for adults who choose to bet on sports and want better information about the prices they&apos;re receiving. We require all users to confirm they are 21 or older before using the site.
            </p>
            <p>
              We do not promote or encourage gambling beyond what a user is already doing. We do not frame betting as a path to profit. Our goal is to make prices transparent — not to increase betting volume.
            </p>
            <p>
              If you have concerns about content on our site, contact us at{" "}
              <a href="mailto:hello@sportslogic.ai" className="text-accent hover:brightness-110 transition-all">
                hello@sportslogic.ai
              </a>
              .
            </p>
          </div>
        </div>

        {/* Repeat the helpline at the bottom */}
        <div className="mt-12 p-6 bg-surface border border-border rounded-2xl text-center">
          <p className="font-heading text-[11px] font-bold tracking-[2px] text-text-tertiary uppercase mb-3">
            NEED HELP NOW?
          </p>
          <p className="text-xl font-bold text-text-primary mb-1">1-800-GAMBLER</p>
          <p className="text-sm text-text-secondary">Free · Confidential · 24/7</p>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
