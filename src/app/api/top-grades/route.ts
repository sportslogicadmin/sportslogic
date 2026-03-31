import { NextResponse } from "next/server";
import { gradeBet, type GradeResult } from "@/lib/grading-engine";

const ODDS_API_KEY = process.env.ODDS_API_KEY ?? "";
const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

const SPORT_MAP: Record<string, string> = {
  nba: "basketball_nba",
  nfl: "americanfootball_nfl",
  mlb: "baseball_mlb",
  nhl: "icehockey_nhl",
  ncaab: "basketball_ncaab",
};

type TopGrade = GradeResult & { team: string; betType: string; sport: string };
type CachedResult = { grades: TopGrade[]; updatedAt: string };

let cache: CachedResult | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export async function GET() {
  const now = Date.now();

  if (cache && now < cacheExpiry) {
    return NextResponse.json(cache);
  }

  if (!ODDS_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  // Find which sports have active games
  const activeSports: string[] = [];
  const cutoff = new Date(now + 24 * 60 * 60 * 1000).toISOString();
  const nowISO = new Date().toISOString();

  for (const [short, key] of Object.entries(SPORT_MAP)) {
    try {
      const res = await fetch(
        `${ODDS_API_BASE}/sports/${key}/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=american&bookmakers=fanduel`,
        { next: { revalidate: 900 } }
      );
      if (res.ok) {
        const games = await res.json();
        const upcoming = games.filter(
          (g: { commence_time: string }) => g.commence_time > nowISO && g.commence_time < cutoff
        );
        if (upcoming.length > 0) activeSports.push(short);
      }
    } catch { /* skip */ }
  }

  // Grade every ML and spread for active sports
  const allGrades: TopGrade[] = [];

  for (const sport of activeSports) {
    const sportKey = SPORT_MAP[sport];

    // Fetch h2h odds
    let res: Response;
    try {
      res = await fetch(
        `${ODDS_API_BASE}/sports/${sportKey}/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=fanduel,draftkings`,
      );
      if (!res.ok) continue;
    } catch { continue; }

    const games = (await res.json()).filter(
      (g: { commence_time: string }) => g.commence_time > nowISO && g.commence_time < cutoff
    );

    for (const game of games) {
      const home = game.home_team as string;
      const away = game.away_team as string;

      // Grade both sides ML
      for (const team of [home, away]) {
        try {
          // Find FanDuel ML odds for this team
          let mlOdds: number | null = null;
          for (const bk of game.bookmakers ?? []) {
            for (const mkt of bk.markets ?? []) {
              if (mkt.key !== "h2h") continue;
              for (const o of mkt.outcomes ?? []) {
                if (o.name === team) mlOdds = o.price;
              }
            }
          }
          if (mlOdds === null) continue;

          const result = await gradeBet(team, "moneyline", mlOdds, sport);
          if (result.error) continue;
          // Display best_odds from the grade result, not the seeded odds
          const bestO = result.best_odds;
          allGrades.push({ ...result, team, betType: `ML (${bestO >= 0 ? "+" : ""}${bestO})`, sport: sport.toUpperCase() });
        } catch { /* skip */ }
      }

      // Grade both sides spread
      for (const bk of game.bookmakers ?? []) {
        for (const mkt of bk.markets ?? []) {
          if (mkt.key !== "spreads") continue;
          for (const o of mkt.outcomes ?? []) {
            try {
              const result = await gradeBet(o.name, "spread", o.price, sport, o.point);
              if (result.error) continue;
              const pt = o.point >= 0 ? `+${o.point}` : `${o.point}`;
              // Display best_odds from the grade result, not the seeded odds
              const bestO = result.best_odds;
              allGrades.push({ ...result, team: o.name, betType: `${pt} (${bestO >= 0 ? "+" : ""}${bestO})`, sport: sport.toUpperCase() });
            } catch { /* skip */ }
          }
          break; // only need one book's spreads for seeding
        }
      }

      // Grade totals (over/under)
      for (const bk of game.bookmakers ?? []) {
        for (const mkt of bk.markets ?? []) {
          if (mkt.key !== "totals") continue;
          for (const o of mkt.outcomes ?? []) {
            try {
              const result = await gradeBet(o.name, "total", o.price, sport, o.point, o.name.toLowerCase());
              if (result.error) continue;
              allGrades.push({
                ...result,
                team: `${away} vs ${home}`,
                betType: `${o.name} ${o.point} (${o.price >= 0 ? "+" : ""}${result.best_odds})`,
                sport: sport.toUpperCase(),
              });
            } catch { /* skip */ }
          }
          break;
        }
      }
    }
  }

  // Dedup: one entry per team — keep whichever bet type has the highest score
  const seen = new Map<string, TopGrade>();
  for (const g of allGrades) {
    const key = g.team;
    const existing = seen.get(key);
    if (!existing || g.score > existing.score) {
      seen.set(key, g);
    }
  }

  // Sort by score descending, take top 10
  const deduped = [...seen.values()];
  deduped.sort((a, b) => b.score - a.score);
  const top = deduped.slice(0, 10);

  cache = { grades: top, updatedAt: new Date().toISOString() };
  cacheExpiry = now + CACHE_TTL;

  return NextResponse.json(cache);
}
