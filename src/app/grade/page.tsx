"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { bookName } from "@/lib/book-names";
import { sportName } from "@/lib/sport-names";
import { PROP_LABELS } from "@/lib/prop-labels";
import { ShareButton } from "@/components/share-button";
import { SiteFooter } from "@/components/site-footer";
import { gradingErrorCopy } from "@/lib/grading-error-copy";

type ParsedChild = {
  player: string | null;
  team: string;
  market: string;
  line: number | null;
  side: string | null;
  odds: null;
};

type ParsedUnit =
  | {
      type: "single";
      team: string;
      opponent?: string | null;
      bet_type: string;
      line?: number | null;
      odds: number;
      side?: string | null;
      player?: string | null;
      prop_type?: string | null;
      market?: string | null;
      sport: string;
    }
  | {
      type: "group";
      groupLabel: string;
      unitOdds: number;
      sport: string;
      children: ParsedChild[];
    };

type SingleUnit = Extract<ParsedUnit, { type: "single" }>;

type SlipMeta = {
  stake: number | null;
  toPay: number | null;
  baseOdds: number | null;
  paidOdds: number | null;
  boostLabel: string | null;
};

type GradedLeg = {
  team: string;
  betType: string;
  grade: string;
  score: number;
  ev: number;
  best_odds: number;
  best_book: string;
  true_prob: number;
  fair_odds: number;
};

type ParlayResult = {
  overallGrade: string;
  overallScore: number;
  overallEv: number;
  combinedTrueProb: number;
  combinedImpliedProb: number;
  vigCost: number;
  legCount: number;
  legs: GradedLeg[];
  weakestLeg: string | null;
  correlationWarnings: string[];
  swapSuggestion: string | null;
  shareSlug?: string;
  bestParlayDecimal: number;
  userParlayDecimal: number;
  bestParlayOdds: number;
  userBookPrice: number;
  foundMoneyPercent: number;
  bestBook: string;
};

type Step = "upload" | "parsing" | "confirm" | "grading" | "result";

const SUPPORTED_SPORTS = new Set(["nba", "nfl", "mlb", "nhl", "ncaab", "ncaaf"]);

function propLabel(parsed: SingleUnit): string {
  return PROP_LABELS[parsed.prop_type ?? ""] ?? parsed.market ?? parsed.prop_type ?? "Prop";
}

// Market descriptor without the odds suffix — used anywhere odds are shown separately (e.g. share card).
function legMarketDesc(parsed: SingleUnit): string {
  if (parsed.bet_type === "moneyline") return "ML";
  if (parsed.bet_type === "spread" && parsed.line != null) {
    return `${parsed.line >= 0 ? "+" : ""}${parsed.line}`;
  }
  if (parsed.bet_type === "total" && parsed.line != null) {
    return `${parsed.side === "under" ? "U" : "O"}${parsed.line}`;
  }
  if (parsed.bet_type === "prop") {
    const label = propLabel(parsed);
    const sideStr = parsed.line != null ? ` (${parsed.side === "under" ? "U" : "O"}${parsed.line})` : "";
    return `${label}${sideStr}`;
  }
  return "";
}

function legDesc(parsed: SingleUnit): string {
  const o = parsed.odds >= 0 ? `+${parsed.odds}` : `${parsed.odds}`;
  const market = legMarketDesc(parsed);
  return market ? `${market} · ${o}` : o;
}

// Compact market descriptor for tight spaces (share card) — drops the prop
// side/line suffix since "To Hit a HR" already implies o0.5; that room is
// needed for longer player names.
function legMarketDescCompact(parsed: SingleUnit): string {
  if (parsed.bet_type === "prop") return propLabel(parsed);
  return legMarketDesc(parsed);
}

function gradeColor(grade: string): string {
  const f = grade[0];
  if (f === "A" || f === "B") return "text-accent";
  if (f === "C") return "text-amber";
  return "text-red";
}

function gradeBg(grade: string): string {
  const f = grade[0];
  if (f === "A" || f === "B") return "border-accent/50 bg-accent/5";
  if (f === "C") return "border-amber/50 bg-amber/5";
  return "border-[#7F1D1D]/60 bg-red/5";
}

