import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { JournalBinder } from "./journal-binder";
import { SettleButton } from "./settle-button";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "My Journal" };

function gradeColor(g: string) {
  const f = g[0];
  if (f === "A" || f === "B") return "text-accent";
  if (f === "C") return "text-amber-400";
  return "text-red-400";
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtDollars(n: number) {
  return n < 1 ? `$${n.toFixed(2)}` : `$${Math.round(n)}`;
}

type Grade = {
  id: string;
  createdAt: Date;
  overallGrade: string;
  overallEV: number;
  totalLegs: number;
  shareSlug: string;
  foundMoney: number | null;
  foundMoneyPercent: number | null;
  stake: number | null;
  userParlayDecimal: number | null;
  bestParlayDecimal: number | null;
  settled: boolean;
  won: boolean | null;
};

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ bind?: string; uuid?: string; sort?: string }>;
}) {
  const session = await auth();
  const cookieStore = await cookies();
  const deviceUUID = cookieStore.get("sl_uuid")?.value ?? null;
  const params = await searchParams;

  const shouldBind = params.bind === "1" && !!session?.user?.id && !!params.uuid;
  const bindUUID = params.uuid ?? null;

  // Query grades by userId (authenticated) OR deviceUUID (anonymous)
  let grades: Grade[] = [];
  if (session?.user?.id) {
    grades = await prisma.grade.findMany({
      where: { userId: session.user.id },
      select: {
        id: true, createdAt: true, overallGrade: true, overallEV: true,
        totalLegs: true, shareSlug: true, foundMoney: true,
        foundMoneyPercent: true, stake: true, userParlayDecimal: true,
        bestParlayDecimal: true, settled: true, won: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } else if (deviceUUID) {
    grades = await prisma.grade.findMany({
      where: { deviceUUID },
      select: {
        id: true, createdAt: true, overallGrade: true, overallEV: true,
        totalLegs: true, shareSlug: true, foundMoney: true,
        foundMoneyPercent: true, stake: true, userParlayDecimal: true,
        bestParlayDecimal: true, settled: true, won: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Sort
  const sort = params.sort ?? "date";
  if (sort === "ev") grades.sort((a, b) => b.overallEV - a.overallEV);
  else if (sort === "found") grades.sort((a, b) => (b.foundMoney ?? 0) - (a.foundMoney ?? 0));

  // Hero stats
  const settledWon = grades.filter((g) => g.settled && g.won === true);
  const settledLost = grades.filter((g) => g.settled && g.won === false);

  const cumulativeFoundMoney = settledWon.reduce((sum, g) => sum + (g.foundMoney ?? 0), 0);

  const settledWithStake = grades.filter((g) => g.settled && g.stake != null && g.stake > 0);
  const totalStaked = settledWithStake.reduce((sum, g) => sum + (g.stake ?? 0), 0);
  const totalProfit = settledWithStake.reduce((sum, g) => {
    const stake = g.stake ?? 0;
    if (g.won && g.userParlayDecimal != null) {
      return sum + stake * (g.userParlayDecimal - 1);
    }
    return sum - stake;
  }, 0);
  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : null;

  const isEmpty = grades.length === 0;

  return (
    <div className="w-full min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="w-full max-w-[720px] mx-auto flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="SportsLogic" width={56} height={28} className="h-7 w-auto" />
          <span className="font-heading text-base font-bold text-text-primary tracking-tight">SportsLogic</span>
        </Link>
        <Link href="/grade" className="text-[11px] text-text-tertiary hover:text-text-secondary transition-colors uppercase tracking-wide">
          Grade a slip
        </Link>
      </nav>

      {/* Grade binding on sign-in */}
      {shouldBind && bindUUID && <JournalBinder deviceUUID={bindUUID} />}

      <div className="flex-1 w-full max-w-[720px] mx-auto px-5 pb-16">
        {/* Header */}
        <div className="pt-6 pb-8">
          <p className="font-heading text-[11px] font-bold tracking-[3px] text-text-tertiary uppercase mb-3">
            Your Season
          </p>
          <h1 className="font-display text-[28px] sm:text-[36px] font-bold text-text-primary tracking-tight mb-6">
            Bet Journal
          </h1>

          {isEmpty ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
              <p className="text-sm text-text-secondary mb-4">No grades yet.</p>
              <Link
                href="/grade"
                className="inline-block bg-accent hover:brightness-110 text-stone-950 font-bold text-sm rounded-xl px-6 py-3 transition-all"
              >
                Grade your first slip
              </Link>
            </div>
          ) : (
            <>
              {/* Hero stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Grades</p>
                  <p className="font-heading text-2xl font-bold text-text-primary">{grades.length}</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Record</p>
                  <p className="font-heading text-2xl font-bold text-text-primary">
                    {settledWon.length}–{settledLost.length}
                  </p>
                </div>
                <div className={`rounded-2xl border p-4 ${cumulativeFoundMoney > 0 ? "border-[#00B362]/30 bg-[#00B362]/5" : "border-zinc-800 bg-zinc-900/40"}`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Found Money</p>
                  <p className={`font-heading text-2xl font-bold ${cumulativeFoundMoney > 0 ? "text-accent" : "text-text-primary"}`}>
                    {cumulativeFoundMoney > 0 ? fmtDollars(cumulativeFoundMoney) : "—"}
                  </p>
                </div>
                {roi !== null && (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Season ROI</p>
                    <p className={`font-heading text-2xl font-bold ${roi >= 0 ? "text-accent" : "text-red-400"}`}>
                      {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>

              {/* Sort controls */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[11px] text-zinc-500 uppercase tracking-wide">Sort:</span>
                {[["date", "Date"], ["ev", "EV"], ["found", "Found Money"]].map(([val, label]) => (
                  <Link
                    key={val}
                    href={`/journal?sort=${val}`}
                    className={`text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full transition-colors ${
                      sort === val
                        ? "bg-accent/10 text-accent"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>

              {/* Grade list */}
              <div className="space-y-3">
                {grades.map((grade) => {
                  const fmDisplay = grade.foundMoney != null && grade.foundMoney > 0
                    ? fmtDollars(grade.foundMoney)
                    : grade.foundMoneyPercent != null && grade.foundMoneyPercent > 0
                      ? `+${grade.foundMoneyPercent.toFixed(1)}%`
                      : null;

                  return (
                    <div
                      key={grade.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`font-heading text-2xl font-bold shrink-0 ${gradeColor(grade.overallGrade)}`}>
                            {grade.overallGrade}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs text-zinc-500">{fmtDate(grade.createdAt)}</p>
                            <p className="text-sm text-text-secondary mt-0.5">
                              {grade.totalLegs}-leg parlay
                              {grade.stake != null && (
                                <span className="text-zinc-500"> · {fmtDollars(grade.stake)}</span>
                              )}
                              {fmDisplay && (
                                <span className="text-accent"> · {fmDisplay} found</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={`text-sm font-semibold ${grade.overallEV >= 0 ? "text-accent" : "text-red-400"}`}>
                            {grade.overallEV >= 0 ? "+" : ""}{grade.overallEV.toFixed(1)}% EV
                          </span>
                          <Link
                            href={`/grade/${grade.shareSlug}`}
                            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            View →
                          </Link>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                        <SettleButton gradeId={grade.id} settled={grade.settled} won={grade.won} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {!session && grades.length > 0 && (
          <div className="mt-6 rounded-2xl border border-zinc-700/50 bg-zinc-900/40 p-5 text-center">
            <p className="text-sm text-text-secondary mb-3">
              Sign in to save these grades to your account — they&apos;ll sync across devices.
            </p>
            <Link
              href="/grade"
              className="text-sm font-semibold text-accent hover:brightness-110 transition-all"
            >
              Go to grade page to sign in →
            </Link>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
