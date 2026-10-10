import assert from "node:assert/strict";
import { loadEnvConfig } from "@next/env";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { and, desc, eq, sql } from "drizzle-orm";
import * as schema from "../src/db/schema.ts";

loadEnvConfig(process.cwd());
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
let queries = 0;
const database = drizzle(pool, {
  schema,
  logger: {
    logQuery() {
      queries++;
    },
  },
});
const rollback = new Error("verification-rollback");

async function run() {
  const expected = process.argv
    .find((value) => value.startsWith("--branch-id="))
    ?.slice(12);
  const branch = (
    await database.execute<{ branch: string }>(
      sql`select current_setting('neon.branch_id', true) as branch`,
    )
  ).rows[0]?.branch;
  assert.ok(
    expected && expected === branch,
    "Explicit matching development branch is required.",
  );
  const {
    saveFantasySelectionInTransaction,
    revertFantasySelectionInTransaction,
  } = await import("../src/lib/fantasy/selection-service.ts");
  const { lockFantasySeason } =
    await import("../src/lib/fantasy/season-lock.ts");
  const {
    savePlayerMatchStats,
    updateFantasyPlayerClassification,
    lockFantasyGameweek,
  } = await import("../src/lib/fantasy/admin-service.ts");
  const [target] = await database
    .select({
      selection: schema.fantasyTeamSelections,
      team: schema.fantasyTeams,
      gameweek: schema.fantasyGameweeks,
    })
    .from(schema.fantasyTeamSelections)
    .innerJoin(
      schema.fantasyTeams,
      eq(schema.fantasyTeams.id, schema.fantasyTeamSelections.fantasyTeamId),
    )
    .innerJoin(
      schema.fantasyGameweeks,
      eq(
        schema.fantasyGameweeks.id,
        schema.fantasyTeamSelections.fantasyGameweekId,
      ),
    )
    .where(
      and(
        eq(schema.fantasyTeamSelections.status, "draft"),
        eq(schema.fantasyGameweeks.status, "open"),
      ),
    )
    .limit(1);
  assert.ok(target, "An open development Gameweek is required.");
  const members = await database
    .select()
    .from(schema.fantasyTeamSelectionPlayers)
    .where(
      eq(schema.fantasyTeamSelectionPlayers.selectionId, target.selection.id),
    );
  assert.equal(members.length, 15, "A complete development squad is required.");
  const [latest] = await database
    .select()
    .from(schema.fantasyTransferRevisions)
    .where(eq(schema.fantasyTransferRevisions.selectionId, target.selection.id))
    .orderBy(desc(schema.fantasyTransferRevisions.revision))
    .limit(1);
  const owner = {
    seasonId: target.team.fantasySeasonId,
    teamId: target.team.id,
    managerId: target.team.managerId,
  };
  const input = {
    selectionId: target.selection.id,
    expectedRevision: latest?.revision ?? 0,
    members,
    activeChip: target.selection.activeChip,
  };
  const fingerprint = async () =>
    (
      await database.execute<{ digest: string }>(sql`
    select md5(string_agg(value, '' order by value)) as digest from (
      select row_to_json(t)::text as value from fantasy_team_selections t
      union all select row_to_json(t)::text from fantasy_team_selection_players t
      union all select row_to_json(t)::text from fantasy_transfer_revisions t
      union all select row_to_json(t)::text from fantasy_player_match_stats t
      union all select row_to_json(t)::text from fantasy_player_match_points t
      union all select row_to_json(t)::text from fantasy_team_gameweek_scores t
      union all select row_to_json(t)::text from fantasy_stat_overrides t
      union all select row_to_json(t)::text from fantasy_admin_audit_log t
      union all select row_to_json(t)::text from fantasy_league_standings t
      union all select row_to_json(t)::text from fantasy_gameweeks t
      union all select row_to_json(t)::text from fantasy_teams t
      union all select row_to_json(t)::text from fantasy_players t
      union all select row_to_json(t)::text from fantasy_player_tiers t
      union all select row_to_json(t)::text from player_registrations t
    ) records
  `)
    ).rows[0].digest;
  const before = await fingerprint();
  async function rolledBack(
    work: (
      tx: Parameters<Parameters<typeof database.transaction>[0]>[0],
    ) => Promise<void>,
    expectedError = rollback,
  ) {
    await assert.rejects(
      database.transaction(async (tx) => {
        // Historical development scenarios may have an expired open deadline.
        // Keep the fixture editable only inside this rolled-back transaction.
        if (target.gameweek.deadlineAt.getTime() <= Date.now()) {
          await tx
            .update(schema.fantasyGameweeks)
            .set({ deadlineAt: new Date(Date.now() + 86_400_000) })
            .where(eq(schema.fantasyGameweeks.id, target.gameweek.id));
        }
        await work(tx);
        throw rollback;
      }),
      (error) => error === expectedError,
    );
    assert.equal(
      await fingerprint(),
      before,
      "No persisted Fantasy state may change during verification.",
    );
  }

  await rolledBack(async (tx) => {
    assert.equal(
      (
        await saveFantasySelectionInTransaction(
          owner,
          {
            ...input,
            members: [
              ...members,
              { ...members[0], fantasyPlayerId: crypto.randomUUID() },
            ],
          },
          tx,
        )
      ).ok,
      false,
    );
    assert.equal(
      (
        await saveFantasySelectionInTransaction(
          owner,
          {
            ...input,
            members: members.map((m, index) =>
              index ? m : { ...m, fantasyPlayerId: crypto.randomUUID() },
            ),
          },
          tx,
        )
      ).ok,
      false,
    );
    assert.equal(
      (await saveFantasySelectionInTransaction(owner, input, tx)).ok,
      true,
    );
    const conflict = await saveFantasySelectionInTransaction(owner, input, tx);
    assert.equal(conflict.ok, false);
    assert.ok(!conflict.ok && conflict.conflict);
    await tx
      .update(schema.fantasyGameweeks)
      .set({ deadlineAt: new Date(0) })
      .where(eq(schema.fantasyGameweeks.id, target.gameweek.id));
    assert.equal(
      (
        await saveFantasySelectionInTransaction(
          owner,
          { ...input, expectedRevision: input.expectedRevision + 1 },
          tx,
        )
      ).ok,
      false,
    );
  });
  console.log(
    "Squad payload, missing player, revision conflict and deadline verified.",
  );

  await rolledBack(async (tx) => {
    const season = await lockFantasySeason(tx, owner.seasonId);
    const [registration] = await tx
      .select({
        registration: schema.playerRegistrations,
        player: schema.fantasyPlayers,
      })
      .from(schema.fantasyPlayers)
      .innerJoin(
        schema.playerRegistrations,
        eq(schema.playerRegistrations.playerId, schema.fantasyPlayers.playerId),
      )
      .innerJoin(
        schema.competitionEntries,
        eq(
          schema.competitionEntries.id,
          schema.playerRegistrations.competitionEntryId,
        ),
      )
      .where(
        and(
          eq(schema.fantasyPlayers.id, members[0].fantasyPlayerId),
          eq(schema.playerRegistrations.status, "active"),
          eq(
            schema.competitionEntries.competitionSeasonId,
            season.competitionSeasonId,
          ),
        ),
      );
    assert.ok(registration);
    const entries = await tx
      .select()
      .from(schema.competitionEntries)
      .where(
        and(
          eq(
            schema.competitionEntries.competitionSeasonId,
            season.competitionSeasonId,
          ),
          eq(schema.competitionEntries.isActive, true),
        ),
      );
    const unusedClub = entries.find(
      (entry) =>
        !members.some((member) => member.clubIdSnapshot === entry.clubId),
    );
    assert.ok(unusedClub, "A club outside the fixture squad is required.");
    await tx
      .update(schema.playerRegistrations)
      .set({ competitionEntryId: unusedClub.id })
      .where(eq(schema.playerRegistrations.id, registration.registration.id));
    const saved = await saveFantasySelectionInTransaction(owner, input, tx);
    assert.ok(saved.ok, saved.message);
    const refreshed = await tx.query.fantasyTeamSelectionPlayers.findFirst({
      where: and(
        eq(schema.fantasyTeamSelectionPlayers.selectionId, target.selection.id),
        eq(
          schema.fantasyTeamSelectionPlayers.fantasyPlayerId,
          members[0].fantasyPlayerId,
        ),
      ),
    });
    assert.equal(refreshed?.clubIdSnapshot, unusedClub.clubId);
    const savedSelection = await tx.query.fantasyTeamSelections.findFirst({
      where: eq(schema.fantasyTeamSelections.id, target.selection.id),
    });
    assert.equal(
      savedSelection?.netTransferCount,
      target.selection.netTransferCount,
    );
    const restored = await revertFantasySelectionInTransaction(
      owner,
      { selectionId: target.selection.id, expectedRevision: saved.revision },
      tx,
    );
    assert.ok(restored.ok, restored.message);
    const restoredPlayer = await tx.query.fantasyTeamSelectionPlayers.findFirst(
      {
        where: and(
          eq(
            schema.fantasyTeamSelectionPlayers.selectionId,
            target.selection.id,
          ),
          eq(
            schema.fantasyTeamSelectionPlayers.fantasyPlayerId,
            members[0].fantasyPlayerId,
          ),
        ),
      },
    );
    assert.equal(restoredPlayer?.clubIdSnapshot, unusedClub.clubId);
    await tx
      .update(schema.fantasyPlayers)
      .set({ isAvailable: false })
      .where(eq(schema.fantasyPlayers.id, members[0].fantasyPlayerId));
    const rejected = await saveFantasySelectionInTransaction(
      owner,
      { ...input, expectedRevision: restored.revision },
      tx,
    );
    assert.equal(rejected.ok, false);
    assert.match(rejected.message, /ไม่พร้อมให้เลือก/);
  });
  console.log(
    "Club transfers refresh save and baseline restore without charging Fantasy transfers; unavailable saves are rejected.",
  );

  await rolledBack(async (tx) => {
    await lockFantasySeason(tx, owner.seasonId);
    await assert.rejects(
      database.transaction(async (other) => {
        await other.execute(sql`set local lock_timeout = '100ms'`);
        await saveFantasySelectionInTransaction(owner, input, other);
      }),
      (error: unknown) => {
        const cause = error as { cause?: { code?: string }; code?: string };
        return (cause.cause?.code ?? cause.code) === "55P03";
      },
    );
    await tx
      .update(schema.fantasyTeamSelections)
      .set({ status: "locked" })
      .where(eq(schema.fantasyTeamSelections.id, target.selection.id));
    assert.equal(
      (await saveFantasySelectionInTransaction(owner, input, tx)).ok,
      false,
    );
  });
  console.log(
    "Concurrent lifecycle exclusion and locked-selection rejection verified.",
  );

  for (const mutation of [
    sql`update fantasy_team_selection_players set bench_order = null where id = ${members.find((m) => m.lineupRole === "bench")!.id}::uuid`,
    sql`update fantasy_team_selection_players set bench_order = 0 where selection_id = ${target.selection.id}::uuid and lineup_role = 'bench'`,
    sql`update fantasy_team_selection_players set captain_role = 'captain' where selection_id = ${target.selection.id}::uuid and lineup_role = 'starter'`,
    sql`update fantasy_team_selections set fantasy_season_id = ${crypto.randomUUID()}::uuid where id = ${target.selection.id}::uuid`,
    sql`update fantasy_team_selection_players set fantasy_season_id = ${crypto.randomUUID()}::uuid where id = ${members[0].id}::uuid`,
  ]) {
    await assert.rejects(
      database.transaction((tx) => tx.execute(mutation)),
      (error: unknown) =>
        ["23502", "23503", "23505", "23514"].includes(
          (error as { cause: { code: string } }).cause?.code,
        ),
    );
  }
  assert.equal(await fingerprint(), before);
  console.log("Database bench, captain and season constraints verified.");

  const [stat] = await database
    .select()
    .from(schema.fantasyPlayerMatchStats)
    .limit(1);
  assert.ok(stat, "A reviewed match stat is required.");
  const statsForm = new FormData();
  for (const [key, value] of Object.entries(stat))
    if (value !== null) statsForm.set(key, String(value));
  statsForm.set("goals", String(stat.goals + 1));
  statsForm.set("reason", "Rollback verification");
  const injected = new Error("injected-scoring-failure");
  await rolledBack(async (tx) => {
    const failing = new Proxy(tx, {
      get(target, property, receiver) {
        if (property === "insert")
          return (table: unknown) => {
            if (table === schema.fantasyTeamGameweekScores) throw injected;
            return target.insert(
              table as typeof schema.fantasyPlayerMatchStats,
            );
          };
        return Reflect.get(target, property, receiver);
      },
    });
    await savePlayerMatchStats(statsForm, "rollback-verification", failing);
  }, injected);
  console.log(
    "Failure during team scoring rolls back stats, player points and audits.",
  );
  await rolledBack(async (tx) => {
    const classification = new FormData();
    classification.set("fantasyPlayerId", members[0].fantasyPlayerId);
    classification.set("effectiveGameweekId", target.gameweek.id);
    classification.set("level", "4");
    classification.set("isThai", String(!members[0].isThaiSnapshot));
    classification.set("reason", "Rollback verification");
    await updateFantasyPlayerClassification(
      classification,
      "rollback-verification",
      tx,
    );
  });
  console.log(
    "Classification, effective tier, snapshots and audit rollback verified.",
  );
  const queryStart = queries;
  const timeStart = Date.now();
  await rolledBack(async (tx) => {
    const form = new FormData();
    form.set("gameweekId", target.gameweek.id);
    const staleClub = await tx.query.competitionEntries.findFirst({
      where: and(
        eq(
          schema.competitionEntries.competitionSeasonId,
          (await tx.query.fantasySeasons.findFirst({
            where: eq(schema.fantasySeasons.id, owner.seasonId),
          }))!.competitionSeasonId,
        ),
        sql`${schema.competitionEntries.clubId} <> ${members[0].clubIdSnapshot}::uuid`,
      ),
    });
    assert.ok(staleClub);
    await tx
      .update(schema.fantasyTeamSelectionPlayers)
      .set({ clubIdSnapshot: staleClub.clubId })
      .where(eq(schema.fantasyTeamSelectionPlayers.id, members[0].id));
    await lockFantasyGameweek(form, "rollback-verification", tx);
    const locked = await tx.query.fantasyTeamSelections.findFirst({
      where: eq(schema.fantasyTeamSelections.id, target.selection.id),
    });
    assert.equal(locked?.status, "locked");
    const deadlinePlayer = await tx.query.fantasyGameweekPlayerPool.findFirst({
      where: and(
        eq(
          schema.fantasyGameweekPlayerPool.fantasyGameweekId,
          target.gameweek.id,
        ),
        eq(
          schema.fantasyGameweekPlayerPool.fantasyPlayerId,
          members[0].fantasyPlayerId,
        ),
      ),
    });
    const lockedPlayer = await tx.query.fantasyTeamSelectionPlayers.findFirst({
      where: eq(schema.fantasyTeamSelectionPlayers.id, members[0].id),
    });
    assert.ok(deadlinePlayer);
    assert.equal(lockedPlayer?.clubIdSnapshot, deadlinePlayer.clubIdSnapshot);
    const clubAudit = await tx.query.fantasyAdminAuditLog.findFirst({
      where: and(
        eq(schema.fantasyAdminAuditLog.action, "refresh_deadline_player_club"),
        eq(schema.fantasyAdminAuditLog.entityId, members[0].id),
      ),
    });
    assert.equal(clubAudit?.before?.clubIdSnapshot, staleClub.clubId);
    assert.equal(
      clubAudit?.after?.clubIdSnapshot,
      deadlinePlayer.clubIdSnapshot,
    );
    const baseline = await tx.query.fantasyTransferRevisions.findFirst({
      where: eq(schema.fantasyTransferRevisions.id, latest!.id),
    });
    assert.deepEqual(baseline?.lineup, latest?.lineup);
    assert.ok(
      await tx.query.fantasyTeamGameweekScores.findFirst({
        where: eq(
          schema.fantasyTeamGameweekScores.selectionId,
          target.selection.id,
        ),
      }),
    );
  });
  console.log(
    `Lock, carryover, batched scores and standings verified: ${queries - queryStart} SQL statements including transaction and checksum; ${Date.now() - timeStart} ms. All changes rolled back on ${branch}.`,
  );
}
run()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Verification failed.",
    );
    process.exitCode = 1;
  })
  .finally(() => pool.end());
