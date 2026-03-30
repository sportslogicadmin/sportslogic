#!/usr/bin/env python3
"""
SportsLogic Grading Engine

Grade any sports bet using live odds data, expected value calculation,
and composite scoring.

Usage:
    python grading_engine.py --team "Celtics" --type moneyline --odds "+120" --book fanduel
    python grading_engine.py --team "Lakers" --type spread --line "-3.5" --odds "-110" --book draftkings
    python grading_engine.py --team "Chiefs" --type total --line "48.5" --side over --odds "-110" --book fanduel
    python grading_engine.py --parlay '[{"team":"Celtics","type":"moneyline","odds":"+120","book":"fanduel"},{"team":"Lakers","type":"spread","line":"-3.5","odds":"-110","book":"draftkings"}]'
"""

import argparse
import json
import math
import os
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import requests

# ── Load .env ──
_env_path = Path(__file__).parent.parent / ".env"
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

ODDS_API_KEY = os.environ.get("ODDS_API_KEY", "")
ODDS_API_BASE = "https://api.the-odds-api.com/v4"

# Sport keys for The Odds API
SPORT_MAP = {
    "nba": "basketball_nba",
    "nfl": "americanfootball_nfl",
    "mlb": "baseball_mlb",
    "nhl": "icehockey_nhl",
    "ncaab": "basketball_ncaab",
    "ncaaf": "americanfootball_ncaaf",
    "epl": "soccer_epl",
    "mls": "soccer_usa_mls",
}

# Market keys
MARKET_MAP = {
    "moneyline": "h2h",
    "ml": "h2h",
    "spread": "spreads",
    "total": "totals",
    "over": "totals",
    "under": "totals",
}

# Sharp books ranked by priority — Pinnacle is king
SHARP_BOOKS = ["pinnacle", "betonlineag", "bookmaker", "betcris", "circa"]

# Grade thresholds
GRADE_MAP = [
    (90, "A+"), (82, "B+"), (74, "B"), (66, "B-"),  # adjusted to feel right
    (58, "C+"), (50, "C"), (35, "D"), (0, "F"),
]
# More granular
GRADE_MAP = [
    (90, "A+"), (84, "A"), (78, "A-"), (72, "B+"), (66, "B"), (60, "B-"),
    (54, "C+"), (46, "C"), (38, "C-"), (30, "D+"), (22, "D"), (14, "D-"),
    (0, "F"),
]


# ────────────────────────────────────────────────
# ODDS MATH
# ────────────────────────────────────────────────

def american_to_implied(odds: int) -> float:
    """Convert American odds to implied probability (0-1)."""
    if odds > 0:
        return 100 / (odds + 100)
    else:
        return abs(odds) / (abs(odds) + 100)


def implied_to_american(prob: float) -> int:
    """Convert implied probability to American odds."""
    if prob <= 0 or prob >= 1:
        return 0
    if prob >= 0.5:
        return int(-100 * prob / (1 - prob))
    else:
        return int(100 * (1 - prob) / prob)


def devig_pinnacle(odds_a: int, odds_b: int) -> tuple[float, float]:
    """
    Remove vig from a two-way market using the multiplicative method.
    Returns true probabilities for side A and side B.
    """
    imp_a = american_to_implied(odds_a)
    imp_b = american_to_implied(odds_b)
    total = imp_a + imp_b  # > 1.0 due to vig
    return imp_a / total, imp_b / total


def calculate_ev(true_prob: float, odds: int) -> float:
    """
    Calculate expected value as a percentage of stake.
    EV% = (true_prob * profit) - (1 - true_prob) * stake
    For a $100 bet at +150: profit = $150, loss = $100
    """
    if odds > 0:
        profit_per_dollar = odds / 100
    else:
        profit_per_dollar = 100 / abs(odds)

    ev = (true_prob * profit_per_dollar) - (1 - true_prob)
    return ev * 100  # as percentage


def kelly_fraction(true_prob: float, odds: int) -> float:
    """
    Kelly criterion: optimal bet size as fraction of bankroll.
    f = (bp - q) / b where b = decimal odds - 1, p = true prob, q = 1-p
    """
    if odds > 0:
        b = odds / 100
    else:
        b = 100 / abs(odds)
    q = 1 - true_prob
    f = (b * true_prob - q) / b
    return max(0, f)  # never negative


# ────────────────────────────────────────────────
# ODDS API
# ────────────────────────────────────────────────

PROP_MARKET_MAP = {
    "points": "player_points",
    "rebounds": "player_rebounds",
    "assists": "player_assists",
    "threes": "player_threes",
    "pra": "player_points_rebounds_assists",
    "pts": "player_points",
    "reb": "player_rebounds",
    "ast": "player_assists",
    "3pt": "player_threes",
}

