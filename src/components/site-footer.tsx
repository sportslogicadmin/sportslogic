import Link from "next/link";

interface SiteFooterProps {
  narrow?: boolean;
}

export function SiteFooter({ narrow = false }: SiteFooterProps) {
  const maxW = narrow ? "max-w-[640px]" : "max-w-[1080px]";

  return (
    <footer className={`w-full ${maxW} mx-auto px-6 pt-10 pb-12 border-t border-border/30`}>
      <p className="text-[11px] text-text-tertiary text-center sm:text-left mb-6 leading-relaxed max-w-[680px]">
        SportsLogic is not a sportsbook. We provide sports betting analytics for informational purposes
        only. Grades are opinions based on market data — not betting advice. 21+. Gambling problem?
        Call 1-800-GAMBLER (1-800-426-2537) or visit{" "}
        <a
          href="https://www.ncpgambling.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-secondary hover:text-text-primary transition-colors underline underline-offset-2"
        >
          ncpgambling.org
        </a>
        .
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[11px] text-text-tertiary">&copy; 2026 SportsLogic</p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/terms" className="text-[11px] text-text-tertiary hover:text-text-secondary transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="text-[11px] text-text-tertiary hover:text-text-secondary transition-colors">
            Privacy
          </Link>
          <Link href="/affiliate-disclosure" className="text-[11px] text-text-tertiary hover:text-text-secondary transition-colors">
            Affiliate Disclosure
          </Link>
          <Link href="/responsible-gambling" className="text-[11px] text-text-tertiary hover:text-text-secondary transition-colors">
            Responsible Gambling
          </Link>
          <Link href="/contact" className="text-[11px] text-text-tertiary hover:text-text-secondary transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
