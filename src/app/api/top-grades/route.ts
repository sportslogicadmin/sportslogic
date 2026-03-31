import { NextResponse } from "next/server";
import { gradeBet, gradeProp, type GradeResult } from "@/lib/grading-engine";

const ODDS_API_KEY = process.env.ODDS_API_KEY ?? "";
const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

const SPORT_MAP: Record<string, string> = {
  nba: "basketball_nba",
  nfl: "americanfootball_nfl",
  mlb: "baseball_mlb",
  nhl: "icehockey_nhl",
  ncaab: "basketball_ncaab",
};

const PROP_MARKETS = ["player_points", "player_rebounds", "player_assists"];

type TopGrade = GradeResult & { team: string; betType: string; sport: string; relativeGrade?: string };
type CachedResult = { grades: TopGrade[]; updatedAt: string; totalScanned: number };

let cache: CachedResult | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 15 * 60 * 1000;

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

    // Player props — sample top props for up to 4 games per sport
    const propsGameIds = gameIds.slice(0, 4);
    for (const eventId of propsGameIds) {
      for (const propMarket of PROP_MARKETS) {
        try {
          const propRes = await fetch(
            `${ODDS_API_BASE}/sports/${sportKey}/events/${eventId}/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=${propMarket}&oddsFormat=american&bookmakers=fanduel,draftkings`,
          );
          if (!propRes.ok) continue;
          const propData = await propRes.json();

          // Grade the first 3 props from FanDuel (top listed players)
          const propType = propMarket.replace("player_", "");
          let propsGraded = 0;

          for (const bk of propData.bookmakers ?? []) {
            if (bk.key !== "fanduel" && bk.key !== "draftkings") continue;
            for (const mkt of bk.markets ?? []) {
              if (mkt.key !== propMarket) continue;

              // Group by player
              const byPlayer = new Map<string, { over?: number; under?: number; point?: number; name?: string }>();
              for (const o of mkt.outcomes ?? []) {
                const desc = o.description ?? "";
                if (!desc || o.point === undefined) continue;
                if (!byPlayer.has(desc)) byPlayer.set(desc, { name: desc });
                const entry = byPlayer.get(desc)!;
                entry.point = o.point;
                entry[o.name.toLowerCase() as "over" | "under"] = o.price;
              }

              for (const [playerName, po] of byPlayer) {
                if (propsGraded >= 3) break;
                if (po.over === undefined || po.point === undefined) continue;

                try {
                  const result = await gradeProp(
                    playerName, propType, "over", po.point, po.over, sport
                  );
                  if (result.error) continue;

                  const bo = result.best_odds;
                  allGrades.push({
                    ...result,
                    team: playerName,
                    betType: `O${po.point} ${propType} (${bo >= 0 ? "+" : ""}${bo})`,
                    sport: sport.toUpperCase(),
                  });
                  propsGraded++;
                } catch { /* skip */ }
              }
            }
            break; // one book is enough for seeding
          }
        } catch { /* skip */ }
      }
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