_odds_cache: dict[str, list] = {}
_events_cache: dict[str, list] = {}
_prop_cache: dict[str, dict] = {}


def fetch_events(sport: str) -> list:
    """Fetch event list for a sport. Cached."""
    sport_key = SPORT_MAP.get(sport.lower(), sport)
    if sport_key in _events_cache:
        return _events_cache[sport_key]

    resp = requests.get(f"{ODDS_API_BASE}/sports/{sport_key}/events/", params={
        "apiKey": ODDS_API_KEY,
    })
    if resp.status_code != 200:
        print(f"ERROR: Events API returned {resp.status_code}")
        return []

    data = resp.json()
    _events_cache[sport_key] = data
    return data


def find_event_id(sport: str, team: str) -> Optional[str]:
    """Find event ID for a game involving the given team."""
    events = fetch_events(sport)
    team_lower = team.lower()
    for ev in events:
        home = ev.get("home_team", "").lower()
        away = ev.get("away_team", "").lower()
        for word in team_lower.split():
            if len(word) >= 4 and (word in home or word in away):
                return ev["id"]
    return None


def fetch_prop_odds(sport: str, event_id: str, prop_type: str) -> dict:
    """Fetch player prop odds for a specific event. Cached."""
    sport_key = SPORT_MAP.get(sport.lower(), sport)
    market_key = PROP_MARKET_MAP.get(prop_type.lower(), prop_type)
    cache_key = f"{event_id}:{market_key}"

    if cache_key in _prop_cache:
        return _prop_cache[cache_key]

    resp = requests.get(
        f"{ODDS_API_BASE}/sports/{sport_key}/events/{event_id}/odds/",
        params={
            "apiKey": ODDS_API_KEY,
            "regions": "us,us2,eu",
            "markets": market_key,
            "oddsFormat": "american",
        },
    )
    if resp.status_code != 200:
        print(f"ERROR: Prop odds API returned {resp.status_code}: {resp.text[:200]}")
        return {}

    remaining = resp.headers.get("x-requests-remaining", "?")
    data = resp.json()
    _prop_cache[cache_key] = data
    print(f"  Props API: {market_key}, {remaining} requests remaining")
    return data


def fetch_odds(sport: str, market: str) -> list:
    """Fetch odds from The Odds API. Caches per sport+market combo."""
    if not ODDS_API_KEY:
        print("ERROR: ODDS_API_KEY not set in .env")
        sys.exit(1)

    cache_key = f"{sport}:{market}"
    if cache_key in _odds_cache:
        return _odds_cache[cache_key]

    sport_key = SPORT_MAP.get(sport.lower(), sport)
    market_key = MARKET_MAP.get(market.lower(), market)

    resp = requests.get(f"{ODDS_API_BASE}/sports/{sport_key}/odds/", params={
        "apiKey": ODDS_API_KEY,
        "regions": "us,us2,eu",
        "markets": market_key,
        "oddsFormat": "american",
    })

    if resp.status_code != 200:
        print(f"ERROR: Odds API returned {resp.status_code}: {resp.text[:200]}")
        return []

    remaining = resp.headers.get("x-requests-remaining", "?")
    data = resp.json()
    _odds_cache[cache_key] = data
    print(f"  Odds API: {len(data)} games, {remaining} requests remaining")
    return data


def find_game(games: list, team: str) -> Optional[dict]:
    """Find a game involving the given team (fuzzy match)."""
    team_lower = team.lower().strip()
    for game in games:
        home = game.get("home_team", "").lower()
        away = game.get("away_team", "").lower()
        if (team_lower in home or team_lower in away or
            any(team_lower in t.lower() for t in [home, away])):
            return game

    # Try partial match (e.g. "Celtics" matches "Boston Celtics")
    for game in games:
        home = game.get("home_team", "").lower()
        away = game.get("away_team", "").lower()
        for word in team_lower.split():
            if len(word) >= 4 and (word in home or word in away):
                return game
    return None


