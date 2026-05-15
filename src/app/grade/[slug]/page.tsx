import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { bookName } from "@/lib/book-names";
import { ShareButton } from "@/components/share-button";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const ogUrl = `/api/og?slug=${slug}`;
  return {
    title: `Parlay Grade ${slug} — SportsLogic`,
    description: "See the EV breakdown and grade for this parlay on SportsLogic.",
    openGraph: {
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      images: [ogUrl],
    },
  };
}

function gradeColor(grade: string) {
  const f = grade[0];
  if (f === "A" || f === "B") return "text-accent";
  if (f === "C") return "text-amber";
  return "text-red";
}

function gradeBg(grade: string) {
  const f = grade[0];
  if (f === "A" || f === "B") return "border-accent/30 bg-accent/5";
  if (f === "C") return "border-amber/30 bg-amber/5";
  return "border-red/30 bg-red/5";
}

function dotColor(grade: string) {
  const f = grade[0];
  if (f === "A" || f === "B") return "bg-accent dot-glow-green";
  if (f === "C") return "bg-amber dot-glow-amber";
  return "bg-red dot-glow-red";
}

function gradeContext(grade: string) {
  const f = grade[0];
  if (f === "A") return "Strong edge. The math is in your favor.";
  if (f === "B") return "Solid parlay. Better than most.";
  if (f === "C") return "Average. Standard vig on most legs.";
  if (f === "D") return "Below average. Weak legs dragging you down.";
  return "Bad value. The books love this parlay.";
}

