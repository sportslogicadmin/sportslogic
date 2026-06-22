"use client";

import { useState } from "react";
import Link from "next/link";
import { gradingErrorCopy, type FailureMode } from "@/lib/grading-error-copy";

const MODES: { mode: FailureMode; slug: string; label: string }[] = [
  { mode: "A", slug: "odds_api_unreachable", label: "API down" },
  { mode: "B", slug: "lines_not_posted",     label: "Lines not posted" },
  { mode: "C", slug: "incomplete_book_coverage", label: "No complete lines" },
  { mode: "D", slug: "game_in_progress",     label: "Game started" },
];

const SAMPLE_TEAM = "Colorado Rockies";

export default function TestErrorsPage() {
  const [active, setActive] = useState<FailureMode | null>(null);

  return (
    <div className="w-full max-w-[520px] mx-auto px-5 py-16">
      <div className="mb-8">
        <Link href="/grade" className="text-[11px] text-text-tertiary hover:text-text-secondary transition-colors">
          ← Back to grade
        </Link>
      </div>

      <h1 className="font-display text-2xl font-bold mb-2">Error mode test</h1>
      <p className="text-sm text-text-tertiary mb-10">
        Preview all four grading failure messages. No API calls — copy renders directly from{" "}
        <code className="text-[11px] text-accent">grading-error-copy.ts</code>.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-10">
        {MODES.map(({ mode, slug, label }) => (
          <button
            key={mode}
            onClick={() => setActive(active === mode ? null : mode)}
            className={`text-left p-4 rounded-xl border transition-all ${
              active === mode
                ? "bg-accent/10 border-accent/40 text-text-primary"
                : "bg-surface border-border text-text-secondary hover:border-text-tertiary"
            }`}
          >
            <span className="font-heading text-xs font-bold block mb-1">Mode {mode}</span>
            <span className="text-[11px] block mb-1">{label}</span>
            <code className="text-[10px] text-text-tertiary">{slug}</code>
          </button>
        ))}
      </div>

      {active && (
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-heading text-[11px] font-bold text-text-tertiary">
              Mode {active} — rendered copy
            </span>
            <code className="text-[10px] text-text-tertiary">
              legName=&quot;{SAMPLE_TEAM}&quot;
            </code>
          </div>
          {/* Same styling as the error div in grade/page.tsx */}
          <div className="bg-red/5 border border-red/20 rounded-lg px-4 py-3">
            <p className="text-sm text-red">{gradingErrorCopy(active, SAMPLE_TEAM)}</p>
          </div>
          <div className="pt-2 border-t border-border/30">
            <p className="text-[11px] text-text-tertiary">
              Internal log slug:{" "}
              <code className="text-accent">
                {MODES.find((m) => m.mode === active)?.slug}
              </code>
            </p>
          </div>
        </div>
      )}

      {!active && (
        <p className="text-sm text-text-tertiary text-center py-8">
          Select a mode above to preview the error message.
        </p>
      )}
    </div>
  );
}
