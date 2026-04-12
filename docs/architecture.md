# System Architecture — MobiFone Project Tracker
**Version:** 1.4.0 | **Updated:** 2026-04-12

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                       │
│    React 19.2 + Tailwind CSS 4 + shadcn/ui + Recharts   │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTPS (via Cloudflare Tunnel)
┌──────────────────────▼───────────────────────────────────┐
│              NEXT.JS 16 SERVER (Instance 1 / 2)          │
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
│  │  │        DIRECT CONNECTION TO TURSO CLOUD      │  │   │
│  │  │   (HTTPS / Stateless / Proxy-safe)           │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│                         │                             │   │
└─────────────────────────┼─────────────────────────────┼───┘
                          │                             │
                          ▼                             ▼
                  Turso Cloud Primary           Turso Cloud Primary
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
| **Data Access** | `src/lib/prisma.ts` | Prisma Client + libSQL Direct HTTP connection |
| **Observability** | `src/lib/logger/` | Centralized JSON logging and auto-rotation |
| **Database** | `prisma/` | Schema, migrations, seed |

---

## 3. Directory Structure

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
├── src/
│   ├── app/
│   │   ├── globals.css            # Tailwind v4 @theme config
│   │   ├── layout.tsx             # Root layout (fonts, providers)
│   │   ├── proxy.ts               # Auth + RBAC proxy gate (Next.js 16)
│   ├── lib/
│   │   ├── prisma.ts              # Prisma + libSQL singleton (Stateless HTTP)
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
├── .env.local                     # Environment variables
├── next.config.ts                 # Next.js 16 config
├── package.json
├── tsconfig.json
└── postcss.config.ts
```

---

## 4. Component Architecture

### 4.1 Rendering Strategy

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

### 4.2 Data Flow (Stateless HTTP)

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
                        ──→ DIRECT STATELESS HTTP REQUEST (HTTPS)
                            ──→ Turso Cloud Primary (AWS)
```

### 4.3 Caching Strategy (Next.js 16 `use cache`)

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

## 5. Authentication & Authorization (RBAC)
... [rest of file]
