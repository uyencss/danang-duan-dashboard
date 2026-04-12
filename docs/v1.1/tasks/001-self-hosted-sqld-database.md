# Task 001: Self-Hosted sqld Database Migration

**Status:** 🟡 Pending  
**Priority:** P0 — Critical Infrastructure  
**Created:** 2026-04-12  
**Estimated:** 4–6 hours

---

## 1. Overview

Migrate from **Turso Cloud (managed)** to a **self-hosted `sqld`** container running within the same Docker Compose network. This eliminates the dependency on Turso's managed cloud service while keeping full libSQL/Hrana compatibility with Prisma.

### Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Docker Compose Network (backend)                │
│                                                                     │
│  ┌──────────┐     http://sqld:8080     ┌──────────────────────┐     │
│  │   web    │ ──────────────────────── │       sqld           │     │
│  │ (Next.js)│   (internal, fast)       │  (libSQL Server)     │     │
│  └──────────┘                          │                      │     │
│                                        │  prod DB: default    │     │
│  ┌──────────────┐                      │  dev DB:  dev        │     │
│  │ cloudflared  │                      └──────────────────────┘     │
│  │  (tunnel)    │                               ▲                   │
│  └──────┬───────┘                               │                   │
│         │  routes turso.gpsdna.io.vn ───────────┘                   │
│         │  to sqld:8080 (internal)                                  │
└─────────┼───────────────────────────────────────────────────────────┘
          │
          ▼ (Cloudflare Edge)
   https://turso.gpsdna.io.vn
          ▲
          │
   ┌──────┴──────────────┐
   │  Developer Laptop   │
   │  (local dev)        │
   │  TURSO_DATABASE_URL │
   │  = https://turso.   │
   │    gpsdna.io.vn     │
   └─────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Self-hosted sqld** instead of Turso Cloud | Zero cost, full data ownership, same Docker network latency |
| **JWT auth on sqld** | Required since sqld is exposed to the internet via Cloudflare Tunnel |
| **Separate prod/dev databases** | Prevents destructive dev migrations from affecting production data |
| **Both dev & prod connect via Cloudflare Tunnel** | Unified access pattern via `https://turso.gpsdna.io.vn` |
| **JWT keys in project `sqld-keys/`** | Keeps secrets co-located with project; synced to GitHub Secrets for CI/CD |
| **Dev ↔ Prod database sync** | Script-driven selective sync allows seeding dev from prod or promoting dev to prod |

---

## 2. Prerequisites

- [ ] Docker & Docker Compose installed on server
- [ ] Cloudflare Tunnel already configured (existing `cloudflared` container)
- [ ] Access to Cloudflare Zero Trust dashboard for DNS routing
- [ ] `openssl` CLI for generating Ed25519 keypair
- [ ] GitHub repository Settings access (for adding Secrets)

---

## 3. Implementation Checklist

### Phase 1: Generate JWT Authentication Keys (In-Project)

- [ ] **3.1** Create `sqld-keys/` directory in the project root
  ```bash
  mkdir -p sqld-keys
  ```

- [ ] **3.2** Verify `.gitignore` already covers `*.pem` files (it does — line 25)
  > The existing `*.pem` rule in `.gitignore` prevents PEM files from being committed. No change needed.

- [ ] **3.3** Generate an Ed25519 keypair inside the project folder
  ```bash
  cd sqld-keys/
  
  # Generate private key (used to sign JWT tokens — NEVER committed to git)
  openssl genpkey -algorithm Ed25519 -out sqld_jwt_private.pem
  
  # Extract public key (mounted into sqld container for verification)
  openssl pkey -in sqld_jwt_private.pem -pubout -out sqld_jwt_public.pem
  ```

- [ ] **3.4** Create a token-generation script at `scripts/sqld-keys/generate-token.ts`
  ```typescript
  // This script reads sqld-keys/sqld_jwt_private.pem and generates JWT tokens
  // Usage: npx tsx scripts/sqld-keys/generate-token.ts --sub prod --exp 10y
  // Usage: npx tsx scripts/sqld-keys/generate-token.ts --sub dev --exp 1y
  ```

