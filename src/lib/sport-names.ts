const SPORT_DISPLAY: Record<string, string> = {
  // Odds API keys
  baseball_mlb: "MLB",
  basketball_nba: "NBA",
  americanfootball_nfl: "NFL",
  icehockey_nhl: "NHL",
  basketball_ncaab: "NCAAB",
  americanfootball_ncaaf: "NCAAF",
  // Short keys (parse-slip format)
  mlb: "MLB",
  nba: "NBA",
  nfl: "NFL",
  nhl: "NHL",
  ncaab: "NCAAB",
  ncaaf: "NCAAF",
};

export function sportName(key: string): string {
  if (!key) return "";
  return SPORT_DISPLAY[key.toLowerCase()] ?? key.toUpperCase();
}