def extract_market_odds(game: dict, bet_type: str, team: str,
                        line: Optional[float] = None,
                        side: Optional[str] = None) -> dict:
    """
    Extract odds for a specific bet from all books in a game.
    Returns: {book_key: {"odds": int, "point": float|None, "outcome_name": str}}
    """
    market_key = MARKET_MAP.get(bet_type.lower(), bet_type)
    team_lower = team.lower()
    results = {}

    for book in game.get("bookmakers", []):
        book_key = book["key"]
        for market in book.get("markets", []):
            if market["key"] != market_key:
                continue

            for outcome in market["outcomes"]:
                name = outcome["name"].lower()
                odds = outcome["price"]
                point = outcome.get("point")

                matched = False

                if bet_type.lower() in ("moneyline", "ml", "h2h"):
                    # Match team name
                    if any(w in name for w in team_lower.split() if len(w) >= 4):
                        matched = True

                elif bet_type.lower() == "spread":
                    # Match team + closest line
                    if any(w in name for w in team_lower.split() if len(w) >= 4):
                        if line is None or point is None or abs(point - line) < 2:
                            matched = True

                elif bet_type.lower() in ("total", "over", "under"):
                    # Match Over/Under
                    target_side = (side or "over").lower()
                    if name == target_side:
                        if line is None or point is None or abs(point - line) < 2:
                            matched = True

                if matched:
                    results[book_key] = {
                        "odds": odds,
                        "point": point,
                        "outcome_name": outcome["name"],
                    }

    return results


def get_opponent_odds(game: dict, bet_type: str, team: str,
                      book_key: str) -> Optional[int]:
    """Get the other side's odds from the same book (needed for devigging)."""
    market_key = MARKET_MAP.get(bet_type.lower(), bet_type)
    team_lower = team.lower()

    for book in game.get("bookmakers", []):
        if book["key"] != book_key:
            continue
        for market in book.get("markets", []):
            if market["key"] != market_key:
                continue
            for outcome in market["outcomes"]:
                name = outcome["name"].lower()
                # Return the outcome that does NOT match our team
                is_our_team = any(w in name for w in team_lower.split() if len(w) >= 4)

                if bet_type.lower() in ("total", "over", "under"):
                    # For totals, opponent is the other side
                    target_side = "over"  # we'll figure out which side is ours
                    if name in ("over", "under"):
                        is_our_team = False  # check below
                    # Just return the other side
                    pass

                if not is_our_team and bet_type.lower() in ("moneyline", "ml", "h2h", "spread"):
                    return outcome["price"]

            # For totals, return the other side
            if bet_type.lower() in ("total", "over", "under"):
                sides = {o["name"].lower(): o["price"] for o in market["outcomes"]}
                if "over" in sides and "under" in sides:
                    # Return whichever side we're NOT on
                    return sides.get("under") if "over" in team_lower or bet_type.lower() == "over" else sides.get("over")

    return None


# ────────────────────────────────────────────────
# GRADING ENGINE
# ────────────────────────────────────────────────

@dataclass
class BetGrade:
    overall_grade: str
    overall_score: float
    ev_percent: float
    true_probability: float
    fair_odds: int
    user_odds: int
    best_available_odds: int
    best_book: str
    kelly_fraction: float
    team: str
    bet_type: str
    line: Optional[float]
    game: str
    breakdown: dict = field(default_factory=dict)
    books_count: int = 0
    edge_vs_fair: float = 0.0
    all_lines: list = field(default_factory=list)  # [{book, odds, line}] for props


def score_to_grade(score: float) -> str:
    for threshold, grade in GRADE_MAP:
        if score >= threshold:
            return grade
    return "F"


