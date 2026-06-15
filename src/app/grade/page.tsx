"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { bookName } from "@/lib/book-names";
import { ShareButton } from "@/components/share-button";

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
};

type Step = "upload" | "parsing" | "confirm" | "grading" | "result";

const SUPPORTED_SPORTS = new Set(["nba", "nfl", "mlb", "nhl", "ncaab", "ncaaf"]);

const PROP_LABELS: Record<string, string> = {
  points: "Points", rebounds: "Rebounds", assists: "Assists",
  threes: "3-Pointers", pra: "Pts+Reb+Ast",
  hr: "To Hit a HR", hits: "To Get a Hit", strikeouts: "Strikeouts", rbis: "RBIs",
  goals: "Goals", shots: "Shots on Goal",
};

function propLabel(parsed: SingleUnit): string {
  return PROP_LABELS[parsed.prop_type ?? ""] ?? parsed.market ?? parsed.prop_type ?? "Prop";
}

function legDesc(parsed: SingleUnit): string {
  const o = parsed.odds >= 0 ? `+${parsed.odds}` : `${parsed.odds}`;
  if (parsed.bet_type === "moneyline") return `ML · ${o}`;
  if (parsed.bet_type === "spread" && parsed.line != null) {
    return `${parsed.line >= 0 ? "+" : ""}${parsed.line} · ${o}`;
  }
  if (parsed.bet_type === "total" && parsed.line != null) {
    return `${parsed.side === "under" ? "U" : "O"}${parsed.line} · ${o}`;
  }
  if (parsed.bet_type === "prop") {
    const label = propLabel(parsed);
    const sideStr = parsed.line != null ? ` (${parsed.side === "under" ? "u" : "o"}${parsed.line})` : "";
    return `${label}${sideStr} · ${o}`;
  }
  return o;
}

function gradeColor(grade: string): string {
  const f = grade[0];
  if (f === "A" || f === "B") return "text-accent";
  if (f === "C") return "text-amber";
  return "text-red";
}

function gradeBg(grade: string): string {
  const f = grade[0];
  if (f === "A" || f === "B") return "border-accent/30 bg-accent/5";
  if (f === "C") return "border-amber/30 bg-amber/5";
  return "border-red/30 bg-red/5";
}

function dotColor(grade: string): string {
  const f = grade[0];
  if (f === "A" || f === "B") return "bg-accent dot-glow-green";
  if (f === "C") return "bg-amber dot-glow-amber";
  return "bg-red dot-glow-red";
}

function gradeGlow(grade: string): string {
  const f = grade[0];
  if (f === "A" || f === "B") return "0 0 60px rgba(0,232,123,0.08)";
  if (f === "C") return "0 0 60px rgba(245,158,11,0.08)";
  return "0 0 60px rgba(239,68,68,0.08)";
}

function gradeGradient(grade: string): string {
  const f = grade[0];
  if (f === "A" || f === "B") return "linear-gradient(180deg, rgba(0,232,123,0.04) 0%, transparent 100%)";
  if (f === "C") return "linear-gradient(180deg, rgba(245,158,11,0.04) 0%, transparent 100%)";
  return "linear-gradient(180deg, rgba(239,68,68,0.04) 0%, transparent 100%)";
}

function gradeContext(grade: string): string {
  const f = grade[0];
  if (f === "A") return "Strong edge. The math is in your favor.";
  if (f === "B") return "Solid parlay. Better than most.";
  if (f === "C") return "Average. Standard vig on most legs.";
  if (f === "D") return "Below average. Weak legs dragging you down.";
  return "Bad value. The books love this parlay.";
}

