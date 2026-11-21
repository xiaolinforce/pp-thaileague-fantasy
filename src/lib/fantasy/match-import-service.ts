import "server-only";
import { createHash } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  fantasyAdminAuditLog,
  fantasyGameweeks,
  fantasySeasons,
  fixtures,
  fantasyPlayerMatchStats,
  fantasyPlayerMatchPoints,
} from "@/db/schema";
import { lockFantasySeason, type FantasyTransaction } from "./season-lock";
import { FANTASY_SEASON_SLUG } from "./provisioning";
import { recalculateGameweek } from "./scoring-service";
import {
  prepareMatchImport,
  MatchImportError,
  type MatchRosterPlayer,
} from "./match-import";
export { MatchImportError };

const format = "match-import-v1";

function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function getMatchImportRoster(
  tx: FantasyTransaction,
  fixtureId: string,
) {
  const result = await tx.execute<
    MatchRosterPlayer & Record<string, unknown>
  >(sql`
    with game as (
      select f.*, fs.id season_id, gw.id gw_id, home.club_id home_club, away.club_id away_club,
        (f.kickoff_at at time zone 'Asia/Bangkok')::date match_date
      from fixtures f
      join competition_entries home on home.id=f.home_entry_id
      join competition_entries away on away.id=f.away_entry_id
      join fantasy_seasons fs on fs.competition_season_id=f.competition_season_id and fs.slug=${FANTASY_SEASON_SLUG}
      join fantasy_gameweeks gw on gw.fantasy_season_id=fs.id and gw.number=f.matchweek
      where f.id=${fixtureId}::uuid
    ), registered as (
      select distinct fp.id, e.club_id from game g
      join player_registrations r on r.competition_entry_id in (g.home_entry_id,g.away_entry_id)
      join competition_entries e on e.id=r.competition_entry_id
      join fantasy_players fp on fp.player_id=r.player_id and fp.fantasy_season_id=g.season_id
      where r.registered_from <= g.match_date and (
        (r.registered_until is null and r.status='active') or r.registered_until >= g.match_date)
    ), selections as (
      select distinct sp.fantasy_player_id id, sp.club_id_snapshot club_id, sp.position_snapshot position
      from game g join fantasy_team_selections sel on sel.fantasy_gameweek_id=g.gw_id
      join fantasy_team_selection_players sp on sp.selection_id=sel.id
      where sp.club_id_snapshot in (g.home_club,g.away_club)
    ), snapshots as (
      select pool.fantasy_player_id id, pool.club_id_snapshot club_id from game g
      join fantasy_gameweek_player_pool pool on pool.fantasy_gameweek_id=g.gw_id
      where pool.club_id_snapshot in (g.home_club,g.away_club)
      union select id, club_id from selections
    ), roster as (
      select id,club_id,true registered from registered
      union all select id,club_id,false from snapshots s
        where not exists (select 1 from registered r where r.id=s.id)
    )
    select distinct fp.id "fantasyPlayerId", coalesce(p.full_name_th,p.full_name_en) name,
      p.full_name_th "nameTh", p.full_name_en "nameEn", roster.registered,
      coalesce(pool.position_snapshot, sp.position, fp.locked_position)::text position,
      case when roster.club_id=g.home_club then 'home' else 'away' end side
    from game g cross join roster inner join fantasy_players fp on fp.id=roster.id
    join players p on p.id=fp.player_id
    left join fantasy_gameweek_player_pool pool on pool.fantasy_gameweek_id=g.gw_id and pool.fantasy_player_id=fp.id
    left join selections sp on sp.id=fp.id
    order by fp.id
  `);
  const roster = result.rows;
  if (new Set(roster.map((row) => row.fantasyPlayerId)).size !== roster.length)
    throw new MatchImportError(
      "Resolve overlapping club registrations for this fixture.",
      "กรุณาแก้ข้อมูลทะเบียนทีมที่ซ้อนกันในแมตช์นี้",
    );
  return roster;
}

async function latestAudit(tx: FantasyTransaction, fixtureId: string) {
  return tx.query.fantasyAdminAuditLog.findFirst({
    where: and(
      eq(fantasyAdminAuditLog.entityId, fixtureId),
      eq(fantasyAdminAuditLog.entityType, "fixture"),
      eq(fantasyAdminAuditLog.action, "import_match_batch"),
      sql`${fantasyAdminAuditLog.after}->>'format'=${format}`,
    ),
    orderBy: [
      desc(fantasyAdminAuditLog.createdAt),
      desc(fantasyAdminAuditLog.id),
    ],
  });
}

