"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const SPORTS = [
  { key: "nba", label: "NBA" },
  { key: "nfl", label: "NFL" },
  { key: "mlb", label: "MLB" },
  { key: "nhl", label: "NHL" },
  { key: "ncaab", label: "NCAAB" },
  { key: "ncaaf", label: "NCAAF" },
];

const BET_TYPES = [
  { key: "moneyline", label: "ML" },
  { key: "spread", label: "SPREAD" },
  { key: "total", label: "TOTAL" },
  { key: "prop", label: "PROP" },
];

const PROP_TYPES = [
  { key: "points", label: "PTS" },
  { key: "rebounds", label: "REB" },
  { key: "assists", label: "AST" },
  { key: "threes", label: "3PT" },
  { key: "pra", label: "PRA" },
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
  const f = grade[0];
  if (f === "A" || f === "B") return "text-accent";
  if (f === "C") return "text-amber";
  return "text-red";
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 60 ? "bg-accent" : pct >= 40 ? "bg-amber" : "bg-red";
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-text-tertiary w-24 shrink-0 uppercase tracking-wide">{label}</span>
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-text-tertiary w-6 text-right">{Math.round(pct)}</span>
    </div>
  );
}

// Shared input class
const inputCls = "w-full h-12 px-4 rounded-lg bg-surface border border-border text-text-primary text-sm outline-none focus:border-accent/50 focus:shadow-[0_0_0_2px_rgba(0,232,123,0.1)] transition-all placeholder:text-text-tertiary";
const selectCls = `${inputCls} appearance-none cursor-pointer`;

