import { NextResponse } from "next/server";
import { gradeBet, type GradeResult } from "@/lib/grading-engine";

// Inline quick-grade for props — avoids extra API calls per player
function quickGradeProp(overOdds: number, underOdds: number, side: "over" | "under"): { ev: number; score: number; grade: string } {
  const impOver = overOdds > 0 ? 100 / (overOdds + 100) : Math.abs(overOdds) / (Math.abs(overOdds) + 100);
  const impUnder = underOdds > 0 ? 100 / (underOdds + 100) : Math.abs(underOdds) / (Math.abs(underOdds) + 100);
  const total = impOver + impUnder;
  const trueProb = side === "over" ? impOver / total : impUnder / total;
  const userOdds = side === "over" ? overOdds : underOdds;
  const profit = userOdds > 0 ? userOdds / 100 : 100 / Math.abs(userOdds);
  const ev = (trueProb * profit - (1 - trueProb)) * 100;
  const evScore = Math.max(0, Math.min(100, 50 + (ev / 3) * 50));
  const score = evScore * 0.45 + 50 * 0.25 + 50 * 0.15 + 50 * 0.15; // assume avg line/market/sit
  const GRADES: [number, string][] = [[90,"A+"],[84,"A"],[78,"A-"],[72,"B+"],[66,"B"],[60,"B-"],[54,"C+"],[46,"C"],[38,"C-"],[30,"D+"],[22,"D"],[14,"D-"],[0,"F"]];
  let grade = "F";
  for (const [t, g] of GRADES) { if (score >= t) { grade = g; break; } }
  return { ev: Math.round(ev * 100) / 100, score: Math.round(score * 10) / 10, grade };
}

const ODDS_API_KEY = process.env.ODDS_API_KEY ?? "";
const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

const SPORT_MAP: Record<string, string> = {
  nba: "basketball_nba",
  nfl: "americanfootball_nfl",
  mlb: "baseball_mlb",
  nhl: "icehockey_nhl",
  ncaab: "basketball_ncaab",
};

const PROP_MARKETS = [
  "player_points", "player_rebounds", "player_assists",
  "player_threes", "player_points_rebounds_assists",
];

type TopGrade = GradeResult & { team: string; betType: string; sport: string; relativeGrade?: string };
type CachedResult = { grades: TopGrade[]; updatedAt: string; totalScanned: number };

let cache: CachedResult | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes — heavier scan

function relativeGrade(rank: number, total: number): string {
  const pct = rank / total;
  if (pct <= 0.10) return "A";
  if (pct <= 0.20) return "A-";
  if (pct <= 0.40) return "B+";
  if (pct <= 0.60) return "B";
  if (pct <= 0.80) return "C";
  return "D";
}

