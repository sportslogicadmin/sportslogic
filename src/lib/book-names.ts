export const BOOK_NAMES: Record<string, string> = {
  fanduel: "FanDuel",
  draftkings: "DraftKings",
  betmgm: "BetMGM",
  caesars: "Caesars",
  espnbet: "ESPN Bet",
  betrivers: "BetRivers",
  fanatics: "Fanatics",
  bovada: "Bovada",
  hardrockbet: "Hard Rock",
  hardrockbet_az: "Hard Rock",
  betparx: "BetParx",
  wynnbet: "WynnBet",
  ballybet: "Bally Bet",
  fliff: "Fliff",
  pinnacle: "Pinnacle",
  betonlineag: "BetOnline",
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
  return BOOK_NAMES[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}
