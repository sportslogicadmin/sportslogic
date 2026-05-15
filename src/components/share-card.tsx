import { forwardRef } from "react";

export type ShareCardData = {
  overallGrade: string;
  ev: number;
  legCount: number;
  swapSuggestion?: string | null;
  legs: {
    label: string;
    grade: string;
    ev: number;
  }[];
  stake?: number | null;
  payout?: number | null;
};

function gradeLetter(grade: string) {
  const f = grade[0];
  if (f === "A") return "#00E87B";
  if (f === "B") return "#00E87B";
  if (f === "C") return "#EAB308";
  return "#EF4444";
}

function dotHex(grade: string) {
  const f = grade[0];
  if (f === "A" || f === "B") return "#00E87B";
  if (f === "C") return "#EAB308";
  return "#EF4444";
}

function gradeLabel(grade: string): string | null {
  if (grade[0] === "F") return "DONATION";
  return null;
}

const INTER = "'Inter', system-ui, sans-serif";
const SATOSHI = "'Satoshi', 'Inter', system-ui, sans-serif";

export const ShareCard = forwardRef<HTMLDivElement, { data: ShareCardData }>(
  function ShareCard({ data }, ref) {
    const evPositive = data.ev >= 0;
    const evColor = evPositive ? "#00E87B" : "#EF4444";
    const evStr = `${evPositive ? "+" : ""}${data.ev.toFixed(1)}%`;
    const specialLabel = gradeLabel(data.overallGrade);

    return (
      <div
        ref={ref}
        style={{
          width: 360,
          height: 450,
          background: "#0C0E14",
          borderRadius: 20,
          padding: "24px 24px 20px",
          display: "flex",
          flexDirection: "column",
          fontFamily: INTER,
          overflow: "hidden",
          position: "relative",
          boxSizing: "border-box",
          border: "1px solid #252A37",
        }}
      >
        {/* Subtle glow behind EV */}
        <div style={{
          position: "absolute",
          left: "50%",
          top: "38%",
          transform: "translate(-50%, -50%)",
          width: 280,
          height: 160,
          background: `radial-gradient(ellipse, ${evPositive ? "rgba(0,232,123,0.07)" : "rgba(239,68,68,0.06)"} 0%, transparent 70%)`,
          filter: "blur(24px)",
          pointerEvents: "none",
        }} />

        {/* Row 1 — wordmark + grade */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{
              fontFamily: SATOSHI,
              fontSize: 10,
              fontWeight: 700,
              color: "#4F5468",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}>
              SPORTSLOGIC
            </span>
            <span style={{ fontSize: 9, color: "#4F5468", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {data.legCount}-LEG PARLAY
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            <span style={{
              fontFamily: SATOSHI,
              fontSize: 64,
              fontWeight: 900,
              color: gradeLetter(data.overallGrade),
              lineHeight: 1,
              letterSpacing: "-2px",
            }}>
              {data.overallGrade}
            </span>
            {specialLabel && (
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#EF4444",
                background: "rgba(239,68,68,0.12)",
                borderRadius: 4,
                padding: "2px 6px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}>
                {specialLabel}
              </span>
            )}
          </div>
        </div>

        {/* Row 2 — EV hero */}
        <div style={{ textAlign: "center", marginBottom: 16, marginTop: 4 }}>
          <span style={{
            fontFamily: SATOSHI,
            fontSize: 48,
            fontWeight: 900,
            color: evColor,
            lineHeight: 1,
            letterSpacing: "-1px",
          }}>
            {evStr}
          </span>
          <span style={{
            fontFamily: SATOSHI,
            fontSize: 18,
            fontWeight: 700,
            color: evColor,
            opacity: 0.7,
            marginLeft: 4,
          }}>
            EV
          </span>
          <div style={{ fontSize: 9, color: "#4F5468", marginTop: 4, letterSpacing: "0.05em" }}>
            Based on Pinnacle fair odds
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#252A37", marginBottom: 8 }} />

        {/* Row 3 — parlay summary */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          fontSize: 10,
          color: "#8A8FA3",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
          <span>{data.legCount}-LEG PARLAY</span>
          {data.stake != null && data.payout != null && (
            <span>${data.stake.toFixed(0)} → ${data.payout.toFixed(0)}</span>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#252A37", marginBottom: 10 }} />

        {/* Legs */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7, overflow: "hidden" }}>
          {data.legs.slice(0, 5).map((leg, i) => {
            const legEvStr = `${leg.ev >= 0 ? "+" : ""}${leg.ev.toFixed(1)}%`;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: dotHex(leg.grade),
                  flexShrink: 0,
                  boxShadow: `0 0 5px ${dotHex(leg.grade)}80`,
                }} />
                <span style={{
                  flex: 1,
                  fontSize: 11,
                  color: "#E2E4EA",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 168,
                }}>
                  {leg.label}
                </span>
                <span style={{
                  fontFamily: SATOSHI,
                  fontSize: 11,
                  fontWeight: 700,
                  color: gradeLetter(leg.grade),
                  width: 24,
                  textAlign: "right",
                  flexShrink: 0,
                }}>
                  {leg.grade}
                </span>
                <span style={{
                  fontSize: 10,
                  fontFamily: "monospace",
                  color: leg.ev >= 0 ? "#00E87B" : "#4F5468",
                  width: 44,
                  textAlign: "right",
                  flexShrink: 0,
                }}>
                  {legEvStr}
                </span>
              </div>
            );
          })}
        </div>

        {/* Swap suggestion */}
        {data.swapSuggestion && (
          <div style={{
            marginTop: 10,
            background: "rgba(0,232,123,0.06)",
            border: "1px solid rgba(0,232,123,0.15)",
            borderRadius: 10,
            padding: "8px 10px",
          }}>
            <div style={{
              fontSize: 8,
              fontWeight: 700,
              color: "#00E87B",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: 3,
            }}>
              ↑ SMART SWAP
            </div>
            <div style={{
              fontSize: 10,
              color: "#8A8FA3",
              lineHeight: 1.4,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            } as React.CSSProperties}>
              {data.swapSuggestion}
            </div>
          </div>
        )}

        {/* Watermark */}
        <div style={{
          marginTop: 12,
          textAlign: "center",
          fontSize: 9,
          color: "#4F5468",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}>
          sportslogic.ai
        </div>
      </div>
    );
  }
);
