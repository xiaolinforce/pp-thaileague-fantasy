export type AppLanguage = "th" | "en";

export type LocalizedText = {
  th: string;
  en: string;
};

export type CompetitionPosition = "GK" | "DEF" | "MID" | "FWD";

export type ClubColorPalette = [string, string, string, string];

export type CompetitionPlayerView = {
  id: string;
  photoUrl: string | null;
  name: LocalizedText;
  club: LocalizedText;
  clubShort: LocalizedText;
  position: CompetitionPosition;
  price: number;
  points: number;
  form: number;
  selected: number;
  next: LocalizedText;
  color: string;
  accent: string;
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
};

export function localize(value: LocalizedText, language: AppLanguage) {
  return value[language];
}
