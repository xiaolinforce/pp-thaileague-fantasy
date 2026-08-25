import { loadEnvConfig } from "@next/env";
import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import * as schema from "../src/db/schema";

import {
  clubs,
  competitionEntries,
  fantasyAdminAuditLog,
  fantasyGameweeks,
  fantasyPlayerRankings,
  fantasyPlayers,
  fantasyPlayerTiers,
  fantasyRankingRuns,
  fantasySeasons,
  fantasyTeamGameweekScores,
  fantasyTeamSelectionPlayers,
  fantasyTeamSelections,
  playerRegistrations,
  players,
} from "../src/db/schema";
import {
  DEFAULT_RANKING_TIER_PERCENTAGES,
  deriveRankingTierCounts,
  FANTASY_RANKING_MODEL_VERSION,
  normalizeRankingName,
  rankFantasyPlayers,
  scoreRankingNameMatch,
  type HistoricalPlayerStats,
  type PlayerRanking,
  type RankingCandidate,
  type RankingTierPercentages,
} from "../src/lib/fantasy/ranking.ts";
import {
  validateSquad,
  type FantasyPosition,
} from "../src/lib/fantasy/rules.ts";
import { fantasyRankingOverrides } from "./sources/fantasy-ranking-overrides.ts";
import {
  fetchPreviousSeasonClubContexts,
  fetchPreviousSeasonPlayerStats,
  PREVIOUS_SEASON_ID,
  PREVIOUS_SEASON_YEAR,
  previousSeasonSourceUrls,
} from "./sources/thai-league-2025-26-player-stats.ts";
import {
  fetchCurrentTransfermarktSquads,
  sourceUrls,
} from "./sources/thai-league-2026-27.ts";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");

const db = drizzle(databaseUrl, { schema });
const FANTASY_SEASON_SLUG = "thai-league-1-2026-27";
const DEFAULT_VERSION = "preseason-2026-27-v2";
const DATA_CUTOFF = "2026-08-22";
const SOURCE_NAME = "preseason-ranking-model";
const FUZZY_MATCH_THRESHOLD = 0.9;
const FUZZY_MATCH_GAP = 0.04;

type Options = {
  publish: boolean;
  version: string;
  effectiveGameweek: number;
  tierPercentages: RankingTierPercentages;
  output: string | null;
};

type CurrentPlayerRow = {
  fantasyPlayerId: string;
  playerId: string;
  fullNameEn: string;
  sourceUrl: string;
  sourceExternalId: string;
  position: FantasyPosition;
  clubId: string;
  clubNameEn: string;
  clubExternalId: string;
};

function parsePositiveInteger(value: string, name: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }
  return parsed;
}

function parsePercentage(value: string, name: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new Error(`${name} must be between 0 and 100.`);
  }
  return parsed;
}

function parseOptions(): Options {
  const values = new Map<string, string>();
  let publish = false;
  for (const argument of process.argv.slice(2)) {
    if (argument === "--publish") {
      publish = true;
      continue;
    }
    const match = argument.match(/^--([^=]+)=(.*)$/);
    if (!match) throw new Error(`Unknown argument: ${argument}`);
    values.set(match[1], match[2]);
  }
  return {
    publish,
    version: values.get("version") || DEFAULT_VERSION,
    effectiveGameweek: parsePositiveInteger(
      values.get("effective-gameweek") || "1",
      "effective-gameweek",
    ),
    tierPercentages: {
      levelOne: parsePercentage(
        values.get("l1-percent") ||
          String(DEFAULT_RANKING_TIER_PERCENTAGES.levelOne),
        "l1-percent",
      ),
      levelTwo: parsePercentage(
        values.get("l2-percent") ||
          String(DEFAULT_RANKING_TIER_PERCENTAGES.levelTwo),
        "l2-percent",
      ),
      levelThree: parsePercentage(
        values.get("l3-percent") ||
          String(DEFAULT_RANKING_TIER_PERCENTAGES.levelThree),
        "l3-percent",
      ),
    },
    output: values.get("output") || null,
  };
}

function chunk<T>(values: T[], size = 100) {
  const groups: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    groups.push(values.slice(index, index + size));
  }
  return groups;
}

function transfermarktId(row: CurrentPlayerRow) {
  const sourceUrlId = row.sourceUrl.match(/\/spieler\/(\d+)/)?.[1];
  const externalId = row.sourceExternalId.split(":").at(-1);
  const value = sourceUrlId ?? externalId;
  if (!value || !/^\d+$/.test(value)) {
    throw new Error(`Transfermarkt ID was not found for ${row.fullNameEn}.`);
  }
  return value;
}

