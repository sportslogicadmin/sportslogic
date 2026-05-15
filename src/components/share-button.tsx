"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { ShareCard, type ShareCardData } from "./share-card";

export function ShareButton({ data }: { data: ShareCardData }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const png = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `sportslogic-grade-${data.overallGrade.replace("+", "plus").replace("-", "minus")}.png`;
      link.href = png;
      link.click();
    } catch {
      // silent — html-to-image can fail on some browsers
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mt-6">
      {/* Card preview — scrolls into view, serves as the download source */}
      <div className="flex justify-center mb-4">
        <ShareCard ref={cardRef} data={data} />
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full h-11 rounded-xl bg-surface border border-border text-text-secondary text-[11px] font-bold uppercase tracking-[0.5px] hover:border-text-tertiary hover:text-text-primary transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {downloading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-text-tertiary/30 border-t-text-secondary rounded-full animate-spin" />
            SAVING...
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            DOWNLOAD CARD
          </>
        )}
      </button>
    </div>
  );
}
