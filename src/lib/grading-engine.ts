/**
 * SportsLogic Grading Engine — TypeScript
 *
 * Grades bets using live odds from The Odds API,
 * Pinnacle devig for true probability, EV calculation,
 * Kelly criterion, and composite scoring.
 */

const ODDS_API_KEY = process.env.ODDS_API_KEY ?? "";
const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

const SPORT_MAP: Record<string, string> = {
  nba: "basketball_nba",
  nfl: "americanfootball_nfl",
  mlb: "baseball_mlb",
  nhl: "icehockey_nhl",
  ncaab: "basketball_ncaab",
  ncaaf: "americanfootball_ncaaf",
};

const MARKET_MAP: Record<string, string> = {
  moneyline: "h2h",
  ml: "h2h",
  spread: "spreads",
  total: "totals",
};

const PROP_MAP: Record<string, string> = {
  points: "player_points",
  rebounds: "player_rebounds",
  assists: "player_assists",
  threes: "player_threes",
  pra: "player_points_rebounds_assists",
};

const SHARP_BOOKS = ["pinnacle", "betonlineag", "bookmaker", "betcris", "circa"];

const GRADE_MAP: [number, string][] = [
  [90, "A+"], [84, "A"], [78, "A-"], [72, "B+"], [66, "B"], [60, "B-"],
  [54, "C+"], [46, "C"], [38, "C-"], [30, "D+"], [22, "D"], [14, "D-"],
  [0, "F"],
];

// ── Odds math ──

function americanToImplied(odds: number): number {
  return odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
}

function impliedToAmerican(prob: number): number {
  if (prob <= 0 || prob >= 1) return 0;
  return prob >= 0.5
    ? Math.round(-100 * prob / (1 - prob))
    : Math.round(100 * (1 - prob) / prob);
}

function devig(oddsA: number, oddsB: number): [number, number] {
  const impA = americanToImplied(oddsA);
  const impB = americanToImplied(oddsB);
  const total = impA + impB;
  return [impA / total, impB / total];
}

function calcEV(trueProb: number, odds: number): number {
  const profitPerDollar = odds > 0 ? odds / 100 : 100 / Math.abs(odds);
  return (trueProb * profitPerDollar - (1 - trueProb)) * 100;
}

function calcKelly(trueProb: number, odds: number): number {
  const b = odds > 0 ? odds / 100 : 100 / Math.abs(odds);
  const f = (b * trueProb - (1 - trueProb)) / b;
  return Math.max(0, f);
}

function scoreToGrade(score: number): string {
  for (const [threshold, grade] of GRADE_MAP) {
    if (score >= threshold) return grade;
  }
  return "F";
}

// ── API helpers ──

type Outcome = { name: string; price: number; point?: number };
type Market = { key: string; outcomes: Outcome[] };
type Bookmaker = { key: string; markets: Market[] };
type Game = {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: Bookmaker[];
};

const oddsCache = new Map<string, Game[]>();

async function fetchOdds(sport: string, market: string): Promise<Game[]> {
  const sportKey = SPORT_MAP[sport] ?? sport;
  const marketKey = MARKET_MAP[market] ?? market;
  const cacheKey = `${sportKey}:${marketKey}`;

  if (oddsCache.has(cacheKey)) return oddsCache.get(cacheKey)!;

  const res = await fetch(
    `${ODDS_API_BASE}/sports/${sportKey}/odds/?` +
    `apiKey=${ODDS_API_KEY}&regions=us,us2,eu&markets=${marketKey}&oddsFormat=american`
  );
  if (!res.ok) return [];

  const data: Game[] = await res.json();
  oddsCache.set(cacheKey, data);
  return data;
}

async function fetchPropOdds(sport: string, eventId: string, propType: string): Promise<Game | null> {
  const sportKey = SPORT_MAP[sport] ?? sport;
  const marketKey = PROP_MAP[propType] ?? propType;

  const res = await fetch(
    `${ODDS_API_BASE}/sports/${sportKey}/events/${eventId}/odds/?` +
    `apiKey=${ODDS_API_KEY}&regions=us,us2,eu&markets=${marketKey}&oddsFormat=american`
  );
  if (!res.ok) return null;
  return await res.json();
}

async function fetchEvents(sport: string): Promise<Game[]> {
  const sportKey = SPORT_MAP[sport] ?? sport;
  const res = await fetch(`${ODDS_API_BASE}/sports/${sportKey}/events/?apiKey=${ODDS_API_KEY}`);
  if (!res.ok) return [];
  return await res.json();
}