function groupHistoricalStats(rows: HistoricalPlayerStats[]) {
  const byPerson = new Map<number, HistoricalPlayerStats[]>();
  for (const row of rows) {
    const list = byPerson.get(row.personId) ?? [];
    list.push(row);
    byPerson.set(row.personId, list);
  }
  return byPerson;
}

function matchHistoricalPlayers(
  currentPlayers: CurrentPlayerRow[],
  historicalRows: HistoricalPlayerStats[],
) {
  const byPerson = groupHistoricalStats(historicalRows);
  const exactNames = new Map<string, number[]>();
  for (const [personId, rows] of byPerson) {
    const name = normalizeRankingName(rows[0].fullNameEn);
    exactNames.set(name, [...(exactNames.get(name) ?? []), personId]);
  }
  const proposals: Array<{
    fantasyPlayerId: string;
    personId: number;
    method: "exact_name" | "fuzzy_name" | "manual";
    score: number;
  }> = [];

  for (const current of currentPlayers) {
    const stableId = transfermarktId(current);
    const override = fantasyRankingOverrides[stableId];
    if (override?.officialPersonId !== undefined) {
      if (!byPerson.has(override.officialPersonId)) {
        throw new Error(
          `Ranking override for ${stableId} references missing Thai League person ${override.officialPersonId}.`,
        );
      }
      proposals.push({
        fantasyPlayerId: current.fantasyPlayerId,
        personId: override.officialPersonId,
        method: "manual",
        score: 1,
      });
      continue;
    }

    const normalized = normalizeRankingName(current.fullNameEn);
    const exact = exactNames.get(normalized) ?? [];
    if (exact.length === 1) {
      proposals.push({
        fantasyPlayerId: current.fantasyPlayerId,
        personId: exact[0],
        method: "exact_name",
        score: 1,
      });
      continue;
    }

    const candidates = [...byPerson.entries()]
      .map(([personId, rows]) => ({
        personId,
        score: scoreRankingNameMatch(current.fullNameEn, rows[0].fullNameEn),
      }))
      .sort((left, right) => right.score - left.score);
    const best = candidates[0];
    const next = candidates[1];
    if (
      best &&
      best.score >= FUZZY_MATCH_THRESHOLD &&
      best.score - (next?.score ?? 0) >= FUZZY_MATCH_GAP
    ) {
      proposals.push({
        fantasyPlayerId: current.fantasyPlayerId,
        personId: best.personId,
        method: "fuzzy_name",
        score: best.score,
      });
    }
  }

  proposals.sort(
    (left, right) =>
      Number(right.method === "manual") - Number(left.method === "manual") ||
      right.score - left.score ||
      left.fantasyPlayerId.localeCompare(right.fantasyPlayerId),
  );
  const claimedPersons = new Set<number>();
  const matches = new Map<
    string,
    {
      stats: HistoricalPlayerStats[];
      method: "exact_name" | "fuzzy_name" | "manual";
      score: number;
    }
  >();
  for (const proposal of proposals) {
    if (claimedPersons.has(proposal.personId)) continue;
    claimedPersons.add(proposal.personId);
    matches.set(proposal.fantasyPlayerId, {
      stats: byPerson.get(proposal.personId) ?? [],
      method: proposal.method,
      score: proposal.score,
    });
  }
  return matches;
}

async function getCurrentPlayers(
  fantasySeasonId: string,
  competitionSeasonId: string,
) {
  const rows = await db
    .select({
      fantasyPlayerId: fantasyPlayers.id,
      playerId: players.id,
      fullNameEn: players.fullNameEn,
      sourceUrl: players.sourceUrl,
      sourceExternalId: players.externalId,
      position: fantasyPlayers.lockedPosition,
      clubId: clubs.id,
      clubNameEn: clubs.nameEn,
      clubExternalId: clubs.externalId,
    })
    .from(fantasyPlayers)
    .innerJoin(players, eq(fantasyPlayers.playerId, players.id))
    .innerJoin(
      playerRegistrations,
      eq(playerRegistrations.playerId, players.id),
    )
    .innerJoin(
      competitionEntries,
      eq(playerRegistrations.competitionEntryId, competitionEntries.id),
    )
    .innerJoin(clubs, eq(competitionEntries.clubId, clubs.id))
    .where(
      and(
        eq(fantasyPlayers.fantasySeasonId, fantasySeasonId),
        eq(fantasyPlayers.isAvailable, true),
        eq(players.isActive, true),
        eq(playerRegistrations.status, "active"),
        eq(competitionEntries.competitionSeasonId, competitionSeasonId),
      ),
    )
    .orderBy(asc(players.fullNameEn));
  const unique = new Map(rows.map((row) => [row.fantasyPlayerId, row]));
  if (unique.size !== rows.length) {
    throw new Error(
      "Current Fantasy players contain duplicate active registrations.",
    );
  }
  return [...unique.values()] as CurrentPlayerRow[];
}

