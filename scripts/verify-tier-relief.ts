import assert from "node:assert/strict";
import { loadEnvConfig } from "@next/env";
import { and, asc, eq, sql } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { autoFillSquadDraft } from "../src/lib/fantasy/auto-fill";
import { createEmptySquadDraft } from "../src/lib/fantasy/team-draft";
import { validateLineup } from "../src/lib/fantasy/rules";

loadEnvConfig(process.cwd());

async function run() {
  const { transactionDb: db } = await import("../src/db/transaction");
  const { getFantasyAutoFillCandidates } =
    await import("../src/data/fantasy-auto-fill");
  const {
    publishTierChange,
    getTierRelief,
    consumeTierRelief,
    adoptAuditedTierChange,
  } = await import("../src/lib/fantasy/tier-relief-service");
  const {
    saveFantasySelectionInTransaction: save,
    revertFantasySelectionInTransaction: revert,
  } = await import("../src/lib/fantasy/selection-service");
  const { lockFantasyGameweek } =
    await import("../src/lib/fantasy/admin-service");
  const rollback = new Error("tier-relief-verification-rollback");
  try {
    const branch = (
      await db.execute<{ branch: string }>(
        sql`select current_setting('neon.branch_id',true) branch`,
      )
    ).rows[0]?.branch;
    const expected = process.argv
      .find((a) => a.startsWith("--branch-id="))
      ?.slice(12);
    assert.ok(
      expected &&
        expected === branch &&
        branch !== "br-floral-silence-azzesg4n",
      "Explicit matching non-production branch required",
    );
    const fingerprint = async () =>
      (
        await db.execute<{ hash: string }>(sql`
      select md5(string_agg(value,'' order by value)) hash from (
        select row_to_json(t)::text value from fantasy_gameweeks t
        union all select row_to_json(t)::text from fantasy_team_selections t
        union all select row_to_json(t)::text from fantasy_team_selection_players t
        union all select row_to_json(t)::text from fantasy_transfer_revisions t
        union all select row_to_json(t)::text from fantasy_player_tiers t
        union all select row_to_json(t)::text from fantasy_tier_change_events t
        union all select row_to_json(t)::text from fantasy_tier_reliefs t
        union all select row_to_json(t)::text from fantasy_admin_audit_log t
        union all select row_to_json(t)::text from fantasy_player_ownerships t
        union all select row_to_json(t)::text from fantasy_team_gameweek_scores t
        union all select row_to_json(t)::text from fantasy_league_standings t
        union all select row_to_json(t)::text from fantasy_gameweek_optimal_teams t
        union all select row_to_json(t)::text from fantasy_gameweek_optimal_team_players t
        union all select row_to_json(t)::text from fantasy_teams t
      ) preserved`)
      ).rows[0]?.hash;
    const before = await fingerprint();
    try {
      await db.transaction(async (tx) => {
        const gw = await tx.query.fantasyGameweeks.findFirst({
          where: and(
            eq(schema.fantasyGameweeks.status, "open"),
            eq(schema.fantasyGameweeks.tierRulesVersion, "two-tier-v1"),
          ),
        });
        assert.ok(gw);
        const season = await tx.query.fantasySeasons.findFirst({
          where: eq(schema.fantasySeasons.id, gw.fantasySeasonId),
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
              eq(schema.fantasyTeamSelections.fantasyGameweekId, gw.id),
              eq(schema.fantasyTeamSelections.status, "draft"),
              sql`exists (select 1 from fantasy_transfer_revisions r where r.selection_id=${schema.fantasyTeamSelections.id} and r.revision=1) and not exists (select 1 from fantasy_transfer_revisions r where r.selection_id=${schema.fantasyTeamSelections.id} and r.revision>1)`,
            ),
          )
          .limit(1);
        assert.ok(target);
        await tx
          .update(schema.fantasyGameweeks)
          .set({ deadlineAt: new Date(Date.now() + 3_600_000) })
          .where(eq(schema.fantasyGameweeks.id, gw.id));
        const owner = {
          seasonId: season.id,
          teamId: target.team.id,
          managerId: target.team.managerId,
        };
        let candidates = await getFantasyAutoFillCandidates(season, gw, tx);
        assert.ok(candidates);
        const filled = autoFillSquadDraft({
          members: createEmptySquadDraft(),
          candidates,
          random: () => 0.5,
        });
        assert.ok(filled);
        const first = await save(
          owner,
          {
            selectionId: target.selection.id,
            expectedRevision: 1,
            members: filled.members,
            activeChip: "wildcard",
          },
          tx,
        );
        assert.ok(first.ok, JSON.stringify(first));
        let revision = first.revision;
        const byId = new Map(candidates.map((p) => [p.id, p]));
        const promoted = filled.members
          .filter((m) => byId.get(m.fantasyPlayerId!)?.tier === 2)
          .slice(0, 3)
          .map((m) => m.fantasyPlayerId!);
        // Rehearse adoption of pre-feature maintenance using audit and revisions.
        // A nested rollback leaves the live-event scenario below independent.
        try {
          await tx.transaction(async (recovery) => {
            await recovery
              .insert(schema.fantasyPlayerTiers)
              .values(
                promoted.map((fantasyPlayerId) => ({
                  fantasyPlayerId,
                  effectiveGameweekId: gw.id,
                  level: 1,
                  sourceName: "verification",
                })),
              )
              .onConflictDoUpdate({
                target: [
                  schema.fantasyPlayerTiers.fantasyPlayerId,
                  schema.fantasyPlayerTiers.effectiveGameweekId,
                ],
                set: { level: 1 },
              });
            const [source] = await recovery
              .insert(schema.fantasyAdminAuditLog)
              .values({
                action: "review_two_tier_player_levels",
                entityType: "fantasy_gameweek",
                entityId: gw.id,
                changedBy: "verification",
                reason: "Rollback-only recovery evidence",
                createdAt: new Date(Date.now() + 1000),
                after: {
                  plan: candidates!.map((p) => ({
                    id: p.id,
                    oldLevel: p.tier,
                    level: promoted.includes(p.id) ? 1 : p.tier,
                  })),
                  overQuotaTeams: [{ team_id: target.team.id }],
                },
              })
              .returning();
            const adopted = await adoptAuditedTierChange(
              recovery,
              source.id,
              "verification",
            );
            const allowance = await getTierRelief(
              recovery,
              target.selection.id,
            );
            assert.equal(
              allowance?.allowedPlayerIds.length,
              8,
              "Recovery proves the original eight identities",
            );
            // Consumed rights must not reappear when the same maintenance is retried.
            const ended = filled.members.map((m, i) => ({
              id: m.fantasyPlayerId!,
              tier: i < 5 ? 1 : 2,
            }));
            await consumeTierRelief(
              recovery,
              target.selection.id,
              ended,
              "verification",
            );
            assert.equal(
              await adoptAuditedTierChange(recovery, source.id, "verification"),
              adopted,
            );
            assert.deepEqual(
              (await getTierRelief(recovery, target.selection.id))
                ?.allowedPlayerIds,
              [],
            );
            throw rollback;
          });
        } catch (error) {
          if (error !== rollback) throw error;
        }
        await publishTierChange(tx, {
          gameweekId: gw.id,
          changes: promoted.map((fantasyPlayerId) => ({
            fantasyPlayerId,
            level: 1,
          })),
          reason: "Rollback-only first performance event",
          changedBy: "tier-relief-verification",
        });
        let relief = await getTierRelief(tx, target.selection.id);
        assert.equal(relief?.allowedPlayerIds.length, 8);
        const unchanged = await save(
          owner,
          {
            selectionId: target.selection.id,
            expectedRevision: revision,
            members: filled.members,
            activeChip: "wildcard",
          },
          tx,
        );
        assert.ok(unchanged.ok, JSON.stringify(unchanged));
        revision = unchanged.revision;
        candidates = await getFantasyAutoFillCandidates(season, gw, tx);
        assert.ok(candidates);
        const fresh = new Map(candidates.map((p) => [p.id, p]));
        const selectedIds = new Set(
          filled.members.map((m) => m.fantasyPlayerId),
        );
        const asLineup = (members: typeof filled.members) =>
          members.map((m) => ({
            ...fresh.get(m.fantasyPlayerId!)!,
            lineupRole: m.lineupRole,
            benchOrder: m.benchOrder,
            captainRole: m.captainRole,
          }));
        const replace = (members: typeof filled.members, tier: number) => {
          for (const [index, m] of members.entries()) {
            const old = fresh.get(m.fantasyPlayerId!)!;
            if (old.tier !== 1) continue;
            for (const candidate of candidates!) {
              if (
                candidate.tier !== tier ||
                candidate.position !== old.position ||
                selectedIds.has(candidate.id)
              )
                continue;
              const proposed = members.map((p, i) =>
                i === index ? { ...p, fantasyPlayerId: candidate.id } : p,
              );
              if (
                validateLineup(asLineup(proposed)).filter(
                  (v) => v.code !== "tier_quota",
                ).length === 0
              )
                return proposed;
            }
          }
          throw new Error("No legal replacement fixture");
        };
        const forbidden = await save(
          owner,
          {
            selectionId: target.selection.id,
            expectedRevision: revision,
            members: replace(filled.members, 1),
            activeChip: "wildcard",
          },
          tx,
        );
        assert.equal(
          forbidden.ok,
          false,
          "New elite while over quota must fail",
        );
        const seven = replace(filled.members, 2);
        const reduced = await save(
          owner,
          {
            selectionId: target.selection.id,
            expectedRevision: revision,
            members: seven,
            activeChip: "wildcard",
          },
          tx,
        );
        assert.ok(reduced.ok, JSON.stringify(reduced));
        revision = reduced.revision;
        relief = await getTierRelief(tx, target.selection.id);
        assert.equal(relief?.allowedPlayerIds.length, 7);
        const undo = await save(
          owner,
          {
            selectionId: target.selection.id,
            expectedRevision: revision,
            members: filled.members,
            activeChip: "wildcard",
          },
          tx,
        );
        assert.equal(undo.ok, false, "Sold allowance cannot be resurrected");
        const stale = await save(
          owner,
          {
            selectionId: target.selection.id,
            expectedRevision: revision - 1,
            members: seven,
            activeChip: "wildcard",
          },
          tx,
        );
        assert.ok(
          !stale.ok && stale.conflict,
          "Concurrent stale revisions fail",
        );
        // A restore uses current tiers, never the old tier-2 snapshot to evade relief.
        const [baseline] = await tx
          .select()
          .from(schema.fantasyTransferRevisions)
          .where(
            eq(
              schema.fantasyTransferRevisions.selectionId,
              target.selection.id,
            ),
          )
          .orderBy(asc(schema.fantasyTransferRevisions.revision));
        const [savedBeforePromotion] = await tx
          .select()
          .from(schema.fantasyTransferRevisions)
          .where(
            and(
              eq(
                schema.fantasyTransferRevisions.selectionId,
                target.selection.id,
              ),
              eq(schema.fantasyTransferRevisions.revision, first.revision),
            ),
          );
        await tx
          .update(schema.fantasyTransferRevisions)
          .set({
            squad: savedBeforePromotion.squad,
            lineup: savedBeforePromotion.lineup,
          })
          .where(eq(schema.fantasyTransferRevisions.id, baseline.id));
        const restored = await revert(
          owner,
          { selectionId: target.selection.id, expectedRevision: revision },
          tx,
        );
        assert.equal(
          restored.ok,
          false,
          "Restore must not resurrect sold elite using stale tiers",
        );
        const next = await tx.query.fantasyGameweeks.findFirst({
          where: and(
            eq(schema.fantasyGameweeks.fantasySeasonId, season.id),
            eq(schema.fantasyGameweeks.number, gw.number + 1),
          ),
        });
        assert.ok(next);
        await tx
          .update(schema.fantasyGameweeks)
          .set({ deadlineAt: new Date(Date.now() + 7_200_000) })
          .where(eq(schema.fantasyGameweeks.id, next.id));
        const futurePlayer = seven.find(
          (m) => fresh.get(m.fantasyPlayerId!)?.tier === 2,
        )!.fantasyPlayerId!;
        await publishTierChange(tx, {
          gameweekId: next.id,
          changes: [{ fantasyPlayerId: futurePlayer, level: 1 }],
          reason: "Rollback-only future event",
          changedBy: "tier-relief-verification",
        });
        assert.equal(
          (await getTierRelief(tx, target.selection.id))?.allowedPlayerIds
            .length,
          7,
          "Scheduling must not change current allowance",
        );
        const form = new FormData();
        form.set("gameweekId", gw.id);
        await lockFantasyGameweek(form, "tier-relief-verification", tx);
        const nextSelection = await tx.query.fantasyTeamSelections.findFirst({
          where: and(
            eq(schema.fantasyTeamSelections.fantasyGameweekId, next.id),
            eq(schema.fantasyTeamSelections.fantasyTeamId, target.team.id),
          ),
        });
        assert.ok(nextSelection);
        const nextRelief = await getTierRelief(tx, nextSelection.id);
        assert.equal(nextRelief?.allowedPlayerIds.length, 8);
        assert.equal(
          (await getTierRelief(tx, target.selection.id))?.allowedPlayerIds
            .length,
          7,
          "Locked allowance is immutable",
        );
        const nextRows = await tx
          .select()
          .from(schema.fantasyTeamSelectionPlayers)
          .where(
            eq(
              schema.fantasyTeamSelectionPlayers.selectionId,
              nextSelection.id,
            ),
          );
        assert.equal(nextRows.filter((m) => m.tierSnapshot === 1).length, 8);
        const ended = nextRows.map((m, i) => ({
          id: m.fantasyPlayerId,
          tier: i < 5 ? 1 : 2,
        }));
        // Exercise the monotone persistence path after reaching the ordinary limit.
        await consumeTierRelief(
          tx,
          nextSelection.id,
          ended,
          "tier-relief-verification",
        );
        assert.deepEqual(
          (await getTierRelief(tx, nextSelection.id))?.allowedPlayerIds,
          [],
        );
        console.log(
          "Tier relief: events, existing-player saves, new-elite rejection, progressive consumption, stale revision, restore protection, scheduled activation and carryover passed.",
        );
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
    assert.equal(
      await fingerprint(),
      before,
      "Every integration change must roll back",
    );
    console.log(`All verification writes rolled back on ${branch}.`);
  } finally {
    await db.$client.end();
  }
}
run().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Tier-relief verification failed",
  );
  process.exitCode = 1;
});
