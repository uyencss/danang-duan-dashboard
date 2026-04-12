# System Architecture — MobiFone Project Tracker
**Version:** 1.5.0 | **Updated:** 2026-04-12

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
│  │         + @prisma/adapter-libsql                    │   │
│  └──────────────────────┬─────────────────────────────┘   │
│                         │                                 │
│  ┌──────────────────────▼─────────────────────────────┐   │
│  │          libSQL Client (Stateless HTTP)             │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │   PROD: http://sqld:8080 (internal Docker)   │  │   │
│  │  │   DEV:  https://turso.gpsdna.io.vn (Tunnel)  │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  └──────────────────────┬─────────────────────────────┘   │
│                         │                                 │
└─────────────────────────┼─────────────────────────────────┘
                          │
    ┌─────────────────────▼─────────────────────────────┐
    │              sqld (libSQL Server)                   │
    │        Docker Container: danang-dashboard-db        │
    │  ┌──────────────┐  ┌───────────────────────────┐   │
    │  │ prod database │  │ dev database (namespace)  │   │
    │  │  (default)    │  │ accessed via ?db=dev      │   │
    │  └──────────────┘  └───────────────────────────┘   │
    │         ▲                       ▲                   │
    │         │                       │                   │
    │    JWT Auth Required       JWT Auth Required         │
    └─────────────────────────────────────────────────────┘
                          ▲
                          │ Cloudflare Tunnel
                          │ turso.gpsdna.io.vn → sqld:8080
                          │
                   ┌──────┴──────────────┐
                   │  Developer Laptop   │
                   │  (local npm run dev)│
                   └─────────────────────┘
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
| **Data Access** | `src/lib/prisma.ts` | Prisma Client + libSQL HTTP connection to self-hosted sqld |
| **Observability** | `src/lib/logger/` | Centralized JSON logging and auto-rotation |
| **Database** | `prisma/` | Schema, migrations, seed |

---

## 3. Database Architecture: Self-Hosted sqld

### 3.1 Overview

The database is a **self-hosted `sqld` (libSQL Server)** running as a Docker container within the same `docker-compose.yml` network. This replaces the previous Turso Cloud managed service.

### 3.2 Connection Topology

| Environment | Connection Path | URL | Latency |
|-------------|----------------|-----|---------|
| **Production** (Docker `web` container) | Internal Docker network | `http://sqld:8080` | < 1ms |
| **Development** (Local laptop) | Cloudflare Tunnel (HTTPS) | `https://turso.gpsdna.io.vn` | ~50-100ms |

### 3.3 Database Separation

| Database | Namespace | Purpose |
|----------|-----------|---------|
| `default` | Production | Live application data, used by Docker `web` container |
| `dev` | Development | Developer data, accessed via Cloudflare Tunnel |

> ⚠️ **Critical:** Production and development use **separate database namespaces** within the same sqld instance. This prevents destructive dev migrations from affecting production data.

### 3.4 Security — JWT Authentication

sqld is protected by **Ed25519 JWT authentication**. Every connection (including internal Docker and external Cloudflare Tunnel) must present a valid JWT token.

**Key Storage:** Keys live in `sqld-keys/` within the project root (gitignored via `*.pem`). The public key is synced to **GitHub Actions Secrets** as `SQLD_JWT_PUBLIC_KEY` and written to the server during deployment.

```
Local Project                           GitHub Secrets              Server (on deploy)
 sqld-keys/                              SQLD_JWT_PUBLIC_KEY  ──▶  sqld-keys/sqld_jwt_public.pem
 ├── sqld_jwt_private.pem (gitignored)   TURSO_AUTH_TOKEN     ──▶  .env (TURSO_AUTH_TOKEN)
 ├── sqld_jwt_public.pem  (gitignored)
 └── README.md            (committed)
```

### 3.5 Database Sync (Dev ↔ Prod)

Dev and prod databases can be synced in either direction using built-in scripts:

| Direction | Command | Use Case |
|-----------|---------|----------|
| Prod → Dev | `pnpm db:sync:prod-to-dev` | Seed dev with real prod data |
| Dev → Prod | `pnpm db:sync:dev-to-prod` | Promote tested changes to production |
| Backup | `pnpm db:backup` | Point-in-time SQL dump of any namespace |

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
├── sqld-keys/                     # JWT keys for sqld auth
│   ├── README.md                  # ✅ Committed — key setup instructions
│   ├── sqld_jwt_private.pem       # ❌ Gitignored — signs JWT tokens
│   └── sqld_jwt_public.pem        # ❌ Gitignored — synced to GitHub Secrets
├── scripts/
│   ├── sqld-keys/
│   │   └── generate-token.ts      # JWT token generation from private key
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
│   │   ├── prisma.ts              # Prisma + libSQL singleton (HTTP to sqld)
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

### 5.2 Data Flow (Stateless HTTP to sqld)

```
// READ & WRITE FLOW
User Action
    │
    ▼
Client Component (React 19)
    │
    └── Route Handler / Server Component / Server Action
            ──→ Service Layer
                ──→ Prisma
                    ──→ libSQL Client
                        ──→ STATELESS HTTP REQUEST
                            ──→ sqld Container (Docker network)
                                ──→ SQLite database file
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
├── sqld            # libSQL Server (primary database)
├── redis           # Cache & session store
├── web             # Next.js application
└── cloudflared     # Cloudflare Tunnel (routes dashboard + DB)
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
    dashboard.gpsdna.io.vn  turso.gpsdna.io.vn
                       │    │
              ┌────────▼─┐ ┌▼──────────┐
              │   web    │ │   sqld     │
              │ :3000    │ │  :8080     │
              └────┬─────┘ └───────────┘
                   │              ▲
                   │   http://sqld:8080
                   └──────────────┘
                         │
              ┌──────────▼─────────┐
              │      redis         │
              │     :6379          │
              └────────────────────┘
              
              All within "backend" Docker network
```
