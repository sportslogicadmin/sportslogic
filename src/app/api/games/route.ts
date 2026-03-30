import { NextResponse } from "next/server";

const ODDS_API_KEY = process.env.ODDS_API_KEY ?? "";

const SPORT_MAP: Record<string, string> = {
  nba: "basketball_nba",
  nfl: "americanfootball_nfl",
  mlb: "baseball_mlb",
  nhl: "icehockey_nhl",
  ncaab: "basketball_ncaab",
  ncaaf: "americanfootball_ncaaf",
};

type Outcome = { name: string; price: number; point?: number };
type Market = { key: string; outcomes: Outcome[] };
type Bookmaker = { key: string; markets: Market[] };
type RawGame = {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: Bookmaker[];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport") ?? "nba";
  const sportKey = SPORT_MAP[sport] ?? sport;

  if (!ODDS_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const res = await fetch(
    `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?` +
      `apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=fanduel,draftkings`,
    { next: { revalidate: 300 } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 502 });
  }

  const data: RawGame[] = await res.json();

  const games = data
    .map((g) => {
      // Extract odds from the first available bookmaker per market
      const odds: Record<string, Outcome[]> = {};
      for (const bk of g.bookmakers) {
        for (const mkt of bk.markets) {
          if (!odds[mkt.key]) {
            odds[mkt.key] = mkt.outcomes;
          }
        }
      }

      return {
        id: g.id,
        home: g.home_team,
        away: g.away_team,
        time: g.commence_time,
        odds,
      };
    })
    .sort((a, b) => a.time.localeCompare(b.time));

  return NextResponse.json({ games });
}
