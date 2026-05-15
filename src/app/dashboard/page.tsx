import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Dashboard — SportsLogic" };

function gradeColor(grade: string) {
  const f = grade[0];
  if (f === "A" || f === "B") return "text-accent";
  if (f === "C") return "text-amber";
  return "text-red";
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  type GradeRow = {
    id: string;
    overallGrade: string;
    overallEV: number;
    totalLegs: number;
    shareSlug: string;
    createdAt: Date;
  };

  let grades: GradeRow[] = [];
  let dbError = false;

  try {
    grades = await prisma.grade.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        overallGrade: true,
        overallEV: true,
        totalLegs: true,
        shareSlug: true,
        createdAt: true,
      },
    });
  } catch {
    dbError = true;
  }

  return (
    <div className="w-full min-h-screen flex flex-col">
      <nav className="w-full max-w-[640px] mx-auto flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="SportsLogic" width={56} height={28} className="h-7 w-auto" />
          <span className="font-heading text-base font-bold text-text-primary tracking-tight">SportsLogic</span>
        </Link>
        <Link
          href="/grade"
          className="text-[11px] text-accent hover:brightness-110 transition-all uppercase tracking-wide"
        >
          GRADE A PARLAY
        </Link>
      </nav>

      <div className="w-full max-w-[640px] mx-auto px-5 flex-1 pb-16">
        <div className="pt-8 pb-8">
          <p className="font-heading text-[11px] font-bold tracking-[3px] text-text-tertiary uppercase mb-3">
            DASHBOARD
          </p>
          <h1 className="font-heading text-2xl font-bold uppercase text-text-primary">Your Grades</h1>
        </div>

        {dbError && (
          <div className="bg-red/10 border border-red/30 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-red">Database unavailable. Check back soon.</p>
          </div>
        )}

        {!dbError && grades.length === 0 && (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center">
            <p className="text-sm text-text-secondary mb-5">You haven&apos;t graded any parlays yet.</p>
            <Link
              href="/grade"
              className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-accent text-bg text-[11px] font-bold uppercase tracking-[0.5px] hover:brightness-110 transition-all"
            >
              GRADE YOUR FIRST PARLAY
            </Link>
          </div>
        )}

        {grades.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="divide-y divide-border/40">
              {grades.map((g) => {
                const date = new Date(g.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                return (
                  <Link
                    key={g.id}
                    href={`/grade/${g.shareSlug}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <span className={`font-heading text-xl font-bold w-10 shrink-0 ${gradeColor(g.overallGrade)}`}>
                      {g.overallGrade}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary font-medium">
                        {g.totalLegs}-leg parlay
                      </p>
                      <p className="text-[11px] text-text-tertiary mt-0.5">{date}</p>
                    </div>
                    <span className={`text-sm font-mono font-medium shrink-0 ${g.overallEV >= 0 ? "text-accent" : "text-red"}`}>
                      {g.overallEV >= 0 ? "+" : ""}{g.overallEV.toFixed(1)}%
                    </span>
                    <svg className="w-4 h-4 text-text-tertiary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <footer className="w-full max-w-[640px] mx-auto px-6 pt-8 pb-10 border-t border-border/30">
        <p className="text-[11px] text-text-tertiary text-center leading-relaxed">
          SportsLogic is not a sportsbook. Analysis tools for informational purposes only. 21+.
        </p>
      </footer>
    </div>
  );
}
