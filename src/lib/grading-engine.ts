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
  // NBA
  points: "player_points",
  rebounds: "player_rebounds",
  assists: "player_assists",
  threes: "player_threes",
  pra: "player_points_rebounds_assists",
  // MLB
  hr: "batter_home_runs",
  hits: "batter_hits",
  strikeouts: "pitcher_strikeouts",
  rbis: "batter_rbis",
  // NHL
  goals: "player_goals",
  shots: "player_shots_on_goal",
};

const SHARP_BOOKS = ["pinnacle", "betonlineag", "bookmaker", "betcris", "circa"];

const SUPPORTED_SPORTS = new Set(Object.keys(SPORT_MAP));
const SUPPORTED_SPORTS_LABEL = "NBA, NFL, MLB, NHL, college football, and college basketball";

// US retail books — what the user can actually bet at. Line value compares against these only.
const US_BOOKS = new Set([
  "fanduel", "draftkings", "betmgm", "caesars", "espnbet", "betrivers",
  "fanatics", "hardrockbet", "hardrockbet_az", "betparx", "wynnbet",
  "ballybet", "fliff", "bovada", "betonlineag",
]);

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

type Outcome = { name: string; price: number; point?: number; description?: string };
type Market = { key: string; outcomes: Outcome[] };
type Bookmaker = { key: string; markets: Market[] };
type Game = {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: Bookmaker[];
};

const oddsCache = new Map<string, { data: Game[]; expires: number }>();
const ODDS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchOdds(sport: string, market: string): Promise<Game[]> {
  const sportKey = SPORT_MAP[sport] ?? sport;
  const marketKey = MARKET_MAP[market] ?? market;
  const cacheKey = `${sportKey}:${marketKey}`;

  const cached = oddsCache.get(cacheKey);
  if (cached && Date.now() < cached.expires) return cached.data;

  const url = `${ODDS_API_BASE}/sports/${sportKey}/odds/?apiKey=${ODDS_API_KEY}&regions=us,us2,eu&markets=${marketKey}&oddsFormat=american`;
  const t0 = Date.now();
  const res = await fetch(url, { next: { revalidate: 300 } });
  const ms = Date.now() - t0;
  if (!res.ok) {
    console.error(`[odds-api] ${sportKey}/${marketKey} → HTTP ${res.status} (${ms}ms)`);
    return [];
  }

  const data: Game[] = await res.json();
  console.log(`[odds-api] ${sportKey}/${marketKey} → ${data.length} games in ${ms}ms: ${data.slice(0, 4).map(g => `${g.away_team} @ ${g.home_team} (${new Date(g.commence_time).toISOString()})`).join(" | ")}`);
  oddsCache.set(cacheKey, { data, expires: Date.now() + ODDS_CACHE_TTL });
  return data;
}

async function fetchPropOdds(sport: string, eventId: string, propType: string): Promise<Game | null> {
  const sportKey = SPORT_MAP[sport] ?? sport;
  const marketKey = PROP_MAP[propType] ?? propType;

  const url = `${ODDS_API_BASE}/sports/${sportKey}/events/${eventId}/odds/?apiKey=${ODDS_API_KEY}&regions=us,us2,eu&markets=${marketKey}&oddsFormat=american`;
  const t0 = Date.now();
  const res = await fetch(url, { next: { revalidate: 300 } });
  const ms = Date.now() - t0;
  console.log(`[prop-api] ${sportKey}/${eventId.slice(-6)}/${marketKey} → HTTP ${res.status} (${ms}ms)`);
  if (!res.ok) return null;
  return await res.json();
}

async function fetchEvents(sport: string): Promise<Game[]> {
  const sportKey = SPORT_MAP[sport] ?? sport;
  const url = `${ODDS_API_BASE}/sports/${sportKey}/events/?apiKey=${ODDS_API_KEY}`;
  const t0 = Date.now();
  const res = await fetch(url, { next: { revalidate: 300 } });
  const ms = Date.now() - t0;
  if (!res.ok) {
    console.error(`[events-api] ${sportKey} → HTTP ${res.status} (${ms}ms)`);
    return [];
  }
  const games: Game[] = await res.json();
  console.log(`[events-api] ${sportKey} → ${games.length} upcoming in ${ms}ms: ${games.slice(0, 4).map(g => `${g.away_team} @ ${g.home_team} (${new Date(g.commence_time).toISOString()})`).join(" | ")}`);
  return games;
}