- [ ] **3.5** Generate JWT auth tokens
  ```bash
  # Generate prod token (long-lived, 10 years)
  npx tsx scripts/sqld-keys/generate-token.ts --sub prod --exp 10y
  # Output: eyJ... → save as SQLD_PROD_AUTH_TOKEN
  
  # Generate dev token (shorter-lived, 1 year)
  npx tsx scripts/sqld-keys/generate-token.ts --sub dev --exp 1y
  # Output: eyJ... → save as SQLD_DEV_AUTH_TOKEN
  ```

- [ ] **3.6** Add an `sqld-keys/README.md` file (this file IS committed) explaining key setup for new developers
  ```markdown
  # sqld JWT Keys
  
  This directory contains Ed25519 keys for sqld authentication.
  The *.pem files are gitignored. To regenerate:
  
  1. openssl genpkey -algorithm Ed25519 -out sqld_jwt_private.pem
  2. openssl pkey -in sqld_jwt_private.pem -pubout -out sqld_jwt_public.pem
  3. npx tsx scripts/sqld-keys/generate-token.ts --sub prod --exp 10y
  4. npx tsx scripts/sqld-keys/generate-token.ts --sub dev --exp 1y
  ```

### Phase 2: Sync Secrets to GitHub Actions

- [ ] **3.7** Add the following **GitHub Repository Secrets** (Settings → Secrets → Actions):

  | Secret Name | Value Source | Description |
  |-------------|-------------|-------------|
  | `SQLD_JWT_PUBLIC_KEY` | Contents of `sqld-keys/sqld_jwt_public.pem` | Public key for sqld JWT verification |
  | `TURSO_AUTH_TOKEN` | Output of prod token generation (3.5) | Prod JWT token for `web` → `sqld` auth |
  | `DATABASE_URL` | `http://sqld:8080` | Internal Docker network URL |
  | `TURSO_DATABASE_URL` | `http://sqld:8080` | Same as DATABASE_URL for prod |

- [ ] **3.8** Update `deploy.yml` to write the public key to the server
  ```yaml
  # In the deploy script section, before docker compose up:
  
  # Write the sqld JWT public key to the project folder
  mkdir -p sqld-keys
  echo "$SQLD_JWT_PUBLIC_KEY" > sqld-keys/sqld_jwt_public.pem
  ```

### Phase 3: Add `sqld` Container to Docker Compose

- [ ] **3.9** Add `sqld` service to `docker-compose.yml`
  ```yaml
  sqld:
    image: ghcr.io/tursodatabase/libsql-server:latest
    container_name: danang-dashboard-db
    restart: always
    environment:
      - TZ=Asia/Ho_Chi_Minh
      - SQLD_NODE=primary
      - SQLD_HTTP_LISTEN_ADDR=0.0.0.0:8080
      - SQLD_AUTH_JWT_KEY_FILE=/etc/sqld/sqld_jwt_public.pem
    volumes:
      - sqld-data:/var/lib/sqld
      - ./sqld-keys/sqld_jwt_public.pem:/etc/sqld/sqld_jwt_public.pem:ro
      - ./logs:/app/logs
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.25'
          memory: 256M
    networks:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 10s
      timeout: 5s
      retries: 5
  ```

- [ ] **3.10** Add `sqld-data` named volume
  ```yaml
  volumes:
    redis-data:
    sqld-data:   # <-- NEW
  ```

- [ ] **3.11** Update `web` service to depend on `sqld`
  ```yaml
  web:
    depends_on:
      sqld:
        condition: service_healthy
      # ... existing depends_on
  ```

- [ ] **3.12** Update `web` environment variables for production
  ```yaml
  web:
    environment:
      # Production: connect internally via Docker network
      - DATABASE_URL=${DATABASE_URL}
      - TURSO_DATABASE_URL=${TURSO_DATABASE_URL}
      - TURSO_AUTH_TOKEN=${TURSO_AUTH_TOKEN}
  ```

### Phase 4: Configure Cloudflare Tunnel Routing

- [ ] **3.13** In Cloudflare Zero Trust Dashboard, add a new public hostname:
  - **Subdomain:** `turso`
  - **Domain:** `gpsdna.io.vn`
  - **Service:** `http://sqld:8080`
  
  > This routes `https://turso.gpsdna.io.vn` → `http://sqld:8080` (inside Docker network)

- [ ] **3.14** *(Optional)* Add Cloudflare Access Policy to restrict access to `turso.gpsdna.io.vn` (additional layer of protection beyond JWT)

### Phase 5: Create Dev & Prod Databases

