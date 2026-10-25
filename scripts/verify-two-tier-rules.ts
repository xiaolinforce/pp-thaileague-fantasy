import assert from "node:assert/strict";
import { loadEnvConfig } from "@next/env";
import { and, asc, eq, sql } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { autoFillSquadDraft } from "../src/lib/fantasy/auto-fill";
import { createEmptySquadDraft } from "../src/lib/fantasy/team-draft";
import {
  THAI_LEAGUE_FANTASY_RULES,
  validateLineup,
} from "../src/lib/fantasy/rules";

loadEnvConfig(process.cwd());

async function run() {
  const { transactionDb } = await import("../src/db/transaction");
  const rollback = new Error("two-tier-verification-rollback");
  try {
    const branch = (
      await transactionDb.execute<{ branch: string }>(
        sql`select current_setting('neon.branch_id', true) branch`,
      )
    ).rows[0]?.branch;
    const expected = process.argv
      .find((value) => value.startsWith("--branch-id="))
      ?.slice(12);
    assert.ok(
      expected &&
        expected === branch &&
        branch !== "br-floral-silence-azzesg4n",
      "An explicit matching non-production branch is required.",
    );
    const fingerprint = async () =>
      (
        await transactionDb.execute<{ hash: string }>(sql`
      select md5(string_agg(value, '' order by value)) hash from (
        select row_to_json(t)::text value from fantasy_gameweeks t
        union all select row_to_json(t)::text from fantasy_team_selections t
        union all select row_to_json(t)::text from fantasy_team_selection_players t
        union all select row_to_json(t)::text from fantasy_transfer_revisions t
        union all select row_to_json(t)::text from fantasy_player_ownerships t
        union all select row_to_json(t)::text from fantasy_gameweek_player_pool t
        union all select row_to_json(t)::text from fantasy_gameweek_optimal_teams t
        union all select row_to_json(t)::text from fantasy_gameweek_optimal_team_players t
        union all select row_to_json(t)::text from fantasy_team_gameweek_scores t
        union all select row_to_json(t)::text from fantasy_league_standings t
        union all select row_to_json(t)::text from fantasy_teams t
        union all select row_to_json(t)::text from fantasy_admin_audit_log t
      ) preserved
    `)
      ).rows[0]?.hash;
    const before = await fingerprint();
    const { getFantasyAutoFillCandidates } =
      await import("../src/data/fantasy-auto-fill");
    const {
      saveFantasySelectionInTransaction,
      revertFantasySelectionInTransaction,
    } = await import("../src/lib/fantasy/selection-service");
    const { lockFantasyGameweek } =
      await import("../src/lib/fantasy/admin-service");
    try {
      await transactionDb.transaction(async (tx) => {
        const gameweek = await tx.query.fantasyGameweeks.findFirst({
          where: and(
            eq(schema.fantasyGameweeks.status, "open"),
            eq(schema.fantasyGameweeks.tierRulesVersion, "two-tier-v1"),
          ),
        });
        assert.ok(gameweek, "An open two-tier test Gameweek is required.");
        const season = await tx.query.fantasySeasons.findFirst({
          where: eq(schema.fantasySeasons.id, gameweek.fantasySeasonId),
        });
        assert.ok(season);
        const [target] = await tx
          .select({
            selection: schema.fantasyTeamSelections,
            team: schema.fantasyTeams,
          })
          .from(schema.fantasyTeamSelections)
          .innerJoin(
            schema.fantasyTeams,
            eq(
              schema.fantasyTeams.id,
              schema.fantasyTeamSelections.fantasyTeamId,
            ),
          )
          .where(
            and(
              eq(schema.fantasyTeamSelections.fantasyGameweekId, gameweek.id),
              eq(schema.fantasyTeamSelections.status, "draft"),
              sql`exists (select 1 from fantasy_transfer_revisions r where r.selection_id=${schema.fantasyTeamSelections.id} and r.revision=1)
              and not exists (select 1 from fantasy_transfer_revisions r where r.selection_id=${schema.fantasyTeamSelections.id} and r.revision>1)`,
            ),
          )
          .limit(1);
        assert.ok(
          target,
          "A carried draft with a single baseline revision is required.",
        );
        const baseline = await tx.query.fantasyTransferRevisions.findFirst({
          where: eq(
            schema.fantasyTransferRevisions.selectionId,
            target.selection.id,
          ),
          orderBy: asc(schema.fantasyTransferRevisions.revision),
        });
        assert.ok(baseline);
        // The development fixture may deliberately have an expired deadline.
        // This extension exists only inside the transaction that always rolls back.
        await tx
          .update(schema.fantasyGameweeks)
          .set({ deadlineAt: new Date(Date.now() + 3_600_000) })
          .where(eq(schema.fantasyGameweeks.id, gameweek.id));
        const candidates = await getFantasyAutoFillCandidates(
          season,
          gameweek,
          tx,
        );
        assert.ok(candidates?.length);
        assert.ok(candidates.every((p) => p.tier === 1 || p.tier === 2));
        const filled = autoFillSquadDraft({
          members: createEmptySquadDraft(),
          candidates,
          random: () => 0.5,
        });
        assert.ok(filled);
        const byId = new Map(candidates.map((p) => [p.id, p]));
        const lineup = filled.members.map((member) => ({
          ...byId.get(member.fantasyPlayerId!)!,
          lineupRole: member.lineupRole,
          benchOrder: member.benchOrder,
          captainRole: member.captainRole,
        }));
        assert.equal(lineup.filter((p) => p.tier === 1).length, 5);
        assert.deepEqual(validateLineup(lineup), []);
        const owner = {
          seasonId: season.id,
          teamId: target.team.id,
          managerId: target.team.managerId,
        };
        const saved = await saveFantasySelectionInTransaction(
          owner,
          {
            selectionId: target.selection.id,
            expectedRevision: baseline.revision,
            members: filled.members,
            activeChip: "wildcard",
          },
          tx,
        );
        assert.ok(saved.ok, JSON.stringify(saved));
        const persisted = await tx
          .select()
          .from(schema.fantasyTeamSelectionPlayers)
          .where(
            eq(
              schema.fantasyTeamSelectionPlayers.selectionId,
              target.selection.id,
            ),
          );
        assert.equal(persisted.filter((p) => p.tierSnapshot === 1).length, 5);
        assert.ok(persisted.every((p) => p.tierSnapshot <= 2));

        // Keep every other constraint legal, then prove the server rejects a
        // sixth Level 1 player using fresh database classifications.
        let sixth: typeof filled.members | undefined;
        const selectedIds = new Set(lineup.map((p) => p.id));
        for (const [index, player] of lineup.entries()) {
          if (player.tier === 1) continue;
          for (const replacement of candidates) {
            if (
              replacement.tier !== 1 ||
              replacement.position !== player.position ||
              selectedIds.has(replacement.id)
            )
              continue;
            const proposed = lineup.map((p, i) =>
              i === index
                ? {
                    ...replacement,
                    lineupRole: p.lineupRole,
                    benchOrder: p.benchOrder,
                    captainRole: p.captainRole,
                  }
                : p,
            );
            const flexible = {
              ...THAI_LEAGUE_FANTASY_RULES,
              tierSlots: [
                { level: 1, slots: 15 },
                { level: 2, slots: 0 },
              ],
            };
            if (validateLineup(proposed, flexible).length) continue;
            sixth = filled.members.map((member, i) =>
              i === index
                ? { ...member, fantasyPlayerId: replacement.id }
                : member,
            );
            break;
          }
          if (sixth) break;
        }
        assert.ok(
          sixth,
          "The test pool must support six Level 1 players apart from the quota.",
        );
        const rejected = await saveFantasySelectionInTransaction(
          owner,
          {
            selectionId: target.selection.id,
            expectedRevision: saved.revision,
            members: sixth,
            activeChip: "wildcard",
          },
          tx,
        );
        assert.equal(rejected.ok, false);
        assert.ok(
          "violations" in rejected &&
            rejected.violations?.some((message) => message.includes("5")),
        );

        const restored = await revertFantasySelectionInTransaction(
          owner,
          {
            selectionId: target.selection.id,
            expectedRevision: saved.revision,
          },
          tx,
        );
        assert.ok(restored.ok, JSON.stringify(restored));
        const restoredRows = await tx
          .select()
          .from(schema.fantasyTeamSelectionPlayers)
          .where(
            eq(
              schema.fantasyTeamSelectionPlayers.selectionId,
              target.selection.id,
            ),
          );
        assert.ok(
          restoredRows.every(
            (p) => p.tierSnapshot === 1 || p.tierSnapshot === 2,
          ),
        );
        const unchanged = await tx.query.fantasyTransferRevisions.findFirst({
          where: eq(schema.fantasyTransferRevisions.id, baseline.id),
        });
        assert.deepEqual(unchanged, baseline);
        const form = new FormData();
        form.set("gameweekId", gameweek.id);
        await lockFantasyGameweek(form, "two-tier-verification", tx);
        const invalid = await tx.execute<{ n: number }>(sql`
          select count(*)::int n from fantasy_team_selection_players p
          join fantasy_team_selections s on s.id=p.selection_id
          join fantasy_gameweeks gw on gw.id=s.fantasy_gameweek_id
          where gw.tier_rules_version='two-tier-v1' and p.tier_snapshot not in (1,2)
        `);
        assert.equal(invalid.rows[0]?.n, 0);
        console.log(
          `GW${gameweek.number}: fresh candidates, five-player save, sixth-player rejection, legacy-baseline restore, lock and carryover passed.`,
        );
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
    assert.equal(
      await fingerprint(),
      before,
      "All integration writes must roll back.",
    );
    console.log(`All verification changes rolled back on ${branch}.`);
  } finally {
    await transactionDb.$client.end();
  }
}

run().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Two-tier verification failed.",
  );
  process.exitCode = 1;
});
