"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SettleButton({ gradeId, settled, won }: { gradeId: string; settled: boolean; won: boolean | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (settled && won !== null) {
    return (
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${won ? "bg-accent/10 text-accent" : "bg-red-900/30 text-red-400"}`}>
        {won ? "Won" : "Lost"}
      </span>
    );
  }

  const settle = async (didWin: boolean) => {
    setLoading(true);
    await fetch("/api/settle-grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gradeId, won: didWin }),
    });
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-zinc-500 uppercase tracking-wide mr-1">Settle:</span>
      <button
        onClick={() => settle(true)}
        disabled={loading}
        className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-accent/40 text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
      >
        Won
      </button>
      <button
        onClick={() => settle(false)}
        disabled={loading}
        className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-red-800/60 text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-50"
      >
        Lost
      </button>
    </div>
  );
}
