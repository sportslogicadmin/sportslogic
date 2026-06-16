import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Affiliate Disclosure" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border/30 pt-8 mt-8">
      <h2 className="font-heading text-[13px] font-bold uppercase text-text-primary tracking-[0.5px] mb-4">
        {title}
      </h2>
      <div className="space-y-4 text-sm text-text-secondary leading-[1.8]">{children}</div>
    </div>
  );
}

export default function AffiliateDisclosurePage() {
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
          LEGAL
        </p>
        <h1 className="font-heading text-[28px] sm:text-[36px] font-bold uppercase text-text-primary mb-3 tracking-tight">
          Affiliate Disclosure
        </h1>
        <p className="text-[12px] text-text-tertiary">Last updated: June 15, 2026</p>

        <div className="mt-10 p-6 bg-surface border border-accent/20 rounded-2xl">
          <p className="font-heading text-[11px] font-bold tracking-[2px] text-accent uppercase mb-3">
            PLAIN ENGLISH SUMMARY
          </p>
          <p className="text-sm text-text-secondary leading-[1.8]">
            When you click certain links on SportsLogic and sign up for a sportsbook, we may earn a commission. It costs you nothing extra. Our grading is completely independent — no sportsbook can pay us for a better grade.
          </p>
        </div>

        <Section title="What This Disclosure Covers">
          <p>
            SportsLogic participates in affiliate marketing programs with licensed and regulated sportsbooks. This disclosure explains how those relationships work, per the Federal Trade Commission&apos;s Endorsement Guides (16 C.F.R. Part 255, updated 2023).
          </p>
        </Section>

        <Section title="How Affiliate Links Work">
          <p>
            When SportsLogic features links to sportsbooks, some of those links are affiliate links. This means:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>If you click the link and create a new account with the sportsbook, SportsLogic may receive a commission from that sportsbook.</li>
            <li>The commission comes from the sportsbook — not from you. You pay nothing extra, and the odds or promotions you receive are not affected by whether you arrived via our link.</li>
            <li>Commissions are typically paid on a cost-per-acquisition (CPA) basis (a flat fee per new depositing customer) or a revenue-share basis (a percentage of the sportsbook&apos;s net revenue from referred customers).</li>
          </ul>
          <p>
            We will label affiliate links clearly when they appear on the site. The label &ldquo;We may earn a commission when you sign up through this link&rdquo; (or similar language) will appear near any affiliate link.
          </p>
        </Section>

        <Section title="Our Grading Is Independent">
          <p>
            <span className="text-text-primary font-medium">Our affiliate relationships do not influence our grading methodology or outputs.</span>
          </p>
          <p>
            Grades are generated from live publicly available market odds data using a fixed statistical pricing model. A sportsbook cannot pay us for a higher grade on a slip from their book, and we do not receive any consideration in exchange for favorable analytical coverage of any operator.
          </p>
          <p>
            The grading algorithm runs the same way regardless of which sportsbook a slip comes from. Our only goal is accuracy: whether a price is good or bad relative to the market.
          </p>
        </Section>

        <Section title="Third-Party Sites">
          <p>
            When you click an affiliate link, you leave SportsLogic and enter a third-party website. That site has its own terms of service, privacy policy, and practices. SportsLogic is not responsible for the content, offers, or data practices of any third-party site.
          </p>
          <p>
            Sportsbooks may track clicks and registrations using server-to-server postback technology through affiliate networks. This attribution tracking does not involve SportsLogic placing advertising trackers on your device.
          </p>
        </Section>

        <Section title="Questions">
          <p>
            If you have questions about our affiliate relationships, contact us at{" "}
            <a href="mailto:hello@sportslogic.ai" className="text-accent hover:brightness-110 transition-all">
              hello@sportslogic.ai
            </a>
            .
          </p>
        </Section>
      </div>

      <SiteFooter />
    </div>
  );
}
