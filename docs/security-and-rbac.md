# Security & Role-Based Access Control (RBAC)
**Version:** 1.2.0 | **Updated:** 2026-04-12

The Danang Dashboard utilizes a highly flexible, database-driven Role-Based Access Control architecture. It is imperative to understand this model before creating new API routes or Server Actions.

## 1. Authentication Layer (Better Auth)
- All user sessions are managed via `better-auth`. 
- The session token securely tracks the user's `userId`, `email`, and `role`.
- **Proxy Gate:** Next.js `proxy.ts` intercepts requests. Unauthenticated users attempting to access dashboard routes are automatically redirected to `/login`.

## 2. Dynamic RBAC System
In v1.0, we migrated away from hardcoded roles (e.g., `role === 'ADMIN'`). 
- **Roles & Permissions Tables:** Allowed access features are configured in the database, tying specific roles to particular URLs, menus, and actions.
- **Menu Visibility:** The Dynamic Menu Management system checks the user's role against assigned menus before rendering them in the sidebar. If a user lacks permission, the element is not rendered in the DOM.

## 3. Server-Side Validation (Crucial)
Hiding a button in the UI is **not** security. Any user can theoretically forge a request to an endpoint. 
- Therefore, **all Next.js Server Actions and API Routes must independently verify the user session and permissions.**
- Example: Before executing a soft-delete row command in the database, `actions.ts` must call `requireRole("ADMIN", "USER")` to verify the active session has explicit deletion rights.

## 4. Data Visibility Rules
Certain roles (e.g., Specialists vs AMs) see different aggregates of data.
- Ensure that Prisma queries dynamically inject `.where()` clauses restricting data fetch based on ownership or assigned department unless the user possesses an overarching 'Admin/Director' flag.

## 5. Database Security — Self-Hosted sqld

### 5.1 Overview

The sqld (libSQL Server) container is the single source of truth for all application data. It is exposed both internally (Docker network) and externally (Cloudflare Tunnel), so robust authentication is mandatory.

### 5.2 JWT Authentication (Ed25519)

All connections to sqld require a valid **Ed25519-signed JWT token**. The sqld container verifies tokens against the mounted public key.

```
Connection Flow:
    Client (Prisma / libSQL)
        │
        ├── Authorization: Bearer <jwt-token>
        │
        ▼
    sqld Container
        │
        ├── Verify JWT signature against SQLD_AUTH_JWT_KEY_FILE (public key)
        ├── Check token expiry
        │
        ▼
    ✅ Allow / ❌ Reject
```

### 5.3 Key Management — In-Project Keys + GitHub Secrets

JWT keys are stored **within the project folder** (`sqld-keys/`) and synced to production via GitHub Actions Secrets.

```
sqld-keys/                              GitHub Actions Secrets
├── README.md           (committed)     
├── sqld_jwt_private.pem (gitignored)   → Used locally to generate tokens
└── sqld_jwt_public.pem  (gitignored)   → SQLD_JWT_PUBLIC_KEY secret
                                        → Written to server on deploy
```

| Key | Location | Git Status | Purpose |
|-----|----------|-----------|---------|
| Ed25519 **Private Key** | `sqld-keys/sqld_jwt_private.pem` | ❌ Gitignored (`*.pem`) | Signs JWT tokens locally |
| Ed25519 **Public Key** | `sqld-keys/sqld_jwt_public.pem` | ❌ Gitignored (`*.pem`) | Synced to GitHub Secrets as `SQLD_JWT_PUBLIC_KEY` |
| **Prod JWT Token** | GitHub Secret `TURSO_AUTH_TOKEN` → server `.env` | ❌ Never committed | Authenticates production `web` container |
| **Dev JWT Token** | Developer local `.env` (`TURSO_AUTH_TOKEN`) | ❌ Never committed | Authenticates developer connections |

**Deployment Flow:**
1. Developer generates keys locally with `openssl` (see `sqld-keys/README.md`)
2. Developer generates tokens with `npx tsx scripts/sqld-keys/generate-token.ts`
3. Public key contents → GitHub Secret `SQLD_JWT_PUBLIC_KEY`
4. Prod token → GitHub Secret `TURSO_AUTH_TOKEN`
5. `deploy.yml` writes public key to `sqld-keys/sqld_jwt_public.pem` on the server
6. `docker-compose.yml` mounts the public key into sqld container

### 5.4 Security Rules

1. **No anonymous access** — sqld rejects all requests without a valid JWT
2. **Ed25519 private key is gitignored** — `*.pem` in `.gitignore` covers all PEM files
3. **Ed25519 private key is NEVER mounted into any container** — only the public key goes into sqld
4. **Public key is synced via GitHub Secrets** — no manual server key management needed
5. **Dev and prod use separate JWT tokens** — different `sub` claims for auditing
6. **Production `web` container uses internal Docker URL** (`http://sqld:8080`) — database traffic never leaves the Docker network
7. **External access via Cloudflare Tunnel only** — no ports are exposed on the VPS firewall for sqld

### 5.5 Cloudflare Access (Optional Additional Layer)

For defense-in-depth, a Cloudflare Access policy can be applied to `turso.gpsdna.io.vn` to restrict who can reach the sqld endpoint even before JWT validation:
- Restrict by email domain
- Require one-time PIN
- Restrict by IP range / country

### 5.6 Data Isolation & Sync

| Namespace | Purpose | Access |
|-----------|---------|--------|
| `default` | Production data | Only the Docker `web` container |
| `dev` | Development data | Developer laptops via Cloudflare Tunnel |

**Database sync scripts** allow controlled data flow between namespaces:
- `pnpm db:sync:prod-to-dev` — Copy prod data to dev (overwrites dev, with confirmation)
- `pnpm db:sync:dev-to-prod` — Promote dev to prod (auto-backup before sync, double confirmation)
- `pnpm db:backup` — Point-in-time SQL dump of any namespace

> ⚠️ **Critical:** Destructive operations (`DROP TABLE`, `prisma migrate reset`) on the dev namespace do NOT affect production data. However, if a developer accidentally uses the prod JWT token locally, they CAN destroy production data. Always verify your `.env` before running migrations.