def grade_bet(
    team: str,
    bet_type: str,
    odds: int,
    book: str = "",
    sport: str = "nba",
    line: Optional[float] = None,
    side: Optional[str] = None,
) -> BetGrade:
    """
    Grade a single bet using live odds data.
    """
    print(f"\nGrading: {team} {bet_type} {f'{line} ' if line else ''}{odds:+d} ({book or 'any'})")

    # 1. Fetch odds
    games = fetch_odds(sport, bet_type)
    game = find_game(games, team)
    if not game:
        print(f"  ERROR: No game found for '{team}' in {sport.upper()}")
        return BetGrade(
            overall_grade="?", overall_score=0, ev_percent=0,
            true_probability=0, fair_odds=0, user_odds=odds,
            best_available_odds=0, best_book="", kelly_fraction=0,
            team=team, bet_type=bet_type, line=line,
            game="NOT FOUND",
        )

    game_name = f"{game['away_team']} @ {game['home_team']}"
    print(f"  Game: {game_name}")

    # 2. Extract odds across all books
    all_odds = extract_market_odds(game, bet_type, team, line, side)
    if not all_odds:
        print(f"  ERROR: No odds found for {team} {bet_type}")
        return BetGrade(
            overall_grade="?", overall_score=0, ev_percent=0,
            true_probability=0, fair_odds=0, user_odds=odds,
            best_available_odds=0, best_book="", kelly_fraction=0,
            team=team, bet_type=bet_type, line=line, game=game_name,
        )

    print(f"  Found odds from {len(all_odds)} books")

    # 3. Calculate fair odds using sharp book or average
    sharp_book = None
    sharp_odds = None
    for sb in SHARP_BOOKS:
        if sb in all_odds:
            sharp_book = sb
            sharp_odds = all_odds[sb]["odds"]
            break

    if sharp_book and sharp_odds:
        # Devig using sharp book's two-way market
        opp_odds = get_opponent_odds(game, bet_type, team, sharp_book)
        if opp_odds:
            true_prob, _ = devig_pinnacle(sharp_odds, opp_odds)
            print(f"  Sharp book: {sharp_book} ({sharp_odds:+d} / {opp_odds:+d}) -> true prob: {true_prob:.3f}")
        else:
            # Fallback: use implied prob with standard vig removal
            true_prob = american_to_implied(sharp_odds) * 0.96  # rough devig
            print(f"  Sharp book: {sharp_book} ({sharp_odds:+d}), estimated true prob: {true_prob:.3f}")
    else:
        # No sharp book — use average implied prob across all books, then devig
        implied_probs = [american_to_implied(b["odds"]) for b in all_odds.values()]
        avg_implied = sum(implied_probs) / len(implied_probs)
        true_prob = avg_implied * 0.96  # rough vig removal
        print(f"  No sharp book found. Average implied: {avg_implied:.3f}, estimated true prob: {true_prob:.3f}")

    fair_odds = implied_to_american(true_prob)

    # 4. Expected value
    ev_pct = calculate_ev(true_prob, odds)
    kelly = kelly_fraction(true_prob, odds)
    print(f"  EV: {ev_pct:+.2f}% | Fair odds: {fair_odds:+d} | User odds: {odds:+d}")

    # 5. Best available odds
    best_book_key = max(all_odds, key=lambda k: all_odds[k]["odds"])
    best_odds = all_odds[best_book_key]["odds"]
    worst_book_key = min(all_odds, key=lambda k: all_odds[k]["odds"])
    worst_odds = all_odds[worst_book_key]["odds"]

    print(f"  Best: {best_book_key} ({best_odds:+d}) | Worst: {worst_book_key} ({worst_odds:+d})")

    # 6. Composite scoring

    # EV component (50%): +5% or more = 100, 0% = 50, -5% or worse = 0
    ev_score = max(0, min(100, 50 + (ev_pct / 5) * 50))

    # Line value component (20%): where does user's odds sit vs best/worst?
    odds_range = best_odds - worst_odds
    if odds_range > 0:
        line_score = ((odds - worst_odds) / odds_range) * 100
        line_score = max(0, min(100, line_score))
    else:
        line_score = 50  # all books have same odds

    # Market sharpness (15%): how tight is the market? Tighter = more efficient = harder to find edge
    # We measure spread between best and worst — tighter market = user should trust the price more
    if odds_range <= 5:
        sharpness_score = 70  # very tight market, neutral-good
    elif odds_range <= 15:
        sharpness_score = 50  # normal
    elif odds_range <= 30:
        sharpness_score = 40  # wide, some opportunity
    else:
        # Very wide — either stale lines or big move. Good if user is on the right side
        sharpness_score = 60 if ev_pct > 0 else 30

    # Situational (15%): placeholder, neutral
    situational_score = 50

    composite = (
        ev_score * 0.50 +
        line_score * 0.20 +
        sharpness_score * 0.15 +
        situational_score * 0.15
    )

    grade = score_to_grade(composite)

    # Edge vs fair: how much better/worse are user's odds vs fair
    user_implied = american_to_implied(odds)
    edge_vs_fair = (true_prob - user_implied) * 100  # positive = good for user

    result = BetGrade(
        overall_grade=grade,
        overall_score=round(composite, 1),
        ev_percent=round(ev_pct, 2),
        true_probability=round(true_prob, 4),
        fair_odds=fair_odds,
        user_odds=odds,
        best_available_odds=best_odds,
        best_book=best_book_key,
        kelly_fraction=round(kelly, 4),
        team=team,
        bet_type=bet_type,
        line=line,
        game=game_name,
        books_count=len(all_odds),
        edge_vs_fair=round(edge_vs_fair, 2),
        breakdown={
            "ev_score": round(ev_score, 1),
            "line_value_score": round(line_score, 1),
            "market_sharpness_score": round(sharpness_score, 1),
            "situational_score": round(situational_score, 1),
        },
    )

    return result


# ────────────────────────────────────────────────
# PROP GRADING
# ────────────────────────────────────────────────

