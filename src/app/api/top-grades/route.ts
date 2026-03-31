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
type WorstBetData = { team: string; betType: string; sport: string; grade: string; score: number; ev: number; best_book: string; vig: number };
type BestAltData = { team: string; betType: string; grade: string; ev: number; best_book: string };
type BookData = { name: string; avgEv: number };
type BookGradeData = { name: string; avgEv: number; grade: string; bestPct: number };
type CachedResult = {
  grades: TopGrade[];
  updatedAt: string;
  totalScanned: number;
  worstBet: WorstBetData | null;
  bestAlt: BestAltData | null;
  worstBook: BookData;
  bookGrades: BookGradeData[];
};

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
        `${ODDS_API_BASE}/sports/${sportKey}/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=fanduel,draftkings,betmgm,caesars,espnbet`,
      );
      if (!eventsRes.ok) continue;
    } catch { continue; }

    const games = (await eventsRes.json()).filter(
      (g: { commence_time: string }) => g.commence_time > nowISO && g.commence_time < cutoff
    );

    for (const game of games) {
      const home = game.home_team as string;
      const away = game.away_team as string;

      // Grade ML, spreads, totals — seed from EACH major book
      for (const bk of game.bookmakers ?? []) {
        const bkKey = bk.key as string;
        for (const mkt of bk.markets ?? []) {
          for (const o of mkt.outcomes ?? []) {
            try {
              let result: Awaited<ReturnType<typeof gradeBet>>;
              let label: string;

              if (mkt.key === "h2h") {
                result = await gradeBet(o.name, "moneyline", o.price, sport);
                if (result.error) continue;
                label = `ML (${result.best_odds >= 0 ? "+" : ""}${result.best_odds}) on ${result.best_book}`;
              } else if (mkt.key === "spreads" && o.point !== undefined) {
                result = await gradeBet(o.name, "spread", o.price, sport, o.point);
                if (result.error) continue;
                const pt = o.point >= 0 ? `+${o.point}` : `${o.point}`;
                label = `${pt} (${result.best_odds >= 0 ? "+" : ""}${result.best_odds}) on ${result.best_book}`;
              } else if (mkt.key === "totals" && o.point !== undefined) {
                result = await gradeBet(o.name, "total", o.price, sport, o.point, o.name.toLowerCase());
                if (result.error) continue;
                label = `${o.name} ${o.point} (${result.best_odds >= 0 ? "+" : ""}${result.best_odds}) on ${result.best_book}`;
              } else {
                continue;
              }

              const teamName = mkt.key === "totals" ? `${away} vs ${home}` : o.name;
              allGrades.push({ ...result, team: teamName, betType: label, sport: sport.toUpperCase(), _seedBook: bkKey, _seedOdds: o.price } as TopGrade & { _seedBook: string; _seedOdds: number });
            } catch { /* skip */ }
          }
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

  // Dedup for top grades: one entry per team/player, keep highest
  const seen = new Map<string, TopGrade>();
  for (const g of allGrades) {
    const key = g.team;
    const existing = seen.get(key);
    if (!existing || g.score > existing.score) {
      seen.set(key, g);
    }
  }

  const deduped = [...seen.values()];
  deduped.sort((a, b) => b.ev - a.ev);
  for (let i = 0; i < deduped.length; i++) {
    deduped[i].relativeGrade = relativeGrade(i, deduped.length);
  }
  const top = deduped.slice(0, 10);

  // Find WORST bet tonight (from all graded, not deduped — we want the actual worst line)
  const gameLineGrades = allGrades.filter((g) => !g.betType.includes("points") && !g.betType.includes("rebounds") && !g.betType.includes("assists") && !g.betType.includes("threes"));
  gameLineGrades.sort((a, b) => a.ev - b.ev);
  const worstBet = gameLineGrades[0] ?? null;

  // Find best alternative for the worst bet's game
  // Extract game teams from the worst bet
  let bestAlt: TopGrade | null = null;
  if (worstBet) {
    const worstTeam = worstBet.team;
    const worstSport = worstBet.sport;
    // Find all bets for the same sport that involve a different team/bet type
    const sameGame = allGrades.filter((g) =>
      g.sport === worstSport && g.team !== worstTeam && g.ev > worstBet.ev
    );
    sameGame.sort((a, b) => b.ev - a.ev);
    bestAlt = sameGame[0] ?? null;
  }

  // Sportsbook report card — compare each book's odds to fair odds
  const bookStats = new Map<string, { totalEv: number; count: number; bestCount: number }>();
  const MAJOR_BOOKS_LIST = ["fanduel", "draftkings", "betmgm", "caesars", "espnbet"];
  for (const bk of MAJOR_BOOKS_LIST) {
    bookStats.set(bk, { totalEv: 0, count: 0, bestCount: 0 });
  }
  for (const g of allGrades) {
    const ext = g as TopGrade & { _seedBook?: string };
    if (ext._seedBook && bookStats.has(ext._seedBook)) {
      const entry = bookStats.get(ext._seedBook)!;
      entry.totalEv += g.ev;
      entry.count++;
    }
    if (g.best_book && bookStats.has(g.best_book)) {
      bookStats.get(g.best_book)!.bestCount++;
    }
  }

  const bookGrades: { name: string; avgEv: number; grade: string; bestPct: number }[] = [];
  for (const [bk, data] of bookStats) {
    if (data.count === 0) continue;
    const avgEv = data.totalEv / data.count;
    const bestPct = data.bestCount / totalScanned * 100;
    // Placeholder grade — will be reassigned relative below
    let grade = "C";
    bookGrades.push({ name: bk, avgEv: Math.round(avgEv * 100) / 100, grade, bestPct: Math.round(bestPct * 10) / 10 });
  }
  bookGrades.sort((a, b) => b.avgEv - a.avgEv);
  // Assign relative grades — best book = A, worst = D
  const bookGradeLetters = ["A", "B+", "B", "C+", "C", "D"];
  for (let i = 0; i < bookGrades.length; i++) {
    bookGrades[i].grade = bookGradeLetters[Math.min(i, bookGradeLetters.length - 1)];
  }

  // Worst book
  const worstBook = bookGrades.length ? bookGrades[bookGrades.length - 1] : { name: "", avgEv: 0, grade: "?", bestPct: 0 };

  cache = {
    grades: top,
    updatedAt: new Date().toISOString(),
    totalScanned,
    worstBet: worstBet ? {
      team: worstBet.team,
      betType: worstBet.betType,
      sport: worstBet.sport,
      grade: worstBet.grade,
      score: worstBet.score,
      ev: worstBet.ev,
      best_book: worstBet.best_book,
      vig: Math.round(Math.abs(worstBet.ev) * 100) / 100,
    } : null,
    bestAlt: bestAlt ? {
      team: bestAlt.team,
      betType: bestAlt.betType,
      grade: bestAlt.grade,
      ev: bestAlt.ev,
      best_book: bestAlt.best_book,
    } : null,
    worstBook,
    bookGrades,
  };
  cacheExpiry = now + CACHE_TTL;

  return NextResponse.json(cache);
}