type ScoreGame = {
  home_team: string;
  away_team: string;
  commence_time: string;
  completed: boolean;
};

type GameStartDecision = "started" | "not_started" | "ambiguous" | "no_match";

// daysFrom=0 (not 1): daysFrom=1 was pulling in the *previous* day's completed
// slate, which collides with back-to-back series (e.g. the same two teams
// playing on consecutive nights) — the matcher couldn't tell yesterday's
// finished game from tonight's game that hasn't started. daysFrom=0 keeps the
// pool to today/live only; the ambiguity handling below is a second layer of
// protection for same-day cases (doubleheaders) it doesn't fully eliminate.
async function hasGameStarted(team: string, sport: string): Promise<GameStartDecision> {
  if (!team?.trim()) return "no_match";
  const sportKey = SPORT_MAP[sport] ?? sport;
  try {
    const res = await fetch(
      `${ODDS_API_BASE}/sports/${sportKey}/scores/?apiKey=${ODDS_API_KEY}&daysFrom=0`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) {
      console.log(`[scores-api] ${sportKey} team="${team}" → HTTP ${res.status}, decision=no_match`);
      return "no_match";
    }
    const games: ScoreGame[] = await res.json();
    const now = Date.now();

    const matches = games
      .filter(g => teamMatch(team, g.home_team) || teamMatch(team, g.away_team))
      .map(g => ({
        home_team: g.home_team,
        away_team: g.away_team,
        commence_time: g.commence_time,
        completed: g.completed,
        commence_ms: new Date(g.commence_time).getTime(),
      }));

    console.log(
      `[scores-api] ${sportKey} team="${team}" → ${games.length} games fetched, ${matches.length} matched: ` +
      matches.map(m => `${m.away_team}@${m.home_team} commence=${new Date(m.commence_ms).toISOString()} completed=${m.completed} pastStart=${m.commence_ms <= now}`).join(" | ")
    );

    if (matches.length === 0) {
      console.log(`[scores-api] team="${team}" → decision=no_match`);
      return "no_match";
    }

    // A future-commence match means there's a real upcoming game for this
    // team — that governs, regardless of any stale completed entry also
    // matching the same team name (the back-to-back-series case).
    const upcoming = matches.filter(m => m.commence_ms > now);
    if (upcoming.length > 0) {
      console.log(`[scores-api] team="${team}" → decision=not_started (upcoming match found)`);
      return "not_started";
    }

    const started = matches.filter(m => m.commence_ms <= now);
    if (started.length === 1) {
      console.log(`[scores-api] team="${team}" → decision=started (single confident match, completed=${started[0].completed})`);
      return "started";
    }

    // Multiple past-commence matches (e.g. doubleheader) with no upcoming
    // entry to disambiguate — not confident enough to abort.
    console.log(`[scores-api] team="${team}" → decision=ambiguous (${started.length} past-commence matches, no upcoming match)`);
    return "ambiguous";
  } catch (e) {
    console.log(`[scores-api] team="${team}" → fetch error, decision=no_match: ${e instanceof Error ? e.message : e}`);
    return "no_match";
  }
}

function teamMatch(query: string, candidate: string): boolean {
  if (candidate.toLowerCase().includes(query.toLowerCase())) return true;
  // Last-word fallback: min 6 chars to avoid common short words matching team names
  const words = query.toLowerCase().split(" ");
  const lastWord = words[words.length - 1];
  if (lastWord.length >= 6 && candidate.toLowerCase().includes(lastWord)) return true;
  return false;
}

const GAME_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // ±3 days

function findGame(games: Game[], team: string): Game | undefined {
  const now = Date.now();
  return games.find((g) => {
    if (!teamMatch(team, g.home_team) && !teamMatch(team, g.away_team)) return false;
    // Reject games outside the ±3-day window — stale/future games produce valid-looking but wrong odds
    const gameTime = new Date(g.commence_time).getTime();
    return Math.abs(gameTime - now) <= GAME_WINDOW_MS;
  });
}

// ── Scoring ──