def grade_prop(
    player: str,
    prop_type: str,
    side: str,
    line: float,
    odds: int,
    book: str = "",
    sport: str = "nba",
    team: str = "",
) -> BetGrade:
    """
    Grade a player prop bet using live prop odds across books.
    """
    market_key = PROP_MARKET_MAP.get(prop_type.lower(), prop_type)
    side_lower = side.lower()
    player_lower = player.lower().strip()

    print(f"\nGrading prop: {player} {prop_type} {side} {line} {odds:+d} ({book or 'any'})")

    # Find the event
    search_term = team if team else player
    event_id = find_event_id(sport, search_term)

    # If team didn't match, try searching all events for the player in prop data
    if not event_id and not team:
        events = fetch_events(sport)
        for ev in events:
            event_id = ev["id"]
            test_data = fetch_prop_odds(sport, event_id, prop_type)
            found = False
            for bk in test_data.get("bookmakers", []):
                for mkt in bk.get("markets", []):
                    for o in mkt["outcomes"]:
                        if player_lower in o.get("description", "").lower():
                            found = True
                            break
                    if found:
                        break
                if found:
                    break
            if found:
                break
        else:
            event_id = None

    if not event_id:
        print(f"  ERROR: No game found for '{search_term}'")
        return BetGrade(
            overall_grade="?", overall_score=0, ev_percent=0,
            true_probability=0, fair_odds=0, user_odds=odds,
            best_available_odds=0, best_book="", kelly_fraction=0,
            team=player, bet_type=f"prop_{prop_type}", line=line, game="NOT FOUND",
        )

    # Fetch prop odds
    data = fetch_prop_odds(sport, event_id, prop_type)
    game_name = f"{data.get('away_team', '?')} @ {data.get('home_team', '?')}"
    print(f"  Game: {game_name}")

    # Extract ALL of this player's prop lines across all books
    # exact_match: same side + exact line (for grading)
    # all_lines: every line/odds combo for this player+side (for display)
    exact_match: dict[str, dict] = {}  # {book: {"over": int, "under": int, "point": float}}
    all_lines_raw: list[dict] = []     # [{book, point, side, odds}]

    for bk in data.get("bookmakers", []):
        bk_key = bk["key"]
        for mkt in bk.get("markets", []):
            if mkt["key"] != market_key:
                continue

            # Group by player + line
            player_outcomes: dict[float, dict] = {}  # {point: {"over": int, "under": int}}
            for o in mkt["outcomes"]:
                desc = o.get("description", "").lower()
                match = any(w in desc for w in player_lower.split() if len(w) >= 4)
                if not match:
                    continue
                point = o.get("point")
                if point is None:
                    continue
                if point not in player_outcomes:
                    player_outcomes[point] = {"point": point}
                player_outcomes[point][o["name"].lower()] = o["price"]

            # Collect all lines for this player
            for pt, po in player_outcomes.items():
                if side_lower in po:
                    all_lines_raw.append({
                        "book": bk_key,
                        "line": pt,
                        "odds": po[side_lower],
                        "side": side_lower,
                    })

                # Exact match: same line (within 0.1) for grading comparison
                if abs(pt - line) < 0.1 and side_lower in po:
                    exact_match[bk_key] = po

    # Sort all_lines by line then odds
    all_lines_raw.sort(key=lambda x: (x["line"], -x["odds"]))

    if not exact_match:
        # Fallback: try closest line within 1.5
        for entry in all_lines_raw:
            if abs(entry["line"] - line) <= 1.5:
                # Re-scan for this book's full over/under at that line
                pass
        if not exact_match:
            print(f"  ERROR: No exact prop match for {player} {prop_type} {side} {line}")
            return BetGrade(
                overall_grade="?", overall_score=0, ev_percent=0,
                true_probability=0, fair_odds=0, user_odds=odds,
                best_available_odds=0, best_book="", kelly_fraction=0,
                team=player, bet_type=f"prop_{prop_type}", line=line, game=game_name,
            )

    print(f"  Exact match from {len(exact_match)} books, {len(all_lines_raw)} total lines")

    # Devig using sharpest book (exact line match only)
    true_prob = None
    for sb in SHARP_BOOKS:
        if sb in exact_match:
            bo = exact_match[sb]
            if "over" in bo and "under" in bo:
                over_prob, under_prob = devig_pinnacle(bo["over"], bo["under"])
                true_prob = over_prob if side_lower == "over" else under_prob
                print(f"  Sharp book: {sb} (O{bo['over']:+d} / U{bo['under']:+d}) -> true prob: {true_prob:.3f}")
                break

    if true_prob is None:
        side_odds_list = [bo[side_lower] for bo in exact_match.values() if side_lower in bo]
        if side_odds_list:
            avg_implied = sum(american_to_implied(o) for o in side_odds_list) / len(side_odds_list)
            true_prob = avg_implied * 0.96
            print(f"  No sharp book. Average devigged true prob: {true_prob:.3f}")
        else:
            true_prob = 0.5

    fair_odds = implied_to_american(true_prob)
    ev_pct = calculate_ev(true_prob, odds)
    kelly_f = kelly_fraction(true_prob, odds)
    print(f"  EV: {ev_pct:+.2f}% | Fair odds: {fair_odds:+d} | User odds: {odds:+d}")

    # Best available — exact same line only
    side_by_book = {bk: bo[side_lower] for bk, bo in exact_match.items() if side_lower in bo}
    if side_by_book:
        best_bk = max(side_by_book, key=lambda k: side_by_book[k])
        best_o = side_by_book[best_bk]
        worst_bk = min(side_by_book, key=lambda k: side_by_book[k])
        worst_o = side_by_book[worst_bk]
    else:
        best_bk, best_o, worst_bk, worst_o = "", 0, "", 0

    print(f"  Best ({side} {line}): {best_bk} ({best_o:+d}) | Worst: {worst_bk} ({worst_o:+d})")
    if all_lines_raw:
        unique_lines = sorted(set(e["line"] for e in all_lines_raw))
        print(f"  Available lines: {', '.join(str(l) for l in unique_lines)}")

    # Scoring — same formula as grade_bet
    ev_score = max(0, min(100, 50 + (ev_pct / 5) * 50))

    odds_range = best_o - worst_o
    if odds_range > 0:
        line_score = max(0, min(100, ((odds - worst_o) / odds_range) * 100))
    else:
        line_score = 50

    if odds_range <= 5:
        sharpness_score = 70
    elif odds_range <= 15:
        sharpness_score = 50
    elif odds_range <= 30:
        sharpness_score = 40
    else:
        sharpness_score = 60 if ev_pct > 0 else 30

    situational_score = 50

    composite = ev_score * 0.50 + line_score * 0.20 + sharpness_score * 0.15 + situational_score * 0.15

    user_implied = american_to_implied(odds)
    edge_vs_fair = (true_prob - user_implied) * 100

    return BetGrade(
        overall_grade=score_to_grade(composite),
        overall_score=round(composite, 1),
        ev_percent=round(ev_pct, 2),
        true_probability=round(true_prob, 4),
        fair_odds=fair_odds,
        user_odds=odds,
        best_available_odds=best_o,
        best_book=best_bk,
        kelly_fraction=round(kelly_f, 4),
        team=player,
        bet_type=f"{prop_type} ({side})",
        line=line,
        game=game_name,
        all_lines=all_lines_raw,
        books_count=len(exact_match),
        edge_vs_fair=round(edge_vs_fair, 2),
        breakdown={
            "ev_score": round(ev_score, 1),
            "line_value_score": round(line_score, 1),
            "market_sharpness_score": round(sharpness_score, 1),
            "situational_score": round(situational_score, 1),
        },
    )


