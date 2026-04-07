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

## Database Architecture (Turso Embedded Replicas)

This project uses **Turso (libSQL)** with **Embedded Replicas** for low-latency performance:

- **Primary Database**: Hosted on Turso Cloud (AWS ap-northeast-1).
- **Local Replica**: A local SQLite file (`./data/local-replica.db`) that automatically synchronizes with the primary.
- **Workflow**: 
  - **Reads**: Performed against the local replica (zero latency, offline-capable).
  - **Writes**: Automatically forwarded to the Turso Cloud primary.
  - **Sync**: The local replica syncs every 60 seconds (configurable via `TURSO_SYNC_PERIOD`).

## Setup & Initialization

If you are setting up the project for the first time or on a new machine:

### 1. Generate Prisma Client
Whenever the schema changes, you must regenerate the client:
```bash
npx prisma generate
```

### 2. Initialize Local Replica
If the `./data/local-replica.db` file is missing, you need to bootstrap it by syncing from the remote:
```bash
# Loads variables from .env and performs initial sync
npx tsx --env-file=.env scripts/init-replica.ts
```

### 3. Run Development Server
```bash
npm run dev
```

## Database Management

- **Pushing Schema Changes**: 
  If you update `prisma/schema.prisma`, normally you would run `npx prisma db push`. However, if you encounter connection issues with the `libsql` protocol in the CLI, use the provided fix script:
  ```bash
  npx tsx --env-file=.env scripts/fix-remote-schema.ts
  ```
- **Seeding**: 
  - `npm run seed`: Safe seeding (skips existing data).
  - `npm run seed:reset`: Destructive reset and re-seed (with mandatory backups).

## Multi-Server Deployment (Tailscale & GitHub Actions)

This project has a fully automated multi-instance CI/CD pipeline set up via GitHub Actions.

- **Auto-Deployment**: Pushes to `master` trigger an SSH deployment utilizing the GitHub Actions runner securely connected to your Tailscale network.
- **Auto-Provisioning**: The GitHub Action dynamically recreates the `.env` file on destination servers using variables stored in GitHub Secrets. If a target machine is completely new, it automatically clones the repository and bootstraps the environment.
- **Port Conflict & Security**: Host port bindings (`3000:3000`) have been removed from `docker-compose.yml`. The UI container connects exclusively to the Cloudflare Tunnel via internal Docker networking.
- **Load Balancing (Deterministic Build IDs)**: Next.js generates static asset paths identical to the `BUILD_ID`. To prevent 404s when Cloudflare load-balances user requests across multiple containers, the GitHub Action overrides the Build ID to be the active Git commit SHA. This ensures CSS and chunk hashes are perfectly identical across all independent servers.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Turso Documentation](https://docs.turso.tech)
- [Better Auth](https://www.better-auth.com)

