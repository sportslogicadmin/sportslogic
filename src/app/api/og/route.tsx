import { ImageResponse } from "@vercel/og";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  let grade = "—";
  let evLabel = "—";

  if (slug) {
    try {
      const record = await prisma.grade.findUnique({
        where: { shareSlug: slug },
        select: { overallGrade: true, overallEV: true },
      });
      if (record) {
        grade = record.overallGrade;
        evLabel = `${record.overallEV >= 0 ? "+" : ""}${record.overallEV.toFixed(1)}% EV`;
      }
    } catch {
      // DB not connected — fall through to generic image
    }
  }

  const gradeFirst = grade[0];
  const gradeColor =
    gradeFirst === "A" || gradeFirst === "B"
      ? "#00E87B"
      : gradeFirst === "C"
      ? "#F59E0B"
      : "#EF4444";

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0C0E14",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: 180,
            fontWeight: 800,
            color: gradeColor,
            lineHeight: 1,
            letterSpacing: "-6px",
          }}
        >
          {grade}
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#6B7280",
            marginTop: 20,
            letterSpacing: "6px",
            textTransform: "uppercase",
          }}
        >
          {evLabel}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 44,
            fontSize: 16,
            color: "#374151",
            letterSpacing: "4px",
            textTransform: "uppercase",
          }}
        >
          sportslogic.ai
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