function dotColor(grade: string): string {
  const f = grade[0];
  if (f === "A" || f === "B") return "bg-accent dot-glow-green";
  if (f === "C") return "bg-amber dot-glow-amber";
  return "bg-red dot-glow-red";
}

function gradeGlow(grade: string): string {
  const f = grade[0];
  if (f === "A" || f === "B") return "0 0 60px rgba(16,185,129,0.05), inset 0 0 40px rgba(16,185,129,0.03)";
  if (f === "C") return "0 0 60px rgba(245,158,11,0.05), inset 0 0 40px rgba(245,158,11,0.03)";
  return "0 0 60px rgba(239,68,68,0.05), inset 0 0 40px rgba(239,68,68,0.03)";
}

function gradeRadial(grade: string): string {
  const f = grade[0];
  if (f === "A" || f === "B") return "radial-gradient(circle at center, rgba(16,185,129,0.07) 0%, transparent 70%)";
  if (f === "C") return "radial-gradient(circle at center, rgba(234,179,8,0.06) 0%, transparent 70%)";
  return "radial-gradient(circle at center, rgba(239,68,68,0.07) 0%, transparent 70%)";
}

function gradeGradient(grade: string): string {
  const f = grade[0];
  if (f === "A" || f === "B") return "linear-gradient(180deg, rgba(16,185,129,0.03) 0%, transparent 100%)";
  if (f === "C") return "linear-gradient(180deg, rgba(245,158,11,0.03) 0%, transparent 100%)";
  return "linear-gradient(180deg, rgba(239,68,68,0.03) 0%, transparent 100%)";
}

function gradeContext(grade: string): string {
  const f = grade[0];
  if (f === "A") return "Strong price. You're getting paid more than the math says you should.";
  if (f === "B") return "Fair price. Within a couple percent of true.";
  if (f === "C") return "Standard vig. You're paying the books' usual cut.";
  if (f === "D") return "Overpriced. The books are taking more than the math justifies.";
  return "Heavy overpay. The books love this one.";
}

const EMPTY_SLIP_META: SlipMeta = { stake: null, toPay: null, baseOdds: null, paidOdds: null, boostLabel: null };

