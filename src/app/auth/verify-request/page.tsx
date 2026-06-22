import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Check your email" };

export default function VerifyRequestPage() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <Link href="/" className="flex items-center gap-2 mb-12">
        <Image src="/logo.png" alt="SportsLogic" width={56} height={28} className="h-7 w-auto" />
        <span className="font-heading text-base font-bold text-text-primary tracking-tight">SportsLogic</span>
      </Link>

      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-text-primary mb-3">Check your inbox</h1>
        <p className="text-sm text-text-secondary leading-relaxed mb-8">
          A sign-in link is on its way. Click it in your email to access your journal.
          The link expires in 24 hours.
        </p>
        <Link href="/grade" className="text-sm text-accent hover:brightness-110 transition-all">
          ← Back to grading
        </Link>
      </div>
    </div>
  );
}