# ────────────────────────────────────────────────
# PARLAY GRADING
# ────────────────────────────────────────────────

@dataclass
class ParlayGrade:
    overall_grade: str
    overall_score: float
    overall_ev_percent: float
    combined_true_prob: float
    combined_implied_prob: float
    leg_count: int
    legs: list[BetGrade] = field(default_factory=list)
    correlation_warnings: list[str] = field(default_factory=list)
    weakest_leg: Optional[str] = None
    vig_cost_percent: float = 0.0


def detect_correlation(legs: list[dict]) -> list[str]:
    """
    Basic correlation detection.
    - Same game legs are correlated
    - Same team across legs may indicate correlation
    """
    warnings = []
    games_seen = {}

    for i, leg in enumerate(legs):
        game = leg.get("_game", "")
        if game and game in games_seen:
            warnings.append(
                f"Legs {games_seen[game]+1} and {i+1} are from the same game — correlated."
            )
        elif game:
            games_seen[game] = i

    # Check for same-team, different bet type
    teams_seen = {}
    for i, leg in enumerate(legs):
        t = leg.get("team", "").lower()
        if t in teams_seen:
            warnings.append(
                f"Legs {teams_seen[t]+1} and {i+1} both involve {leg.get('team', '')} — likely correlated."
            )
        else:
            teams_seen[t] = i

    return warnings


