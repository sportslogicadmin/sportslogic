export type FailureMode = "A" | "B" | "C" | "D";

export function gradingErrorCopy(mode: string | undefined, legName?: string): string {
  const name = legName?.trim() || "this game";
  switch (mode) {
    case "A":
      return "Odds service is having a moment. Try again in a few seconds.";
    case "B":
      return `Lines aren't posted yet for ${name}. Sportsbooks usually post 12–24 hours before first pitch. Check back closer to game time.`;
    case "C":
      return "Found the game, but no sportsbook has complete lines posted yet. Try again closer to game time.";
    case "D":
      return "This leg is already in progress. SportsLogic grades pre-game lines only — odds during play move too fast for fair grading.";
    default:
      return "Grading failed. Try again.";
  }
}