- [ ] **3.15** After sqld starts, create the `dev` namespace database:
  ```bash
  # The default database is used for production
  # Create a dev database via sqld admin API
  curl -X POST http://localhost:8080/v1/namespaces/dev/create \
    -H "Authorization: Bearer ${SQLD_PROD_AUTH_TOKEN}"
  ```

### Phase 6: Update Environment Variables

- [ ] **3.16** Update **production** `.env` on server (auto-written by `deploy.yml`):
  ```env
  # Production: internal Docker network (fast, no internet hop)
  DATABASE_URL="http://sqld:8080"
  TURSO_DATABASE_URL="http://sqld:8080"
  TURSO_AUTH_TOKEN="<prod-jwt-token>"
  ```

- [ ] **3.17** Update **development** `.env` on local machine:
  ```env
  # Development: connect through Cloudflare Tunnel to dev database
  DATABASE_URL="https://turso.gpsdna.io.vn"
  TURSO_DATABASE_URL="https://turso.gpsdna.io.vn"
  TURSO_AUTH_TOKEN="<dev-jwt-token>"
  ```

- [ ] **3.18** Update `.env.example` with new variable documentation

### Phase 7: Update Prisma Client Configuration

- [ ] **3.19** Update `src/lib/prisma.ts` — simplify the `formatUrl` function:
  - Production (internal Docker): `http://sqld:8080` — no URL rewriting needed
  - Development (Cloudflare Tunnel): `https://turso.gpsdna.io.vn` — already HTTPS
  - Keep the `libsql://` → `https://` fallback for backward compatibility

- [ ] **3.20** Verify Prisma migrations work against sqld:
  ```bash
  # From local machine (pointing at dev DB through tunnel)
  npx prisma migrate deploy
  npx prisma db push
  ```

### Phase 8: Database Sync Mechanism (Dev ↔ Prod)

- [ ] **3.21** Create `scripts/db-sync/sync-prod-to-dev.ts` — Copy prod data to dev
  ```typescript
  // Dumps the prod (default) namespace and imports into dev namespace
  // Usage: npx tsx scripts/db-sync/sync-prod-to-dev.ts
  // 
  // Flow:
  //   1. Connect to sqld prod (http://sqld:8080 or https://turso.gpsdna.io.vn)
  //   2. Dump all tables via SELECT * FROM each table
  //   3. Connect to sqld dev namespace
  //   4. TRUNCATE all dev tables
  //   5. INSERT dumped data into dev tables
  //   6. Report row counts
  //
  // Safety: Prompts for confirmation before overwriting dev data
  ```

- [ ] **3.22** Create `scripts/db-sync/sync-dev-to-prod.ts` — Promote dev to prod
  ```typescript
  // Promotes dev database schema and/or data to production
  // Usage: npx tsx scripts/db-sync/sync-dev-to-prod.ts [--schema-only] [--data-only]
  //
  // Flags:
  //   --schema-only  Only apply schema migrations (Prisma migrate deploy)
  //   --data-only    Only copy data rows (skip schema changes)
  //   (no flag)      Sync both schema and data
  //
  // Safety: 
  //   - Creates automatic backup of prod before sync
  //   - Requires manual confirmation with prod row counts displayed
  //   - Stores backup at ./backups/pre-sync-<timestamp>.sql
  ```

- [ ] **3.23** Create `scripts/db-sync/backup.ts` — Standalone backup utility
  ```typescript
  // Creates a SQL dump backup of a database namespace
  // Usage: npx tsx scripts/db-sync/backup.ts --namespace default --output ./backups/
  // Usage: npx tsx scripts/db-sync/backup.ts --namespace dev --output ./backups/
  ```

- [ ] **3.24** Add npm scripts for convenience
  ```json
  {
    "scripts": {
      "db:sync:prod-to-dev": "tsx scripts/db-sync/sync-prod-to-dev.ts",
      "db:sync:dev-to-prod": "tsx scripts/db-sync/sync-dev-to-prod.ts",
      "db:backup": "tsx scripts/db-sync/backup.ts",
      "db:token:generate": "tsx scripts/sqld-keys/generate-token.ts"
    }
  }
  ```

### Phase 9: Data Migration (from Turso Cloud)

- [ ] **3.25** Export data from Turso Cloud:
  ```bash
  # Using turso CLI or direct SQL dump
  turso db shell <db-name> .dump > turso-backup.sql
  ```

