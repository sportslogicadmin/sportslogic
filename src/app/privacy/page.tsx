import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Privacy Policy" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const match = title.match(/^(\d+)\.\s+(.+)$/);
  const num = match ? match[1].padStart(2, "0") : null;
  const label = match ? match[2] : title;

  return (
    <div className="mt-14">
      {num && (
        <p className="font-heading text-[10px] font-bold tracking-[4px] text-accent/60 uppercase mb-2">
          {num}
        </p>
      )}
      <h2 className="font-heading text-[20px] sm:text-[22px] font-bold text-text-primary tracking-tight mb-3">
        {label}
      </h2>
      <div className="w-10 h-[2px] bg-accent/35 mb-7" />
      <div className="space-y-5 text-[15px] text-text-secondary leading-[1.75]">
        {children}
      </div>
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-heading text-[11px] font-bold tracking-[1.5px] text-text-primary/70 uppercase mt-7 mb-3">
      {children}
    </p>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return <span className="text-text-primary font-semibold">{children}</span>;
}

function BulletList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc list-outside pl-5 space-y-3">
      {children}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <div className="w-full min-h-screen flex flex-col">
      <nav className="w-full max-w-[1080px] mx-auto flex items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="SportsLogic" width={56} height={28} className="h-7 w-auto" />
          <span className="font-heading text-base font-bold text-text-primary tracking-tight">SportsLogic</span>
        </Link>
        <Link
          href="/"
          className="text-[11px] text-text-tertiary hover:text-text-secondary transition-colors uppercase tracking-wide"
        >
          Home
        </Link>
      </nav>

      <div className="flex-1 w-full max-w-[720px] mx-auto px-6 sm:px-10 py-14">

        {/* ── Page header ── */}
        <div className="pb-10 border-b border-border/40">
          <p className="font-heading text-[10px] font-bold tracking-[4px] text-text-tertiary uppercase mb-5">
            Legal
          </p>
          <h1 className="font-heading text-[36px] sm:text-[48px] font-bold text-text-primary tracking-[-0.5px] leading-[1.05] mb-4">
            Privacy Policy
          </h1>
          <p className="text-[13px] text-text-tertiary">Last updated: June 15, 2026</p>
        </div>

        {/* ── Sections ── */}
        <Section title="1. Who We Are">
          <p>
            SportsLogic (&ldquo;SportsLogic,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;) operates
            sportslogic.ai, a sports betting analytics platform that grades bet slips against publicly available market
            odds. <Highlight>We are not a sportsbook.</Highlight> We do not accept bets, hold funds, or facilitate
            wagering.
          </p>
          <p>
            This Privacy Policy explains what personal information we collect, how we use it, and the choices available
            to you. By using SportsLogic, you agree to the terms described here.
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <SubLabel>Information you provide directly</SubLabel>
          <BulletList>
            <li>
              <Highlight>Bet slip screenshots.</Highlight> When you upload a screenshot to be graded, our AI system
              processes the image to extract bet details. If you use our share feature, the extracted grade results (not
              your image) are stored in our database with a unique share ID.
            </li>
            <li>
              <Highlight>Shared grades.</Highlight> Grades you share are stored in our database and may be publicly
              accessible via your share link. Shared grades include the bet details and grading output — not your
              identity or any personal information unless you include it in the content.
            </li>
            <li>
              <Highlight>Email address.</Highlight> If you join our waitlist, we store the email address you provide. We
              use it only to send product updates and will not contact you for unrelated purposes.
            </li>
          </BulletList>

          <SubLabel>Information collected automatically</SubLabel>
          <BulletList>
            <li>
              <Highlight>Usage data.</Highlight> Standard web analytics including pages visited, time on site, and
              general interaction patterns, collected in aggregate to improve the service.
            </li>
            <li>
              <Highlight>Cookies.</Highlight> We may use analytics cookies to understand aggregate site traffic. We do
              not use advertising trackers or cross-site tracking cookies.
            </li>
            <li>
              <Highlight>Technical data.</Highlight> Standard server logs including IP address, browser type, and device
              information, retained briefly for security and service health monitoring.
            </li>
          </BulletList>
        </Section>

        <Section title="3. How We Use Your Information">
          <BulletList>
            <li>To provide, operate, and improve the grading service</li>
            <li>To deliver waitlist updates if you have subscribed</li>
            <li>To monitor service health and prevent abuse</li>
            <li>To comply with legal obligations</li>
          </BulletList>
          <p>We do not sell your personal information to third parties.</p>
        </Section>

        <Section title="4. Affiliate Links and Third-Party Tracking">
          <p>
            SportsLogic will contain affiliate links to licensed sportsbooks. If you click an affiliate link and sign up
            for a sportsbook account, we may earn a commission. Affiliate networks use server-to-server postback
            tracking to attribute signups — this does not involve us placing third-party tracking cookies on your device.
          </p>
          <p>
            Clicking an affiliate link takes you to a third-party website. That site&apos;s own privacy policy governs
            how your data is collected and used once you leave SportsLogic. We will always clearly label affiliate links
            when they appear on the site. See our{" "}
            <Link
              href="/affiliate-disclosure"
              className="text-accent hover:brightness-110 transition-all underline underline-offset-2 decoration-accent/40"
            >
              Affiliate Disclosure
            </Link>{" "}
            for full details.
          </p>
        </Section>

        <Section title="5. Data Storage and Security">
          <p>
            Your data is stored in a PostgreSQL database hosted by a managed cloud provider. All data is encrypted in
            transit (TLS). We apply reasonable technical and organizational safeguards to protect your information,
            though no internet transmission or electronic storage is 100% secure.
          </p>
          <p>
            Grade results shared via the share feature are retained until you request deletion or we remove them during
            routine data management. Uploaded images are processed and are not stored long-term. Waitlist emails are
            retained until you unsubscribe or request deletion.
          </p>
        </Section>

        <Section title="6. Your Privacy Rights (California Residents — CCPA)">
          <p>
            If you are a California resident, you have the following rights under the California Consumer Privacy Act
            (CCPA):
          </p>
          <BulletList>
            <li>
              <Highlight>Right to Know.</Highlight> You may request a summary of the personal information we have
              collected about you in the past 12 months and how it has been used or disclosed.
            </li>
            <li>
              <Highlight>Right to Delete.</Highlight> You may request that we delete personal information we hold about
              you, subject to certain exceptions.
            </li>
            <li>
              <Highlight>Right to Opt Out.</Highlight> We do not sell personal information. There is nothing to opt out
              of, but we will honor opt-out requests.
            </li>
            <li>
              <Highlight>Right to Non-Discrimination.</Highlight> We will not discriminate against you for exercising
              any of these rights.
            </li>
          </BulletList>
          <p>
            To exercise any of these rights, email{" "}
            <a href="mailto:hello@sportslogic.ai" className="text-accent hover:brightness-110 transition-all">
              hello@sportslogic.ai
            </a>
            . We will respond within 45 days.
          </p>
        </Section>

        <Section title="7. Children's Privacy">
          <p>
            SportsLogic is intended for users 21 years of age or older. We do not knowingly collect personal information
            from anyone under 21. If you believe we have inadvertently collected information from a minor, contact us
            immediately at{" "}
            <a href="mailto:hello@sportslogic.ai" className="text-accent hover:brightness-110 transition-all">
              hello@sportslogic.ai
            </a>{" "}
            and we will delete it promptly.
          </p>
        </Section>

        <Section title="8. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. The &ldquo;Last Updated&rdquo; date at the top of this
            page reflects the most recent revision. We will post any material changes on this page. Continued use of
            SportsLogic after changes are posted constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section title="9. Contact Us">
          <p>
            Questions, privacy requests, or concerns — reach us at{" "}
            <a href="mailto:hello@sportslogic.ai" className="text-accent hover:brightness-110 transition-all">
              hello@sportslogic.ai
            </a>
            .
          </p>
        </Section>

        <div className="h-16" />
      </div>

      <SiteFooter />
    </div>
  );
}
