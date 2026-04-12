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

## Database Architecture (PostgreSQL via Tailscale)

This project uses **PostgreSQL** as the primary database. To ensure secure and high-performance access during development, we connect via **Tailscale**:

- **Primary Database**: Hosted on a dedicated server (accessible via Tailscale IP `100.68.79.40`).
- **Secure Connection**: No public ports are exposed. Development machines must be connected to the team's Tailscale network to reach the database.
- **Local Development Workflow**:
  - Developers connect to a `mobi_dev` database instance on the target server.
  - The `mobi_dev` database is effectively a dedicated development sandbox.

## Setup & Initialization

If you are setting up the project for the first time or on a new machine:

### 1. Connect to Tailscale
Ensure your machine is logged into Tailscale and has access to the database server (`100.68.79.40`).

### 2. Configure Environment Variables

Create a `.env` file by copying `.env.example`:
```bash
cp .env.example .env
```
Update the `DATABASE_URL` with your credentials:
`DATABASE_URL="postgresql://postgres:your_password@100.68.79.40:5432/mobi_dev"`

### 3. Synchronize Development Data
To get started with a fresh copy of the production schema and data in your development environment, run:
```bash
npm run db:sync
```
*Note: This script drops your local `mobi_dev` database and recreates it from a snapshot of `mobi_prod`.*

### 4. Run Development Server
```bash
npm run dev
```
*Note: `npm run dev` automatically triggers `db:sync` to ensure your local environment is up-to-date.*

## Database Management

- **Pushing Schema Changes**: 
  Always coordinate schema changes with the team. Use Prisma as usual:
  ```bash
  npx prisma db push
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
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Better Auth](https://www.better-auth.com)