export async function getLatestMatchImport(
  tx: FantasyTransaction,
  fixtureId: string,
) {
  const last = await latestAudit(tx, fixtureId);
  if (!last?.after) return null;
  const {
    fixtureId: id,
    homeScore,
    awayScore,
    sources,
    events,
    uncertainties,
    players,
  } = last.after;
  return JSON.stringify(
    {
      fixtureId: id,
      homeScore,
      awayScore,
      sources,
      events,
      uncertainties,
      players,
    },
    null,
    2,
  );
}

async function inspect(
  tx: FantasyTransaction,
  fixtureId: string,
  raw: string,
  mode: "share" | "update",
) {
  const [target] = await tx
    .select({ seasonId: fantasySeasons.id })
    .from(fixtures)
    .innerJoin(
      fantasySeasons,
      eq(fantasySeasons.competitionSeasonId, fixtures.competitionSeasonId),
    )
    .where(
      and(
        eq(fixtures.id, fixtureId),
        eq(fantasySeasons.slug, FANTASY_SEASON_SLUG),
      ),
    );
  if (!target)
    throw new MatchImportError(
      "Fixture or Fantasy season was not found.",
      "ไม่พบแมตช์หรือฤดูกาลแฟนตาซี",
    );
  await lockFantasySeason(tx, target.seasonId, mode);
  const fixture = await tx.query.fixtures.findFirst({
    where: eq(fixtures.id, fixtureId),
  });
  if (
    !fixture ||
    !fixture.kickoffAt ||
    fixture.kickoffAt.getTime() > Date.now() ||
    ["postponed", "cancelled"].includes(fixture.status)
  )
    throw new MatchImportError(
      "Fixture kickoff or status is not eligible for a completed-match report.",
      "ยังลงผลจบแมตช์สำหรับเวลาแข่งขันหรือสถานะนี้ไม่ได้",
    );
  const week = await tx.query.fantasyGameweeks.findFirst({
    where: and(
      eq(fantasyGameweeks.fantasySeasonId, target.seasonId),
      eq(fantasyGameweeks.number, fixture.matchweek),
    ),
  });
  if (!week || week.status !== "provisional" || week.scoreComplete)
    throw new MatchImportError(
      "The fixture must belong to a provisional Gameweek.",
      "แมตช์ต้องอยู่ใน Gameweek ที่เป็น Provisional",
    );
  const roster = await getMatchImportRoster(tx, fixtureId);
  const { rows, payload } = prepareMatchImport(fixtureId, raw, roster);
  const previous = await tx
    .select({ stat: fantasyPlayerMatchStats, point: fantasyPlayerMatchPoints })
    .from(fantasyPlayerMatchStats)
    .leftJoin(
      fantasyPlayerMatchPoints,
      eq(
        fantasyPlayerMatchPoints.playerMatchStatsId,
        fantasyPlayerMatchStats.id,
      ),
    )
    .where(eq(fantasyPlayerMatchStats.fixtureId, fixtureId))
    .orderBy(fantasyPlayerMatchStats.fantasyPlayerId);
  const byPlayer = new Map(previous.map((p) => [p.stat.fantasyPlayerId, p]));
  const ids = new Set(rows.map((r) => r.fantasyPlayerId));
  if (previous.some((p) => !ids.has(p.stat.fantasyPlayerId)))
    throw new MatchImportError(
      "An existing result is outside the registered roster. Reconcile the registration before applying.",
      "พบสถิติเดิมของนักเตะนอกทะเบียน กรุณาตรวจทะเบียนก่อนบันทึก",
    );
  const digest = hash(payload);
  const latest = await latestAudit(tx, fixtureId);
  const unchanged =
    latest?.after?.digest === digest &&
    fixture.status === "finished" &&
    fixture.homeScore === payload.homeScore &&
    fixture.awayScore === payload.awayScore &&
    rows.every((row) => {
      const old = byPlayer.get(row.fantasyPlayerId);
      return (
        old &&
        old.point?.totalPoints === row.points.total &&
        Object.entries(row.stats).every(
          ([k, v]) => old.stat[k as keyof typeof row.stats] === v,
        ) &&
        Object.entries(row.points.breakdown).every(
          ([k, v]) => old.point?.breakdown[k] === v,
        )
      );
    });
  const preview = {
    unchanged,
    token: hash([
      digest,
      week.id,
      [fixture.updatedAt, fixture.status, fixture.homeScore, fixture.awayScore],
      latest?.id,
      roster.map((p) => [p.fantasyPlayerId, p.position, p.side, p.registered]),
      previous,
    ]),
    rows: rows.map((r) => ({
      fantasyPlayerId: r.fantasyPlayerId,
      points: r.points.total,
      previousPoints:
        byPlayer.get(r.fantasyPlayerId)?.point?.totalPoints ?? null,
    })),
  };
  return { preview, rows, payload, digest, fixture, week, previous, byPlayer };
}

