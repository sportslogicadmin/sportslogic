import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Terms of Service" };

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

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-[13px] text-text-tertiary">Last updated: June 15, 2026</p>
        </div>

        {/* ── Sections ── */}
        <Section title="1. Agreement to Terms">
          <p>
            By accessing or using SportsLogic at sportslogic.ai (&ldquo;the Service&rdquo;), you agree to be bound by
            these Terms of Service. If you do not agree to these Terms, do not use the Service. These Terms may be
            updated at any time; continued use of the Service after changes are posted constitutes acceptance of the
            updated Terms.
          </p>
        </Section>

        <Section title="2. What SportsLogic Is">
          <p>
            SportsLogic is a sports betting analytics platform. We analyze publicly available sports betting odds and
            grade bet slips against market prices to help users understand the pricing quality of their bets.
          </p>
          <p>
            <Highlight>SportsLogic is not a sportsbook.</Highlight> We do not accept bets, hold funds, or facilitate
            gambling of any kind. The Service is for informational and analytical purposes only.
          </p>
        </Section>

        <Section title="3. Eligibility">
          <p>
            You must be at least <Highlight>21 years old</Highlight> to use SportsLogic. By using the Service, you
            represent and warrant that:
          </p>
          <BulletList>
            <li>You are 21 years of age or older</li>
            <li>You are located in a jurisdiction where it is legal to access sports betting information</li>
            <li>Your use of the Service complies with all applicable local, state, and federal laws</li>
          </BulletList>
          <p>If you do not meet these requirements, you are not authorized to use the Service.</p>
        </Section>

        <Section title="4. Not Betting Advice">
          <p>
            Nothing on SportsLogic constitutes betting advice, financial advice, investment advice, or a recommendation
            to place any specific wager. Our grades are opinions based on publicly available market odds data and
            statistical pricing models.
          </p>
          <p>
            <Highlight>A grade does not predict the outcome of any game or bet.</Highlight> An A-grade parlay can lose;
            an F-grade parlay can win. We explicitly disclaim any representation that using SportsLogic will result in
            winning bets or any financial gain.
          </p>
          <p>
            Betting on sporting events involves substantial risk of financial loss. You alone are responsible for any
            betting decisions you make.
          </p>
        </Section>

        <Section title="5. No Guarantee of Accuracy">
          <p>
            We strive to provide accurate, timely odds data. However, sports betting odds move continuously, and there
            may be latency, data gaps, or errors in our analysis. We make no warranty, express or implied, that the
            information we provide is accurate, complete, or current at any given moment.
          </p>
          <p>Do not rely solely on SportsLogic data as the basis for placing any wager.</p>
        </Section>

        <Section title="6. Affiliate Relationships">
          <p>
            SportsLogic may contain links to licensed sportsbooks through affiliate programs. If you click these links
            and create an account, we may earn a commission. We will always clearly disclose when links are affiliate
            links.
          </p>
          <p>
            The existence of affiliate relationships does not influence our grading methodology or analytical outputs.
            See our full{" "}
            <Link
              href="/affiliate-disclosure"
              className="text-accent hover:brightness-110 transition-all underline underline-offset-2 decoration-accent/40"
            >
              Affiliate Disclosure
            </Link>
            .
          </p>
        </Section>

        <Section title="7. Intellectual Property">
          <p>
            All content on SportsLogic — including the grading methodology, scoring models, user interface, visual
            design, and written content — is owned by SportsLogic and protected by applicable intellectual property
            laws. You may not copy, reproduce, distribute, or create derivative works from our content without express
            written permission.
          </p>
        </Section>

        <Section title="8. Prohibited Uses">
          <p>You may not use SportsLogic to:</p>
          <BulletList>
            <li>Scrape, crawl, or automatically access our data or grading outputs in bulk</li>
            <li>Attempt to reverse-engineer our grading algorithms or data sources</li>
            <li>Misrepresent or republish our grades or outputs without attribution</li>
            <li>Access the Service if you are under 21 or in a jurisdiction where doing so is unlawful</li>
            <li>Use the Service in connection with any unlawful gambling activity</li>
            <li>Interfere with or disrupt the integrity or performance of the Service</li>
          </BulletList>
        </Section>

        <Section title="9. Limitation of Liability">
          {/* Boxed all-caps block — legal convention, visually distinct */}
          <div className="bg-surface border border-border/60 rounded-xl p-5 sm:p-6 space-y-4">
            <p className="text-[12px] text-text-secondary uppercase tracking-wide leading-[1.8]">
              To the fullest extent permitted by applicable law, SportsLogic and its operators, officers, employees, and
              agents are not liable for any indirect, incidental, special, consequential, or punitive damages, including
              but not limited to financial losses arising from betting decisions made in connection with our grades or
              analysis.
            </p>
            <p className="text-[12px] text-text-secondary uppercase tracking-wide leading-[1.8]">
              Our total cumulative liability to you for any claim arising from your use of the Service shall not exceed
              one hundred dollars ($100).
            </p>
          </div>
          <p>
            Some jurisdictions do not permit limitations on liability for certain types of damages. In those
            jurisdictions, the above limitations apply to the maximum extent permitted by law.
          </p>
        </Section>

        <Section title="10. Indemnification">
          <p>
            You agree to defend, indemnify, and hold harmless SportsLogic and its operators from and against any
            claims, liabilities, damages, losses, and expenses (including reasonable attorney fees) arising from your
            use of the Service, your violation of these Terms, or your violation of any applicable law.
          </p>
        </Section>

        <Section title="11. Responsible Gambling">
          <p>
            Sports betting involves real risk of loss. We encourage all users to bet responsibly. If you or someone you
            know has a gambling problem, free help is available 24/7 at{" "}
            <Highlight>1-800-GAMBLER (1-800-426-2537)</Highlight> or{" "}
            <a
              href="https://www.ncpgambling.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:brightness-110 transition-all underline underline-offset-2 decoration-accent/40"
            >
              ncpgambling.org
            </a>
            . See our{" "}
            <Link
              href="/responsible-gambling"
              className="text-accent hover:brightness-110 transition-all underline underline-offset-2 decoration-accent/40"
            >
              Responsible Gambling
            </Link>{" "}
            page for more resources.
          </p>
        </Section>

        <Section title="12. Governing Law">
          <p>
            These Terms are governed by the laws of the United States, without regard to conflict of law principles.
            Any dispute arising under these Terms that cannot be resolved informally shall be submitted to binding
            arbitration under the rules of the American Arbitration Association.
          </p>
        </Section>

        <Section title="13. Changes to Terms">
          <p>
            We reserve the right to modify these Terms at any time. We will update the &ldquo;Last Updated&rdquo; date
            at the top of this page when changes are made. Your continued use of the Service after any changes
            constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="14. Contact">
          <p>
            Questions about these Terms or general inquiries — reach us at{" "}
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
