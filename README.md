# PP Thaileague Fantasy

Thai League fantasy football application built with Next.js, Drizzle ORM, and Neon Postgres.

## Getting started

Copy the environment template and add the pooled connection string for the Neon `development` branch:

```powershell
Copy-Item .env.example .env.local
```

Then verify the database connection and start the development server:

```bash
npm run db:check
npm run db:migrate
npm run db:seed:competition
npm run db:seed:fantasy
npm run dev
```

Open [http://localhost:3006](http://localhost:3006) in your browser. The local `.env.local` file connects to the Neon `development` branch and is excluded from Git.

## Database workflow

- Local development uses the Neon `development` branch.
- Vercel Production must use the Neon `production` branch through its `DATABASE_URL` environment variable.
- Add Drizzle table definitions to `src/db/schema.ts`.
- Generate migrations with `npm run db:generate`.
- Apply committed migrations with `npm run db:migrate`, testing development before production.
- Inspect the current database with `npm run db:studio`.

The fantasy seed is idempotent and creates a single playable demo account,
its initial squad, two Classic leagues, 27 gameweeks, and tier metadata for
the imported Thai League players. Use `npm run db:verify:fantasy` to inspect
the resulting row counts. Demo write actions are disabled in production by
default; set `FANTASY_DEMO_WRITE_ENABLED=true` only where the one-account demo
should be editable.

## Fantasy prototype

The playable flow is available at `/team`, `/transfers`, `/points`, and
`/leagues`. Internal match scoring, player tier/Thai-status corrections, and
gameweek locking are available at `/admin/fantasy`.

The rules engine includes 15-player squads, FPL formations and automatic
substitutions, captain/vice-captain, Triple Captain, Bench Boost, Wildcard,
two uses of each chip per season, two free transfers per gameweek (capped at
four), four-point transfer hits, three players per club, seven foreign
players, and the tier-slot limits. Scoring follows FPL except that Defensive
Contributions and bonus points are intentionally excluded.

You can start editing the application in `src/app/page.tsx`.

## Quality checks

```bash
npm run types
npm run lint
npm run test:rules
npm run format:check
```

## Deploy on Vercel

Deploy the application with [Vercel](https://vercel.com/new). Configure `DATABASE_URL` separately for each Vercel environment and never expose it with a `NEXT_PUBLIC_` prefix.