function computeScore(evPct: number, userOdds: number, bestOdds: number, worstOdds: number) {
  // EV scale: centres on real-world sportsbook juice.
  // 0% EV = 70 (near fair value), -5% EV = 40 (typical -110 line),
  // +5% EV = 100 (clear edge), < -11.7% EV = 0 (terrible line).
  const evScore = Math.max(0, Math.min(100, 70 + (evPct / 5) * 30));

  const oddsRange = bestOdds - worstOdds;
  const lineScore = oddsRange > 0
    ? Math.max(0, Math.min(100, ((userOdds - worstOdds) / oddsRange) * 100))
    : 50;

  const sharpnessScore = oddsRange <= 5 ? 70 : oddsRange <= 15 ? 50 : oddsRange <= 30 ? 40 : (evPct > 0 ? 60 : 30);
  const situationalScore = 50;

  // Bonus: positive EV + top-tier line = extra boost
  const bonus = evPct > 0 && lineScore > 70 ? 5 : 0;

  const composite = Math.min(100, evScore * 0.45 + lineScore * 0.25 + sharpnessScore * 0.15 + situationalScore * 0.15 + bonus);

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
          const isOurTeam = teamMatch(team, o.name);
          if (isOurTeam) {
            const pointMatch = o.point === undefined
              ? true
              : line === undefined
                ? true
                : Math.abs(o.point - line) < 0.5;
            if (pointMatch) {
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
    trueProb = implied.length > 0
      ? (implied.reduce((a, b) => a + b, 0) / implied.length) * 0.96
      : 0.5;
  }

  const fairOdds = impliedToAmerican(trueProb);
  const ev = calcEV(trueProb, userOdds);
  const kelly = calcKelly(trueProb, userOdds);

  // Compare line value against US retail books only (what user can actually bet at)
  const allOurs = [...bookOdds.entries()].map(([bk, bo]) => ({ book: bk, odds: bo.ours }));
  const usOurs = allOurs.filter((x) => US_BOOKS.has(x.book));
  const compareSet = usOurs.length >= 2 ? usOurs : allOurs; // fallback if no US books

  const best = compareSet.reduce((a, b) => (b.odds > a.odds ? b : a));
  const worst = compareSet.reduce((a, b) => (b.odds < a.odds ? b : a));

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
  const events = await fetchEvents(sport);

  // Primary: match by team name (fast, single lookup)
  let event: Game | undefined;
  if (team && team.trim()) {
    event = events.find((ev) =>
      teamMatch(team, ev.home_team) || teamMatch(team, ev.away_team)
    );
  }

  // Fallback: when team is missing or didn't match, scan prop data across all
  // events until we find the player's name in a bookmaker's outcome descriptions.
  // Capped at 8 events to limit API calls.
  if (!event) {
    for (const ev of events.slice(0, 8)) {
      const probe = await fetchPropOdds(sport, ev.id, propType);
      if (!probe) continue;
      const bookmakers = (probe as unknown as { bookmakers: Bookmaker[] }).bookmakers ?? [];
      const playerLower = player.toLowerCase();
      const found = bookmakers.some((bk) =>
        bk.markets.some((mkt) =>
          mkt.outcomes.some((o) => {
            const desc = (o.description ?? "").toLowerCase();
            return playerLower.split(" ").some((w) => w.length >= 4 && desc.includes(w));
          })
        )
      );
      if (found) {
        event = ev;
        break;
      }
    }
  }

  if (!event) {
    return errorResult(
      team
        ? `No ${sport.toUpperCase()} game found for "${team}"`
        : `Could not find "${player}" in any active ${sport.toUpperCase()} game — try including the team name`
    );
  }

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

  // Compare against US books only for line value
  const usSideByBook = sideByBook.filter((x) => US_BOOKS.has(x.book));
  const compareSet = usSideByBook.length >= 2 ? usSideByBook : sideByBook;

  const best = compareSet.length ? compareSet.reduce((a, b) => (b.odds > a.odds ? b : a)) : { book: "", odds: 0 };
  const worst = compareSet.length ? compareSet.reduce((a, b) => (b.odds < a.odds ? b : a)) : { book: "", odds: 0 };

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

// ── Find better alternatives for a game ──

export async function findAlternatives(
  team: string,
  sport: string,
  currentScore: number,
): Promise<GradeResult[]> {
  const alternatives: (GradeResult & { label: string })[] = [];

  const games = await fetchOdds(sport, "moneyline");
  const game = findGame(games, team);
  if (!game) return [];

  const home = game.home_team;
  const away = game.away_team;

  // Grade all bet types for both teams
  for (const betTeam of [home, away]) {
    // ML
    const mlGames = await fetchOdds(sport, "moneyline");
    const mlGame = findGame(mlGames, betTeam);
    if (mlGame) {
      for (const bk of mlGame.bookmakers) {
        for (const mkt of bk.markets) {
          if (mkt.key !== "h2h") continue;
          for (const o of mkt.outcomes) {
            if (teamMatch(betTeam, o.name)) {
              const r = await gradeBet(betTeam, "moneyline", o.price, sport);
              if (!r.error && r.score > currentScore) {
                alternatives.push({ ...r, label: `${betTeam} ML (${r.best_odds >= 0 ? "+" : ""}${r.best_odds})` });
              }
            }
          }
        }
        break;
      }
    }

    // Spread
    const spGames = await fetchOdds(sport, "spread");
    const spGame = findGame(spGames, betTeam);
    if (spGame) {
      for (const bk of spGame.bookmakers) {
        for (const mkt of bk.markets) {
          if (mkt.key !== "spreads") continue;
          for (const o of mkt.outcomes) {
            if (teamMatch(betTeam, o.name) && o.point !== undefined) {
              const r = await gradeBet(betTeam, "spread", o.price, sport, o.point);
              if (!r.error && r.score > currentScore) {
                const pt = o.point >= 0 ? `+${o.point}` : `${o.point}`;
                alternatives.push({ ...r, label: `${betTeam} ${pt} (${r.best_odds >= 0 ? "+" : ""}${r.best_odds})` });
              }
            }
          }
        }
        break;
      }
    }
  }

  // Totals
  const totGames = await fetchOdds(sport, "total");
  const totGame = findGame(totGames, team);
  if (totGame) {
    for (const bk of totGame.bookmakers) {
      for (const mkt of bk.markets) {
        if (mkt.key !== "totals") continue;
        for (const o of mkt.outcomes) {
          if (o.point !== undefined) {
            const r = await gradeBet(o.name, "total", o.price, sport, o.point, o.name.toLowerCase());
            if (!r.error && r.score > currentScore) {
              alternatives.push({ ...r, label: `${o.name} ${o.point} (${r.best_odds >= 0 ? "+" : ""}${r.best_odds})` });
            }
          }
        }
      }
      break;
    }
  }

  // Dedup and sort
  const seen = new Map<string, typeof alternatives[0]>();
  for (const a of alternatives) {
    if (!seen.has(a.label) || a.score > seen.get(a.label)!.score) {
      seen.set(a.label, a);
    }
  }

  return [...seen.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// ── Parlay grading ──

export type ParlayLeg = {
  team: string;
  betType: string;
  odds: number;
  sport: string;
  line?: number;
  side?: string;
  player?: string;
  isProp?: boolean;
};

export type ParlayResult = {
  overallGrade: string;
  overallScore: number;
  overallEv: number;
  combinedTrueProb: number;
  combinedImpliedProb: number;
  vigCost: number;
  legCount: number;
  legs: (GradeResult & { team: string; betType: string })[];
  weakestLeg: string | null;
  correlationWarnings: string[];
  swapSuggestion: string | null;
};

export async function gradeParlay(legs: ParlayLeg[]): Promise<ParlayResult> {
  // Pre-flight: reject unsupported sports before hitting any API
  for (let i = 0; i < legs.length; i++) {
    const sport = (legs[i].sport ?? "").toLowerCase();
    if (!SUPPORTED_SPORTS.has(sport)) {
      const displaySport = legs[i].sport ? legs[i].sport.charAt(0).toUpperCase() + legs[i].sport.slice(1).toLowerCase() : "that sport";
      throw new Error(
        `We can't grade ${displaySport} yet — SportsLogic currently covers ${SUPPORTED_SPORTS_LABEL}.`
      );
    }
  }

  const gradedLegs: (GradeResult & { team: string; betType: string })[] = [];
  let combinedTrueProb = 1;
  let combinedImpliedProb = 1;

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const odds = typeof leg.odds === "string" ? parseInt(String(leg.odds).replace("+", ""), 10) : leg.odds;
    let result: GradeResult;

    if (leg.isProp && leg.player) {
      result = await gradeProp(leg.player, leg.betType || "points", leg.side || "over", leg.line || 0, odds, leg.sport, leg.team);
    } else {
      result = await gradeBet(leg.team, leg.betType || "moneyline", odds, leg.sport, leg.line, leg.side);
    }

    // Hard abort: any leg without resolved odds poisons the whole grade
    if (result.error) {
      const name = leg.player ?? leg.team;
      const startDecision = await hasGameStarted(leg.team, leg.sport);
      // "Already started" requires a confident, single, unambiguous match —
      // ambiguous/no-match cases fall through to the generic message instead
      // of a false-confidence abort (see decision log 2026-06-16).
      if (startDecision === "started") {
        throw new Error(
          `This game has already started — SportsLogic grades slips before tip-off/first pitch.`
        );
      }
      throw new Error(
        `We couldn't find live odds for leg ${i + 1} (${name}). Check that the game is active and try again.`
      );
    }

    gradedLegs.push({ ...result, team: leg.team, betType: leg.betType || "moneyline" });

    if (result.true_prob > 0) {
      combinedTrueProb *= result.true_prob;
      combinedImpliedProb *= americanToImplied(odds);
    }
  }

  // Parlay EV
  let parlayEv = 0;
  let vigCost = 0;
  if (combinedImpliedProb > 0 && combinedTrueProb > 0) {
    const parlayDecimal = 1 / combinedImpliedProb;
    parlayEv = (combinedTrueProb * (parlayDecimal - 1) - (1 - combinedTrueProb)) * 100;
    vigCost = ((combinedImpliedProb - combinedTrueProb) / combinedTrueProb) * 100;
  }

  // Correlation detection — same-game legs
  const warnings: string[] = [];
  const gameTeams = new Map<string, number>();
  for (let i = 0; i < gradedLegs.length; i++) {
    const t = gradedLegs[i].team.toLowerCase();
    if (gameTeams.has(t)) {
      warnings.push(`Legs ${gameTeams.get(t)! + 1} and ${i + 1} both involve ${gradedLegs[i].team} — likely correlated.`);
    } else {
      gameTeams.set(t, i);
    }
  }

  // Composite parlay score
  const avgScore = gradedLegs.length > 0
    ? gradedLegs.reduce((sum, l) => sum + l.score, 0) / gradedLegs.length
    : 0;
  const worstScore = gradedLegs.length > 0
    ? Math.min(...gradedLegs.map((l) => l.score))
    : 0;
  const corrPenalty = warnings.length * 5;
  const weakPenalty = Math.max(0, (50 - worstScore) * 0.3);
  const parlayScore = Math.max(0, avgScore - corrPenalty - weakPenalty);

  // Find weakest leg
  const weakest = gradedLegs.length > 0
    ? gradedLegs.reduce((a, b) => (a.score < b.score ? a : b))
    : null;

  // Swap suggestion — find what the weakest leg's best alternative would be
  let swapSuggestion: string | null = null;
  if (weakest && weakest.score < 50) {
    try {
      const weakestIndex = gradedLegs.indexOf(weakest);
      const weakestSport = legs[weakestIndex]?.sport || legs[0]?.sport || "nba";
      const alts = await findAlternatives(weakest.team, weakestSport, weakest.score);
      if (alts.length > 0) {
        const best = alts[0] as GradeResult & { label?: string };
        swapSuggestion = `Swap leg ${gradedLegs.indexOf(weakest) + 1}: ${best.label ?? weakest.team} grades ${best.grade} with ${best.ev >= 0 ? "+" : ""}${best.ev.toFixed(1)}% EV.`;
      }
    } catch { /* skip */ }
  }

  return {
    overallGrade: scoreToGrade(parlayScore),
    overallScore: Math.round(parlayScore * 10) / 10,
    overallEv: Math.round(parlayEv * 100) / 100,
    combinedTrueProb: Math.round(combinedTrueProb * 10000) / 10000,
    combinedImpliedProb: Math.round(combinedImpliedProb * 10000) / 10000,
    vigCost: Math.round(vigCost * 100) / 100,
    legCount: gradedLegs.length,
    legs: gradedLegs,
    weakestLeg: weakest ? `${weakest.team} (${weakest.grade})` : null,
    correlationWarnings: warnings,
    swapSuggestion,
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
