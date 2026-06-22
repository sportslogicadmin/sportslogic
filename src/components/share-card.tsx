import { forwardRef } from "react";

export type ShareCardData = {
  overallGrade: string;
  ev: number;
  legCount: number;
  impliedProb?: number;
  trueProb?: number;
  swapSuggestion?: string | null;
  foundMoney?: number | null;
  legs: {
    label: string;
    grade: string;
    ev: number;
  }[];
  stake?: number | null;
  payout?: number | null;
};

function tierColor(grade: string) {
  const f = grade[0];
  if (f === "A") return "#00B362";  // desaturated data-green — pure brand green reserved for wordmarks
  if (f === "B") return "#58B992";  // muted teal-green, distinct from A-tier
  if (f === "C") return "#EAB308";
  if (f === "D") return "#F87171";
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
    const evStr = `${evPositive ? "+" : ""}${data.ev.toFixed(1)}%`;
    const heroColor = tierColor(data.overallGrade);
    const evColor = heroColor;
    const specialLabel = gradeLabel(data.overallGrade);

    return (
      <div
        ref={ref}
        style={{
          width: 360,
          background: "linear-gradient(135deg, #18181B 0%, #000000 100%)",
          borderRadius: 20,
          padding: "26px 28px 22px",
          display: "flex",
          flexDirection: "column",
          fontFamily: INTER,
          overflow: "hidden",
          position: "relative",
          boxSizing: "border-box",
          border: "1px solid #3F3F46",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
        }}
      >
        {/* Subtle glow behind grade hero */}
        <div style={{
          position: "absolute",
          left: "50%",
          top: "30%",
          transform: "translate(-50%, -50%)",
          width: 280,
          height: 180,
          background: `radial-gradient(ellipse, ${heroColor}26 0%, transparent 70%)`,
          filter: "blur(28px)",
          pointerEvents: "none",
        }} />

        {/* Row 1 — wordmark */}
        <div style={{ marginBottom: 14 }}>
          <span style={{
            fontFamily: SATOSHI,
            fontSize: 10,
            fontWeight: 700,
            color: "#10B981",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}>
            SPORTSLOGIC
          </span>
        </div>

        {/* Grade hero */}
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <span style={{
            fontFamily: SATOSHI,
            fontSize: 96,
            fontWeight: 900,
            color: heroColor,
            lineHeight: 1,
            letterSpacing: "-4px",
          }}>
            {data.overallGrade}
          </span>
          {specialLabel && (
            <div style={{ marginTop: 4 }}>
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
            </div>
          )}
        </div>

        {/* EV — subordinate to the grade */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
          <span style={{ fontFamily: SATOSHI, fontSize: 18, fontWeight: 700, color: evColor }}>{evStr}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: evColor, opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            EV
          </span>
        </div>

        {/* Found Money pill */}
        {data.foundMoney != null && data.foundMoney > 0 && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <span style={{
              background: "rgba(16,185,129,0.10)",
              border: "1px solid rgba(16,185,129,0.22)",
              borderRadius: 8,
              padding: "3px 11px",
              fontSize: 12,
              fontWeight: 700,
              color: "#10B981",
              fontFamily: SATOSHI,
              letterSpacing: "0.01em",
            }}>
              +${data.foundMoney.toFixed(2)} found
            </span>
          </div>
        )}

        {/* Verdict — the Found Money framing, in neutral body text */}
        {data.impliedProb != null && data.trueProb != null && (
          <div style={{ textAlign: "center", marginBottom: 14, padding: "0 10px" }}>
            <span style={{ fontSize: 11.5, color: "#71717A", lineHeight: 1.4 }}>
              You&apos;re paying like it&apos;s {(data.impliedProb * 100).toFixed(1)}%. We price it at {(data.trueProb * 100).toFixed(1)}%.
            </span>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: "#252A37", marginBottom: 10 }} />

        {/* Row 3 — parlay summary */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          fontSize: 10,
          color: "#A1A1AA",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
          <span>{data.legCount}-LEG PARLAY</span>
          {data.stake != null && data.payout != null && (
            <span>${data.stake.toFixed(0)} → ${data.payout.toFixed(0)}</span>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#252A37", marginBottom: 12 }} />

        {/* Legs */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {data.legs.map((leg, i) => {
            const legEvStr = `${leg.ev >= 0 ? "+" : ""}${leg.ev.toFixed(1)}%`;
            return (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                paddingTop: i === 0 ? 0 : 10,
                marginTop: i === 0 ? 0 : 1,
                borderTop: i === 0 ? "none" : "1px solid #27272A",
              }}>
                <div style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: tierColor(leg.grade),
                  flexShrink: 0,
                  boxShadow: `0 0 5px ${tierColor(leg.grade)}80`,
                }} />
                <span style={{
                  flex: 1,
                  fontSize: 11,
                  color: "#F4F4F5",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 195,
                }}>
                  {leg.label}
                </span>
                <span style={{
                  fontFamily: SATOSHI,
                  fontSize: 11,
                  fontWeight: 700,
                  color: tierColor(leg.grade),
                  opacity: 0.7,
                  width: 24,
                  textAlign: "right",
                  flexShrink: 0,
                }}>
                  {leg.grade}
                </span>
                <span style={{
                  fontSize: 10,
                  fontFamily: "monospace",
                  color: "#71717A",
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
            marginTop: 12,
            background: "rgba(16,185,129,0.06)",
            border: "1px solid rgba(16,185,129,0.15)",
            borderRadius: 10,
            padding: "9px 11px",
          }}>
            <div style={{
              fontSize: 8,
              fontWeight: 700,
              color: "#10B981",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: 3,
            }}>
              ↑ SMART SWAP
            </div>
            <div style={{
              fontSize: 10,
              color: "#71717A",
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

        {/* Divider above wordmark */}
        <div style={{ height: 1, background: "#252A37", marginTop: 14, marginBottom: 10 }} />

        {/* Wordmark */}
        <div style={{ textAlign: "center" }}>
          <span style={{
            fontFamily: SATOSHI,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.22em",
          }}>
            <span style={{ color: "#10B981" }}>SPORTSLOGIC</span>
            <span style={{ color: "#71717A" }}>.AI</span>
          </span>
        </div>
      </div>
    );
  }
);
