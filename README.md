This is a [Next.js](https://nextjs.org) dashboard project with Prisma + Better Auth.

## Database Safety (Important)

Seeding is now safe by default:

- `npm run seed` will **not** delete data.
- If data already exists, seed will skip.
- Destructive reset is opt-in only via `npm run seed:reset` (sets `SEED_RESET=true`).
- Every destructive reset now runs mandatory preflight checks and creates backup files under `.backups/seed/` before deleting any rows.
- Use `npm run db:migrate:reset` for schema reset; it also runs backup/preflight first under `.backups/migrate-reset/`.
- If reset or reseed fails in `db:migrate:reset`, the script automatically restores `dev.db` from the backup snapshot.

Use `seed:reset` only for local/dev environments where data loss is acceptable.

Unsafe bypass (not recommended): `npm run db:migrate:reset:unsafe`

## Database Environments

- Local development: SQLite/libSQL for fast local iteration.
- Staging/production: managed PostgreSQL.

Recommended default path:

1. Start local with SQLite while building.
2. Move to managed Postgres (Supabase or Neon) for shared/online data.
3. Run Prisma migrations against that Postgres database.

Why this path:

- Better reliability and backups than self-hosting too early.
- Simpler operations than running your own Postgres over Cloudflare tunnel.
- Keeps relational SQL model and Prisma migrations unchanged.

Firebase is best when you want a document/NoSQL model and Firebase-native stack. For this project's current Prisma + relational schema, Postgres is the better fit.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
