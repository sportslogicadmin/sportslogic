"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const SPORTS = [
  { key: "nba", label: "NBA" },
  { key: "nfl", label: "NFL" },
  { key: "mlb", label: "MLB" },
  { key: "nhl", label: "NHL" },
  { key: "ncaab", label: "NCAAB" },
  { key: "ncaaf", label: "NCAAF" },
];

const BET_TYPES = [
  { key: "moneyline", label: "MONEYLINE" },
  { key: "spread", label: "SPREAD" },
  { key: "total", label: "TOTAL" },
  { key: "prop", label: "PLAYER PROP" },
];

const PROP_TYPES = [
  { key: "points", label: "Points" },
  { key: "rebounds", label: "Rebounds" },
  { key: "assists", label: "Assists" },
  { key: "threes", label: "Threes" },
  { key: "pra", label: "Pts+Reb+Ast" },
];

const BOOKS = [
  { key: "fanduel", label: "FanDuel" },
  { key: "draftkings", label: "DraftKings" },
  { key: "betmgm", label: "BetMGM" },
  { key: "caesars", label: "Caesars" },
  { key: "espnbet", label: "ESPN Bet" },
  { key: "", label: "Other" },
];

type Game = { id: string; home: string; away: string; time: string };

type GradeResult = {
  grade: string;
  score: number;
  ev: number;
  fair_odds: number;
  best_odds: number;
  best_book: string;
  true_prob: number;
  kelly: number;
  breakdown: Record<string, number>;
  remaining?: number;
  error?: string;
};

function gradeColor(grade: string): string {
  const first = grade[0];
  if (first === "A" || first === "B") return "text-accent";
  if (first === "C") return "text-amber";
  return "text-red";
}

function gradeBg(grade: string): string {
  const first = grade[0];
  if (first === "A" || first === "B") return "bg-accent/10 border-accent/30";
  if (first === "C") return "bg-amber/10 border-amber/30";
  return "bg-red/10 border-red/30";
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 60 ? "bg-accent" : pct >= 40 ? "bg-amber" : "bg-red";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-secondary w-28 shrink-0 uppercase">{label}</span>
      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-text-secondary w-8 text-right">{Math.round(pct)}</span>
    </div>
  );
}