- [ ] **3.26** Import data into self-hosted sqld (prod namespace):
  ```bash
  curl -X POST http://localhost:8080/v2/pipeline \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"requests": [{"type": "execute", "stmt": {"sql": "..."}}]}'
  ```

- [ ] **3.27** Run `pnpm db:sync:prod-to-dev` to seed dev database from prod

- [ ] **3.28** Verify data integrity in both namespaces

### Phase 10: Update CI/CD Pipeline

- [ ] **3.29** Update `.github/workflows/deploy.yml`:
  - Add `SQLD_JWT_PUBLIC_KEY` to env/secrets
  - Add step to write public key PEM file to `sqld-keys/`
  - Update `docker compose up` to include `sqld` service
  - Ensure `.env` file includes prod DB URLs

- [ ] **3.30** Verify full deployment cycle works end-to-end

### Phase 11: Verification & Testing

- [ ] **3.31** Verify production: `web` container connects to `sqld:8080` successfully
- [ ] **3.32** Verify development: local `npm run dev` connects through `https://turso.gpsdna.io.vn`
- [ ] **3.33** Run full Prisma migration cycle (dev + deploy)
- [ ] **3.34** Test CRUD operations from both environments
- [ ] **3.35** Verify Better Auth sessions work with new database
- [ ] **3.36** Test `pnpm db:sync:prod-to-dev` and `pnpm db:sync:dev-to-prod`
- [ ] **3.37** Verify Cloudflare Tunnel logs show healthy connections

### Phase 12: Cleanup

- [ ] **3.38** Remove old Turso Cloud database references
- [ ] **3.39** Update all documentation (architecture, deployment, developer guide, etc.)
- [ ] **3.40** Cancel/delete Turso Cloud managed database (after confirming everything works)

---

## 4. Secret & Key Management Flow

### 4.1 Where Keys Live

```
Project Root (danang-duan-dashboard/)
├── sqld-keys/
│   ├── README.md                  # ✅ Committed — setup instructions
│   ├── sqld_jwt_private.pem       # ❌ Gitignored (*.pem) — for local token generation only
│   └── sqld_jwt_public.pem        # ❌ Gitignored (*.pem) — mounted into sqld container
├── scripts/
│   └── sqld-keys/
│       └── generate-token.ts      # ✅ Committed — token generation script
```

### 4.2 GitHub Actions Secrets Flow

```
Developer runs:
  npx tsx scripts/sqld-keys/generate-token.ts --sub prod
    │
    ▼ Copies output token
GitHub → Settings → Secrets → Actions:
  SQLD_JWT_PUBLIC_KEY = <contents of sqld_jwt_public.pem>
  TURSO_AUTH_TOKEN    = <generated prod JWT token>
  DATABASE_URL        = http://sqld:8080
  TURSO_DATABASE_URL  = http://sqld:8080
    │
    ▼ On push to master, deploy.yml:
Server (remote):
  1. git pull
  2. echo "$SQLD_JWT_PUBLIC_KEY" > sqld-keys/sqld_jwt_public.pem
  3. Write .env from secrets (DATABASE_URL, TURSO_AUTH_TOKEN, etc.)
  4. docker compose up -d --build
    │
    ▼ sqld container reads:
  sqld-keys/sqld_jwt_public.pem → JWT verification ✅
```

### 4.3 Local Dev Key Flow

```
Developer clones repo:
  1. Ask team lead for sqld-keys/*.pem files (shared securely, e.g. via 1Password)
  2. Place them in sqld-keys/
  3. Generate dev token: npx tsx scripts/sqld-keys/generate-token.ts --sub dev
  4. Put token in .env as TURSO_AUTH_TOKEN
  5. pnpm dev → connects to https://turso.gpsdna.io.vn ✅
```

---

## 5. Database Sync Strategy

### 5.1 Sync Directions

```
┌─────────────────┐                    ┌─────────────────┐
│  PROD (default)  │ ──── sync ────▶  │  DEV             │
│  namespace       │ ◀── promote ───  │  namespace       │
└─────────────────┘                    └─────────────────┘
```

| Direction | Script | Use Case |
|-----------|--------|----------|
| **Prod → Dev** | `pnpm db:sync:prod-to-dev` | Seed dev with real prod data for testing |
| **Dev → Prod** | `pnpm db:sync:dev-to-prod` | Promote tested schema/data changes to production |
| **Backup** | `pnpm db:backup` | Create point-in-time SQL dump of any namespace |

