"use client";

import { useState, useEffect } from "react";

import { bookName as bk } from "@/lib/book-names";

type Data = {
  totalScanned?: number;
  worstBet?: { team: string; betType: string; sport: string; grade: string; ev: number; vig: number };
  bestAlt?: { team: string; betType: string; grade: string; ev: number; best_book: string };
  bookGrades?: { name: string; avgEv: number; grade: string }[];
  updatedAt?: string;
};

export function MarketInsights() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch("/api/top-grades")
      .then((r) => r.json())
      .then((d) => { if (d.worstBet) setData(d); })
      .catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="w-full max-w-[1080px] mx-auto px-6 py-20 sm:py-24">
      <div className="max-w-[640px] mx-auto space-y-10">

        {/* Tonight's Trap */}
        {data.worstBet && (
          <div>
            <p className="text-xs font-semibold tracking-[2px] text-red uppercase text-center mb-6">TONIGHT&apos;S TRAP</p>
            <div className="bg-surface rounded-xl border border-red/20 overflow-hidden"
              style={{ boxShadow: "0 0 40px rgba(239, 68, 68, 0.05)" }}>
              <div className="p-5 text-center"
                style={{ background: "linear-gradient(180deg, rgba(239,68,68,0.05) 0%, transparent 100%)" }}>
                <span className="font-heading text-[48px] font-bold text-red leading-none">{data.worstBet.grade}</span>
                <span className="block px-3 py-0.5 rounded-full bg-red/15 text-red text-[10px] font-bold uppercase mx-auto w-fit mt-2">SELL</span>
                <p className="font-heading text-sm font-bold text-text-primary uppercase tracking-wide mt-3">{data.worstBet.team}</p>
                <p className="text-xs text-text-secondary mt-1">{data.worstBet.betType} &bull; {data.worstBet.sport}</p>
              </div>
              <div className="px-5 py-3 border-t border-red/10 text-center">
                <p className="text-xs text-text-secondary">
                  The sportsbook is taking <span className="text-red font-semibold">{data.worstBet.vig.toFixed(1)}%</span> of your money on this line.
                </p>
              </div>
              {data.bestAlt && (
                <div className="px-5 py-3 border-t border-border/30 bg-accent/[0.03]">
                  <p className="text-[10px] text-accent uppercase tracking-[1.5px] font-bold mb-2 text-center">BET THIS INSTEAD</p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="font-heading text-lg font-bold text-accent">{data.bestAlt.grade}</span>
                    <span className="text-sm text-text-primary font-medium">{data.bestAlt.team}</span>
                    <span className="text-xs text-accent">{data.bestAlt.ev >= 0 ? "+" : ""}{data.bestAlt.ev.toFixed(2)}% EV</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sportsbook Report Card */}
        {data.bookGrades && data.bookGrades.length > 0 && (
          <div>
            <p className="text-xs font-semibold tracking-[2px] text-text-tertiary uppercase text-center mb-6">SPORTSBOOK REPORT CARD</p>
            <div className="bg-surface border border-border rounded-xl overflow-hidden divide-y divide-border/50">
              {data.bookGrades.map((b, i) => {
                const f = b.grade[0];
                const color = f === "A" ? "text-accent" : f === "B" ? "text-accent/80" : f === "C" ? "text-amber" : "text-red";
                return (
                  <div key={i} className={`px-5 py-3.5 flex items-center gap-3 ${i === 0 ? "bg-accent/[0.03]" : ""}`}>
                    <span className={`font-heading text-base font-bold w-8 shrink-0 ${color}`}>{b.grade}</span>
                    <span className="text-sm text-text-primary font-medium flex-1">{bk(b.name)}</span>
                    <span className={`text-xs ${f === "A" || f === "B" ? "text-text-secondary" : "text-red/80"}`}>
                      {Math.abs(b.avgEv).toFixed(1)}% {b.avgEv >= 0 ? "better" : "worse"} than fair
                    </span>
                  </div>
                );
              })}
            </div>
            {data.totalScanned && (
              <p className="text-[10px] text-text-tertiary text-center mt-3">{data.totalScanned} bets compared across all games tonight</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