function findGame(games: Game[], team: string): Game | undefined {
  const t = team.toLowerCase();
  return games.find((g) => {
    const home = g.home_team.toLowerCase();
    const away = g.away_team.toLowerCase();
    return t.split(" ").some((w) => w.length >= 4 && (home.includes(w) || away.includes(w)));
  });
}

// ── Scoring ──

function computeScore(evPct: number, userOdds: number, bestOdds: number, worstOdds: number) {
  const evScore = Math.max(0, Math.min(100, 50 + (evPct / 5) * 50));

  const oddsRange = bestOdds - worstOdds;
  const lineScore = oddsRange > 0
    ? Math.max(0, Math.min(100, ((userOdds - worstOdds) / oddsRange) * 100))
    : 50;

  const sharpnessScore = oddsRange <= 5 ? 70 : oddsRange <= 15 ? 50 : oddsRange <= 30 ? 40 : (evPct > 0 ? 60 : 30);
  const situationalScore = 50;

  const composite = evScore * 0.50 + lineScore * 0.20 + sharpnessScore * 0.15 + situationalScore * 0.15;

  return {
    composite,
    breakdown: {
      ev_score: Math.round(evScore * 10) / 10,
      line_value_score: Math.round(lineScore * 10) / 10,
      market_sharpness_score: Math.round(sharpnessScore * 10) / 10,
      situational_score: Math.round(situationalScore * 10) / 10,
    },
  };
}

// ── Result type ──

export type GradeResult = {
  grade: string;
  score: number;
  ev: number;
  fair_odds: number;
  best_odds: number;
  best_book: string;
  true_prob: number;
  kelly: number;
  breakdown: Record<string, number>;
  all_lines?: { book: string; line: number; odds: number; side: string }[];
  error?: string;
};

// ── Grade a standard bet ──

export async function gradeBet(
  team: string,
  betType: string,
  userOdds: number,
  sport: string,
  line?: number,
  side?: string,
): Promise<GradeResult> {
  const games = await fetchOdds(sport, betType);
  const game = findGame(games, team);

  if (!game) return errorResult("No game found for this team");

  const marketKey = MARKET_MAP[betType] ?? betType;
  const teamLower = team.toLowerCase();
  const sideTarget = (side ?? "over").toLowerCase();

  // Extract odds for user's side across all books
  const bookOdds = new Map<string, { ours: number; theirs: number }>();

  for (const bk of game.bookmakers) {
    for (const mkt of bk.markets) {
      if (mkt.key !== marketKey) continue;

      let ours: Outcome | undefined;
      let theirs: Outcome | undefined;

      for (const o of mkt.outcomes) {
        const name = o.name.toLowerCase();

        if (betType === "total" || betType === "totals") {
          if (name === sideTarget) ours = o;
          else theirs = o;
        } else {
          const isOurTeam = teamLower.split(" ").some((w) => w.length >= 4 && name.includes(w));
          if (isOurTeam) {
            if (line === undefined || o.point === undefined || Math.abs(o.point - line) < 2) {
              ours = o;
            }
          } else {
            theirs = o;
          }
        }
      }

      if (ours && theirs) {
        bookOdds.set(bk.key, { ours: ours.price, theirs: theirs.price });
      }
    }
  }

  if (bookOdds.size === 0) return errorResult("No odds found for this bet");

  // True probability via sharp book devig
  let trueProb: number | null = null;
  for (const sb of SHARP_BOOKS) {
    const bo = bookOdds.get(sb);
    if (bo) {
      const [probOurs] = devig(bo.ours, bo.theirs);
      trueProb = probOurs;
      break;
    }
  }

  if (trueProb === null) {
    const implied = [...bookOdds.values()].map((bo) => americanToImplied(bo.ours));
    trueProb = (implied.reduce((a, b) => a + b, 0) / implied.length) * 0.96;
  }

  const fairOdds = impliedToAmerican(trueProb);
  const ev = calcEV(trueProb, userOdds);
  const kelly = calcKelly(trueProb, userOdds);

  const allOurs = [...bookOdds.entries()].map(([bk, bo]) => ({ book: bk, odds: bo.ours }));
  const best = allOurs.reduce((a, b) => (b.odds > a.odds ? b : a));
  const worst = allOurs.reduce((a, b) => (b.odds < a.odds ? b : a));

  const { composite, breakdown } = computeScore(ev, userOdds, best.odds, worst.odds);

  return {
    grade: scoreToGrade(composite),
    score: Math.round(composite * 10) / 10,
    ev: Math.round(ev * 100) / 100,
    fair_odds: fairOdds,
    best_odds: best.odds,
    best_book: best.book,
    true_prob: Math.round(trueProb * 10000) / 10000,
    kelly: Math.round(kelly * 10000) / 10000,
    breakdown,
  };
}