const EMPTY_SLIP_META: SlipMeta = { stake: null, toPay: null, baseOdds: null, paidOdds: null, boostLabel: null };

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

    setStep("grading");

    try {
      const parlayLegs = singleUnits.map((unit) => ({
        team: unit.team,
        betType: unit.bet_type,
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
        setError(data.error || "Grading failed. Try again.");
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
      <nav className="w-full max-w-[640px] mx-auto flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="SportsLogic" width={56} height={28} className="h-7 w-auto" />
          <span className="font-heading text-base font-bold text-text-primary tracking-tight">SportsLogic</span>
        </Link>
        <Link href="/" className="text-[11px] text-text-tertiary hover:text-text-secondary transition-colors uppercase tracking-wide">
          HOME
        </Link>
      </nav>

      <div className="w-full max-w-[520px] mx-auto px-5 pb-16">
        {/* Header */}
        <div className="text-center pt-8 pb-8">
          <h1 className="font-heading text-[28px] sm:text-[36px] font-bold uppercase tracking-[-0.5px] leading-tight">
            DROP YOUR <span className="text-accent">PARLAY</span>
          </h1>
          <p className="text-sm text-text-secondary mt-2">Screenshot your bet slip. We grade every leg.</p>
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
              <p className="font-heading text-base font-bold text-text-primary uppercase tracking-wide mb-2">
                TAP TO UPLOAD
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
            <p className="font-heading text-sm font-bold text-text-primary uppercase tracking-wide">READING YOUR SLIP...</p>
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
              <p className="font-heading text-[11px] font-bold text-text-tertiary uppercase tracking-[2px] mb-4">
                WE FOUND {parsedUnits.length} LEG{parsedUnits.length !== 1 ? "S" : ""}
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
                            {unit.bet_type === "total" && unit.line != null ? `${unit.side ?? "over"} ${unit.line} ` : ""}
                            {unit.bet_type === "prop" ? `${propLabel(unit)}${unit.line != null ? ` (${unit.side === "under" ? "u" : "o"}${unit.line})` : ""} ` : ""}
                            {unit.bet_type === "moneyline" ? "ML " : ""}
                            ({unit.odds >= 0 ? "+" : ""}{unit.odds})
                            <span className="text-text-tertiary"> &bull; {unit.sport.toUpperCase()}</span>
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
                          <p className="text-[10px] text-text-tertiary uppercase tracking-wide">Same Game Parlay &bull; {unit.sport.toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="pl-8 space-y-1">
                        {unit.children.map((child, j) => (
                          <p key={j} className="text-[11px] text-text-secondary truncate">
                            &bull; {child.player ?? child.team} — {child.market}
                            {child.line != null ? ` (${child.side === "under" ? "u" : "o"}${child.line})` : ""}
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
            <p className="font-heading text-sm font-bold text-text-primary uppercase tracking-wide">GRADING YOUR PARLAY...</p>
            <p className="text-xs text-text-secondary mt-3">
              Checking <span className="text-text-primary font-medium transition-all">{gradingBook}</span>
            </p>
            <p className="text-[10px] text-text-tertiary mt-1">{singleUnits.length} legs · 30+ books</p>
          </div>
        )}

        {/* ── RESULT STEP ── */}
        {step === "result" && result && (
          <div>
            {/* Overall grade card */}
            <div
              className={`rounded-2xl border overflow-hidden mb-6 ${gradeBg(result.overallGrade)}`}
              style={{ boxShadow: gradeGlow(result.overallGrade) }}
            >
              <div className="px-5 pt-6 pb-4 text-center"
                style={{ background: gradeGradient(result.overallGrade) }}>
                <p className="text-[11px] text-text-tertiary uppercase tracking-[2px] mb-2">
                  {result.legCount}-LEG PARLAY
                </p>
                <p className={`font-heading text-[72px] font-bold leading-none ${gradeColor(result.overallGrade)}`}>
                  {result.overallGrade}
                </p>
                <p className="text-sm text-text-secondary mt-2">{gradeContext(result.overallGrade)}</p>
                <p className="text-[11px] text-text-tertiary mt-1">EdgeScore: {result.overallScore} / 100</p>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 border-t border-border/30">
                <div className="px-3 py-3 text-center border-r border-border/30">
                  <p className="text-[10px] text-text-tertiary uppercase">EV</p>
                  <p className={`text-sm font-bold ${result.overallEv >= 0 ? "text-accent" : "text-red"}`}>
                    {result.overallEv >= 0 ? "+" : ""}{result.overallEv.toFixed(1)}%
                  </p>
                </div>
                <div className="px-3 py-3 text-center border-r border-border/30">
                  <p className="text-[10px] text-text-tertiary uppercase">TO HIT</p>
                  <p className="text-sm font-bold text-text-primary">{(result.combinedTrueProb * 100).toFixed(1)}%</p>
                </div>
                <div className="px-3 py-3 text-center">
                  <p className="text-[10px] text-text-tertiary uppercase">TAX</p>
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
            <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-6">
              <div className="px-5 pt-4 pb-2">
                <p className="font-heading text-[11px] font-bold text-text-tertiary uppercase tracking-[2px]">LEG-BY-LEG BREAKDOWN</p>
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
                        <p className="text-sm text-text-primary font-medium truncate">{primaryName}</p>
                        <p className="text-[10px] text-text-tertiary truncate">{desc} &bull; Best: {bookName(leg.best_book)}</p>
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
                <p className="text-[11px] font-bold text-amber uppercase tracking-wide mb-2">CORRELATION WARNING</p>
                {result.correlationWarnings.map((w, i) => (
                  <p key={i} className="text-xs text-text-secondary">{w}</p>
                ))}
              </div>
            )}

            {/* Swap suggestion */}
            {result.swapSuggestion && (
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-4">
                <p className="text-[11px] font-bold text-accent uppercase tracking-wide mb-2">AI SUGGESTION</p>
                <p className="text-xs text-text-secondary leading-relaxed">{result.swapSuggestion}</p>
              </div>
            )}

            {/* Weakest leg callout */}
            {result.legs.length > 0 && (() => {
              const worst = result.legs.reduce((a, b) => a.score < b.score ? a : b);
              const fairFmt = worst.fair_odds >= 0 ? `+${worst.fair_odds}` : `${worst.fair_odds}`;
              const payingFmt = worst.best_odds >= 0 ? `+${worst.best_odds}` : `${worst.best_odds}`;
              return (
                <div className="bg-red/5 border border-red/20 rounded-xl p-4 mb-4">
                  <p className="text-[11px] font-bold text-red uppercase tracking-wide mb-1">HURTING YOU MOST</p>
                  <p className="text-xs text-text-secondary">
                    {worst.team} — fair price {fairFmt}, you&apos;re paying {payingFmt}
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
              swapSuggestion: result.swapSuggestion,
              legs: result.legs.map((leg) => ({
                label: `${leg.team} ${leg.betType}`,
                grade: leg.grade,
                ev: leg.ev,
              })),
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

            <p className="text-[10px] text-text-tertiary text-center uppercase tracking-wide mt-6">POWERED BY SPORTSLOGIC</p>
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
      <footer className="w-full max-w-[640px] mx-auto px-6 pt-8 pb-10 border-t border-border/30">
        <p className="text-[11px] text-text-tertiary text-center leading-relaxed">
          SportsLogic is not a sportsbook. Analysis tools for informational purposes only. 21+.
        </p>
      </footer>
    </div>
  );
}