export async function GET() {
  const now = Date.now();
  if (cache && now < cacheExpiry) {
    return NextResponse.json(cache);
  }

  if (!ODDS_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const cutoff = new Date(now + 24 * 60 * 60 * 1000).toISOString();
  const nowISO = new Date().toISOString();

  // Find active sports
  const activeSports: { short: string; key: string; gameIds: string[] }[] = [];

  for (const [short, key] of Object.entries(SPORT_MAP)) {
    try {
      const res = await fetch(
        `${ODDS_API_BASE}/sports/${key}/events/?apiKey=${ODDS_API_KEY}`,
      );
      if (!res.ok) continue;
      const events = await res.json();
      const upcoming = events.filter(
        (g: { commence_time: string }) => g.commence_time > nowISO && g.commence_time < cutoff
      );
      if (upcoming.length > 0) {
        activeSports.push({
          short,
          key,
          gameIds: upcoming.map((g: { id: string }) => g.id),
        });
      }
    } catch { /* skip */ }
  }

  const allGrades: TopGrade[] = [];

  for (const { short: sport, key: sportKey, gameIds } of activeSports) {
    // Fetch game odds (ML, spreads, totals)
    // Use gradeBet's own fetchOdds (all books) — grade directly with best_odds as the display
    // Fetch events list to get team names for this sport
    let eventsRes: Response;
    try {
      eventsRes = await fetch(
        `${ODDS_API_BASE}/sports/${sportKey}/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=fanduel`,
      );
      if (!eventsRes.ok) continue;
    } catch { continue; }

    const games = (await eventsRes.json()).filter(
      (g: { commence_time: string }) => g.commence_time > nowISO && g.commence_time < cutoff
    );

    for (const game of games) {
      const home = game.home_team as string;
      const away = game.away_team as string;

      // ML both sides — use best_odds from grading engine, not seeded price
      for (const team of [home, away]) {
        try {
          // Use 0 as a dummy price — gradeBet fetches real odds from all books internally
          // We just need to seed with something reasonable. Use FanDuel if available.
          let seedOdds = -110;
          for (const bk of game.bookmakers ?? []) {
            for (const mkt of bk.markets ?? []) {
              if (mkt.key !== "h2h") continue;
              for (const o of mkt.outcomes ?? []) {
                if (o.name === team) seedOdds = o.price;
              }
            }
          }
          // Grade using best_odds from the engine (which fetches all books)
          const result = await gradeBet(team, "moneyline", seedOdds, sport);
          if (result.error) continue;
          // IMPORTANT: display best_odds from the engine, which compared all US books
          const bo = result.best_odds;
          const bb = result.best_book;
          allGrades.push({ ...result, team, betType: `ML (${bo >= 0 ? "+" : ""}${bo}) on ${bb}`, sport: sport.toUpperCase() });
        } catch { /* skip */ }
      }

      // Spreads — seed from fanduel, grade against all books
      for (const bk of game.bookmakers ?? []) {
        for (const mkt of bk.markets ?? []) {
          if (mkt.key !== "spreads") continue;
          for (const o of mkt.outcomes ?? []) {
            try {
              const result = await gradeBet(o.name, "spread", o.price, sport, o.point);
              if (result.error) continue;
              const pt = o.point >= 0 ? `+${o.point}` : `${o.point}`;
              const bo = result.best_odds;
              const bb = result.best_book;
              allGrades.push({ ...result, team: o.name, betType: `${pt} (${bo >= 0 ? "+" : ""}${bo}) on ${bb}`, sport: sport.toUpperCase() });
            } catch { /* skip */ }
          }
          break;
        }
      }

      // Totals
      for (const bk of game.bookmakers ?? []) {
        for (const mkt of bk.markets ?? []) {
          if (mkt.key !== "totals") continue;
          for (const o of mkt.outcomes ?? []) {
            try {
              const result = await gradeBet(o.name, "total", o.price, sport, o.point, o.name.toLowerCase());
              if (result.error) continue;
              const bo = result.best_odds;
              const bb = result.best_book;
              allGrades.push({
                ...result,
                team: `${away} vs ${home}`,
                betType: `${o.name} ${o.point} (${bo >= 0 ? "+" : ""}${bo}) on ${bb}`,
                sport: sport.toUpperCase(),
              });
            } catch { /* skip */ }
          }
          break;
        }
      }
    }

    // Player props — scan ALL games, ALL prop types, both over AND under
    for (const eventId of gameIds) {
      // Fetch all prop markets in one call per game (comma-separated)
      const propMarketsStr = PROP_MARKETS.join(",");
      try {
        const propRes = await fetch(
          `${ODDS_API_BASE}/sports/${sportKey}/events/${eventId}/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=${propMarketsStr}&oddsFormat=american&bookmakers=fanduel`,
        );
        if (!propRes.ok) continue;
        const propData = await propRes.json();

        for (const bk of propData.bookmakers ?? []) {
          for (const mkt of bk.markets ?? []) {
            const propType = mkt.key.replace("player_", "");

            // Group by player + line
            const byPlayer = new Map<string, { over?: number; under?: number; point: number; name: string }>();
            for (const o of mkt.outcomes ?? []) {
              const desc = o.description ?? "";
              if (!desc || o.point === undefined) continue;
              const pk = `${desc}:${o.point}`;
              if (!byPlayer.has(pk)) byPlayer.set(pk, { name: desc, point: o.point });
              byPlayer.get(pk)![o.name.toLowerCase() as "over" | "under"] = o.price;
            }

            // Quick-grade both sides for every player — no extra API calls
            for (const [, po] of byPlayer) {
              if (po.over === undefined || po.under === undefined) continue;
              for (const side of ["over", "under"] as const) {
                const userOdds = po[side]!;
                const { ev, score, grade } = quickGradeProp(po.over, po.under, side);
                const sideLabel = side === "over" ? "O" : "U";
                const priceStr = userOdds >= 0 ? `+${userOdds}` : `${userOdds}`;
                allGrades.push({
                  grade,
                  score,
                  ev,
                  fair_odds: 0,
                  best_odds: userOdds,
                  best_book: bk.key,
                  true_prob: 0,
                  kelly: 0,
                  breakdown: {},
                  team: po.name,
                  betType: `${sideLabel}${po.point} ${propType} (${priceStr}) on ${bk.key}`,
                  sport: sport.toUpperCase(),
                });
              }
            }
          }
          break; // one book for seeding
        }
      } catch { /* skip */ }
    }
  }

  const totalScanned = allGrades.length;

  // Dedup: one entry per team/player
  const seen = new Map<string, TopGrade>();
  for (const g of allGrades) {
    const key = g.team;
    const existing = seen.get(key);
    if (!existing || g.score > existing.score) {
      seen.set(key, g);
    }
  }

  // Sort by EV descending for relative ranking
  const deduped = [...seen.values()];
  deduped.sort((a, b) => b.ev - a.ev);

  // Assign relative grades
  for (let i = 0; i < deduped.length; i++) {
    deduped[i].relativeGrade = relativeGrade(i, deduped.length);
  }

  // Take top 10
  const top = deduped.slice(0, 10);

  cache = { grades: top, updatedAt: new Date().toISOString(), totalScanned };
  cacheExpiry = now + CACHE_TTL;

  return NextResponse.json(cache);
}
