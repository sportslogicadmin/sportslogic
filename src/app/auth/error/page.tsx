import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign-in error" };

export default function AuthErrorPage() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <Link href="/" className="flex items-center gap-2 mb-12">
        <Image src="/logo.png" alt="SportsLogic" width={56} height={28} className="h-7 w-auto" />
        <span className="font-heading text-base font-bold text-text-primary tracking-tight">SportsLogic</span>
      </Link>

      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-2xl font-bold text-text-primary mb-3">Sign-in failed</h1>
        <p className="text-sm text-text-secondary leading-relaxed mb-8">
          The link may have expired or already been used. Request a new one from the grade page.
        </p>
        <Link href="/grade" className="inline-block bg-accent hover:brightness-110 text-stone-950 font-bold text-sm rounded-xl px-6 py-3 transition-all">
          Back to grading
        </Link>
      </div>
    </div>
  );
}