### 5.2 Sync Safety Rules

1. **Prod → Dev** always overwrites dev (with confirmation prompt)
2. **Dev → Prod** always creates a backup first, requires double confirmation
3. **Schema-only mode** runs `prisma migrate deploy` without touching data
4. **Data-only mode** copies rows without schema changes
5. **Passwords are NEVER synced** — user passwords are excluded from data sync to prevent security leaks between environments

### 5.3 Automated Sync (Optional Future)

A GitHub Action can be added to automatically sync prod → dev nightly:
```yaml
# .github/workflows/db-sync-nightly.yml
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync prod to dev
        run: |
          # Connect via Cloudflare Tunnel and sync
          npx tsx scripts/db-sync/sync-prod-to-dev.ts --auto-confirm
```

---

## 6. Environment Variable Reference

### Production (Server `.env` — written by `deploy.yml` from GitHub Secrets)

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `http://sqld:8080` | Prisma-compatible URL (internal Docker) |
| `TURSO_DATABASE_URL` | `http://sqld:8080` | libSQL client URL (internal Docker) |
| `TURSO_AUTH_TOKEN` | `<prod-jwt-token>` | JWT signed with Ed25519 private key |

### Development (Local `.env`)

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `https://turso.gpsdna.io.vn` | Prisma-compatible URL (via Cloudflare Tunnel) |
| `TURSO_DATABASE_URL` | `https://turso.gpsdna.io.vn` | libSQL client URL (via Cloudflare Tunnel) |
| `TURSO_AUTH_TOKEN` | `<dev-jwt-token>` | JWT signed with same Ed25519 private key |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Local auth URL |

### GitHub Actions Secrets

| Secret | Value | Description |
|--------|-------|-------------|
| `SQLD_JWT_PUBLIC_KEY` | Contents of `sqld_jwt_public.pem` | Written to server as PEM file for sqld |
| `DATABASE_URL` | `http://sqld:8080` | Prod DB URL |
| `TURSO_DATABASE_URL` | `http://sqld:8080` | Prod DB URL |
| `TURSO_AUTH_TOKEN` | `<prod-jwt-token>` | Prod JWT token |

---

## 7. Rollback Plan

If the migration fails:
1. Revert `docker-compose.yml` to the previous version (without `sqld` service)
2. Restore `.env` values pointing to Turso Cloud URLs
3. Turso Cloud data remains untouched during migration (read-only export)

---

## 8. Security Checklist

- [ ] sqld JWT authentication is mandatory (no anonymous access)
- [ ] Ed25519 private key is gitignored (`*.pem` in `.gitignore`)
- [ ] Ed25519 private key is NOT mounted into any container
- [ ] Ed25519 public key is synced to GitHub Secrets as `SQLD_JWT_PUBLIC_KEY`
- [ ] `deploy.yml` writes the public key to `sqld-keys/` on the server before `docker compose up`
- [ ] Cloudflare Access policy restricts who can reach `turso.gpsdna.io.vn` (optional but recommended)
- [ ] Production `web` container uses internal `http://sqld:8080` (never touches public internet for DB)
- [ ] Dev tokens have shorter expiry than prod tokens (recommended: 1yr vs 10yr)

---

## 9. Files to Modify / Create

| File | Change |
|------|--------|
| `sqld-keys/README.md` | **[NEW]** Setup instructions for JWT keys |
| `scripts/sqld-keys/generate-token.ts` | **[NEW]** JWT token generation script |
| `scripts/db-sync/sync-prod-to-dev.ts` | **[NEW]** Prod → Dev data sync |
| `scripts/db-sync/sync-dev-to-prod.ts` | **[NEW]** Dev → Prod data promotion |
| `scripts/db-sync/backup.ts` | **[NEW]** Database backup utility |
| `docker-compose.yml` | Add `sqld` service, update `web` depends_on |
| `.github/workflows/deploy.yml` | Add `SQLD_JWT_PUBLIC_KEY` secret, write PEM file on deploy |
| `.env` | Update DB URLs for dev |
| `.env.example` | Document new variables |
| `package.json` | Add `db:sync:*` and `db:token:*` scripts |
| `src/lib/prisma.ts` | Simplify URL formatting, remove Turso Cloud assumptions |
| `docs/*` | Update all documentation |
