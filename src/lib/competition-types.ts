export type AppLanguage = "th" | "en";

export type LocalizedText = {
  th: string;
  en: string;
};

export type CompetitionPosition = "GK" | "DEF" | "MID" | "FWD";

export type ClubColorPalette = [string, string, string, string];

export type CompetitionPlayerView = {
  id: string;
  fantasyPlayerId: string | null;
  clubId: string;
  photoUrl: string | null;
  name: LocalizedText;
  shortName: LocalizedText;
  club: LocalizedText;
  clubShort: LocalizedText;
  position: CompetitionPosition;
  price: number;
  tier: number;
  isThai: boolean;
  points: number;
  form: number;
  fantasyAppearances: number;
  selected: number;
  next: LocalizedText;
  recentMatches: Array<{
    fixtureId: string;
    matchweek: number;
    points: number;
  }>;
  color: string;
  accent: string;
};

export type CompetitionFootballStatView = {
  playerId: string;
  appearances: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  goalsConceded: number;
  penaltyGoals: number;
  penaltyMisses: number;
  yellowCards: number;
  redCards: number;
  ownGoals: number;
};

export type CompetitionStatisticsView = {
  fantasy: {
    available: boolean;
    lastUpdatedAt: string | null;
  };
  football: {
    available: boolean;
    lastUpdatedAt: string | null;
    sourceUrl: string | null;
    players: CompetitionFootballStatView[];
  };
};

export type CompetitionClubView = {
  id: string;
  name: LocalizedText;
  shortName: LocalizedText;
  abbreviation: string;
  colors: ClubColorPalette;
};

export type CompetitionFixtureView = {
  id: string;
  matchweek: number;
  kickoffAt: string | null;
  dateLabel: LocalizedText;
  timeLabel: LocalizedText;
  homeScore: number | null;
  awayScore: number | null;
  home: CompetitionClubView;
  away: CompetitionClubView;
  venue: LocalizedText | null;
  status: string;
};

export type CompetitionDataset = {
  season: LocalizedText;
  players: CompetitionPlayerView[];
  fixtures: CompetitionFixtureView[];
  clubs: CompetitionClubView[];
  matchweeks: number[];
  currentGameweek: number | null;
  statistics: CompetitionStatisticsView;
};

export function localize(value: LocalizedText, language: AppLanguage) {
  return value[language];
}
