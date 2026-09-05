# Guarded production release

## Activation status — 2026-09-05

The workflow and guards are committed on `dev`; activation is in progress.
GitHub's `Production` environment is restricted to `main` and contains the
required variables and encrypted secrets. The approved Vercel token is scoped
to this project only and expires on 2027-09-06. The first complete production
release still needs to pass before activation is considered verified.

Local release/rules/email/auth/observability/localization/readiness tests,
TypeScript, lint and production build passed. The development rollback rehearsal
confirmed that a second migration's SQL failure reverts prior DDL, data and the
first migration's journal insert. All 17 original journal rows were preserved;
the wrong-branch check also rejected a development connection with production
configured as its expected target. Repository-wide formatting still reports
pre-existing warnings in `DATA_SOURCES.md` and the Points `player-token.tsx`.

## One-time setup

1. In GitHub Settings → Environments → Production, allow only the branch `main`.
2. Set these environment variables:
   - `VERCEL_ORG_ID`: `team_DTmT5wZoWAHcAf3l2y8MzUW2`
   - `VERCEL_PROJECT_ID`: `prj_21PtanGKPn9ZhcX3C5DfUbaDQp6r`
   - `NEON_PRODUCTION_BRANCH_ID`: `br-tiny-shape-azrvakql`
3. Store these encrypted environment secrets, never repository files:
   - `DATABASE_URL`: Neon production `neondb` connection, confirmed by branch ID.
   - `READINESS_SECRET`: dedicated read-only readiness credential, also stored as
     a Secret in Vercel Production. The existing `CRON_SECRET` remains unchanged
     and can still authorize readiness; CI does not receive Cron credentials.
   - `VERCEL_TOKEN`: a dedicated token scoped to this project. Record its
     expiry and rotate it in GitHub before expiration.
   - `VERCEL_AUTOMATION_BYPASS_SECRET`: project deployment-protection automation
     bypass secret, used only for checking the staged candidate.
4. Push and verify the checks on `dev`. Set GitHub's default branch to `main`
   so the workflow is available for manual dispatch.
5. In Vercel Settings → Environments → Production, turn **Auto-assign Custom
   Production Domains** off. Keep production branch tracking on `main`.
6. Merge the verified workflow to `main`. `vercel.json` disables Git-triggered
   deployments only for `main`; Actions creates production deployments directly.
   Other branches retain Vercel Preview deployments.
7. Wait for the first Actions release to pass, verify the exact production alias,
   inspect runtime logs and authenticated game pages, then update this status.

Do not switch off the existing production deployment path until credentials and
checks are ready. No browser needs to remain open after activation.

## Normal release

`.github/workflows/production-release.yml` runs checks on `dev` and `main`.
Only `main` can enter the production environment. Its release job:

1. Verifies the current main commit, configuration and migration history.
2. Uses the pinned Vercel CLI to build remotely with production configuration.
3. Creates a production candidate with `--prod --skip-domain`. Sensitive build
   credentials, including Sentry upload credentials, stay available inside
   Vercel; they are not pulled as redacted values into a local prebuilt build.
4. Confirms the candidate's project, target, exact commit and Ready state.
5. Applies reviewed compatible migrations in one transaction, then verifies
   that the migration journal is current.
6. Checks candidate liveness, authorized database readiness, and public Thai
   and English rules/privacy pages, using the protection bypass header.
7. Promotes that candidate, restores the staging setting, checks the production
   domain points to its deployment ID, and repeats the health checks.

Runs are serialized per branch and stale main commits cannot promote. No build
command runs migrations by itself. An up-to-date database performs no migration
writes. Promotion can reset Vercel's domain-assignment setting, so the runner
restores it even after an uncertain promotion response; disabling main's Git
deployments avoids a parallel Git release bypassing this sequence.

Manual **Run workflow** defaults to `dry_run=true`: build/stage/check only,
without migration or promotion. A candidate that requires pending schema changes
can fail health checks during a dry run. Set `dry_run=false` for a reviewed retry
of the current main release. Do not rerun an older commit after main has moved.

## New migrations

Generate a new forward migration from `src/db/schema.ts`, review it, and test it
on the confirmed development branch first. Never rewrite applied history.
Add each pending migration to `scripts/release/migration-policy.json`:

```json
{
  "0017_example": {
    "sha256": "<SHA-256 of reviewed SQL with LF line endings>",
    "compatibility": "compatible"
  }
}
```

`compatible` means the currently deployed application can still read and write
throughout the transition. This declaration needs human/code review; the runner
does not infer SQL compatibility. Missing entries or modified SQL hashes block
release. Already applied migrations need no policy entry.

Use `coordinated` for incompatible required columns, removals, constraints or
other changes requiring a write pause. Automatic release stops before SQL.
Prepare the replacement build, confirm recovery options, pause affected writes,
apply and verify the reviewed migration on the confirmed production branch,
then rerun the guarded release and resume writes after verification. Never label
an incompatible migration `compatible` merely to unblock deployment. Prefer
separate compatible expansion, application transition and later cleanup releases.

The runner rejects empty or divergent databases, checks the complete journal
prefix and hashes, and locks both the release and journal during each transaction.
All pending SQL and journal inserts commit atomically; failure rolls them back.
`CREATE INDEX CONCURRENTLY` and other non-transactional maintenance require a
separate reviewed procedure. Keep imports and source-data maintenance outside
this schema-only workflow.

## Verification and failure recovery

Run `npm run test:release` for release guard changes. With an explicitly confirmed
`DATABASE_URL` and `NEON_PRODUCTION_BRANCH_ID`, these commands inspect state:

```bash
node scripts/release/migrate.ts check
node scripts/release/migrate.ts verify
```

`verify` requires zero pending migrations. `apply` is restricted to the main
GitHub Actions job. Never print connection strings or secret values in logs.

If the build, migration or candidate checks fail, promotion does not run. A
committed migration is not automatically reversed if a later step fails. Inspect
the failed step and schema compatibility before retrying or rolling application
code back. If promotion/public verification fails, inspect the current alias;
production may already have switched. Preserve the Actions summary and logs.

The pre-migration timestamp in the run summary is subject to Neon's configured
history retention, not a permanent backup. Verify backup/recovery arrangements
before schema changes. Restore to a separate branch first when investigating a
data incident; do not automatically rewind production data.

Automated checks do not submit squads or exercise fresh OAuth/Email OTP. Perform
those checks separately when a release changes their behavior.