export default function GradePage() {
  const [sport, setSport] = useState("nba");
  const [games, setGames] = useState<Game[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [betType, setBetType] = useState("moneyline");
  const [line, setLine] = useState("");
  const [side, setSide] = useState("over");
  const [odds, setOdds] = useState("");
  const [book, setBook] = useState("fanduel");
  const [playerName, setPlayerName] = useState("");
  const [propType, setPropType] = useState("points");
  const [loading, setLoading] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState("");

  // Fetch games when sport changes
  useEffect(() => {
    setLoadingGames(true);
    setSelectedTeam("");
    setResult(null);
    fetch(`/api/games?sport=${sport}`)
      .then((r) => r.json())
      .then((data) => {
        setGames(data.games || []);
        setLoadingGames(false);
      })
      .catch(() => {
        setGames([]);
        setLoadingGames(false);
      });
  }, [sport]);

  // Build team options from games — show matchup + date/time
  function formatGameTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isToday = d.toDateString() === now.toDateString();
    const isTomorrow = d.toDateString() === tomorrow.toDateString();
    const day = isToday ? "Today" : isTomorrow ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${day} ${time}`;
  }

  type TeamOption = { team: string; label: string };
  const teamOptions: TeamOption[] = [];
  for (const g of games) {
    const tag = formatGameTime(g.time);
    teamOptions.push({ team: g.away, label: `${g.away} @ ${g.home} — ${tag}` });
    teamOptions.push({ team: g.home, label: `${g.home} vs ${g.away} — ${tag}` });
  }

  const isProp = betType === "prop";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isProp ? !playerName || !odds : !selectedTeam || !odds) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team: selectedTeam || undefined,
          betType: isProp ? propType : betType,
          odds: odds,
          sport,
          line: line ? parseFloat(line) : undefined,
          side: (isProp || betType === "total") ? side : undefined,
          book,
          player: isProp ? playerName : undefined,
          isProp,
        }),
      });

      const data = await res.json();
      if (res.ok && !data.error) {
        setResult(data);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Failed to connect to grading engine");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen">
      {/* Nav */}
      <nav className="w-full max-w-[1080px] mx-auto flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-lg font-bold text-text-primary tracking-tight">
            SportsLogic
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs text-text-tertiary hover:text-text-secondary transition-colors uppercase tracking-wide"
        >
          BACK TO HOME
        </Link>
      </nav>

      <div className="w-full max-w-[560px] mx-auto px-6 py-12">
        {/* Header */}
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-[-0.5px] text-center mb-2">
          GRADE YOUR BET
        </h1>
        <p className="text-sm text-text-secondary text-center mb-10">
          See your edge before you place it.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sport */}
          <div>
            <label className="text-xs text-text-tertiary uppercase tracking-wide block mb-2">SPORT</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {SPORTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSport(s.key)}
                  className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all cursor-pointer ${
                    sport === s.key
                      ? "bg-accent text-bg"
                      : "bg-surface border border-border text-text-secondary hover:border-text-tertiary"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Team */}
          <div>
            <label className="text-xs text-text-tertiary uppercase tracking-wide block mb-2">TEAM</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full h-12 px-4 rounded-lg bg-surface border border-border text-text-primary text-sm outline-none focus:border-accent/50 transition-colors appearance-none cursor-pointer"
            >
              <option value="">
                {loadingGames ? "Loading games..." : games.length ? "Select a team" : "No games available"}
              </option>
              {teamOptions.map((t, i) => (
                <option key={`${t.team}-${i}`} value={t.team}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Bet Type */}
          <div>
            <label className="text-xs text-text-tertiary uppercase tracking-wide block mb-2">BET TYPE</label>
            <div className="grid grid-cols-3 gap-2">
              {BET_TYPES.map((bt) => (
                <button
                  key={bt.key}
                  type="button"
                  onClick={() => setBetType(bt.key)}
                  className={`py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all cursor-pointer ${
                    betType === bt.key
                      ? "bg-accent text-bg"
                      : "bg-surface border border-border text-text-secondary hover:border-text-tertiary"
                  }`}
                >
                  {bt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prop fields */}
          {isProp && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-text-tertiary uppercase tracking-wide block mb-2">PLAYER NAME</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="e.g. Embiid"
                  className="w-full h-12 px-4 rounded-lg bg-surface border border-border text-text-primary text-sm outline-none focus:border-accent/50 transition-colors placeholder:text-text-tertiary"
                />
              </div>
              <div>
                <label className="text-xs text-text-tertiary uppercase tracking-wide block mb-2">PROP TYPE</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {PROP_TYPES.map((pt) => (
                    <button
                      key={pt.key}
                      type="button"
                      onClick={() => setPropType(pt.key)}
                      className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all cursor-pointer ${
                        propType === pt.key
                          ? "bg-accent text-bg"
                          : "bg-surface border border-border text-text-secondary hover:border-text-tertiary"
                      }`}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text-tertiary uppercase tracking-wide block mb-2">LINE</label>
                  <input
                    type="text"
                    value={line}
                    onChange={(e) => setLine(e.target.value)}
                    placeholder="28.5"
                    className="w-full h-12 px-4 rounded-lg bg-surface border border-border text-text-primary text-sm outline-none focus:border-accent/50 transition-colors placeholder:text-text-tertiary"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-tertiary uppercase tracking-wide block mb-2">SIDE</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["over", "under"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSide(s)}
                        className={`h-12 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all cursor-pointer ${
                          side === s
                            ? "bg-accent text-bg"
                            : "bg-surface border border-border text-text-secondary"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Line (for spread/total) */}
          {!isProp && (betType === "spread" || betType === "total") && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-tertiary uppercase tracking-wide block mb-2">
                  {betType === "spread" ? "SPREAD" : "TOTAL LINE"}
                </label>
                <input
                  type="text"
                  value={line}
                  onChange={(e) => setLine(e.target.value)}
                  placeholder={betType === "spread" ? "-3.5" : "218.5"}
                  className="w-full h-12 px-4 rounded-lg bg-surface border border-border text-text-primary text-sm outline-none focus:border-accent/50 transition-colors placeholder:text-text-tertiary"
                />
              </div>
              {betType === "total" && (
                <div>
                  <label className="text-xs text-text-tertiary uppercase tracking-wide block mb-2">SIDE</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["over", "under"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSide(s)}
                        className={`h-12 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all cursor-pointer ${
                          side === s
                            ? "bg-accent text-bg"
                            : "bg-surface border border-border text-text-secondary"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Odds + Book */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-tertiary uppercase tracking-wide block mb-2">YOUR ODDS</label>
              <input
                type="text"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
                placeholder="-110"
                className="w-full h-12 px-4 rounded-lg bg-surface border border-border text-text-primary text-sm outline-none focus:border-accent/50 transition-colors placeholder:text-text-tertiary"
              />
            </div>
            <div>
              <label className="text-xs text-text-tertiary uppercase tracking-wide block mb-2">SPORTSBOOK</label>
              <select
                value={book}
                onChange={(e) => setBook(e.target.value)}
                className="w-full h-12 px-4 rounded-lg bg-surface border border-border text-text-primary text-sm outline-none focus:border-accent/50 transition-colors appearance-none cursor-pointer"
              >
                {BOOKS.map((b) => (
                  <option key={b.key} value={b.key}>{b.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || (isProp ? !playerName || !odds : !selectedTeam || !odds)}
            className="w-full h-14 rounded-lg bg-accent text-bg text-sm font-semibold uppercase tracking-[0.5px] hover:brightness-110 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "GRADING..." : "GRADE THIS BET"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 rounded-lg bg-red/10 border border-red/30">
            <p className="text-sm text-red text-center">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-10">
            {/* Grade hero */}
            <div className={`rounded-xl border p-6 text-center mb-6 ${gradeBg(result.grade)}`}>
              <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">YOUR GRADE</p>
              <p className={`text-[80px] font-bold leading-none ${gradeColor(result.grade)}`}>
                {result.grade}
              </p>
              <p className="text-sm text-text-secondary mt-2">{result.score}/100</p>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-surface border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">EXPECTED VALUE</p>
                <p className={`text-xl font-bold ${result.ev >= 0 ? "text-accent" : "text-red"}`}>
                  {result.ev >= 0 ? "+" : ""}{result.ev.toFixed(2)}%
                </p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">TRUE PROBABILITY</p>
                <p className="text-xl font-bold text-text-primary">
                  {(result.true_prob * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">FAIR ODDS</p>
                <p className="text-xl font-bold text-text-primary">
                  {result.fair_odds >= 0 ? "+" : ""}{result.fair_odds}
                </p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">BEST AVAILABLE</p>
                <p className="text-xl font-bold text-accent">
                  {result.best_odds >= 0 ? "+" : ""}{result.best_odds}
                </p>
                <p className="text-[10px] text-text-tertiary mt-0.5 uppercase">{result.best_book}</p>
              </div>
            </div>

            {/* Kelly */}
            <div className="bg-surface border border-border rounded-xl p-4 mb-6">
              <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">KELLY CRITERION</p>
              <p className="text-sm text-text-secondary">
                {result.kelly > 0 ? (
                  <>Suggested stake: <span className="text-accent font-semibold">{(result.kelly * 100).toFixed(2)}%</span> of bankroll</>
                ) : (
                  <span className="text-red">No edge — Kelly says pass on this bet.</span>
                )}
              </p>
            </div>

            {/* Breakdown */}
            {result.breakdown && (
              <div className="bg-surface border border-border rounded-xl p-5 mb-6">
                <p className="text-xs text-text-tertiary uppercase tracking-wide mb-4">SCORE BREAKDOWN</p>
                <div className="space-y-3">
                  <ScoreBar label="EV (50%)" value={result.breakdown.ev_score} />
                  <ScoreBar label="Line Value (20%)" value={result.breakdown.line_value_score} />
                  <ScoreBar label="Market (15%)" value={result.breakdown.market_sharpness_score} />
                  <ScoreBar label="Situational (15%)" value={result.breakdown.situational_score} />
                </div>
              </div>
            )}

            {/* Remaining */}
            {result.remaining !== undefined && (
              <p className="text-xs text-text-tertiary text-center">
                {result.remaining > 0
                  ? `${result.remaining} free grade${result.remaining === 1 ? "" : "s"} remaining today`
                  : "No free grades remaining today"}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full max-w-[1080px] mx-auto px-6 pt-8 pb-10 border-t border-border mt-12">
        <p className="text-[12px] text-text-tertiary text-center leading-relaxed">
          SportsLogic is not a sportsbook. Analysis tools for informational purposes only. 21+.
        </p>
      </footer>
    </div>
  );
}
