# Developer Guide & Onboarding
**Version:** 1.2.0 | **Updated:** 2026-04-12

Welcome to the Danang Project Dashboard! This guide will help you get your local environment set up and explain our core development conventions.

## 1. Local Environment Setup

**Prerequisites:**
- Node.js (v18+)
- pnpm (v10+)
- Git
- Docker (optional — only needed if you want to run the full stack locally including sqld)

**Steps to run locally:**
1. Clone the repository: `git clone <repo-url>`
2. Install dependencies: `pnpm install`
3. Copy the environment variables: `cp .env.example .env`
4. **Configure the database connection** (see Section 2 below)
5. Run the development server: `pnpm dev`
6. Visit `http://localhost:3000`

## 2. Database Connection (Self-Hosted sqld)

The project uses a **self-hosted sqld (libSQL Server)** running on the deployment server. For local development, you connect to the **dev database** namespace through a Cloudflare Tunnel.

### 2.1 How It Works

```
Your Laptop (npm run dev)
    │
    │  HTTPS (DATABASE_URL)
    ▼
https://turso.gpsdna.io.vn  ← Cloudflare Tunnel
    │
    ▼
sqld container (on VPS)
    └── dev database namespace
```

### 2.2 Getting Access

1. Ask the team lead for the `sqld-keys/` PEM files (`sqld_jwt_private.pem` + `sqld_jwt_public.pem`) — shared securely (e.g., via 1Password, encrypted message)
2. Place them in your local `sqld-keys/` directory
3. Generate a dev JWT token:
   ```bash
   npx tsx scripts/sqld-keys/generate-token.ts --sub dev --exp 1y
   ```
4. Copy the output token into your `.env` as `TURSO_AUTH_TOKEN`
5. Ask for any other secrets (BETTER_AUTH_SECRET, Ably, SMTP, etc.)

### 2.3 Environment Variables

Your `.env` should look like this for local development:

```env
# Database — Self-Hosted sqld (via Cloudflare Tunnel)
DATABASE_URL="https://turso.gpsdna.io.vn"
TURSO_DATABASE_URL="https://turso.gpsdna.io.vn"
TURSO_AUTH_TOKEN="<dev-jwt-token-from-team-lead>"

# Authentication (Better Auth)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
BETTER_AUTH_SECRET="<secret-from-team-lead>"
BETTER_AUTH_URL="http://localhost:3000"

# Real-time (Ably)
ABLY_API_KEY="<ably-key>"
NEXT_PUBLIC_ABLY_KEY="<ably-public-key>"

# Redis (Optional for local — only needed if testing cache)
REDIS_URL="redis://localhost:6379"
```

> ⚠️ **Important:** Both `DATABASE_URL` and `TURSO_DATABASE_URL` point to `https://turso.gpsdna.io.vn`. This is the Cloudflare Tunnel endpoint that routes to the sqld container's dev database. The `TURSO_AUTH_TOKEN` is a JWT signed with the Ed25519 private key — without it, connections will be rejected.

### 2.4 Production vs Development

| Setting | Development | Production |
|---------|-------------|------------|
| `DATABASE_URL` | `https://turso.gpsdna.io.vn` | `http://sqld:8080` |
| `TURSO_DATABASE_URL` | `https://turso.gpsdna.io.vn` | `http://sqld:8080` |
| `TURSO_AUTH_TOKEN` | Dev JWT token | Prod JWT token |
| `BETTER_AUTH_URL` | `http://localhost:3000` | `https://dashboard.gpsdna.io.vn` |
| Database namespace | `dev` | `default` (production) |

## 3. Coding Conventions

- **Client vs Server:** We use Next.js App Router. Default to Server Components (`.tsx` without `"use client"`). Only use `"use client"` when you need browser APIs (onClick, hooks like useState/useEffect).
- **Server Actions:** For data mutations, utilize React Server Actions inside `actions.ts` files, ensuring you validate permissions using `requireRole()` before executing Prisma queries.
- **RBAC Guards:** Every Server Action and API Route must include role-based access control. Use `requireRole()` for Server Actions and `requireApiRole()` for API Routes.
- **Git Flow:** 
  - Create branches as `feature/<task-name>` or `fix/<bug-name>`.
  - Always write clear, descriptive commit messages.

## 4. Database Migrations (Prisma ORM)

We use **Prisma v7** with the `@prisma/adapter-libsql` adapter.

### 4.1 Development Migrations

When you modify `prisma/schema.prisma`:

```bash
# Generate and apply migration to dev database (via Cloudflare Tunnel)
npx prisma migrate dev --name <migration-name>

# Or push schema changes directly (no migration file)
npx prisma db push

# Generate Prisma client types
npx prisma generate
```

### 4.2 Production Migrations

Production migrations are applied automatically during deployment or manually:

```bash
# Inside the web container (connects via internal Docker network)
npx prisma migrate deploy
```

### 4.3 Prisma Studio (Visual DB Browser)

```bash
# Opens a visual browser for the database you're connected to
npx prisma studio
```

> **Note:** When running `prisma studio` locally, it connects to the dev database via Cloudflare Tunnel. This is safe because dev and prod are separate namespaces.

## 5. Database Sync Scripts

The project includes scripts for syncing data between dev and prod database namespaces:

```bash
# Copy production data into dev database (for testing with real data)
pnpm db:sync:prod-to-dev

# Promote dev database to production (auto-backup first, double confirmation)
pnpm db:sync:dev-to-prod

# Create a manual backup of any namespace
pnpm db:backup

# Generate a new JWT token (e.g., if your dev token expires)
pnpm db:token:generate -- --sub dev --exp 1y
```

> ⚠️ **Safety:** The prod-to-dev sync overwrites dev data. The dev-to-prod sync creates an automatic backup before proceeding and requires double confirmation.

## 6. Helpful Scripts

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Check TypeScript types
pnpm typecheck

# Lint code
pnpm lint
```
