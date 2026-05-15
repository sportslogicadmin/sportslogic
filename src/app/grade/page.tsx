"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { bookName } from "@/lib/book-names";
import { ShareButton } from "@/components/share-button";

type ParsedLeg = {
  team: string;
  opponent?: string | null;
  bet_type: string;
  line?: number | null;
  odds: number;
  side?: string | null;
  player?: string | null;
  prop_type?: string | null;
  sport: string;
  stake?: number | null;
  potential_payout?: number | null;
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
};

type ParlayResult = {
  overallGrade: string;
  overallScore: number;
  overallEv: number;
  combinedTrueProb: number;
  vigCost: number;
  legCount: number;
  legs: GradedLeg[];
  weakestLeg: string | null;
  correlationWarnings: string[];
  swapSuggestion: string | null;
  shareSlug?: string;
};

type Step = "upload" | "parsing" | "confirm" | "grading" | "result";

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

export default function GradePage() {
  const [step, setStep] = useState<Step>("upload");
  const [parsedLegs, setParsedLegs] = useState<ParsedLeg[]>([]);
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
        if (res.ok && data.legs?.length > 0) {
          setParsedLegs(data.legs);
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
    setStep("grading");
    setError("");

    try {
      const parlayLegs = parsedLegs.map((leg) => ({
        team: leg.team,
        betType: leg.bet_type,
        odds: leg.odds,
        sport: leg.sport,
        line: leg.line ?? undefined,
        side: leg.side ?? undefined,
        player: leg.player ?? undefined,
        isProp: leg.bet_type === "prop",
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
    setParsedLegs([]);
    setResult(null);
    setError("");
    setImagePreview(null);
  };

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
                WE FOUND {parsedLegs.length} LEG{parsedLegs.length !== 1 ? "S" : ""}
              </p>
              <div className="space-y-3">
                {parsedLegs.map((leg, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                    <span className="text-[10px] font-mono text-text-tertiary w-5 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary font-medium truncate">
                        {leg.player ?? leg.team}
                      </p>
                      <p className="text-[11px] text-text-secondary">
                        {leg.bet_type === "spread" && leg.line != null ? `${leg.line >= 0 ? "+" : ""}${leg.line} ` : ""}
                        {leg.bet_type === "total" && leg.line != null ? `${leg.side ?? "over"} ${leg.line} ` : ""}
                        {leg.bet_type === "prop" && leg.prop_type ? `${leg.side ?? "over"} ${leg.line} ${leg.prop_type} ` : ""}
                        {leg.bet_type === "moneyline" ? "ML " : ""}
                        ({leg.odds >= 0 ? "+" : ""}{leg.odds})
                        <span className="text-text-tertiary"> &bull; {leg.sport.toUpperCase()}</span>
                      </p>
                    </div>
                  </div>
                ))}
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
            <p className="text-[10px] text-text-tertiary mt-1">{parsedLegs.length} legs · 30+ books</p>
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
                  <p className="text-[10px] text-text-tertiary uppercase">WIN PROB</p>
                  <p className="text-sm font-bold text-text-primary">{(result.combinedTrueProb * 100).toFixed(1)}%</p>
                </div>
                <div className="px-3 py-3 text-center">
                  <p className="text-[10px] text-text-tertiary uppercase">VIG COST</p>
                  <p className="text-sm font-bold text-red">{result.vigCost.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Individual legs */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-6">
              <div className="px-5 pt-4 pb-2">
                <p className="font-heading text-[11px] font-bold text-text-tertiary uppercase tracking-[2px]">LEG-BY-LEG BREAKDOWN</p>
              </div>
              <div className="divide-y divide-border/30">
                {result.legs.map((leg, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor(leg.grade)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary font-medium truncate">{leg.team}</p>
                      <p className="text-[10px] text-text-tertiary">{leg.betType} &bull; Best: {bookName(leg.best_book)}</p>
                    </div>
                    <span className={`font-heading text-base font-bold ${gradeColor(leg.grade)}`}>{leg.grade}</span>
                    <span className={`text-xs font-mono ${leg.ev >= 0 ? "text-accent" : "text-text-tertiary"}`}>
                      {leg.ev >= 0 ? "+" : ""}{leg.ev.toFixed(1)}%
                    </span>
                  </div>
                ))}
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
            {result.weakestLeg && (
              <p className="text-[11px] text-text-tertiary text-center mb-6">
                Weakest leg: {result.weakestLeg}
              </p>
            )}

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
              stake: parsedLegs.find((l) => l.stake != null)?.stake ?? null,
              payout: parsedLegs.find((l) => l.potential_payout != null)?.potential_payout ?? null,
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