def grade_parlay(legs: list[dict], sport: str = "nba") -> ParlayGrade:
    """
    Grade a multi-leg parlay.
    Each leg: {"team": str, "type": str, "odds": str/int, "book": str, "line": float?, "side": str?}
    """
    print(f"\n{'='*50}")
    print(f"GRADING {len(legs)}-LEG PARLAY")
    print(f"{'='*50}")

    graded_legs = []
    combined_true_prob = 1.0
    combined_implied_prob = 1.0

    for i, leg in enumerate(legs):
        odds_int = int(str(leg.get("odds", "0")).replace("+", ""))
        result = grade_bet(
            team=leg["team"],
            bet_type=leg.get("type", "moneyline"),
            odds=odds_int,
            book=leg.get("book", ""),
            sport=leg.get("sport", sport),
            line=leg.get("line"),
            side=leg.get("side"),
        )
        graded_legs.append(result)

        if result.true_probability > 0:
            combined_true_prob *= result.true_probability
            combined_implied_prob *= american_to_implied(odds_int)

        # Store game name for correlation detection
        leg["_game"] = result.game

    # Correlation detection
    corr_warnings = detect_correlation(legs)

    # Overall parlay EV
    # Parlay pays at the combined implied odds, but true probability may differ
    if combined_implied_prob > 0 and combined_true_prob > 0:
        # Implied parlay odds (what the book is paying)
        parlay_decimal = 1 / combined_implied_prob
        # EV = true_prob * (payout - 1) - (1 - true_prob)
        parlay_ev = (combined_true_prob * (parlay_decimal - 1) - (1 - combined_true_prob)) * 100
        # Vig cost: difference between true and implied probabilities
        vig_cost = (combined_implied_prob - combined_true_prob) / combined_true_prob * 100
    else:
        parlay_ev = 0
        vig_cost = 0

    # Composite parlay score: weighted average of leg scores, penalized by correlation
    if graded_legs:
        avg_score = sum(l.overall_score for l in graded_legs) / len(graded_legs)
        # Penalty for each correlation warning
        correlation_penalty = len(corr_warnings) * 5
        # Penalty for weak legs — worst leg drags harder
        worst_score = min(l.overall_score for l in graded_legs)
        weak_penalty = max(0, (50 - worst_score) * 0.3)

        parlay_score = max(0, avg_score - correlation_penalty - weak_penalty)
    else:
        parlay_score = 0

    # Find weakest leg
    weakest = min(graded_legs, key=lambda l: l.overall_score) if graded_legs else None

    result = ParlayGrade(
        overall_grade=score_to_grade(parlay_score),
        overall_score=round(parlay_score, 1),
        overall_ev_percent=round(parlay_ev, 2),
        combined_true_prob=round(combined_true_prob, 6),
        combined_implied_prob=round(combined_implied_prob, 6),
        leg_count=len(graded_legs),
        legs=graded_legs,
        correlation_warnings=corr_warnings,
        weakest_leg=f"{weakest.team} {weakest.bet_type} ({weakest.overall_grade})" if weakest else None,
        vig_cost_percent=round(vig_cost, 2),
    )

    return result


# ────────────────────────────────────────────────
# DISPLAY
# ────────────────────────────────────────────────

def print_grade(g: BetGrade):
    """Pretty print a bet grade."""
    dot = {"A": "🟢", "B": "🟢", "C": "🟡", "D": "🔴", "F": "🔴", "?": "⚪"}.get(g.overall_grade[0], "⚪")

    print(f"\n{'─'*50}")
    print(f"  {dot} {g.team} — {g.bet_type.upper()}{f' {g.line}' if g.line else ''}")
    print(f"  {g.game}")
    print(f"{'─'*50}")
    print(f"  GRADE:  {g.overall_grade}  ({g.overall_score}/100)")
    print(f"  EV:     {g.ev_percent:+.2f}%")
    print(f"  EDGE:   {g.edge_vs_fair:+.2f}% vs fair")
    print(f"  KELLY:  {g.kelly_fraction:.2%} of bankroll")
    print(f"{'─'*50}")
    print(f"  Your odds:    {g.user_odds:+d}")
    print(f"  Fair odds:    {g.fair_odds:+d}")
    print(f"  Best avail:   {g.best_available_odds:+d} ({g.best_book})")
    print(f"  True prob:    {g.true_probability:.1%}")
    print(f"  Books:        {g.books_count}")
    print(f"{'─'*50}")
    print(f"  Breakdown:")
    for k, v in g.breakdown.items():
        label = k.replace("_", " ").replace(" score", "").title()
        bar = "█" * int(v / 5) + "░" * (20 - int(v / 5))
        print(f"    {label:22s} {bar} {v:.0f}")
    print()


