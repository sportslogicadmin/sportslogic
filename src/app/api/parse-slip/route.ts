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
        max_tokens: 2048,
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

Output shape:
{
  "units": [ ... ],
  "stake": number or null,
  "toPay": number or null,
  "baseOdds": number or null,
  "paidOdds": number or null,
  "boostLabel": string or null
}

━━━ THE THREE RULES ━━━

RULE 1 — THE SLIP HEADER IS NEVER A UNIT.
The top-level "N PICK PARLAY", "N PICK SGPx", or similar combined label is the slip itself — not a unit.
Its combined odds are the slip-level odds: put them in baseOdds (and paidOdds if boosted).
Do NOT create a unit for the overall parlay header.

RULE 2 — OWN ODDS = SINGLE UNIT.
Any pick that displays its own individual American odds (e.g. +300, -110) is ALWAYS a single unit,
even if the slip header also shows a combined parlay price.

RULE 3 — GROUP UNIT = SUB-PARLAY PRICED AS ONE, NO MEMBER ODDS.
A group unit exists ONLY when a labeled sub-bundle inside the slip shows ONE combined price
for the whole bundle AND its member picks display NO individual odds.
Examples: "2 PICK SGP +400", "SGP Boost", an SGPx sub-section labeled with its own price.

━━━ EXAMPLE A — flat 5-leg parlay (5 singles, no groups) ━━━
Slip shows: "5 PICK PARLAY +8450"
  Aaron Judge · To Hit a HR · +300      ← has own odds → single
  Juan Soto · 2+ Hits · +140            ← has own odds → single
  Yankees · ML · -130                   ← has own odds → single
  Mets · -1.5 · +110                    ← has own odds → single
  Over 8.5 Runs · -110                  ← has own odds → single
Stake: $10  |  To Pay: $855

Correct output:
{
  "units": [
    {"type":"single","team":"New York Yankees","player":"Aaron Judge","bet_type":"prop","line":0.5,"odds":300,"side":"over","prop_type":"hr","sport":"mlb","opponent":null},
    {"type":"single","team":"New York Yankees","player":"Juan Soto","bet_type":"prop","line":1.5,"odds":140,"side":"over","prop_type":"hits","sport":"mlb","opponent":null},
    {"type":"single","team":"New York Yankees","player":null,"bet_type":"moneyline","line":null,"odds":-130,"side":null,"prop_type":null,"sport":"mlb","opponent":null},
    {"type":"single","team":"New York Mets","player":null,"bet_type":"spread","line":-1.5,"odds":110,"side":null,"prop_type":null,"sport":"mlb","opponent":null},
    {"type":"single","team":"New York Yankees","player":null,"bet_type":"total","line":8.5,"odds":-110,"side":"over","prop_type":null,"sport":"mlb","opponent":null}
  ],
  "stake": 10,
  "toPay": 855,
  "baseOdds": 8450,
  "paidOdds": null,
  "boostLabel": null
}

━━━ EXAMPLE B — SGPx slip (singles + one group sub-parlay) ━━━
Slip shows: "5 PICK SGPx +7761" (boosted from struck-through +6467)
  Jordan Spieth · Top 5 Finish · +550   ← has own odds → single (sport: golf)
  Rory McIlroy · Top 5 Finish · +300    ← has own odds → single (sport: golf)
  Scottie Scheffler · To Win · +150     ← has own odds → single (sport: golf)
  Jon Rahm · Top 20 Finish · +100       ← has own odds → single (sport: golf)
  ┌─ 2 PICK SGP +400 ─────────────────┐  ← sub-bundle, one combined price, NO member odds
  │  Aaron Judge · To Hit a HR         │
  │  Juan Soto · 2+ Hits               │
  └────────────────────────────────────┘
Boost label: "+20% Odds Boost"
Stake: $25  |  To Pay: $1965.25

Correct output:
{
  "units": [
    {"type":"single","team":"","player":"Jordan Spieth","bet_type":"prop","line":null,"odds":550,"side":null,"prop_type":null,"sport":"golf","opponent":null},
    {"type":"single","team":"","player":"Rory McIlroy","bet_type":"prop","line":null,"odds":300,"side":null,"prop_type":null,"sport":"golf","opponent":null},
    {"type":"single","team":"","player":"Scottie Scheffler","bet_type":"prop","line":null,"odds":150,"side":null,"prop_type":null,"sport":"golf","opponent":null},
    {"type":"single","team":"","player":"Jon Rahm","bet_type":"prop","line":null,"odds":100,"side":null,"prop_type":null,"sport":"golf","opponent":null},
    {"type":"group","groupLabel":"2 PICK SGP","unitOdds":400,"sport":"mlb","children":[
      {"player":"Aaron Judge","team":"New York Yankees","market":"To Hit a HR","line":0.5,"side":"over","odds":null},
      {"player":"Juan Soto","team":"New York Yankees","market":"2+ Hits","line":1.5,"side":"over","odds":null}
    ]}
  ],
  "stake": 25,
  "toPay": 1965.25,
  "baseOdds": 6467,
  "paidOdds": 7761,
  "boostLabel": "+20% Odds Boost"
}

━━━ UNIT SHAPES (reference) ━━━

Single unit:
{
  "type": "single",
  "team": string (team name, or "" if individual sport like golf/tennis),
  "opponent": string or null,
  "bet_type": "moneyline" | "spread" | "total" | "prop",
  "line": number or null,
  "odds": number (American format, required),
  "side": "over" | "under" | null,
  "player": string or null,
  "prop_type": "hr"|"hits"|"strikeouts"|"rbis"|"points"|"rebounds"|"assists"|"threes"|"pra"|"goals"|"shots" or null,
  "sport": "nba"|"nfl"|"mlb"|"nhl"|"ncaab"|"ncaaf" — or the actual sport name in lowercase if unsupported. NEVER substitute a supported sport for an unsupported one (e.g. golf stays "golf", not "nfl")
}

Group unit (sub-parlay priced as one — see Rule 3):
{
  "type": "group",
  "groupLabel": string,
  "unitOdds": number (American format),
  "sport": string,
  "children": [
    { "player": string or null, "team": string, "market": string, "line": number or null, "side": "over"|"under"|null, "odds": null }
  ]
}

━━━ BOOST / STAKE / PAYOUT ━━━
baseOdds: struck-through original parlay odds, or null
paidOdds: boosted parlay odds actually paid, or null (if no boost, both null)
stake: wager amount, or null
toPay: total potential payout (not just profit), or null

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