function FoundMoneyCallout({ result, stake }: { result: ParlayResult; stake: number | null }) {
  const [stakeInput, setStakeInput] = useState(stake == null ? "50" : "");

  const effectiveStake = stake ?? (stakeInput !== "" ? parseFloat(stakeInput) : null);
  const foundMoney =
    effectiveStake != null && !isNaN(effectiveStake) && effectiveStake > 0
      ? effectiveStake * (result.bestParlayDecimal - result.userParlayDecimal)
      : null;

  const fmtOdds = (o: number) => (o >= 0 ? `+${o}` : `${o}`);
  const bestBookLabel = bookName(result.bestBook);

  // Stake parsed from slip — dollar hero or best-price pill (no input)
  if (stake !== null) {
    if (foundMoney !== null && foundMoney > 0) {
      return (
        <div className="rounded-2xl border border-[#00B362]/30 bg-[#00B362]/5 p-5 mb-6">
          <p className="text-[10px] font-bold mb-3" style={{ color: "#00B362" }}>
            Found money
          </p>
          <p className="font-heading text-[56px] font-bold leading-none" style={{ color: "#00B362" }}>
            ${foundMoney < 1 ? foundMoney.toFixed(2) : Math.round(foundMoney)}
          </p>
          <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
            Your book prices this parlay at {fmtOdds(result.userBookPrice)}.{" "}
            {bestBookLabel ? `${bestBookLabel} has it` : "Best available"} at {fmtOdds(result.bestParlayOdds)}.{" "}
            You could win ${foundMoney < 1 ? foundMoney.toFixed(2) : Math.round(foundMoney)} more on a ${Math.round(stake)} bet.
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-[#10B981]/20 bg-[#10B981]/5 px-5 py-4 mb-6">
        <p className="text-sm font-bold" style={{ color: "#10B981" }}>
          Best price available. Nothing left on the table.
        </p>
      </div>
    );
  }

  // Stake not parsed — show result (pre-filled $50) + editable input
  const pctGap = result.foundMoneyPercent;
  return (
    <div className="rounded-2xl border border-zinc-700/50 bg-zinc-900/40 p-5 mb-6">
      {foundMoney !== null && foundMoney > 0 ? (
        <>
          <p className="text-[10px] font-bold mb-3" style={{ color: "#00B362" }}>Found money</p>
          <p className="font-heading text-[56px] font-bold leading-none" style={{ color: "#00B362" }}>
            ${foundMoney < 1 ? foundMoney.toFixed(2) : Math.round(foundMoney)}
          </p>
          <p className="text-xs text-zinc-400 mt-2 mb-5 leading-relaxed">
            Your book has it at {fmtOdds(result.userBookPrice)}.{" "}
            {bestBookLabel ? `${bestBookLabel} offers` : "Best available"} {fmtOdds(result.bestParlayOdds)}.
          </p>
        </>
      ) : (
        <>
          <p className="text-[10px] font-bold text-zinc-400 mb-2">Found money</p>
          {pctGap > 0 ? (
            <p className="text-sm text-zinc-300 mb-5 leading-relaxed">
              You&apos;re paying {fmtOdds(result.userBookPrice)} —{" "}
              {bestBookLabel || "the market"} has it at {fmtOdds(result.bestParlayOdds)} ({pctGap.toFixed(1)}% better payout).
            </p>
          ) : (
            <p className="text-sm text-zinc-300 mb-5">You have the best available price.</p>
          )}
        </>
      )}
      <p className="text-xs text-zinc-400 mb-2">Set your stake to see the dollar amount</p>
      <div className="flex items-center gap-2">
        <span className="text-zinc-400 text-sm font-semibold">$</span>
        <input
          type="number"
          min="1"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          value={stakeInput}
          onChange={(e) => setStakeInput(e.target.value)}
          className="w-28 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/60 transition-colors"
        />
      </div>
    </div>
  );
}

export default function GradePage() {
  const [step, setStep] = useState<Step>("upload");
  const [parsedUnits, setParsedUnits] = useState<ParsedUnit[]>([]);
  const [slipMeta, setSlipMeta] = useState<SlipMeta>(EMPTY_SLIP_META);
  const [result, setResult] = useState<ParlayResult | null>(null);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [gradingBook, setGradingBook] = useState("DraftKings");
  const fileRef = useRef<HTMLInputElement>(null);

  const BOOKS = ["DraftKings", "FanDuel", "BetMGM", "Caesars", "ESPN Bet", "Bet365", "Pinnacle", "Hard Rock", "WynnBET", "Fanatics"];

  useEffect(() => {
    if (step !== "grading") return;
    let i = 0;
    setGradingBook(BOOKS[0]);
    const id = setInterval(() => {
      i = (i + 1) % BOOKS.length;
      setGradingBook(BOOKS[i]);
    }, 500);
    return () => clearInterval(id);
  }, [step]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    setError("");
    setStep("parsing");

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);

      try {
        const res = await fetch("/api/parse-slip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl }),
        });

        const data = await res.json();
        if (res.ok && data.units?.length > 0) {
          setParsedUnits(data.units);
          setSlipMeta({
            stake: data.stake ?? null,
            toPay: data.toPay ?? null,
            baseOdds: data.baseOdds ?? null,
            paidOdds: data.paidOdds ?? null,
            boostLabel: data.boostLabel ?? null,
          });
          setStep("confirm");
        } else if (res.status >= 500) {
          setError("Our service is temporarily down. Check back soon.");
          setStep("upload");
        } else {
          setError(data.error || "Could not read your slip. Try a clearer screenshot.");
          setStep("upload");
        }
      } catch {
        setError("Could not reach our servers. Check your connection and try again.");
        setStep("upload");
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleGrade = async () => {
    setError("");

    const singleUnits = parsedUnits.filter((u): u is SingleUnit => u.type === "single");

    // Sport check fires first
    for (const unit of singleUnits) {
      if (!SUPPORTED_SPORTS.has(unit.sport?.toLowerCase())) {
        const sportName = unit.sport ?? "this sport";
        setError(
          `We can't grade ${sportName} yet — SportsLogic currently covers NBA, NFL, MLB, NHL, college football, and college basketball.`
        );
        return;
      }
    }

    // Group unit (SGP) check
    const hasGroup = parsedUnits.some((u) => u.type === "group");
    if (hasGroup) {
      setError(
        "This slip includes a Same Game Parlay priced as one unit — we can't grade SGP pricing yet. We can grade the individual legs if you screenshot them separately."
      );
      return;
    }

    // Basic field validation
    for (let i = 0; i < singleUnits.length; i++) {
      const unit = singleUnits[i];
      if (!unit.odds || !unit.sport || (!unit.team && !unit.player)) {
        setError(`We couldn't read leg ${i + 1} clearly — try re-uploading with a sharper screenshot.`);
        return;
      }
    }

    // Prop-type gate — a prop leg with no prop_type sends a garbage market
    // key to the Odds API (422), which previously surfaced as a misleading
    // "game not active" error. Block it here instead.
    for (let i = 0; i < singleUnits.length; i++) {
      const unit = singleUnits[i];
      if (unit.bet_type === "prop" && !unit.prop_type) {
        const name = unit.player ?? unit.team ?? `leg ${i + 1}`;
        setError(
          `We couldn't read the bet type for leg ${i + 1} (${name}). Try a clearer screenshot, or upload one leg at a time.`
        );
        return;
      }
    }

    setStep("grading");

    try {
      const parlayLegs = singleUnits.map((unit) => ({
        team: unit.team,
        betType: unit.bet_type === "prop" ? (unit.prop_type ?? unit.bet_type) : unit.bet_type,
        odds: unit.odds,
        sport: unit.sport,
        line: unit.line ?? undefined,
        side: unit.side ?? undefined,
        player: unit.player ?? undefined,
        isProp: unit.bet_type === "prop",
      }));

      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parlayLegs }),
      });

      const data = await res.json();
      if (res.ok && data.overallGrade) {
        setResult(data);
        setStep("result");
      } else if (res.status >= 500) {
        setError("Our grading service is temporarily down. Check back soon.");
        setStep("confirm");
      } else {
        setError(gradingErrorCopy(data.failureMode, data.legName));
        setStep("confirm");
      }
    } catch {
      setError("Could not reach our servers. Check your connection and try again.");
      setStep("confirm");
    }
  };

  const reset = () => {
    setStep("upload");
    setParsedUnits([]);
    setSlipMeta(EMPTY_SLIP_META);
    setResult(null);
    setError("");
    setImagePreview(null);
  };

  const singleUnits = parsedUnits.filter((u): u is SingleUnit => u.type === "single");

  return (
    <div className="w-full min-h-screen">
      {/* Nav */}
      <nav className="w-full max-w-[720px] mx-auto flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="SportsLogic" width={56} height={28} className="h-7 w-auto" />
          <span className="font-heading text-base font-bold text-text-primary tracking-tight">SportsLogic</span>
        </Link>
        <Link href="/" className="text-[11px] text-text-tertiary hover:text-text-secondary transition-colors uppercase tracking-wide">
          HOME
        </Link>
      </nav>

      <div className="w-full max-w-[720px] mx-auto px-5 pb-16">
        {/* Header */}
        <div className="text-center pt-8 pb-8">
          <h1 className="font-display text-[28px] sm:text-[36px] font-bold tracking-[-0.5px] leading-tight">
            Drop your <span className="text-accent">parlay</span>
          </h1>
          <p className="text-sm text-text-secondary mt-2">Find the money your sportsbook is hiding. We grade every leg.</p>
        </div>

        {/* ── UPLOAD STEP ── */}
        {step === "upload" && (
          <div>
            <p className="text-[12px] text-text-secondary text-center mb-4 tracking-wide">
              Currently supports NBA · NFL · MLB · NHL · NCAAF · NCAAB
            </p>
            <div
              className="bg-surface border-2 border-dashed border-border rounded-2xl p-10 sm:p-14 text-center cursor-pointer hover:border-accent/40 transition-all"
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="font-heading text-base font-bold text-text-primary mb-2">
                Tap to upload
              </p>
              <p className="text-sm text-text-secondary">
                or drag and drop your bet slip screenshot
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
            <p className="text-xs text-zinc-400 text-center mt-4 leading-relaxed max-w-[340px] mx-auto">
              Screenshot your full slip — including the wager amount at the bottom — for exact Found Money in dollars. Just legs? You&apos;ll still get a grade and the percent gap.
            </p>
            <p className="text-[11px] text-text-tertiary text-center mt-4 tracking-wide">
              Works with DraftKings &bull; FanDuel &bull; BetMGM &bull; ESPN Bet &bull; Caesars
            </p>
            <p className="text-[11px] text-text-tertiary text-center mt-1 tracking-wide">
              Supports NBA &bull; NFL &bull; MLB &bull; NHL &bull; NCAAB &bull; NCAAF &bull; Pre-game only
            </p>
          </div>
        )}

        {/* ── PARSING STEP ── */}
        {step === "parsing" && (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-3 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-5" />
            <p className="font-heading text-sm font-bold text-text-primary">Reading your slip...</p>
            <p className="text-xs text-text-secondary mt-2">AI is extracting every leg from your screenshot</p>
          </div>
        )}

        {/* ── CONFIRM STEP ── */}
        {step === "confirm" && (
          <div>
            {imagePreview && (
              <div className="mb-4 flex justify-center">
                <img
                  src={imagePreview}
                  alt="Your bet slip"
                  className="max-h-36 rounded-xl border border-border/50 object-contain"
                />
              </div>
            )}
            <div className="bg-surface border border-border rounded-2xl p-5 mb-5">
              <p className="font-heading text-[11px] font-bold text-text-tertiary mb-4">
                We found {parsedUnits.length} leg{parsedUnits.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-3">
                {parsedUnits.map((unit, i) => {
                  if (unit.type === "single") {
                    return (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                        <span className="text-[10px] font-mono text-text-tertiary w-5 shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary font-medium truncate">
                            {unit.player ?? unit.team}
                          </p>
                          <p className="text-[11px] text-text-secondary">
                            {unit.bet_type === "spread" && unit.line != null ? `${unit.line >= 0 ? "+" : ""}${unit.line} ` : ""}
                            {unit.bet_type === "total" && unit.line != null ? `${unit.side === "under" ? "Under" : "Over"} ${unit.line} ` : ""}
                            {unit.bet_type === "prop" ? `${propLabel(unit)}${unit.line != null ? ` (${unit.side === "under" ? "U" : "O"}${unit.line})` : ""} ` : ""}
                            {unit.bet_type === "moneyline" ? "ML " : ""}
                            ({unit.odds >= 0 ? "+" : ""}{unit.odds})
                            <span className="text-text-tertiary"> &bull; {sportName(unit.sport)}</span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  // Group unit
                  return (
                    <div key={i} className="py-2 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-mono text-text-tertiary w-5 shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary font-medium">
                            {unit.groupLabel}
                            <span className="text-text-secondary font-normal ml-2">
                              ({unit.unitOdds >= 0 ? "+" : ""}{unit.unitOdds})
                            </span>
                          </p>
                          <p className="text-[10px] text-text-tertiary uppercase tracking-wide">Same Game Parlay &bull; {sportName(unit.sport)}</p>
                        </div>
                      </div>
                      <div className="pl-8 space-y-1">
                        {unit.children.map((child, j) => (
                          <p key={j} className="text-[11px] text-text-secondary truncate">
                            &bull; {child.player ?? child.team} — {child.market}
                            {child.line != null ? ` (${child.side === "under" ? "U" : "O"}${child.line})` : ""}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-text-secondary text-center mb-5">Look right? Hit grade to see your score.</p>

            <button
              onClick={handleGrade}
              className="w-full h-14 rounded-xl bg-accent text-bg text-sm font-bold uppercase tracking-[0.5px] hover:brightness-110 transition-all cursor-pointer"
            >
              GRADE THIS PARLAY
            </button>

            <button
              onClick={reset}
              className="w-full h-10 text-xs text-text-tertiary hover:text-text-secondary transition-colors mt-3 cursor-pointer uppercase tracking-wide"
            >
              START OVER
            </button>
          </div>
        )}

        {/* ── GRADING STEP ── */}
        {step === "grading" && (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-3 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-5" />
            <p className="font-heading text-sm font-bold text-text-primary">Grading your parlay...</p>
            <p className="text-xs text-text-secondary mt-3">
              Checking <span className="text-text-primary font-medium transition-all">{gradingBook}</span>
            </p>
            <p className="text-[10px] text-text-tertiary mt-1">{singleUnits.length} legs · 30+ books</p>
          </div>
        )}

        {/* ── RESULT STEP ── */}
        {step === "result" && result && (
          <div>
            <FoundMoneyCallout result={result} stake={slipMeta.stake} />
            {/* Overall grade card */}
            <div
              className={`rounded-2xl border overflow-hidden mb-6 ${gradeBg(result.overallGrade)}`}
              style={{ boxShadow: gradeGlow(result.overallGrade) }}
            >
              <div className="px-5 pt-6 pb-4 text-center"
                style={{ background: gradeGradient(result.overallGrade) }}>
                <p className="text-[11px] text-zinc-400 mb-2">
                  {result.legCount}-leg parlay
                </p>
                <div className="relative inline-block">
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ width: 200, height: 160, background: gradeRadial(result.overallGrade), filter: "blur(16px)" }}
                  />
                  <p className="relative text-[10px] text-zinc-500 mb-1">Grade</p>
                  <p className={`relative font-display text-[72px] font-bold leading-none tracking-[-2px] ${gradeColor(result.overallGrade)}`}>
                    {result.overallGrade}
                  </p>
                </div>
                <p className="text-sm text-text-secondary mt-2">{gradeContext(result.overallGrade)}</p>
                <p className="text-[11px] text-text-tertiary mt-1">EdgeScore: {result.overallScore} / 100</p>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 border-t border-border/30">
                <div className="px-3 py-3 text-center border-r border-border/30">
                  <p className="text-[10px] text-zinc-400">EV</p>
                  <p className={`text-sm font-bold ${result.overallEv >= 0 ? "text-accent" : "text-red"}`}>
                    {result.overallEv >= 0 ? "+" : ""}{result.overallEv.toFixed(1)}%
                  </p>
                </div>
                <div className="px-3 py-3 text-center border-r border-border/30">
                  <p className="text-[10px] text-zinc-400">To hit</p>
                  <p className="text-sm font-bold text-white">{(result.combinedTrueProb * 100).toFixed(1)}%</p>
                </div>
                <div className="px-3 py-3 text-center">
                  <p className="text-[10px] text-zinc-400">Tax</p>
                  <p className="text-sm font-bold text-red">
                    {((result.combinedImpliedProb - result.combinedTrueProb) * 100).toFixed(1)}pp
                  </p>
                </div>
              </div>
              {/* Tax explanation */}
              <div className="px-5 pb-3 pt-2 text-center border-t border-border/20">
                <p className="text-[11px] text-text-tertiary leading-relaxed">
                  Paying like it&apos;s {(result.combinedImpliedProb * 100).toFixed(1)}% — we price it at {(result.combinedTrueProb * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Individual legs */}
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl overflow-hidden mb-6">
              <div className="px-5 pt-4 pb-2">
                <p className="font-heading text-[11px] font-bold text-zinc-400">Leg-by-leg breakdown</p>
              </div>
              <div className="divide-y divide-border/30">
                {result.legs.map((leg, i) => {
                  const parsed = singleUnits[i];
                  const primaryName = parsed?.player ?? parsed?.team ?? leg.team;
                  const desc = parsed ? legDesc(parsed) : leg.betType;
                  return (
                    <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor(leg.grade)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-100 font-medium truncate">{primaryName}</p>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {desc}{parsed?.odds != null && leg.best_odds > parsed.odds ? ` • Best: ${bookName(leg.best_book)}` : ""}
                        </p>
                      </div>
                      <span className={`font-heading text-base font-bold shrink-0 ${gradeColor(leg.grade)}`}>{leg.grade}</span>
                      <span className={`text-xs font-mono shrink-0 ${leg.ev >= 0 ? "text-accent" : "text-text-tertiary"}`}>
                        {leg.ev >= 0 ? "+" : ""}{leg.ev.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Warnings */}
            {result.correlationWarnings.length > 0 && (
              <div className="bg-amber/5 border border-amber/20 rounded-xl p-4 mb-4">
                <p className="text-[11px] font-bold text-amber mb-2">Correlation warning</p>
                {result.correlationWarnings.map((w, i) => (
                  <p key={i} className="text-xs text-text-secondary">{w}</p>
                ))}
              </div>
            )}

            {/* Swap suggestion */}
            {result.swapSuggestion && (
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-4">
                <p className="text-[11px] font-bold text-accent mb-2">AI suggestion</p>
                <p className="text-xs text-text-secondary leading-relaxed">{result.swapSuggestion}</p>
              </div>
            )}

            {/* Weakest leg callout */}
            {result.legs.length > 0 && (() => {
              let worstIndex = 0;
              for (let i = 1; i < result.legs.length; i++) {
                if (result.legs[i].score < result.legs[worstIndex].score) worstIndex = i;
              }
              const worst = result.legs[worstIndex];
              const parsed = singleUnits[worstIndex];
              const name = parsed?.player ?? parsed?.team ?? worst.team;
              const fairFmt = worst.fair_odds >= 0 ? `+${worst.fair_odds}` : `${worst.fair_odds}`;
              const worstUserOdds = singleUnits[worstIndex]?.odds;
              const payingFmt = worstUserOdds != null
                ? (worstUserOdds >= 0 ? `+${worstUserOdds}` : `${worstUserOdds}`)
                : (worst.best_odds >= 0 ? `+${worst.best_odds}` : `${worst.best_odds}`);
              return (
                <div className="bg-red/5 border border-red-500/30 rounded-xl p-4 mb-4">
                  <p className="text-[11px] font-bold text-red mb-1">Hurting you most</p>
                  <p className="text-xs text-text-secondary">
                    <span className="text-zinc-100 font-medium">{name}</span> — fair price{" "}
                    <span className="text-zinc-100 font-medium">{fairFmt}</span>, you&apos;re paying{" "}
                    <span className="text-zinc-100 font-medium">{payingFmt}</span>
                  </p>
                </div>
              );
            })()}

            {/* Copy link */}
            {result.shareSlug && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://sportslogic.ai/grade/${result.shareSlug}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="w-full h-11 rounded-xl bg-surface border border-border text-text-secondary text-[11px] font-bold uppercase tracking-[0.5px] hover:border-text-tertiary hover:text-text-primary transition-all cursor-pointer mt-4"
              >
                {copied ? "COPIED" : "COPY SHARE LINK"}
              </button>
            )}

            {/* Share card + download */}
            <ShareButton data={{
              overallGrade: result.overallGrade,
              ev: result.overallEv,
              legCount: result.legCount,
              impliedProb: result.combinedImpliedProb,
              trueProb: result.combinedTrueProb,
              swapSuggestion: result.swapSuggestion,
              legs: result.legs.map((leg, i) => {
                const parsed = singleUnits[i];
                const name = parsed?.player ?? parsed?.team ?? leg.team;
                const desc = parsed ? legMarketDescCompact(parsed) : leg.betType;
                return {
                  label: desc ? `${name} · ${desc}` : name,
                  grade: leg.grade,
                  ev: leg.ev,
                };
              }),
              stake: slipMeta.stake,
              payout: slipMeta.toPay,
            }} />

            {/* Actions */}
            <div className="space-y-3 mt-6">
              <button
                onClick={reset}
                className="w-full h-12 rounded-xl bg-surface border border-border text-text-secondary text-sm font-bold uppercase tracking-[0.5px] hover:border-text-tertiary hover:text-text-primary transition-all cursor-pointer"
              >
                GRADE ANOTHER
              </button>
            </div>

            <p className="text-[10px] text-text-tertiary text-center mt-6">Powered by SportsLogic</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-5 p-4 rounded-xl bg-red/10 border border-red/30 text-center">
            <p className="text-sm text-red">{error}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <SiteFooter narrow />
    </div>
  );
}
