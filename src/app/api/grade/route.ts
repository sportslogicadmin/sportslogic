import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const exec = promisify(execFile);

// Simple in-memory rate limiter (resets on server restart)
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const FREE_LIMIT = 2;

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
  // Rate limit by IP
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

  // Find the grading engine
  const enginePath = path.join(process.cwd(), "tools", "grading_engine.py");
  if (!fs.existsSync(enginePath)) {
    return NextResponse.json({ error: "Grading engine not found" }, { status: 500 });
  }

  // Build args
  const args = [enginePath, "--sport", sport, "--odds", String(odds), "--json"];

  if (isProp && player) {
    args.push("--prop", "--player", player, "--type", betType || "points");
    if (side) args.push("--side", side);
    if (line) args.push("--line", String(line));
    if (team) args.push("--team", team);
  } else {
    args.push("--team", team || "", "--type", betType || "moneyline");
    if (line) args.push("--line", String(line));
    if (side) args.push("--side", side);
  }
  if (book) args.push("--book", book);

  try {
    const { stdout, stderr } = await exec("python3", args, { timeout: 30000 });

    // The engine prints status to stderr-ish via print(), JSON goes to stdout
    // Find the JSON object in stdout
    const lines = stdout.split("\n");
    let jsonStr = "";
    let inJson = false;
    for (const l of lines) {
      if (l.trim().startsWith("{")) inJson = true;
      if (inJson) jsonStr += l;
    }

    if (!jsonStr) {
      return NextResponse.json({ error: "Engine returned no result", debug: stdout }, { status: 500 });
    }

    const result = JSON.parse(jsonStr);
    return NextResponse.json({ ...result, remaining: rate.remaining });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Grading failed", debug: message }, { status: 500 });
  }
}