function ToggleGroup({
  options,
  value,
  onChange,
  cols = "grid-cols-3",
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  cols?: string;
}) {
  return (
    <div className={`grid ${cols} gap-1.5`}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`h-10 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all cursor-pointer ${
            value === o.key
              ? "bg-accent text-bg"
              : "bg-surface border border-border text-text-secondary hover:border-text-tertiary"
          }`}
        >
          {o.label}
        </button>
      ))}
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

  useEffect(() => {
    setLoadingGames(true);
    setSelectedTeam("");
    setResult(null);
    fetch(`/api/games?sport=${sport}`)
      .then((r) => r.json())
      .then((data) => { setGames(data.games || []); setLoadingGames(false); })
      .catch(() => { setGames([]); setLoadingGames(false); });
  }, [sport]);

  function formatGameTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const tom = new Date(now);
    tom.setDate(tom.getDate() + 1);
    const isToday = d.toDateString() === now.toDateString();
    const isTom = d.toDateString() === tom.toDateString();
    const day = isToday ? "Today" : isTom ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    return `${day} ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
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
          odds,
          sport,
          line: line ? parseFloat(line) : undefined,
          side: (isProp || betType === "total") ? side : undefined,
          book,
          player: isProp ? playerName : undefined,
          isProp,
        }),
      });
      const data = await res.json();
      if (res.ok && !data.error) setResult(data);
      else setError(data.error || "Something went wrong");
    } catch {
      setError("Failed to connect to grading engine");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen">
      {/* ── NAV ── */}
      <nav className="w-full max-w-[640px] mx-auto flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="SportsLogic" width={56} height={28} className="h-7 w-auto" />
          <span className="text-base font-bold text-text-primary tracking-tight">SportsLogic</span>
        </Link>
        <Link href="/" className="text-[11px] text-text-tertiary hover:text-text-secondary transition-colors uppercase tracking-wide">
          HOME
        </Link>
      </nav>

      <div className="w-full max-w-[520px] mx-auto px-5 pb-16">
        {/* ── HEADER ── */}
        <div className="text-center pt-8 pb-10">
          <h1 className="text-[28px] sm:text-[36px] font-bold uppercase tracking-[-0.5px] leading-tight">
            GRADE YOUR <span className="text-accent">BET</span>
          </h1>
          <p className="text-sm text-text-secondary mt-2">Know your edge before you place it.</p>
        </div>

        {/* ── FORM ── */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Sport + Game group */}
          <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
            <div>
              <label className="text-[11px] text-text-tertiary uppercase tracking-wide block mb-2">SPORT</label>
              <ToggleGroup options={SPORTS} value={sport} onChange={setSport} cols="grid-cols-3 sm:grid-cols-6" />
            </div>
            <div>
              <label className="text-[11px] text-text-tertiary uppercase tracking-wide block mb-2">GAME</label>
              <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className={selectCls}>
                <option value="">{loadingGames ? "Loading..." : games.length ? "Select a team" : "No games available"}</option>
                {teamOptions.map((t, i) => <option key={`${t.team}-${i}`} value={t.team}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Bet details group */}
          <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
            <div>
              <label className="text-[11px] text-text-tertiary uppercase tracking-wide block mb-2">BET TYPE</label>
              <ToggleGroup options={BET_TYPES} value={betType} onChange={setBetType} cols="grid-cols-4" />
            </div>

            {/* Prop fields */}
            {isProp && (
              <>
                <div>
                  <label className="text-[11px] text-text-tertiary uppercase tracking-wide block mb-2">PLAYER</label>
                  <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="e.g. Embiid" className={inputCls} />
                </div>
                <div>
                  <label className="text-[11px] text-text-tertiary uppercase tracking-wide block mb-2">PROP TYPE</label>
                  <ToggleGroup options={PROP_TYPES} value={propType} onChange={setPropType} cols="grid-cols-5" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-text-tertiary uppercase tracking-wide block mb-2">LINE</label>
                    <input type="text" value={line} onChange={(e) => setLine(e.target.value)} placeholder="28.5" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[11px] text-text-tertiary uppercase tracking-wide block mb-2">SIDE</label>
                    <ToggleGroup options={[{ key: "over", label: "OVER" }, { key: "under", label: "UNDER" }]} value={side} onChange={setSide} cols="grid-cols-2" />
                  </div>
                </div>
              </>
            )}

            {/* Spread/total fields */}
            {!isProp && (betType === "spread" || betType === "total") && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-text-tertiary uppercase tracking-wide block mb-2">
                    {betType === "spread" ? "SPREAD" : "LINE"}
                  </label>
                  <input type="text" value={line} onChange={(e) => setLine(e.target.value)} placeholder={betType === "spread" ? "-3.5" : "218.5"} className={inputCls} />
                </div>
                {betType === "total" && (
                  <div>
                    <label className="text-[11px] text-text-tertiary uppercase tracking-wide block mb-2">SIDE</label>
                    <ToggleGroup options={[{ key: "over", label: "OVER" }, { key: "under", label: "UNDER" }]} value={side} onChange={setSide} cols="grid-cols-2" />
                  </div>
                )}
              </div>
            )}

            {/* Odds + Book */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-text-tertiary uppercase tracking-wide block mb-2">YOUR ODDS</label>
                <input type="text" value={odds} onChange={(e) => setOdds(e.target.value)} placeholder="-110" className={inputCls} />
              </div>
              <div>
                <label className="text-[11px] text-text-tertiary uppercase tracking-wide block mb-2">BOOK</label>
                <select value={book} onChange={(e) => setBook(e.target.value)} className={selectCls}>
                  {BOOKS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || (isProp ? !playerName || !odds : !selectedTeam || !odds)}
            className="w-full h-14 rounded-xl bg-accent text-bg text-sm font-bold uppercase tracking-[0.5px] hover:brightness-110 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? "GRADING..." : "GRADE THIS BET"}
          </button>
        </form>

        {/* ── ERROR ── */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red/10 border border-red/30 text-center">
            <p className="text-sm text-red">{error}</p>
          </div>
        )}

        {/* ── RESULT ── */}
        {result && (
          <div className="mt-10">
            {/* Grade card with glow */}
            <div
              className="bg-surface border border-border rounded-xl overflow-hidden mb-6"
              style={{ boxShadow: "0 0 80px rgba(0, 232, 123, 0.08)" }}
            >
              {/* Grade header with gradient */}
              <div
                className="px-5 pt-6 pb-4 text-center"
                style={{ background: "linear-gradient(180deg, rgba(0, 232, 123, 0.05) 0%, transparent 100%)" }}
              >
                <p className="text-[11px] text-text-tertiary uppercase tracking-[2px] mb-3">YOUR GRADE</p>
                <p className={`text-[72px] font-bold leading-none ${gradeColor(result.grade)}`}>
                  {result.grade}
                </p>
                <p className="text-sm text-text-secondary mt-2">{result.score.toFixed(1)} / 100</p>
              </div>

              <div className="px-5 pb-5">
                <div className="h-px bg-border mb-5" />

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="text-center">
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wide mb-1">EXPECTED VALUE</p>
                    <p className={`text-lg font-bold ${result.ev >= 0 ? "text-accent" : "text-red"}`}>
                      {result.ev >= 0 ? "+" : ""}{result.ev.toFixed(2)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wide mb-1">TRUE PROB</p>
                    <p className="text-lg font-bold text-text-primary">{(result.true_prob * 100).toFixed(1)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wide mb-1">FAIR ODDS</p>
                    <p className="text-lg font-bold text-text-primary">
                      {result.fair_odds >= 0 ? "+" : ""}{result.fair_odds}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wide mb-1">BEST LINE</p>
                    <p className="text-lg font-bold text-accent">
                      {result.best_odds >= 0 ? "+" : ""}{result.best_odds}
                    </p>
                    <p className="text-[10px] text-accent mt-0.5 uppercase">{result.best_book}</p>
                  </div>
                </div>

                <div className="h-px bg-border mb-5" />

                {/* Kelly */}
                <div className="mb-5">
                  <p className="text-[10px] text-text-tertiary uppercase tracking-wide mb-1">KELLY CRITERION</p>
                  {result.kelly > 0 ? (
                    <p className="text-sm text-text-secondary">
                      Suggested stake: <span className="text-accent font-bold">{(result.kelly * 100).toFixed(2)}%</span> of bankroll
                    </p>
                  ) : (
                    <p className="text-sm text-red">No edge — Kelly says pass.</p>
                  )}
                </div>

                <div className="h-px bg-border mb-5" />

                {/* Breakdown */}
                {result.breakdown && (
                  <div>
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wide mb-3">BREAKDOWN</p>
                    <div className="space-y-2.5">
                      <ScoreBar label="EV (50%)" value={result.breakdown.ev_score} />
                      <ScoreBar label="Line (20%)" value={result.breakdown.line_value_score} />
                      <ScoreBar label="Market (15%)" value={result.breakdown.market_sharpness_score} />
                      <ScoreBar label="Situation (15%)" value={result.breakdown.situational_score} />
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 pb-4">
                <p className="text-[10px] text-text-tertiary text-center uppercase tracking-wide">
                  POWERED BY SPORTSLOGIC
                </p>
              </div>
            </div>

            {/* Remaining */}
            {result.remaining !== undefined && (
              <p className="text-[11px] text-text-tertiary text-center">
                {result.remaining > 0
                  ? `${result.remaining} free grade${result.remaining === 1 ? "" : "s"} remaining today`
                  : "Upgrade to Pro for unlimited grades"}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer className="w-full max-w-[640px] mx-auto px-6 pt-8 pb-10 border-t border-border">
        <p className="text-[11px] text-text-tertiary text-center leading-relaxed">
          SportsLogic is not a sportsbook. Analysis tools for informational purposes only. 21+.
        </p>
      </footer>
    </div>
  );
}
