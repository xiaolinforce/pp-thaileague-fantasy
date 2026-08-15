const OFFICIAL_API_BASE =
  "https://competition.tl.prod.c0d1um.io/thaileague/api/";
const TRANSFERMARKT_BASE = "https://www.transfermarkt.com";

export const THAI_LEAGUE_SOURCE = "Thai League official API";
export const TRANSFERMARKT_SOURCE = "Transfermarkt";
export const TOURNAMENT_ID = 224;
export const SEASON_ID = 33;

const transfermarktSquadsByTournamentTeamId: Record<number, string> = {
  7112: "/buriram-united/kader/verein/25449/saison_id/2026",
  7113: "/bg-pathum-united/kader/verein/25444/saison_id/2026",
  7114: "/port-fc/kader/verein/27092/saison_id/2026",
  7115: "/ratchaburi-mitr-phol-fc/kader/verein/35387/saison_id/2026",
  7116: "/true-bangkok-united/kader/verein/25445/saison_id/2026",
  7117: "/pt-prachuap-fc/kader/verein/50659/saison_id/2026",
  7118: "/ayutthaya-united/kader/verein/55257/saison_id/2026",
  7119: "/singha-chiangrai-united/kader/verein/6759/saison_id/2026",
  7120: "/chonburi-fc/kader/verein/12533/saison_id/2026",
  7121: "/rayong-fc/kader/verein/48190/saison_id/2026",
  7122: "/lamphun-warrior-fc/kader/verein/55227/saison_id/2026",
  7123: "/uthai-thani-fc/kader/verein/55265/saison_id/2026",
  7124: "/sisaket-united/kader/verein/55243/saison_id/2026",
  7125: "/sukhothai-fc/kader/verein/50658/saison_id/2026",
  7126: "/rasisalai-united/kader/verein/96139/saison_id/2026",
  7127: "/pattani-fc/kader/verein/55283/saison_id/2026",
};

export type SourcePlayerPosition =
  "goalkeeper" | "defender" | "midfielder" | "forward" | "unknown";

export type OfficialSeason = {
  id: number;
  year: string;
  start_date: string;
  end_date: string;
};

export type OfficialTournament = {
  id: number;
  name: string;
  name_en: string;
  logo: string | null;
  season_start_date: string;
  season_end_date: string;
  start_date: string;
  end_date: string;
  tier: number;
};

export type OfficialTeam = {
  id: number;
  website: string;
  stadium: string;
  stadium_en: string;
  stadium_id: string;
  stadium_photo: string | null;
  name: string;
  name_en: string;
  logo: string | null;
  tournament: number;
  club: number;
};

export type OfficialStadium = {
  id: number;
  name: string;
  name_en: string | null;
  capacity: number | null;
  photo: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  province: string | null;
};

export type OfficialFixture = {
  id: number;
  start_date: string;
  start_time: string | null;
  match_status: number;
  home_goal_count: number;
  away_goal_count: number;
  home_penalty_goal_count: number;
  away_penalty_goal_count: number;
  home_team: number;
  away_team: number;
  home_team_alias: string | null;
  away_team_alias: string | null;
  stadium: number | null;
  stadium_name: string | null;
  stadium_name_en: string | null;
  match_no: number | null;
  match_day_name: string;
  is_cancel: boolean;
  attendance_number: number;
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  results: T[];
};

export type TransfermarktPlayer = {
  externalId: string;
  fullNameEn: string;
  position: SourcePlayerPosition;
  positionDetail: string;
  nationality: string | null;
  shirtNumber: number | null;
  photoUrl: string | null;
  sourceUrl: string;
};

export type TransfermarktSquad = {
  tournamentTeamId: number;
  sourceUrl: string;
  players: TransfermarktPlayer[];
};

export type ThaiLeagueSourceData = {
  season: OfficialSeason;
  tournament: OfficialTournament;
  teams: OfficialTeam[];
  stadiums: OfficialStadium[];
  fixtures: OfficialFixture[];
  squads: TransfermarktSquad[];
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  return (await response.json()) as T;
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  return response.text();
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  worker: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(values[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, runWorker),
  );

  return results;
}

function decodeHtml(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(
      /&([a-z]+);/gi,
      (entity, name: string) => namedEntities[name.toLowerCase()] ?? entity,
    )
    .replace(/\s+/g, " ")
    .trim();
}

function toPosition(value: string): SourcePlayerPosition {
  const normalized = value.toLowerCase();

  if (normalized.includes("goalkeeper")) return "goalkeeper";
  if (normalized.includes("defender")) return "defender";
  if (normalized.includes("midfield")) return "midfielder";
  if (
    normalized.includes("forward") ||
    normalized.includes("winger") ||
    normalized.includes("striker") ||
    normalized.includes("attack")
  ) {
    return "forward";
  }

  return "unknown";
}