// ── Grade a player prop ──

export async function gradeProp(
  player: string,
  propType: string,
  side: string,
  line: number,
  userOdds: number,
  sport: string,
  team?: string,
): Promise<GradeResult> {
  // Find event ID
  const events = await fetchEvents(sport);
  const searchTerm = (team ?? player).toLowerCase();
  const event = events.find((ev) =>
    searchTerm.split(" ").some(
      (w) => w.length >= 4 && (ev.home_team.toLowerCase().includes(w) || ev.away_team.toLowerCase().includes(w))
    )
  );

  if (!event) return errorResult("No game found for this player/team");

  const data = await fetchPropOdds(sport, event.id, propType);
  if (!data) return errorResult("Failed to fetch prop odds");

  const marketKey = PROP_MAP[propType] ?? propType;
  const playerLower = player.toLowerCase();
  const sideLower = side.toLowerCase();

  // Collect exact matches and all lines
  const exactMatch = new Map<string, { over: number; under: number; point: number }>();
  const allLines: { book: string; line: number; odds: number; side: string }[] = [];

  const bookmakers = (data as unknown as { bookmakers: Bookmaker[] }).bookmakers ?? [];

  for (const bk of bookmakers) {
    for (const mkt of bk.markets) {
      if (mkt.key !== marketKey) continue;

      // Group by player + line
      const byLine = new Map<number, Record<string, number>>();
      for (const o of mkt.outcomes) {
        const desc = (o.description ?? "").toLowerCase();
        const match = playerLower.split(" ").some((w) => w.length >= 4 && desc.includes(w));
        if (!match || o.point === undefined) continue;

        if (!byLine.has(o.point)) byLine.set(o.point, { point: o.point } as Record<string, number>);
        byLine.get(o.point)![o.name.toLowerCase()] = o.price;
      }

      for (const [pt, po] of byLine) {
        if (po[sideLower] !== undefined) {
          allLines.push({ book: bk.key, line: pt, odds: po[sideLower], side: sideLower });
        }
        if (Math.abs(pt - line) < 0.1 && po.over !== undefined && po.under !== undefined) {
          exactMatch.set(bk.key, { over: po.over, under: po.under, point: pt });
        }
      }
    }
  }

  allLines.sort((a, b) => a.line - b.line || b.odds - a.odds);

  if (exactMatch.size === 0) return errorResult(`No prop odds found for ${player} ${propType} ${side} ${line}`);

  // Devig
  let trueProb: number | null = null;
  for (const sb of SHARP_BOOKS) {
    const bo = exactMatch.get(sb);
    if (bo) {
      const [overProb, underProb] = devig(bo.over, bo.under);
      trueProb = sideLower === "over" ? overProb : underProb;
      break;
    }
  }

  if (trueProb === null) {
    const sideOdds = [...exactMatch.values()].map((bo) => bo[sideLower as "over" | "under"]).filter(Boolean);
    if (sideOdds.length) {
      const avg = sideOdds.reduce((a, b) => a + americanToImplied(b), 0) / sideOdds.length;
      trueProb = avg * 0.96;
    } else {
      trueProb = 0.5;
    }
  }

  const fairOdds = impliedToAmerican(trueProb);
  const ev = calcEV(trueProb, userOdds);
  const kelly = calcKelly(trueProb, userOdds);

  const sideByBook = [...exactMatch.entries()]
    .map(([bk, bo]) => ({ book: bk, odds: bo[sideLower as "over" | "under"] }))
    .filter((x) => x.odds !== undefined);

  const best = sideByBook.length ? sideByBook.reduce((a, b) => (b.odds > a.odds ? b : a)) : { book: "", odds: 0 };
  const worst = sideByBook.length ? sideByBook.reduce((a, b) => (b.odds < a.odds ? b : a)) : { book: "", odds: 0 };

  const { composite, breakdown } = computeScore(ev, userOdds, best.odds, worst.odds);

  return {
    grade: scoreToGrade(composite),
    score: Math.round(composite * 10) / 10,
    ev: Math.round(ev * 100) / 100,
    fair_odds: fairOdds,
    best_odds: best.odds,
    best_book: best.book,
    true_prob: Math.round(trueProb * 10000) / 10000,
    kelly: Math.round(kelly * 10000) / 10000,
    breakdown,
    all_lines: allLines,
  };
}

function errorResult(msg: string): GradeResult {
  return {
    grade: "?",
    score: 0,
    ev: 0,
    fair_odds: 0,
    best_odds: 0,
    best_book: "",
    true_prob: 0,
    kelly: 0,
    breakdown: {},
    error: msg,
  };
}
