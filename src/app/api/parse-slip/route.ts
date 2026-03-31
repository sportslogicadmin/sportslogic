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
        model: "claude-3-5-haiku-20241022",
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
                text: `Extract every bet leg from this sportsbook bet slip screenshot.

Return ONLY a JSON array, no other text. Each leg should have these fields:
- "team": the team or player name (string)
- "opponent": the other team if visible (string or null)
- "bet_type": one of "moneyline", "spread", "total", "prop" (string)
- "line": the spread or total number (number or null for moneyline)
- "odds": American format odds as a number (e.g. -110, +150)
- "side": "over" or "under" for totals/props, null otherwise
- "player": player name if this is a player prop, null otherwise
- "prop_type": "points", "rebounds", "assists", "threes", "pra" if prop, null otherwise
- "sport": "nba", "nfl", "mlb", "nhl", "ncaab", or "ncaaf"

Also include if visible:
- "stake": the wager amount as a number or null
- "potential_payout": the potential payout as a number or null

Example: [{"team":"Boston Celtics","opponent":"Atlanta Hawks","bet_type":"spread","line":-4.5,"odds":-110,"side":null,"player":null,"prop_type":null,"sport":"nba","stake":100,"potential_payout":191}]

Return ONLY the JSON array.`,
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

    // Extract JSON from response (might have markdown code fences)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse bet slip. Try a clearer screenshot.", raw: text }, { status: 422 });
    }

    const legs = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ legs, raw: text });
  } catch (err) {
    console.error("[parse-slip]", err);
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }
}
