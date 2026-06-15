import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ApiCheck = { ok: boolean; status: number; latency_ms: number };
type DbCheck = { ok: boolean; latency_ms: number };

type HealthPayload = {
  status: "ok" | "degraded" | "down";
  checks: { anthropic: ApiCheck; odds_api: ApiCheck; db: DbCheck };
  timestamp: string;
};

let cached: { payload: HealthPayload; at: number } | null = null;
const TTL = 60_000;

async function checkAnthropic(): Promise<ApiCheck> {
  const t = Date.now();
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      }),
      cache: "no-store",
    });
    return { ok: res.ok, status: res.status, latency_ms: Date.now() - t };
  } catch {
    return { ok: false, status: 0, latency_ms: Date.now() - t };
  }
}

async function checkOddsApi(): Promise<ApiCheck> {
  const t = Date.now();
  try {
    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports?apiKey=${process.env.ODDS_API_KEY ?? ""}`,
      { cache: "no-store" }
    );
    return { ok: res.ok, status: res.status, latency_ms: Date.now() - t };
  } catch {
    return { ok: false, status: 0, latency_ms: Date.now() - t };
  }
}

async function checkDb(): Promise<DbCheck> {
  const t = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latency_ms: Date.now() - t };
  } catch {
    return { ok: false, latency_ms: Date.now() - t };
  }
}

export async function GET() {
  if (cached && Date.now() - cached.at < TTL) {
    return NextResponse.json(cached.payload, {
      headers: { "Cache-Control": "public, s-maxage=60" },
    });
  }

  const [anthropic, odds_api, db] = await Promise.all([
    checkAnthropic(),
    checkOddsApi(),
    checkDb(),
  ]);

  const allOk = anthropic.ok && odds_api.ok && db.ok;
  const allDown = !anthropic.ok && !odds_api.ok && !db.ok;

  const payload: HealthPayload = {
    status: allOk ? "ok" : allDown ? "down" : "degraded",
    checks: { anthropic, odds_api, db },
    timestamp: new Date().toISOString(),
  };

  cached = { payload, at: Date.now() };

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=60" },
  });
}
