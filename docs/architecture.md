# System Architecture — MobiFone Project Tracker
**Version:** 1.6.0 | **Updated:** 2026-04-12

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                       │
│    React 19.2 + Tailwind CSS 4 + shadcn/ui + Recharts   │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTPS (via Cloudflare Tunnel)
┌──────────────────────▼───────────────────────────────────┐
│              NEXT.JS 16 SERVER (Docker Container)         │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │  proxy.ts   │ │ App Router   │ │  Server Actions  │   │
│  │ (Auth+RBAC) │ │ (Pages/API)  │ │  (Role Guards)   │   │
│  └──────┬──────┘ └──────┬───────┘ └────────┬─────────┘   │
│         │               │                  │              │
│  ┌──────▼───────────────▼──────────────────▼──────────┐   │
│  │       RBAC Layer (src/lib/rbac.ts + auth-utils.ts) │   │
│  └──────────────────────┬─────────────────────────────┘   │
│  ┌──────────────────────▼─────────────────────────────┐   │
│  │              Service Layer (Business Logic)         │   │
│  │  projectService │ analyticsService │ chatService    │   │
│  └──────────────────────┬─────────────────────────────┘   │
│                         │                                 │
│  ┌──────────────────────▼─────────────────────────────┐   │
│  │            Prisma Client v7 (ORM)                   │   │
│  │         (Standard PostgreSQL Driver)                │   │
│  └──────────────────────┬─────────────────────────────┘   │
│                         │                                 │
│  ┌──────────────────────▼─────────────────────────────┐   │
│  │   postgresql://postgres:pass@db:5432/mobi_prod     │   │
│  └──────────────────────┬─────────────────────────────┘   │
│                         │                                 │
└─────────────────────────┼─────────────────────────────────┘
                          │
    ┌─────────────────────▼─────────────────────────────┐
    │              PostgreSQL 17                        │
    │        Docker Container: danang-dashboard-db        │
    │  ┌──────────────┐  ┌───────────────────────────┐   │
    │  │ mobi_prod    │  │ mobi_dev (namespace)       │   │
    │  └──────────────┘  └───────────────────────────┘   │
    └─────────────────────────────────▲───────────────────┘
                                      │ Cloudflare Tunnel
                                      │ db.gpsdna.io.vn → tcp://db:5432
                                      │
                   ┌──────────────────┴──────────────────┐
                   │  Developer Laptop                   │
                   │  1. Run: cloudflared access tcp     │
                   │     --hostname db.gpsdna.io.vn      │
                   │     --url localhost:5433            │
                   │  2. env: DATABASE_URL=postgresql:// │
                   │     ...localhost:5433/mobi_dev      │
                   └─────────────────────────────────────┘
```

---

## 2. Architecture Pattern: **Layered Monolith**

Hệ thống sử dụng **Layered Monolith** pattern trong Next.js 16 App Router:

| Layer | Thư mục | Vai trò |
|-------|--------|---------|
| **Presentation** | `src/app/`, `src/components/` | UI rendering, user interactions |
| **Proxy/Auth** | `src/proxy.ts` | Authentication + RBAC gate (Next.js 16 proxy pattern) |
| **RBAC** | `src/lib/rbac.ts` | Centralized role-permission config, route-to-role mapping |
| **API** | `src/app/api/` | REST Route Handlers |
| **Server Actions** | `src/app/(dashboard)/*/actions.ts` | Direct server mutations (with role guards) |
| **Real-time** | `src/app/api/*/stream/` | SSE streams for chat & notifications |
| **Service** | `src/lib/services/` | Business logic, validation |
| **Data Access** | `src/lib/prisma.ts` | Prisma Client (Direct connection to Postgres) |
| **Observability** | `src/lib/logger/` | Centralized JSON logging and auto-rotation |
| **Database** | `prisma/` | Schema, migrations, seed |

---

## 3. Database Architecture: Self-Hosted PostgreSQL

### 3.1 Overview

The database is a **self-hosted `postgres:17-alpine`** running as a Docker container within the same `docker-compose.yml` network. This replaces the previous Turso Cloud / libSQL managed service entirely, offering superior stability, native ENUM support, and a flawless Prisma integration that solves historical connection drop issues.

### 3.2 Connection Topology

| Environment | Connection Path | Format | Latency |
|-------------|----------------|-----|---------|
| **Production** (Docker `web` container) | Internal Docker network | `postgresql://...db:5432` | < 1ms |
| **Development** (Local laptop) | Cloudflare Tunnel (TCP port forwarding) | `postgresql://...localhost:5433` | ~50-100ms |