export function parseTransfermarktSquad(html: string): TransfermarktPlayer[] {
  const tableStart = html.indexOf('<table class="items">');
  const tableEnd = tableStart >= 0 ? html.indexOf("</tbody>", tableStart) : -1;

  if (tableStart < 0 || tableEnd < 0) {
    throw new Error("Transfermarkt squad table was not found.");
  }

  const tableHtml = html.slice(tableStart, tableEnd);
  const rowChunks = tableHtml.split(/<tr class="(?:odd|even)">/).slice(1);
  const players: TransfermarktPlayer[] = [];

  for (const row of rowChunks) {
    const playerMatch = row.match(
      /href="(\/[^"?]+\/profil\/spieler\/(\d+))"[^>]*>\s*([^<]+?)\s*<\/a>/,
    );

    if (!playerMatch) continue;

    const positionGroup =
      row.match(/rueckennummer[^>]+title="([^"]+)"/)?.[1] ?? "";
    const positionDetail =
      row.match(/<tr>\s*<td>\s*([^<]+?)\s*<\/td>\s*<\/tr>\s*<\/table>/)?.[1] ??
      positionGroup;
    const shirtNumberText = row.match(/class=rn_nummer>([^<]*)<\/div>/)?.[1];
    const shirtNumber = shirtNumberText?.trim().match(/^\d+$/)
      ? Number.parseInt(shirtNumberText.trim(), 10)
      : null;
    const nationalityMatches = Array.from(
      row.matchAll(/<img[^>]+title="([^"]+)"[^>]+class="flaggenrahmen"[^>]*>/g),
    );
    const photoUrl =
      row.match(
        /<img[^>]+data-src="([^"]+)"[^>]+class="bilderrahmen-fixed[^"]*"[^>]*>/,
      )?.[1] ?? null;
    const profilePath = playerMatch[1];

    players.push({
      externalId: playerMatch[2],
      fullNameEn: decodeHtml(playerMatch[3]),
      position: toPosition(`${positionGroup} ${positionDetail}`),
      positionDetail: decodeHtml(positionDetail),
      nationality: nationalityMatches[0]
        ? decodeHtml(nationalityMatches[0][1])
        : null,
      shirtNumber,
      photoUrl:
        photoUrl && !photoUrl.includes("/default.jpg")
          ? decodeHtml(photoUrl)
          : null,
      sourceUrl: `${TRANSFERMARKT_BASE}${profilePath}`,
    });
  }

  if (players.length === 0) {
    throw new Error("Transfermarkt squad table did not contain any players.");
  }

  return players;
}

async function fetchAllFixtures(): Promise<OfficialFixture[]> {
  let nextUrl: string | null =
    `${OFFICIAL_API_BASE}match-day-match-public/?tournament=${TOURNAMENT_ID}&only_valid_match=true&page=1`;
  const fixtures: OfficialFixture[] = [];

  while (nextUrl) {
    const page: PaginatedResponse<OfficialFixture> = await fetchJson(nextUrl);
    fixtures.push(...page.results);
    nextUrl = page.next;
  }

  return fixtures;
}

async function fetchSquads(
  teams: OfficialTeam[],
): Promise<TransfermarktSquad[]> {
  return mapWithConcurrency(teams, 4, async (team) => {
    const path = transfermarktSquadsByTournamentTeamId[team.id];

    if (!path) {
      throw new Error(
        `Transfermarkt squad URL is missing for ${team.name_en}.`,
      );
    }

    const sourceUrl = `${TRANSFERMARKT_BASE}${path}`;
    const html = await fetchHtml(sourceUrl);

    return {
      tournamentTeamId: team.id,
      sourceUrl,
      players: parseTransfermarktSquad(html),
    };
  });
}

