import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { gradeBet, gradeProp, gradeParlay, findAlternatives, type ParlayLeg } from "@/lib/grading-engine";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const FREE_LIMIT = 50;

function checkRate(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const resetAt = midnight.getTime();

  const entry = rateLimit.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimit.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: FREE_LIMIT - 1 };
  }

  if (entry.count >= FREE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: FREE_LIMIT - entry.count };
}

export async function POST(request: Request) {
  const { userId } = await auth();
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  const rate = checkRate(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "You've used your free grades today. Upgrade to Pro for unlimited grading.", remaining: 0 },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { team, betType, odds, sport, line, side, player, isProp, parlayLegs } = body as {
    team?: string; betType?: string; odds?: string | number; sport?: string;
    line?: number; side?: string; player?: string; isProp?: boolean;
    parlayLegs?: ParlayLeg[];
  };

  // Parlay grading
  if (parlayLegs && parlayLegs.length > 0) {
    try {
      const result = await gradeParlay(parlayLegs);

      let shareSlug: string | undefined;
      try {
        const slug = generateSlug();
        await prisma.grade.create({
          data: {
            userId: userId ?? null,
            overallGrade: result.overallGrade,
            overallEV: result.overallEv,
            totalLegs: result.legCount,
            swapSuggestion: result.swapSuggestion,
            shareSlug: slug,
            isPublic: true,
            legs: {
              create: result.legs.map((leg, i) => {
                const input = parlayLegs[i];
                return {
                  team: leg.team,
                  market: leg.betType,
                  line: input?.line ?? null,
                  odds: input?.odds ?? leg.best_odds,
                  ev: leg.ev,
                  grade: leg.grade,
                  sport: input?.sport ?? "unknown",
                  isWeak: leg.grade[0] === "D" || leg.grade[0] === "F",
                };
              }),
            },
          },
        });
        shareSlug = slug;
      } catch (dbErr) {
        console.error("[grade-save]", dbErr);
      }

      return NextResponse.json({ ...result, shareSlug, remaining: rate.remaining });
    } catch (err) {
      console.error("[grade-parlay]", err);
      return NextResponse.json({ error: "Parlay grading failed. Try again." }, { status: 500 });
    }
  }

  if ((!team && !player) || !odds || !sport) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const userOdds = parseInt(String(odds).replace("+", ""), 10);
    if (isNaN(userOdds)) {
      return NextResponse.json({ error: "Invalid odds format" }, { status: 400 });
    }

    const result = isProp && player
      ? await gradeProp(player, betType || "points", side || "over", line || 0, userOdds, sport, team)
      : await gradeBet(team || "", betType || "moneyline", userOdds, sport, line, side);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    // Find better alternatives if grade is C or below
    type Alt = { label: string; grade: string; score: number; ev: number; best_book: string };
    let alternatives: Alt[] = [];
    const gradeFirst = result.grade[0];
    if (["C", "D", "F"].includes(gradeFirst) && team) {
      try {
        const alts = await findAlternatives(team, sport, result.score);
        alternatives = alts.map((a) => {
          const withLabel = a as GradeWithLabel;
          return {
            label: withLabel.label ?? `${team} (${a.grade})`,
            grade: a.grade,
            score: a.score,
            ev: a.ev,
            best_book: a.best_book,
          };
        });
      } catch { /* skip */ }
    }

    return NextResponse.json({ ...result, alternatives, remaining: rate.remaining });
  } catch (err: unknown) {
    console.error("[grade]", err);
    return NextResponse.json({ error: "Grading failed. Try again." }, { status: 500 });
  }
}

type GradeWithLabel = { label?: string; grade: string; score: number; ev: number; best_book: string };