### 3.3 Database Separation

| Database Name | Purpose | Accessed By |
|----------|---------|-------------|
| `mobi_prod` | Production | Live application data, used by Docker `web` container |
| `mobi_dev` | Development | Developer data, accessed via Cloudflare Tunnel TCP proxy |

> ⚠️ **Critical:** Production and development use **separate databases** within the same Postgres cluster. This prevents destructive dev migrations from affecting production data.

### 3.4 Security — Standard Postgres Auth

Unlike libSQL, Postgres doesn't require a complex JWT authentication layer. It uses standard internal authentication.

**Key Storage:** The database password is stored in GitHub Actions Secrets as `POSTGRES_PASSWORD` and injected into the `.env` on deploy.

```
GitHub Actions Secrets           Server (on deploy)
POSTGRES_PASSWORD    ──▶      .env (POSTGRES_PASSWORD)
```

Cloudflare Zero Trust policies on `db.gpsdna.io.vn` ensure that only authorized developers can even dial the database port, adding a zero-trust network layer on top of database credentials.

### 3.5 Database Sync (Dev ↔ Prod)

Dev and prod databases can be synced in either direction using built-in scripts:

| Direction | Command | Use Case |
|-----------|---------|----------|
| Prod → Dev | `pnpm db:sync:prod-to-dev` | Seed dev with real prod data |
| Dev → Prod | `pnpm db:sync:dev-to-prod` | Promote tested changes to production |
| Backup | `pnpm db:backup` | Point-in-time SQL dump of any database |

---

## 4. Directory Structure

```
danang-dashboard/
├── docs/                          # Documentation
│   ├── prd.md
│   ├── tasks.md
│   ├── tech-stack.md
│   ├── database-design.md
│   ├── architecture.md
│   └── ui/                        # UI Mockups (HTML + images)
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── seed.ts                    # Seed data
│   └── migrations/                # Migration files
├── scripts/
│   ├── postgres-init.sql          # Auto-creates mobi_dev db on startup
│   └── db-sync/
│       ├── sync-prod-to-dev.ts    # Prod → Dev data sync
│       ├── sync-dev-to-prod.ts    # Dev → Prod data promotion
│       └── backup.ts              # Database backup utility
├── src/
│   ├── app/
│   │   ├── globals.css            # Tailwind v4 @theme config
│   │   ├── layout.tsx             # Root layout (fonts, providers)
│   │   ├── proxy.ts               # Auth + RBAC proxy gate (Next.js 16)
│   ├── lib/
│   │   ├── prisma.ts              # Prisma Client singleton
│   │   ├── auth.ts                # Better Auth config
│   │   ├── auth-utils.ts          # requireAuth, requireRole, requireApiRole helpers
│   │   ├── rbac.ts                # Centralized RBAC config (roles, route-permissions)
│   │   ├── services/
│   │   │   ├── project.service.ts
│   │   │   ├── analytics.service.ts
│   │   │   ├── customer.service.ts
│   │   │   └── staff.service.ts
│   │   └── utils/
│   │       ├── alertUtils.ts      # 15-day smart alert
│   │       ├── chatRealtime.ts    # SSE/Pusher chat infrastructure
│   │       ├── chatUnread.ts      # Unread message tracking
│   │       ├── dateExtract.ts     # Week/Month/Quarter/Year
│   │       ├── formatters.ts      # Currency, date formatting
│   │       └── permissions.ts     # Legacy permission helpers (superseded by rbac.ts)
│   ├── hooks/
│   │   ├── use-project-chat.ts    # Chat state & SSE connection
│   │   ├── use-typing-indicator.ts # Typing broadcast hook
│   │   └── use-online-presence.ts  # Presence tracking hook
│   └── types/
│       ├── index.ts               # Shared TypeScript types
│       └── api.ts                 # API request/response types
├── public/
│   ├── logo.svg                   # MobiFone logo
│   └── favicon.ico
├── docker-compose.yml             # web + redis + sqld + cloudflared
├── .env.local                     # Environment variables
├── next.config.ts                 # Next.js 16 config
├── package.json
├── tsconfig.json
└── postcss.config.ts
```