function buildCandidates(
  currentPlayers: CurrentPlayerRow[],
  historicalRows: HistoricalPlayerStats[],
  marketValues: Map<string, number | null>,
  clubContexts: Map<
    string,
    { attackMultiplier: number; defenseMultiplier: number }
  >,
) {
  const historicalMatches = matchHistoricalPlayers(
    currentPlayers,
    historicalRows,
  );
  return currentPlayers.map<RankingCandidate>((current) => {
    const stableId = transfermarktId(current);
    const match = historicalMatches.get(current.fantasyPlayerId);
    const context = clubContexts.get(current.clubExternalId);
    return {
      fantasyPlayerId: current.fantasyPlayerId,
      playerId: current.playerId,
      fullNameEn: current.fullNameEn,
      position: current.position,
      clubId: current.clubId,
      marketValueEur: marketValues.get(stableId) ?? null,
      historicalStats: match?.stats ?? [],
      matchMethod: match?.method ?? "none",
      matchScore: match?.score ?? null,
      manualAdjustment:
        fantasyRankingOverrides[stableId]?.manualAdjustment ?? 0,
      attackMultiplier: context?.attackMultiplier ?? 1,
      defenseMultiplier: context?.defenseMultiplier ?? 1,
    };
  });
}

function printSummary(rankings: PlayerRanking[]) {
  const summary = {
    players: rankings.length,
    tier1: rankings.filter((row) => row.tierLevel === 1).length,
    tier2: rankings.filter((row) => row.tierLevel === 2).length,
    tier3: rankings.filter((row) => row.tierLevel === 3).length,
    tier4: rankings.filter((row) => row.tierLevel === 4).length,
    exactMatches: rankings.filter((row) => row.matchMethod === "exact_name")
      .length,
    fuzzyMatches: rankings.filter((row) => row.matchMethod === "fuzzy_name")
      .length,
    manualMatches: rankings.filter((row) => row.matchMethod === "manual")
      .length,
    unmatched: rankings.filter((row) => row.matchMethod === "none").length,
    highConfidence: rankings.filter((row) => row.confidence === "high").length,
    mediumConfidence: rankings.filter((row) => row.confidence === "medium")
      .length,
    lowConfidence: rankings.filter((row) => row.confidence === "low").length,
  };
  console.table([summary]);
  console.table(
    rankings.slice(0, 30).map((row) => ({
      rank: row.overallRank,
      player: row.fullNameEn,
      position: row.position,
      points: row.projectedPoints,
      minutes: row.projectedMinutes,
      tier: row.tierLevel,
      confidence: row.confidence,
      match: row.matchMethod,
    })),
  );
  console.table(
    ([1, 2, 3, 4] as const).flatMap((tier) =>
      (["goalkeeper", "defender", "midfielder", "forward"] as const).map(
        (position) => ({
          tier,
          position,
          players: rankings.filter(
            (row) => row.tierLevel === tier && row.position === position,
          ).length,
        }),
      ),
    ),
  );
}