export default async function SharedGradePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  type SharedGrade = {
    overallGrade: string;
    overallEV: number;
    totalLegs: number;
    swapSuggestion: string | null;
    isPublic: boolean;
    createdAt: Date;
    legs: {
      team: string;
      market: string;
      line: number | null;
      odds: number;
      ev: number;
      grade: string;
      sport: string;
      isWeak: boolean;
    }[];
  };

  let raw: SharedGrade | null = null;

  try {
    raw = await prisma.grade.findUnique({
      where: { shareSlug: slug },
      select: {
        overallGrade: true,
        overallEV: true,
        totalLegs: true,
        swapSuggestion: true,
        isPublic: true,
        createdAt: true,
        legs: {
          select: {
            team: true,
            market: true,
            line: true,
            odds: true,
            ev: true,
            grade: true,
            sport: true,
            isWeak: true,
          },
        },
      },
    });
  } catch {
    // DB not yet connected — show a holding page rather than crashing
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-text-tertiary text-sm">This grade is not available right now.</p>
        <Link href="/grade" className="mt-6 text-accent text-sm hover:brightness-110 transition-all">
          Grade your own parlay →
        </Link>
      </div>
    );
  }

  if (!raw || !raw.isPublic) notFound();

  const dateStr = new Date(raw.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="w-full min-h-screen">
      {/* Nav */}
      <nav className="w-full max-w-[640px] mx-auto flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="SportsLogic" width={56} height={28} className="h-7 w-auto" />
          <span className="font-heading text-base font-bold text-text-primary tracking-tight">SportsLogic</span>
        </Link>
        <span className="text-[11px] text-text-tertiary uppercase tracking-wide">{dateStr}</span>
      </nav>

      <div className="w-full max-w-[520px] mx-auto px-5 pb-16">
        <div className="text-center pt-8 pb-8">
          <p className="text-[11px] text-text-tertiary uppercase tracking-[2px]">SHARED PARLAY GRADE</p>
        </div>

        {/* Overall grade card */}
        <div
          className={`rounded-2xl border overflow-hidden mb-6 ${gradeBg(raw.overallGrade)}`}
          style={{ boxShadow: "0 0 60px rgba(0,232,123,0.06)" }}
        >
          <div
            className="px-5 pt-6 pb-4 text-center"
            style={{ background: "linear-gradient(180deg, rgba(0,232,123,0.03) 0%, transparent 100%)" }}
          >
            <p className="text-[11px] text-text-tertiary uppercase tracking-[2px] mb-2">
              {raw.totalLegs}-LEG PARLAY
            </p>
            <p className={`font-heading text-[72px] font-bold leading-none ${gradeColor(raw.overallGrade)}`}>
              {raw.overallGrade}
            </p>
            <p className="text-sm text-text-secondary mt-2">{gradeContext(raw.overallGrade)}</p>
          </div>

          <div className="grid grid-cols-2 border-t border-border/30">
            <div className="px-3 py-3 text-center border-r border-border/30">
              <p className="text-[10px] text-text-tertiary uppercase">EV</p>
              <p className={`text-sm font-bold ${raw.overallEV >= 0 ? "text-accent" : "text-red"}`}>
                {raw.overallEV >= 0 ? "+" : ""}{raw.overallEV.toFixed(1)}%
              </p>
            </div>
            <div className="px-3 py-3 text-center">
              <p className="text-[10px] text-text-tertiary uppercase">LEGS</p>
              <p className="text-sm font-bold text-text-primary">{raw.totalLegs}</p>
            </div>
          </div>
        </div>

        {/* Leg breakdown */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-6">
          <div className="px-5 pt-4 pb-2">
            <p className="font-heading text-[11px] font-bold text-text-tertiary uppercase tracking-[2px]">LEG-BY-LEG BREAKDOWN</p>
          </div>
          <div className="divide-y divide-border/30">
            {raw.legs.map((leg, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor(leg.grade)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-medium truncate">{leg.team}</p>
                  <p className="text-[10px] text-text-tertiary">
                    {leg.market}
                    {leg.line != null ? ` ${leg.line >= 0 ? "+" : ""}${leg.line}` : ""} &bull;{" "}
                    {leg.odds >= 0 ? "+" : ""}{leg.odds} &bull; {leg.sport.toUpperCase()}
                  </p>
                </div>
                <span className={`font-heading text-base font-bold ${gradeColor(leg.grade)}`}>{leg.grade}</span>
                <span className={`text-xs font-mono ${leg.ev >= 0 ? "text-accent" : "text-text-tertiary"}`}>
                  {leg.ev >= 0 ? "+" : ""}{leg.ev.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Swap suggestion */}
        {raw.swapSuggestion && (
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6">
            <p className="text-[11px] font-bold text-accent uppercase tracking-wide mb-2">AI SUGGESTION</p>
            <p className="text-xs text-text-secondary leading-relaxed">{raw.swapSuggestion}</p>
          </div>
        )}

        {/* Share card download */}
        <ShareButton data={{
          overallGrade: raw.overallGrade,
          ev: raw.overallEV,
          legCount: raw.totalLegs,
          swapSuggestion: raw.swapSuggestion,
          legs: raw.legs.map((leg) => ({
            label: `${leg.team}${leg.market ? ` ${leg.market}` : ""}`,
            grade: leg.grade,
            ev: leg.ev,
          })),
        }} />

        {/* CTA */}
        <div className="bg-surface border border-border rounded-2xl p-6 text-center">
          <p className="font-heading text-sm font-bold text-text-primary uppercase tracking-wide mb-2">
            KNOW YOUR EDGE
          </p>
          <p className="text-xs text-text-secondary mb-5">
            Upload your bet slip and get a grade like this in seconds.
          </p>
          <Link
            href="/grade"
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-accent text-bg text-sm font-bold uppercase tracking-[0.5px] hover:brightness-110 transition-all"
          >
            GRADE YOUR PARLAY
          </Link>
        </div>
      </div>

      <footer className="w-full max-w-[640px] mx-auto px-6 pt-8 pb-10 border-t border-border/30">
        <p className="text-[11px] text-text-tertiary text-center leading-relaxed">
          SportsLogic is not a sportsbook. Analysis tools for informational purposes only. 21+.
        </p>
      </footer>
    </div>
  );
}
