export const BOOK_NAMES: Record<string, string> = {
  fanduel: "FanDuel",
  draftkings: "DraftKings",
  betmgm: "BetMGM",
  caesars: "Caesars",
  espnbet: "ESPN BET",
  betrivers: "BetRivers",
  fanatics: "Fanatics",
  bovada: "Bovada",
  hardrockbet: "Hard Rock Bet",
  hardrockbet_az: "Hard Rock Bet",
  betparx: "BetParx",
  wynnbet: "WynnBET",
  ballybet: "Bally Bet",
  fliff: "Fliff",
  pinnacle: "Pinnacle",
  betonlineag: "BetOnline",
  bookmaker: "Bookmaker",
  betcris: "BetCRIS",
  pointsbetus: "PointsBet",
  circa: "Circa",
  williamhill_us: "Caesars",
  lowvig: "LowVig",
  rebet: "Rebet",
  matchbook: "Matchbook",
  mybookieag: "MyBookie",
  betus: "BetUS",
  gtbets: "GTBets",
  coolbet: "Coolbet",
  onexbet: "1xBet",
};

export function bookName(key: string): string {
  if (!key) return "";
  if (BOOK_NAMES[key]) return BOOK_NAMES[key];
  // Fallback: split on _ or - or camelCase boundary, title-case each word
  return key
    .split(/[_\-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
