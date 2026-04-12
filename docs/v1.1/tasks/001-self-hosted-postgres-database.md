# Task 001: Self-Hosted PostgreSQL Database Migration

**Status:** 🟡 Pending  
**Priority:** P0 — Critical Infrastructure  
**Created:** 2026-04-12  
**Estimated:** 4–6 hours

---

## 1. Overview

Migrate from **Turso Cloud (SQLite/libSQL)** to a **self-hosted PostgreSQL 17** container running within the same Docker Compose network. This removes the Hrana HTTP proxy instability and provides the massive stability of the industry-standard Postgres database.

### Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Docker Compose Network (backend)                │
│                                                                     │
│  ┌──────────┐ postgresql://...:5432/mobi_prod ┌─────────────────┐   │
│  │   web    │ ─────────────────────────────── │   postgres      │   │
│  │ (Next.js)│   (internal, < 1ms)             │   (Container)   │   │
│  └──────────┘                                 │                 │   │
│                                               │  DB: mobi_prod  │   │
│  ┌──────────────┐                             │  DB: mobi_dev   │   │
│  │ cloudflared  │                             └─────────────────┘   │
│  │  (tunnel)    │                                      ▲            │
│  └──────┬───────┘                                      │            │
│         │  routes db.gpsdna.io.vn (TCP) ───────────────┘            │
│         │  to postgres:5432 (internal)                              │
└─────────┼───────────────────────────────────────────────────────────┘
          │
          ▼ (Cloudflare Edge - TCP Routing)
          │
   ┌──────┴───────────────────────────────────────┐
   │  Developer Laptop                            │
   │  1. Run: cloudflared access tcp --hostname \ │
   │          db.gpsdna.io.vn --url localhost:5432│
   │  2. DATABASE_URL="postgresql://...localhost" │
   └──────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **PostgreSQL** instead of libSQL/Turso | Absolute stability, native enum support, zero Hrana stream timeouts. |
| **Cloudflare TCP Tunnel** | Securely exposes the PostgreSQL port (5432) to developers without opening VPS firewall ports. |
| **Standard Username/Password** | Simpler to manage than generating arbitrary JWT Ed25519 tokens. |
| **Separate prod/dev databases** | Prevents dev migrations from destroying `mobi_prod` data. |

---

## 2. Prerequisites

- [ ] Docker & Docker Compose installed on server
- [ ] Cloudflare Tunnel already configured (existing `cloudflared` container)
- [ ] Developers must have `cloudflared` installed locally (`brew install cloudflared`)

---

## 3. Implementation Checklist

### Phase 1: Docker Compose Configuration

- [ ] **3.1** Create a database initialization script at `./scripts/postgres-init.sql` to create the dev namespace automatically:
  ```sql
  CREATE DATABASE mobi_dev;
  GRANT ALL PRIVILEGES ON DATABASE mobi_dev TO postgres;
  ```

- [ ] **3.2** Add `db` service to `docker-compose.yml` (replacing any `sqld` or Turso services):
  ```yaml
  db:
    image: postgres:17-alpine
    container_name: danang-dashboard-db
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: mobi_prod
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./scripts/postgres-init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d mobi_prod"]
      interval: 10s
      timeout: 5s
      retries: 5
  ```

- [ ] **3.3** Add `postgres-data` named volume:
  ```yaml
  volumes:
    redis-data:
    postgres-data:   # <-- NEW
  ```

- [ ] **3.4** Update `web` service to depend on `db`:
  ```yaml
  web:
    depends_on:
      db:
        condition: service_healthy
  ```

### Phase 2: Configure Cloudflare Tunnel Routing (TCP)

- [ ] **3.5** In Cloudflare Zero Trust Dashboard, add a new public hostname:
  - **Subdomain:** `db`
  - **Domain:** `gpsdna.io.vn`
  - **Service:** `tcp://db:5432` 
  
  > Note: The service type MUST be `tcp` pointing to the internal Postgres port.

- [ ] **3.6** Add Cloudflare Access Policy (Zero Trust) to `db.gpsdna.io.vn` to restrict who can dial this TCP tunnel (Require email or PIN).

### Phase 3: Prisma Codebase Updates

- [ ] **3.7** Uninstall libSQL packages:
  ```bash
  pnpm remove @libsql/client @prisma/adapter-libsql
  ```

- [ ] **3.8** Update `prisma/schema.prisma`:
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```

- [ ] **3.9** Update `src/lib/prisma.ts` to be completely standard (delete libSQL logic):
  ```typescript
  import { PrismaClient } from "@prisma/client";
  import { logger } from "./logger";
  
  declare global {
    var prisma: undefined | PrismaClient;
  }
  
  if (process.env.NODE_ENV !== "production") {
    delete (globalThis as any).prisma;
  }
  
  export const prisma =
    globalThis.prisma ??
    new PrismaClient({
      log: [
        { emit: "event", level: "query" },
        { emit: "stdout", level: "error" },
      ],
    });
  
  if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = prisma;
  }
  ```

- [ ] **3.10** Generate standard Prisma client locally:
  ```bash
  npx prisma generate
  ```

### Phase 4: Database Sync Scripts (Optional but Recommended)

- [ ] **3.11** Create `scripts/db-sync/sync-prod-to-dev.ts` (Copies data from `mobi_prod` to `mobi_dev` locally on the server for testing).
- [ ] **3.12** Create `scripts/db-sync/backup.sh` (Wraps `pg_dump` for easy backups).

### Phase 5: CI/CD & Environment Updates

- [ ] **3.13** Update `.github/workflows/deploy.yml` secrets:
  - Add `POSTGRES_PASSWORD`
  - Set `DATABASE_URL="postgresql://postgres:${{ secrets.POSTGRES_PASSWORD }}@db:5432/mobi_prod"`

- [ ] **3.14** Update `.env` on production server (handled by Deploy Action).

### Phase 6: Data Migration (SQLite to Postgres)

- [ ] **3.15** Follow Prisma's SQLite-to-Postgres guide.
- [ ] **3.16** Export data from Turso Cloud (SQLite dump).
- [ ] **3.17** Use `pgloader` or a custom extraction node script to map the SQLite structure into the new PostgreSQL schemas.
- [ ] **3.18** Run `npx prisma db push` on the fresh Postgres production to instantiate the schema before loading data.

### Phase 7: Verification & Testing

- [ ] **3.19** Verify production connects natively via Docker network without HTTP drops.
- [ ] **3.20** Verify local dev connects via Cloudflare tcp access:
  ```bash
  # Local Terminal 1
  cloudflared access tcp --hostname db.gpsdna.io.vn --url localhost:5433
  ```
  ```bash
  # Local .env
  DATABASE_URL="postgresql://postgres:<pass>@localhost:5433/mobi_dev"
  ```
  ```bash
  # Local Terminal 2
  npx prisma studio
  ```

---

## 4. Environment Variable Reference

### Production (Server `.env`)

| Variable | Value |
|----------|-------|
| `POSTGRES_PASSWORD` | `<secure-random-password>` |
| `DATABASE_URL` | `postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/mobi_prod` |
| `BETTER_AUTH_SECRET` | `<random>` |

### Development (Local Laptop `.env`)

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:<pass>@localhost:<local_port>/mobi_dev` |
| `BETTER_AUTH_URL` | `http://localhost:3000` |

---

## 5. Rollback Plan

If migration fails:
1. Re-install `@libsql/client` and `@prisma/adapter-libsql`.
2. Change `provider` back to `sqlite`.
3. Restore `src/lib/prisma.ts` logic.
4. Update `DATABASE_URL` back to Turso HTTPS URLs.