function validateSourceData(data: ThaiLeagueSourceData) {
  if (data.season.id !== SEASON_ID) {
    throw new Error(
      `Expected season ${SEASON_ID}, received ${data.season.id}.`,
    );
  }

  if (data.tournament.id !== TOURNAMENT_ID) {
    throw new Error(
      `Expected tournament ${TOURNAMENT_ID}, received ${data.tournament.id}.`,
    );
  }

  if (data.teams.length !== 16) {
    throw new Error(`Expected 16 teams, received ${data.teams.length}.`);
  }

  if (data.fixtures.length !== 240) {
    throw new Error(`Expected 240 fixtures, received ${data.fixtures.length}.`);
  }

  const fixturesPerMatchweek = new Map<number, number>();
  for (const fixture of data.fixtures) {
    const matchweek = Number.parseInt(fixture.match_day_name, 10);
    fixturesPerMatchweek.set(
      matchweek,
      (fixturesPerMatchweek.get(matchweek) ?? 0) + 1,
    );
  }

  if (
    fixturesPerMatchweek.size !== 30 ||
    Array.from(fixturesPerMatchweek.values()).some((count) => count !== 8)
  ) {
    throw new Error(
      "The official fixture list is not 30 matchweeks of 8 games.",
    );
  }

  const totalPlayers = data.squads.reduce(
    (total, squad) => total + squad.players.length,
    0,
  );

  if (data.squads.length !== 16 || totalPlayers < 200) {
    throw new Error(
      `Expected 16 populated squads and at least 200 players, received ${data.squads.length} squads and ${totalPlayers} players.`,
    );
  }
}

export async function fetchThaiLeagueSourceData(): Promise<ThaiLeagueSourceData> {
  const [seasons, tournament, teams, fixtures] = await Promise.all([
    fetchJson<OfficialSeason[]>(`${OFFICIAL_API_BASE}season-dropdown-public/`),
    fetchJson<OfficialTournament>(
      `${OFFICIAL_API_BASE}tournament-public/${TOURNAMENT_ID}/`,
    ),
    fetchJson<OfficialTeam[]>(
      `${OFFICIAL_API_BASE}tournament-team-public/?tournament=${TOURNAMENT_ID}`,
    ),
    fetchAllFixtures(),
  ]);
  const season = seasons.find((item) => item.id === SEASON_ID);

  if (!season) {
    throw new Error(
      `Season ${SEASON_ID} was not returned by the official API.`,
    );
  }

  const stadiumIds = Array.from(
    new Set(
      [
        ...teams.map((team) => Number.parseInt(team.stadium_id, 10)),
        ...fixtures
          .filter(
            (fixture) =>
              fixture.stadium &&
              fixture.stadium_name?.trim().toUpperCase() !== "TBC",
          )
          .map((fixture) => fixture.stadium as number),
      ].filter((id) => Number.isInteger(id)),
    ),
  );
  const [stadiums, squads] = await Promise.all([
    mapWithConcurrency(stadiumIds, 6, (id) =>
      fetchJson<OfficialStadium>(`${OFFICIAL_API_BASE}stadium-public/${id}`),
    ),
    fetchSquads(teams),
  ]);
  const data = { season, tournament, teams, stadiums, fixtures, squads };

  validateSourceData(data);

  return data;
}

export const sourceUrls = {
  officialArticle:
    "https://thaileague.co.th/v1/news-index/%E0%B8%9B%E0%B8%95%E0%B8%95%E0%B8%B2%E0%B8%99-%E0%B9%80%E0%B8%9B%E0%B8%94%E0%B8%AB%E0%B8%A7%E0%B8%A3%E0%B8%9A-%E0%B8%9A%E0%B8%88-%E0%B8%A8%E0%B8%81%E0%B8%9A%E0%B8%A7%E0%B8%B2%E0%B8%A2%E0%B8%94-%E0%B8%8B%E0%B9%84%E0%B8%A5%E0%B8%AD%E0%B8%AD%E0%B8%99-%E0%B8%8B%E0%B8%81%E0%B8%AA-%E0%B8%A5%E0%B8%81%E0%B8%AB%E0%B8%99%E0%B8%87-202627-%E0%B9%81%E0%B8%8A%E0%B8%A1%E0%B8%9B%E0%B9%80%E0%B8%81%E0%B8%B2-%E0%B8%9A%E0%B8%A3%E0%B8%A3%E0%B8%A1%E0%B8%A2-%E0%B8%9A%E0%B8%81%E0%B8%A3%E0%B8%87-%E0%B8%AA%E0%B9%82%E0%B8%82%E0%B8%97%E0%B8%A2%E0%B8%A3%E0%B8%B2%E0%B8%A9%E0%B9%84%E0%B8%A8%E0%B8%A5-%E0%B8%A3%E0%B8%9A-%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%97%E0%B8%B2%E0%B9%80%E0%B8%A3%E0%B8%AD-%E0%B8%A7%E0%B8%84%E0%B9%81%E0%B8%A3%E0%B8%81/",
  officialApi: OFFICIAL_API_BASE,
  tournament: `${OFFICIAL_API_BASE}tournament-public/${TOURNAMENT_ID}/`,
  teams: `${OFFICIAL_API_BASE}tournament-team-public/?tournament=${TOURNAMENT_ID}`,
  fixtures: `${OFFICIAL_API_BASE}match-day-match-public/?tournament=${TOURNAMENT_ID}&only_valid_match=true`,
};
