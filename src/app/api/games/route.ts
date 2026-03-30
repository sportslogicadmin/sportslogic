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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport") ?? "nba";
  const sportKey = SPORT_MAP[sport] ?? sport;

  if (!ODDS_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const res = await fetch(
    `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=american&bookmakers=fanduel`,
    { next: { revalidate: 300 } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 502 });
  }

  const data = await res.json();
  const games = data.map((g: { id: string; home_team: string; away_team: string; commence_time: string }) => ({
    id: g.id,
    home: g.home_team,
    away: g.away_team,
    time: g.commence_time,
  }));

  return NextResponse.json({ games });
}
