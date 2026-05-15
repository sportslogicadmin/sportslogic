import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
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

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <p className="font-heading text-[11px] font-bold tracking-[3px] text-text-tertiary uppercase mb-6">
          PRIVACY POLICY
        </p>
        <h1 className="font-heading text-2xl font-bold uppercase text-text-primary mb-4">Coming Soon</h1>
        <p className="text-sm text-text-secondary max-w-[400px] leading-relaxed">
          Our privacy policy is being drafted. Check back soon.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center h-10 px-6 rounded-xl bg-accent text-bg text-[11px] font-bold uppercase tracking-[0.5px] hover:brightness-110 transition-all"
        >
          BACK TO HOME
        </Link>
      </div>

      <footer className="w-full max-w-[1080px] mx-auto px-6 pt-8 pb-10 border-t border-border/30">
        <p className="text-[11px] text-text-tertiary text-center leading-relaxed">
          SportsLogic is not a sportsbook. Analysis tools for informational purposes only. 21+.
        </p>
      </footer>
    </div>
  );
}
