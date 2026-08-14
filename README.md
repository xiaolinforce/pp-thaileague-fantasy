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

You can start editing the application in `src/app/page.tsx`.

## Quality checks

```bash
npm run types
npm run lint
npm run format:check
```

## Deploy on Vercel

Deploy the application with [Vercel](https://vercel.com/new). Configure `DATABASE_URL` separately for each Vercel environment and never expose it with a `NEXT_PUBLIC_` prefix.