function csvCell(value: string | number | null) {
  if (value === null) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function writeCsv(rankings: PlayerRanking[], outputPath: string) {
  const header = [
    "rank",
    "position_rank",
    "player",
    "position",
    "projected_points",
    "projected_minutes",
    "previous_season_points",
    "previous_season_minutes",
    "market_value_eur",
    "confidence",
    "match_method",
    "tier",
    "reason",
  ];
  const lines = [
    header.join(","),
    ...rankings.map((row) =>
      [
        row.overallRank,
        row.positionRank,
        row.fullNameEn,
        row.position,
        row.projectedPoints,
        row.projectedMinutes,
        row.previousSeasonPoints,
        row.previousSeasonMinutes,
        row.marketValueEur,
        row.confidence,
        row.matchMethod,
        row.tierLevel,
        row.reason,
      ]
        .map(csvCell)
        .join(","),
    ),
  ];
  const resolved = path.resolve(outputPath);
  await writeFile(resolved, `${lines.join("\n")}\n`, "utf8");
  console.log(`Wrote ranking report to ${resolved}`);
}

async function assertDraftSquadsRemainValid(
  gameweekId: string,
  rankings: PlayerRanking[],
) {
  const selections = await db
    .select({ id: fantasyTeamSelections.id })
    .from(fantasyTeamSelections)
    .where(
      and(
        eq(fantasyTeamSelections.fantasyGameweekId, gameweekId),
        eq(fantasyTeamSelections.status, "draft"),
      ),
    );
  if (selections.length === 0) return;
  const members = await db
    .select()
    .from(fantasyTeamSelectionPlayers)
    .where(
      inArray(
        fantasyTeamSelectionPlayers.selectionId,
        selections.map((selection) => selection.id),
      ),
    );
  const tierByPlayer = new Map(
    rankings.map((ranking) => [ranking.fantasyPlayerId, ranking.tierLevel]),
  );
  for (const selection of selections) {
    const squad = members
      .filter((member) => member.selectionId === selection.id)
      .map((member) => ({
        id: member.fantasyPlayerId,
        clubId: member.clubIdSnapshot,
        position: member.positionSnapshot as FantasyPosition,
        tier: tierByPlayer.get(member.fantasyPlayerId) ?? member.tierSnapshot,
        isThai: member.isThaiSnapshot,
      }));
    if (squad.length === 0) continue;
    const violations = validateSquad(squad);
    if (violations.length > 0) {
      throw new Error(
        `Draft selection ${selection.id} would be invalid after ranking publication: ${violations.map((item) => item.code).join(", ")}.`,
      );
    }
  }
}

async function publishRankings({
  fantasySeason,
  gameweek,
  rankings,
  options,
  tierCounts,
}: {
  fantasySeason: typeof fantasySeasons.$inferSelect;
  gameweek: typeof fantasyGameweeks.$inferSelect;
  rankings: PlayerRanking[];
  options: Options;
  tierCounts: ReturnType<typeof deriveRankingTierCounts>;
}) {
  if (gameweek.status !== "open" && gameweek.status !== "planned") {
    throw new Error(
      `Gameweek ${gameweek.number} is ${gameweek.status}; publish to an open or planned Gameweek only.`,
    );
  }
  if (gameweek.deadlineAt <= new Date()) {
    throw new Error(`Gameweek ${gameweek.number} deadline has passed.`);
  }
  const lockedSelections = await db
    .select({ id: fantasyTeamSelections.id })
    .from(fantasyTeamSelections)
    .where(
      and(
        eq(fantasyTeamSelections.fantasyGameweekId, gameweek.id),
        eq(fantasyTeamSelections.status, "locked"),
      ),
    );
  const scoredSelections = await db
    .select({ id: fantasyTeamGameweekScores.id })
    .from(fantasyTeamGameweekScores)
    .innerJoin(
      fantasyTeamSelections,
      eq(fantasyTeamGameweekScores.selectionId, fantasyTeamSelections.id),
    )
    .where(eq(fantasyTeamSelections.fantasyGameweekId, gameweek.id));
  if (lockedSelections.length > 0 || scoredSelections.length > 0) {
    throw new Error(
      "Ranking publication cannot rewrite a Gameweek with locked selections or scores.",
    );
  }
  await assertDraftSquadsRemainValid(gameweek.id, rankings);

  const existing = await db.query.fantasyRankingRuns.findFirst({
    where: and(
      eq(fantasyRankingRuns.fantasySeasonId, fantasySeason.id),
      eq(fantasyRankingRuns.version, options.version),
    ),
  });
  if (existing?.status === "published") {
    throw new Error(`Ranking version ${options.version} is already published.`);
  }
  let rankingRun: typeof fantasyRankingRuns.$inferSelect;
  if (existing) {
    await db
      .delete(fantasyPlayerRankings)
      .where(eq(fantasyPlayerRankings.rankingRunId, existing.id));
    const updated = await db
      .update(fantasyRankingRuns)
      .set({
        effectiveGameweekId: gameweek.id,
        modelVersion: FANTASY_RANKING_MODEL_VERSION,
        dataCutoff: DATA_CUTOFF,
        totalPlayers: rankings.length,
        levelOneCount: tierCounts.levelOneCount,
        levelTwoCount: tierCounts.levelTwoCount,
        levelThreeCount: tierCounts.levelThreeCount,
        sourceName: SOURCE_NAME,
        sourceUrls: [...previousSeasonSourceUrls, sourceUrls.tournament],
        configuration: {
          previousSeasonId: PREVIOUS_SEASON_ID,
          previousSeasonYear: PREVIOUS_SEASON_YEAR,
          fuzzyMatchThreshold: FUZZY_MATCH_THRESHOLD,
          fuzzyMatchGap: FUZZY_MATCH_GAP,
          tierPercentages: options.tierPercentages,
        },
        notes:
          "Preseason ranking based on official prior-season statistics, current Transfermarkt squad values, and club context.",
        updatedAt: new Date(),
      })
      .where(eq(fantasyRankingRuns.id, existing.id))
      .returning();
    rankingRun = updated[0];
  } else {
    const inserted = await db
      .insert(fantasyRankingRuns)
      .values({
        fantasySeasonId: fantasySeason.id,
        effectiveGameweekId: gameweek.id,
        version: options.version,
        modelVersion: FANTASY_RANKING_MODEL_VERSION,
        dataCutoff: DATA_CUTOFF,
        totalPlayers: rankings.length,
        levelOneCount: tierCounts.levelOneCount,
        levelTwoCount: tierCounts.levelTwoCount,
        levelThreeCount: tierCounts.levelThreeCount,
        sourceName: SOURCE_NAME,
        sourceUrls: [...previousSeasonSourceUrls, sourceUrls.tournament],
        configuration: {
          previousSeasonId: PREVIOUS_SEASON_ID,
          previousSeasonYear: PREVIOUS_SEASON_YEAR,
          fuzzyMatchThreshold: FUZZY_MATCH_THRESHOLD,
          fuzzyMatchGap: FUZZY_MATCH_GAP,
          tierPercentages: options.tierPercentages,
        },
        notes:
          "Preseason ranking based on official prior-season statistics, current Transfermarkt squad values, and club context.",
      })
      .returning();
    rankingRun = inserted[0];
  }

  const rankingValues: Array<typeof fantasyPlayerRankings.$inferInsert> =
    rankings.map((ranking) => ({
      rankingRunId: rankingRun.id,
      fantasyPlayerId: ranking.fantasyPlayerId,
      overallRank: ranking.overallRank,
      positionRank: ranking.positionRank,
      positionSnapshot: ranking.position,
      tierLevel: ranking.tierLevel,
      modelProjectedPoints: ranking.modelProjectedPoints,
      manualAdjustment: ranking.manualAdjustment,
      projectedPoints: ranking.projectedPoints,
      projectedMinutes: ranking.projectedMinutes,
      previousSeasonPoints: ranking.previousSeasonPoints,
      previousSeasonMinutes: ranking.previousSeasonMinutes,
      marketValueEur: ranking.marketValueEur,
      confidence: ranking.confidence,
      matchMethod: ranking.matchMethod,
      matchScore: ranking.matchScore,
      sourcePlayerIds: ranking.sourcePlayerIds,
      sourceFacts: ranking.sourceFacts,
      modelComponents: ranking.modelComponents,
      reason: ranking.reason,
    }));
  for (const values of chunk(rankingValues)) {
    await db.insert(fantasyPlayerRankings).values(values);
  }

  const now = new Date();
  const tierValues: Array<typeof fantasyPlayerTiers.$inferInsert> =
    rankings.map((ranking) => ({
      fantasyPlayerId: ranking.fantasyPlayerId,
      effectiveGameweekId: gameweek.id,
      level: ranking.tierLevel,
      sourceName: `${SOURCE_NAME}:${options.version}`,
      reason: `Overall rank ${ranking.overallRank}/${rankings.length}; projected ${ranking.projectedPoints} points; confidence ${ranking.confidence}.`,
      updatedAt: now,
    }));
  const tierUpsert = db
    .insert(fantasyPlayerTiers)
    .values(tierValues)
    .onConflictDoUpdate({
      target: [
        fantasyPlayerTiers.fantasyPlayerId,
        fantasyPlayerTiers.effectiveGameweekId,
      ],
      set: {
        level: sql`excluded.level`,
        sourceName: sql`excluded.source_name`,
        reason: sql`excluded.reason`,
        updatedAt: now,
      },
    });
  const refreshDraftSnapshots = db.execute(sql`
    update fantasy_team_selection_players as member
    set tier_snapshot = ranking.tier_level,
        updated_at = ${now}
    from fantasy_player_rankings as ranking,
         fantasy_team_selections as selection
    where ranking.ranking_run_id = ${rankingRun.id}
      and ranking.fantasy_player_id = member.fantasy_player_id
      and selection.id = member.selection_id
      and selection.fantasy_gameweek_id = ${gameweek.id}
      and selection.status = 'draft'
  `);
  const supersedePrevious = db
    .update(fantasyRankingRuns)
    .set({ status: "superseded", updatedAt: now })
    .where(
      and(
        eq(fantasyRankingRuns.fantasySeasonId, fantasySeason.id),
        eq(fantasyRankingRuns.status, "published"),
        ne(fantasyRankingRuns.id, rankingRun.id),
      ),
    );
  const publishRun = db
    .update(fantasyRankingRuns)
    .set({ status: "published", publishedAt: now, updatedAt: now })
    .where(eq(fantasyRankingRuns.id, rankingRun.id));
  const audit = db.insert(fantasyAdminAuditLog).values({
    action: "publish_player_ranking",
    entityType: "fantasy_season",
    entityId: fantasySeason.id,
    reason: `Publish ${options.version} for Gameweek ${gameweek.number}.`,
    changedBy: "ranking-script",
    after: {
      rankingRunId: rankingRun.id,
      version: options.version,
      effectiveGameweekId: gameweek.id,
      totalPlayers: rankings.length,
      levelOneCount: tierCounts.levelOneCount,
      levelTwoCount: tierCounts.levelTwoCount,
      levelThreeCount: tierCounts.levelThreeCount,
      levelFourCount: tierCounts.levelFourCount,
      tierPercentages: options.tierPercentages,
    },
  });
  await db.batch([
    tierUpsert,
    refreshDraftSnapshots,
    supersedePrevious,
    publishRun,
    audit,
  ]);
  console.log(
    `Published ${options.version} to Gameweek ${gameweek.number} with ranking run ${rankingRun.id}.`,
  );
}

async function main() {
  const options = parseOptions();
  const fantasySeason = await db.query.fantasySeasons.findFirst({
    where: eq(fantasySeasons.slug, FANTASY_SEASON_SLUG),
  });
  if (!fantasySeason) throw new Error("Fantasy season was not found.");
  const gameweek = await db.query.fantasyGameweeks.findFirst({
    where: and(
      eq(fantasyGameweeks.fantasySeasonId, fantasySeason.id),
      eq(fantasyGameweeks.number, options.effectiveGameweek),
    ),
  });
  if (!gameweek) {
    throw new Error(
      `Fantasy Gameweek ${options.effectiveGameweek} was not found.`,
    );
  }
  const currentPlayers = await getCurrentPlayers(
    fantasySeason.id,
    fantasySeason.competitionSeasonId,
  );
  const [historicalRows, clubContextRows, currentSquads] = await Promise.all([
    fetchPreviousSeasonPlayerStats(),
    fetchPreviousSeasonClubContexts(),
    fetchCurrentTransfermarktSquads(),
  ]);
  const marketValues = new Map(
    currentSquads.flatMap((squad) =>
      squad.players.map(
        (player) => [player.externalId, player.marketValueEur] as const,
      ),
    ),
  );
  const clubContexts = new Map(
    [...clubContextRows]
      // Map keeps the last duplicate. Process TL2 first so TL1 remains the
      // preferred context if a club appeared in both tournaments.
      .sort((left, right) => right.tournamentLevel - left.tournamentLevel)
      .map((context) => [
        context.clubExternalId.toString(),
        {
          attackMultiplier: context.attackMultiplier,
          defenseMultiplier: context.defenseMultiplier,
        },
      ]),
  );
  const candidates = buildCandidates(
    currentPlayers,
    historicalRows,
    marketValues,
    clubContexts,
  );
  const tierCounts = deriveRankingTierCounts(
    candidates.length,
    options.tierPercentages,
  );
  const rankings = rankFantasyPlayers(candidates, tierCounts);
  if (rankings.length !== currentPlayers.length) {
    throw new Error(
      `Expected ${currentPlayers.length} rankings, received ${rankings.length}.`,
    );
  }
  printSummary(rankings);
  if (options.output) await writeCsv(rankings, options.output);
  if (options.publish) {
    await publishRankings({
      fantasySeason,
      gameweek,
      rankings,
      options,
      tierCounts,
    });
  } else {
    console.log(
      "Preview only. Re-run with --publish after reviewing the report.",
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
