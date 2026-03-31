import { NextResponse } from "next/server";
import { gradeBet, gradeProp } from "@/lib/grading-engine";

// Simple in-memory rate limiter (resets on server restart)
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
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  const rate = checkRate(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "You've used your free grades today. Upgrade to Pro for unlimited grading.", remaining: 0 },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { team, betType, odds, sport, line, side, book, player, isProp } = body;

  if ((!team && !player) || !odds || !sport) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const userOdds = parseInt(String(odds).replace("+", ""), 10);

    const result = isProp && player
      ? await gradeProp(player, betType || "points", side || "over", line || 0, userOdds, sport, team)
      : await gradeBet(team, betType || "moneyline", userOdds, sport, line, side);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ ...result, remaining: rate.remaining });
  } catch (err: unknown) {
    console.error("[grade]", err);
    return NextResponse.json({ error: "Grading failed. Try again." }, { status: 500 });
  }
}