export async function previewMatchImport(
  tx: FantasyTransaction,
  fixtureId: string,
  rawJson: string,
) {
  return (await inspect(tx, fixtureId, rawJson, "share")).preview;
}

export async function applyMatchImport(
  tx: FantasyTransaction,
  fixtureId: string,
  rawJson: string,
  previewToken: string,
  actor: string,
) {
  const { preview, rows, payload, digest, fixture, week, previous, byPlayer } =
    await inspect(tx, fixtureId, rawJson, "update");
  if (preview.unchanged) return preview;
  if (preview.token !== previewToken)
    throw new MatchImportError(
      "The report or match data changed. Preview again before applying.",
      "รายงานหรือข้อมูลแมตช์เปลี่ยนไป กรุณาดูตัวอย่างอีกครั้งก่อนบันทึก",
    );
  const now = new Date();
  const stats = await tx
    .insert(fantasyPlayerMatchStats)
    .values(
      rows.map((row) => ({
        fixtureId,
        fantasyPlayerId: row.fantasyPlayerId,
        ...row.stats,
        status: byPlayer.has(row.fantasyPlayerId)
          ? ("corrected" as const)
          : ("reviewed" as const),
        reviewedAt: now,
        sourceName: "PP Fantasy match import",
        sourcePayload: { format, digest, sources: payload.sources },
      })),
    )
    .onConflictDoUpdate({
      target: [
        fantasyPlayerMatchStats.fixtureId,
        fantasyPlayerMatchStats.fantasyPlayerId,
      ],
      set: {
        minutes: sql`excluded.minutes`,
        goals: sql`excluded.goals`,
        sourceAssists: sql`excluded.source_assists`,
        fantasyAssists: sql`excluded.fantasy_assists`,
        goalsConcededWhilePlaying: sql`excluded.goals_conceded_while_playing`,
        saves: sql`excluded.saves`,
        penaltySaves: sql`excluded.penalty_saves`,
        penaltyMisses: sql`excluded.penalty_misses`,
        yellowCards: sql`excluded.yellow_cards`,
        redCards: sql`excluded.red_cards`,
        ownGoals: sql`excluded.own_goals`,
        reviewedAt: now,
        updatedAt: now,
        status: "corrected",
        sourcePayload: sql`excluded.source_payload`,
        sourceName: "PP Fantasy match import",
      },
    })
    .returning({
      id: fantasyPlayerMatchStats.id,
      playerId: fantasyPlayerMatchStats.fantasyPlayerId,
    });
  const statIds = new Map(stats.map((s) => [s.playerId, s.id]));
  await tx
    .insert(fantasyPlayerMatchPoints)
    .values(
      rows.map((row) => ({
        playerMatchStatsId: statIds.get(row.fantasyPlayerId)!,
        breakdown: row.points.breakdown,
        totalPoints: row.points.total,
      })),
    )
    .onConflictDoUpdate({
      target: fantasyPlayerMatchPoints.playerMatchStatsId,
      set: {
        totalPoints: sql`excluded.total_points`,
        breakdown: sql`excluded.breakdown`,
        computedAt: now,
        updatedAt: now,
      },
    });
  await tx
    .update(fixtures)
    .set({
      status: "finished",
      homeScore: payload.homeScore,
      awayScore: payload.awayScore,
      updatedAt: now,
    })
    .where(eq(fixtures.id, fixtureId));
  await tx.insert(fantasyAdminAuditLog).values({
    createdAt: sql`clock_timestamp()`,
    updatedAt: sql`clock_timestamp()`,
    action: "import_match_batch",
    entityType: "fixture",
    entityId: fixtureId,
    changedBy: actor,
    reason: "Reviewed whole-match report",
    before: {
      status: fixture.status,
      homeScore: fixture.homeScore,
      awayScore: fixture.awayScore,
      players: previous,
    },
    after: { format, digest, ...payload },
  });
  await recalculateGameweek(week.id, tx);
  return preview;
}