---

## 5. Component Architecture

### 5.1 Rendering Strategy

| Component Type | Rendering | Ví dụ |
|---------------|-----------|-------|
| **Layout Shell** | Server Component | Sidebar, Header |
| **Dashboard Wrapper** | Client Component | DashboardWrapper (provides UserProvider) |
| **Sidebar** | Client Component | Role-aware menu filtering via `canRoleAccess()` |
| **Dashboard Charts** | Client Component | FunnelChart, BarChart |
| **Data Tables** | Client Component | ProjectTable, UsersTable (role filter tabs) |
| **KPI Cards** | Server Component + `use cache` | KPICard (cached data) |
| **Role Overview Cards** | Client Component | RoleOverviewCards (user count per role) |
| **Forms** | Client Component | ProjectForm, QuickLogModal |
| **Detail Page** | Server Component (data) + Client (interactive) | ProjectDetail |
| **Chat UI** | Client Component (SSE) | ProjectChat, ChatInput |
| **Typing/Presence** | Client Component (SSE) | TypingIndicator, OnlineUsers |

### 5.2 Data Flow (Standard Postgres)

```
// READ & WRITE FLOW
User Action
    │
    ▼
Client Component (React 19)
    │
    └── Route Handler / Server Component / Server Action
            ──→ Service Layer
                ──→ Prisma Client
                    ──→ TCP CONNECTION (pg)
                        ──→ PostgreSQL Container (Docker network)
                            ──→ mobi_prod database
```

### 5.3 Caching Strategy (Next.js 16 `use cache`)

```typescript
// Dashboard data — cached 60 seconds
"use cache"
export async function DashboardOverview() {
  cacheLife("minutes", 1);
  const stats = await analyticsService.getOverviewStats();
  return <DashboardCards stats={stats} />;
}

// Project list — no cache (always fresh)
export async function ProjectList({ filters }) {
  const projects = await projectService.list(filters);
  return <ProjectTable data={projects} />;
}
```

---

## 6. Authentication & Authorization (RBAC)
... [rest of file]

---

## 7. Infrastructure — Docker Compose

### 7.1 Service Topology

```
docker-compose.yml
├── init-perms      # One-shot: set file permissions
├── db              # Postgres 17 Server (primary database)
├── redis           # Cache & session store
├── web             # Next.js application
└── cloudflared     # Cloudflare Tunnel (routes dashboard + TCP DB)
```

### 7.2 Network Flow

```
                     Internet
                        │
                   Cloudflare Edge
                        │
              ┌─────────▼──────────┐
              │    cloudflared      │
              │   (tunnel client)   │
              └────────┬────┬──────┘
                       │    │
    dashboard.gpsdna.io.vn  db.gpsdna.io.vn (TCP route)
                       │    │
              ┌────────▼─┐ ┌▼──────────┐
              │   web    │ │    db      │
              │ :3000    │ │  :5432     │
              └────┬─────┘ └───────────┘
                   │              ▲
                   │ tcp://db:5432│
                   └──────────────┘
                         │
              ┌──────────▼─────────┐
              │      redis         │
              │     :6379          │
              └────────────────────┘
              
              All within "backend" Docker network
```
