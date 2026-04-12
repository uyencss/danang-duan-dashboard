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

## 5. Database Security — Self-Hosted PostgreSQL

### 5.1 Overview

The PostgreSQL container is the single source of truth for all application data. It is exposed both internally (Docker network) and externally (Cloudflare TCP Tunnel), so robust authentication is mandatory.

### 5.2 Authentication (Postgres Role)

All connections to PostgreSQL require a valid role and password.

```
Connection Flow:
    Client (Prisma)
        │
    │  TCP Connection (Prisma)
    ▼
PostgreSQL Container (Network `backend`)
    │
    ├── Authenticate via Postgres Role/Password
    │
    ▼
✅ Allow / ❌ Reject
```

### 5.3 Key Management — GitHub Secrets

PostgreSQL uses standard username and password authentication without complex JWT or PEM keys.

1. A highly secure random password is generated and stored in **GitHub Actions Secrets** as `POSTGRES_PASSWORD`.
2. During the `deploy.yml` workflow, this secret is injected into the server's `.env` file.
3. The Docker Compose `db` service reads this password to instantiate the Postgres cluster.
4. Developers do NOT need the production password. They only need access to the `mobi_dev` database locally.

### 5.4 Security Rules

- Restrict by IP range / country

### 5.6 Data Isolation & Sync

| Database | Purpose | Access |
|-----------|---------|--------|
| `mobi_prod` | Production data | Only the Docker `web` container |
| `mobi_dev` | Development data | Developer laptops via Cloudflare TCP Tunnel |

**Database sync scripts** allow controlled data flow between databases:
- `pnpm db:sync:prod-to-dev` — Copy prod data to dev (pg_dump -> dev)
- `pnpm db:sync:dev-to-prod` — Promote dev to prod (auto-backup before sync)
- `pnpm db:backup` — Point-in-time SQL dump of any database

> ⚠️ **Critical:** Destructive operations (`prisma db push --force-reset`) on `mobi_dev` do NOT affect production data. Always verify your `DATABASE_URL` before running destructive commands.
