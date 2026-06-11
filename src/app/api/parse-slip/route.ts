import { NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

export async function POST(request: Request) {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === "your-key-here") {
    return NextResponse.json({ error: "Anthropic API key not configured" }, { status: 500 });
  }

  let body: { image: string; mediaType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.image) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  // Strip data URL prefix if present
  let imageData = body.image;
  let mediaType = body.mediaType ?? "image/png";
  if (imageData.startsWith("data:")) {
    const match = imageData.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      mediaType = match[1];
      imageData = match[2];
    }
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: imageData,
                },
              },
              {
                type: "text",
                text: `Parse this sportsbook bet slip screenshot into structured betting units.

Return ONLY a valid JSON object — no other text, no markdown fences.

Shape:
{
  "units": [ ... ],
  "stake": number or null,
  "toPay": number or null,
  "baseOdds": number or null,
  "paidOdds": number or null,
  "boostLabel": string or null
}

--- UNIT RULES ---
Each independently priced bet = one unit.
Non-bet content (tournament names, event dates, promo text, "PARLAY" headers, "POTENTIAL PAYOUT" labels) is NEVER a unit.

Single unit shape:
{
  "type": "single",
  "team": string,
  "opponent": string or null,
  "bet_type": "moneyline" | "spread" | "total" | "prop",
  "line": number or null,
  "odds": number (American, e.g. -110 or +300),
  "side": "over" | "under" | null,
  "player": string or null,
  "prop_type": "hr"|"hits"|"strikeouts"|"rbis"|"points"|"rebounds"|"assists"|"threes"|"pra"|"goals"|"shots" or null,
  "sport": "nba"|"nfl"|"mlb"|"nhl"|"ncaab"|"ncaaf" — or the actual sport name in lowercase if unsupported. NEVER guess a supported sport for an unsupported one (e.g. use "golf" not "nfl")
}

Group unit shape (use when multiple legs are priced as one bundle, e.g. SGP, Same Game Parlay, SGPx):
{
  "type": "group",
  "groupLabel": string (the bundle label, e.g. "2 PICK SGP"),
  "unitOdds": number (the single price for the whole bundle, American format),
  "sport": string,
  "children": [
    {
      "player": string or null,
      "team": string,
      "market": string (e.g. "To Hit a HR", "O1.5 Hits"),
      "line": number or null,
      "side": "over" | "under" | null,
      "odds": null
    }
  ]
}

--- BOOST RULES ---
If a struck-through odds AND a higher "boosted" odds are both visible on the slip:
  "baseOdds": the struck-through original parlay odds (American)
  "paidOdds": the boosted parlay odds you actually get paid (American)
If no boost: both null.

--- STAKE / PAYOUT ---
"stake": wager amount as a number, or null
"toPay": total potential payout as a number, or null (full payout, not just profit)

Return ONLY the JSON object.`,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[parse-slip] Anthropic error:", res.status, errText.slice(0, 200));
      return NextResponse.json({ error: "Failed to read bet slip" }, { status: 502 });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text ?? "";

    // Strip markdown code fences then parse
    const stripped = text.replace(/^```(?:json)?\s*/m, "").replace(/```\s*$/m, "").trim();

    let parsed: { units?: unknown[]; stake?: number | null; toPay?: number | null; baseOdds?: number | null; paidOdds?: number | null; boostLabel?: string | null };
    try {
      parsed = JSON.parse(stripped);
    } catch {
      const match = stripped.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json({ error: "Could not parse bet slip. Try a clearer screenshot.", raw: text }, { status: 422 });
      }
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        return NextResponse.json({ error: "Could not parse bet slip. Try a clearer screenshot.", raw: text }, { status: 422 });
      }
    }

    if (!parsed.units || !Array.isArray(parsed.units) || parsed.units.length === 0) {
      return NextResponse.json({ error: "No betting units found. Try a clearer screenshot.", raw: text }, { status: 422 });
    }

    return NextResponse.json({
      units: parsed.units,
      stake: parsed.stake ?? null,
      toPay: parsed.toPay ?? null,
      baseOdds: parsed.baseOdds ?? null,
      paidOdds: parsed.paidOdds ?? null,
      boostLabel: parsed.boostLabel ?? null,
      raw: text,
    });
  } catch (err) {
    console.error("[parse-slip]", err);
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }
}