def print_parlay(p: ParlayGrade):
    """Pretty print a parlay grade."""
    print(f"\n{'═'*50}")
    print(f"  PARLAY GRADE: {p.overall_grade}  ({p.overall_score}/100)")
    print(f"  {p.leg_count} legs | EV: {p.overall_ev_percent:+.2f}%")
    print(f"  Vig cost: {p.vig_cost_percent:.1f}%")
    print(f"  True win prob: {p.combined_true_prob:.4%}")
    print(f"{'═'*50}")

    if p.correlation_warnings:
        print(f"\n  ⚠️  CORRELATION WARNINGS:")
        for w in p.correlation_warnings:
            print(f"      {w}")

    if p.weakest_leg:
        print(f"\n  ⚠️  Weakest leg: {p.weakest_leg}")

    for leg in p.legs:
        print_grade(leg)


# ────────────────────────────────────────────────
# CLI
# ────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="SportsLogic Grading Engine")
    parser.add_argument("--team", help="Team name (e.g. 'Celtics')")
    parser.add_argument("--type", default="moneyline", help="Bet type: moneyline, spread, total")
    parser.add_argument("--odds", help="American odds (e.g. +120, -110)")
    parser.add_argument("--line", type=float, default=None, help="Line/spread (e.g. -3.5, 218.5)")
    parser.add_argument("--side", default=None, help="Over/under for totals/props")
    parser.add_argument("--book", default="", help="Sportsbook (e.g. fanduel, draftkings)")
    parser.add_argument("--sport", default="nba", help="Sport (nba, nfl, mlb, nhl, ncaab, ncaaf)")
    parser.add_argument("--parlay", help="JSON array of legs for parlay grading")
    parser.add_argument("--prop", action="store_true", help="Grade a player prop")
    parser.add_argument("--player", help="Player name for props (e.g. 'Embiid')")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()

    if args.parlay:
        legs = json.loads(args.parlay)
        result = grade_parlay(legs, sport=args.sport)
        if args.json:
            print(json.dumps({
                "grade": result.overall_grade,
                "score": result.overall_score,
                "ev": result.overall_ev_percent,
                "legs": [{
                    "team": l.team, "grade": l.overall_grade,
                    "score": l.overall_score, "ev": l.ev_percent,
                } for l in result.legs],
            }, indent=2))
        else:
            print_parlay(result)

    elif args.prop and args.player and args.odds:
        odds_int = int(args.odds.replace("+", ""))
        result = grade_prop(
            player=args.player,
            prop_type=args.type,
            side=args.side or "over",
            line=args.line or 0,
            odds=odds_int,
            book=args.book,
            sport=args.sport,
            team=args.team or "",
        )
        if args.json:
            print(json.dumps({
                "grade": result.overall_grade,
                "score": result.overall_score,
                "ev": result.ev_percent,
                "fair_odds": result.fair_odds,
                "best_odds": result.best_available_odds,
                "best_book": result.best_book,
                "true_prob": result.true_probability,
                "kelly": result.kelly_fraction,
                "breakdown": result.breakdown,
                "all_lines": result.all_lines,
            }, indent=2))
        else:
            print_grade(result)
            if result.all_lines:
                print(f"  ALL AVAILABLE LINES ({result.bet_type} {result.line}):")
                for entry in result.all_lines:
                    price = entry["odds"]
                    print(f"    {entry['book']:16s} | {entry['side']} {entry['line']} ({price:+d})")
                print()

    elif args.team and args.odds:
        odds_int = int(args.odds.replace("+", ""))
        result = grade_bet(
            team=args.team,
            bet_type=args.type,
            odds=odds_int,
            book=args.book,
            sport=args.sport,
            line=args.line,
            side=args.side,
        )
        if args.json:
            print(json.dumps({
                "grade": result.overall_grade,
                "score": result.overall_score,
                "ev": result.ev_percent,
                "fair_odds": result.fair_odds,
                "best_odds": result.best_available_odds,
                "best_book": result.best_book,
                "true_prob": result.true_probability,
                "kelly": result.kelly_fraction,
                "breakdown": result.breakdown,
            }, indent=2))
        else:
            print_grade(result)
    else:
        parser.print_help()
        print("\nExamples:")
        print('  python grading_engine.py --team "Celtics" --type moneyline --odds "+120" --book fanduel')
        print('  python grading_engine.py --team "Lakers" --type spread --line -3.5 --odds "-110"')
        print('  python grading_engine.py --prop --player "Embiid" --type points --side over --line 28.5 --odds "-123" --book fanduel')
        print('  python grading_engine.py --parlay \'[{"team":"Celtics","type":"moneyline","odds":"+120"},{"team":"Heat","type":"moneyline","odds":"-136"}]\'')


if __name__ == "__main__":
    main()
