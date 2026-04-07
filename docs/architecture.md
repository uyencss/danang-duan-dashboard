# System Architecture — MobiFone Project Tracker
**Version:** 1.2.0 | **Updated:** 2026-04-07

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
│  │ (Auth Gate) │ │ (Pages/API)  │ │    SSE / Chat    │   │
│  └──────┬──────┘ └──────┬───────┘ └────────┬─────────┘   │
│         │               │                  │              │
│  ┌──────▼───────────────▼──────────────────▼──────────┐   │
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
│  │          libSQL Client (Embedded Replica)           │   │
│  │  ┌─────────────┐         ┌──────────────────────┐  │   │
│  │  │ READ (local)│         │ WRITE (→ remote)     │  │   │
│  │  │ local.db    │         │ forwarded to Turso   │  │   │
│  │  │ (0 latency) │         │ cloud primary        │  │   │
│  │  └──────▲──────┘         └──────────┬───────────┘  │   │
│  │         │ auto-sync (60s)           │              │   │
│  └─────────┼───────────────────────────┼──────────────┘   │
└────────────┼───────────────────────────┼──────────────────┘
             │                           │
             │         ┌─────────────────▼──────────────┐
             └─────────│      Turso Cloud Primary       │
                       │  (AWS ap-northeast-1 — remote) │
                       │  Syncs changes to all replicas │
                       └────────────────────────────────┘
```

---

## 2. Architecture Pattern: **Layered Monolith**

Hệ thống sử dụng **Layered Monolith** pattern trong Next.js 16 App Router:

| Layer | Thư mục | Vai trò |
|-------|--------|---------|
| **Presentation** | `src/app/`, `src/components/` | UI rendering, user interactions |
| **Proxy/Auth** | `src/app/proxy.ts` | Authentication gate (replaces middleware) |
| **API** | `src/app/api/` | REST Route Handlers |
| **Server Actions** | `src/actions/` | Direct server mutations |
| **Real-time** | `src/app/api/*/stream/` | SSE streams for chat & notifications |
| **Service** | `src/lib/services/` | Business logic, validation |
| **Data Access** | `src/lib/prisma.ts` | Prisma Client + libSQL Embedded Replica |
| **Sync** | `src/lib/utils/sync.ts` | Replica sync utilities (syncReplica, withSync) |
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
│   │   ├── proxy.ts               # Auth proxy gate
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx         # Sidebar + Header shell
│   │   │   ├── page.tsx           # Dashboard Tổng quan
│   │   │   ├── du-an/
│   │   │   │   ├── page.tsx       # Project list (CRM)
│   │   │   │   ├── tao-moi/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx   # Project detail
│   │   │   │       └── loading.tsx
│   │   │   ├── nhan-su/page.tsx
│   │   │   ├── kpi/page.tsx
│   │   │   ├── dia-ban/page.tsx
│   │   │   └── admin/
│   │   │       ├── khach-hang/page.tsx
│   │   │       ├── san-pham/page.tsx
│   │   │       ├── nhan-vien/page.tsx
│   │   │       └── users/page.tsx
│   │   └── api/
│   │       ├── auth/[...all]/route.ts
│   │       ├── du-an/
│   │       │   ├── route.ts       # GET list, POST create
│   │       │   └── [id]/
│   │       │       ├── route.ts   # GET, PUT, DELETE
│   │       │       ├── nhat-ky/route.ts
│   │       │       ├── binh-luan/route.ts
│   │       │       └── chat/
│   │       │           ├── route.ts       # GET messages, POST send
│   │       │           └── stream/
│   │       │               └── route.ts   # SSE stream endpoint
│   │       ├── khach-hang/route.ts
│   │       ├── san-pham/route.ts
│   │       ├── nhan-vien/route.ts
│   │       └── analytics/
│   │           ├── tong-quan/route.ts
│   │           ├── nhan-su/route.ts
│   │           ├── kpi-thoi-gian/route.ts
│   │           └── dia-ban/route.ts
│   ├── actions/
│   │   ├── project.actions.ts     # Server Actions for projects
│   │   ├── tasklog.actions.ts     # Server Actions for task logs
│   │   ├── admin.actions.ts       # Server Actions for CRUD
│   │   └── chat.actions.ts        # Server Actions for chat messages
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── dashboard/
│   │   │   ├── KPICard.tsx
│   │   │   ├── FunnelChart.tsx
│   │   │   ├── StaffBarChart.tsx
│   │   │   ├── TimelineChart.tsx
│   │   │   └── TerritoryMatrix.tsx
│   │   ├── project/
│   │   │   ├── ProjectTable.tsx
│   │   │   ├── ProjectForm.tsx
│   │   │   ├── QuickLogModal.tsx
│   │   │   ├── ProjectTimeline.tsx
│   │   │   ├── CommentThread.tsx
│   │   │   ├── ProjectChat.tsx        # Main chat component
│   │   │   ├── ChatMessage.tsx         # Individual message
│   │   │   ├── ChatInput.tsx           # Auto-resize input
│   │   │   ├── TypingIndicator.tsx     # Typing dots animation
│   │   │   ├── OnlineUsers.tsx         # Online presence sidebar
│   │   │   └── SmartAlertBadge.tsx
│   │   └── shared/
│   │       ├── SearchSelect.tsx
│   │       ├── StatusBadge.tsx
│   │       └── LoadingSkeleton.tsx
│   ├── lib/
│   │   ├── prisma.ts              # Prisma + libSQL Embedded Replica singleton
│   │   ├── auth.ts                # Better Auth config
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
│   │       ├── permissions.ts     # Role-based access helpers
│   │       └── sync.ts           # Turso Embedded Replica sync utilities
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
| **Dashboard Charts** | Client Component | FunnelChart, BarChart |
| **Data Tables** | Client Component | ProjectTable (interactive) |
| **KPI Cards** | Server Component + `use cache` | KPICard (cached data) |
| **Forms** | Client Component | ProjectForm, QuickLogModal |
| **Detail Page** | Server Component (data) + Client (interactive) | ProjectDetail |
| **Chat UI** | Client Component (SSE) | ProjectChat, ChatInput |
| **Typing/Presence** | Client Component (SSE) | TypingIndicator, OnlineUsers |

### 4.2 Data Flow (Embedded Replica)

```
// READ FLOW — Zero Latency
User Action (read)
    │
    ▼
Client Component (React 19)
    │
    └── Route Handler / Server Component
            ──→ Service Layer
                ──→ Prisma
                    ──→ libSQL Client
                        ──→ local-replica.db (microsecond reads, FREE)
                            │
                      JSON Response

// WRITE FLOW — Forward to Cloud + Sync Back
User Action (mutation)
    │
    ▼
Client Component → Server Action
    ──→ Service Layer
        ──→ Prisma
            ──→ libSQL Client
                ──→ WRITE forwarded to Turso Cloud Primary
                        │
                  syncReplica() ← force immediate sync
                        │
                  revalidatePath()

// CROSS-INSTANCE SYNC
Instance A writes ──→ Turso Cloud
                        │
                  auto-sync (every 60s)
                        │
                        ▼
                  Instance B local-replica.db updated

// Real-time Chat Flow (unchanged — uses Ably, not DB polling)
User types message → Server Action → Prisma → DB + Ably broadcast
    │
    ▼
Ably subscription ← real-time delivery to all clients
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

## 5. Authentication & Authorization

### 5.1 Auth Flow (Better Auth)

```
┌─────────┐     ┌────────────┐     ┌──────────┐
│  Login   │────▶│ Better Auth│────▶│ Session  │
│  Page    │     │   API      │     │   DB     │
└─────────┘     └────────────┘     └──────────┘
                      │
                      ▼
              ┌──────────────┐
              │  proxy.ts    │ ←── Checks session on every request
              │  (Auth Gate) │
              └──────┬───────┘
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
      /dashboard  /admin    /api/*
      (all users) (ADMIN)   (role check)
```

### 5.2 Role-Based Access

```typescript
// src/lib/utils/permissions.ts
export const PERMISSIONS = {
  ADMIN: {
    canManageMasterData: true,
    canManageUsers: true,
    canViewAllProjects: true,
    canCommentOnAll: true,
    canViewDashboards: true,
  },
  USER: {
    canManageMasterData: false,
    canManageUsers: false,
    canViewAllProjects: false,  // Only assigned projects
    canCommentOnAll: false,     // Reply only
    canViewDashboards: false,   // Only personal KPI
  },
} as const;
```

### 5.3 proxy.ts (Replaces middleware.ts)

```typescript
// src/app/proxy.ts
import { auth } from "@/lib/auth";

export default async function proxy(request: Request) {
  const session = await auth.getSession(request);
  const path = new URL(request.url).pathname;

  // Public routes
  if (path.startsWith("/login") || path.startsWith("/api/auth")) {
    return;
  }

  // Require authentication
  if (!session) {
    return Response.redirect(new URL("/login", request.url));
  }

  // Admin-only routes
  if (path.startsWith("/admin") && session.user.role !== "ADMIN") {
    return Response.redirect(new URL("/", request.url));
  }
}
```

---

## 6. API Design

### 6.1 REST Endpoints

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `POST` | `/api/auth/*` | Public | Better Auth routes |
| `GET` | `/api/du-an` | User+ | List projects (filtered) |
| `POST` | `/api/du-an` | User+ | Create project |
| `GET` | `/api/du-an/[id]` | User+ | Project detail |
| `PUT` | `/api/du-an/[id]` | User+ | Update project |
| `POST` | `/api/du-an/[id]/nhat-ky` | User+ | Add task log |
| `GET` | `/api/du-an/[id]/nhat-ky` | User+ | Task log timeline |
| `POST` | `/api/du-an/[id]/binh-luan` | User+ | Add comment |
| `GET` | `/api/du-an/[id]/chat` | User+ | Get chat messages (cursor pagination) |
| `POST` | `/api/du-an/[id]/chat` | User+ | Send chat message |
| `PUT` | `/api/du-an/[id]/chat/[msgId]` | User+ | Edit message (owner only, 15min) |
| `DELETE` | `/api/du-an/[id]/chat/[msgId]` | User+ | Soft-delete message |
| `GET` | `/api/du-an/[id]/chat/stream` | User+ | SSE stream (real-time messages, typing, presence) |
| `GET` | `/api/khach-hang` | User+ | List customers |
| `POST` | `/api/khach-hang` | Admin | Create customer |
| `PUT` | `/api/khach-hang/[id]` | Admin | Update customer |
| `GET` | `/api/san-pham` | User+ | List products |
| `POST` | `/api/san-pham` | Admin | Create product |
| `GET` | `/api/nhan-vien` | User+ | List staff |
| `GET` | `/api/analytics/tong-quan` | Admin | Dashboard overview |
| `GET` | `/api/analytics/nhan-su` | Admin | Staff analytics |
| `GET` | `/api/analytics/kpi-thoi-gian` | Admin | Time-based KPI |
| `GET` | `/api/analytics/dia-ban` | Admin | Territory analytics |

### 6.2 Response Format

```typescript
// Success
{ data: T, meta?: { total: number, page: number, pageSize: number } }

// Error
{ error: { code: string, message: string, details?: unknown } }
```

---

## 7. Performance Architecture

### 7.1 Optimization Map

| Concern | Solution |
|---------|---------|
| **Build speed** | Turbopack (default in Next.js 16) |
| **Fast Refresh** | Turbopack — 10x faster |
| **SSR Performance** | React Server Components (zero-JS) |
| **Auto-memoization** | React Compiler (React 19.2) |
| **Data caching** | `use cache` directive + `cacheLife()` |
| **DB query** | Prisma query optimization + indexes |
| **Bundle size** | Tree-shaking + dynamic imports |
| **Charts** | Lazy-loaded Recharts with Suspense |
| **Search** | Debounced input + server-side query |
| **Chat SSE** | Single EventSource per channel, shared across components |
| **Chat scroll** | Virtualized list for 200+ messages, cursor pagination |

### 7.2 Loading Strategy

```
Page Load
  │
  ├── 1. Server: Layout Shell (instant)
  ├── 2. Server: KPI Cards (cached, ~50ms)
  ├── 3. Streaming: Charts (<Suspense fallback={<Skeleton/>}>)
  └── 4. Client: Interactive filters (hydration)

Target: First Contentful Paint < 1s, Full Interactive < 2s
```

---

## 8. Error Handling

```typescript
// Global error boundary: src/app/(dashboard)/error.tsx
"use client";
export default function Error({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2>Đã xảy ra lỗi</h2>
      <p>{error.message}</p>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  );
}

// API error handling
export function handleApiError(error: unknown) {
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === "P2002") return { error: { code: "DUPLICATE", message: "Dữ liệu đã tồn tại" } };
    if (error.code === "P2025") return { error: { code: "NOT_FOUND", message: "Không tìm thấy" } };
  }
  return { error: { code: "INTERNAL", message: "Lỗi hệ thống" } };
}
```

---

## 9. Deployment Architecture (Multi-Instance + Embedded Replicas)

```
                    ┌──────────────────────────────────┐
                    │      Cloudflare Tunnel (HTTPS)   │
                    └──────────┬───────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                                 ▼
┌──────────────────────┐          ┌──────────────────────┐
│  Instance 1 (VPS)    │          │  Instance 2 (VPS)    │
│  Next.js 16 :3000    │          │  Next.js 16 :3001    │
│                      │          │                      │
│  ┌────────────────┐  │          │  ┌────────────────┐  │
│  │ Node.js 22     │  │          │  │ Node.js 22     │  │
│  │ Runtime        │  │          │  │ Runtime        │  │
│  └───────┬────────┘  │          │  └───────┬────────┘  │
│          │           │          │          │           │
│  ┌───────▼────────┐  │          │  ┌───────▼────────┐  │
│  │ libSQL Client  │  │          │  │ libSQL Client  │  │
│  │ (Emb. Replica) │  │          │  │ (Emb. Replica) │  │
│  └───┬───────┬────┘  │          │  └───┬───────┬────┘  │
│      │       │       │          │      │       │       │
│  ┌───▼──┐ ┌──▼────┐  │          │  ┌───▼──┐ ┌──▼────┐  │
│  │ READ │ │ WRITE │  │          │  │ READ │ │ WRITE │  │
│  │local │ │→cloud │  │          │  │local │ │→cloud │  │
│  └──────┘ └───┬───┘  │          │  └──────┘ └───┬───┘  │
│       ▲       │      │          │       ▲       │      │
│  local.db     │      │          │  local.db     │      │
│  (volume)     │      │          │  (volume)     │      │
└───────────────┼──────┘          └───────────────┼──────┘
                │                                 │
                │     writes forwarded            │
                ▼                                 ▼
          ┌───────────────────────────────────────────┐
          │          Turso Cloud Primary               │
          │      (AWS ap-northeast-1 — remote)         │
          │                                            │
          │  ← auto-sync changes to all replicas →     │
          │          (every 60s, configurable)          │
          └────────────────────────────────────────────┘
```

| Env | Host | DB | Read Source | Write Target |
|-----|------|----|-------------|------|
| Dev | localhost:3000 | SQLite (direct) | file:./dev.db | file:./dev.db |
| Production (Instance 1) | Docker :3000 | Turso Embedded Replica | local-replica.db | Turso Cloud |
| Production (Instance 2) | Docker :3001 | Turso Embedded Replica | local-replica.db | Turso Cloud |

---

## 10. Embedded Replica Subsystem

### 10.1 Connection Configuration

```typescript
// src/lib/prisma.ts — Dual-mode support
import { createClient, type Client } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

export let libsqlClient: Client;

function createLibSqlClient() {
  const useEmbeddedReplica = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN;
  
  if (useEmbeddedReplica) {
    // Production: Embedded Replica
    return createClient({
      url: process.env.LOCAL_REPLICA_PATH || "file:./data/local-replica.db",
      syncUrl: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
      syncPeriod: Number(process.env.TURSO_SYNC_PERIOD) || 60,
    });
  }
  
  // Development: Direct connection
  return createClient({ url: process.env.DATABASE_URL! });
}
```

### 10.2 Sync Strategy

| Trigger | Method | When |
|---------|--------|----- |
| Automatic | `syncPeriod: 60` | Every 60 seconds (configurable) |
| Manual | `libsqlClient.sync()` | After every write operation |
| Startup | `scripts/init-replica.ts` | Container first boot |

### 10.3 Bandwidth Budget

| Monthly Limit (Free Tier) | Estimated Usage | Utilization |
|--------------------------|-----------------|-------------|
| 3GB (3,072 MB) | ~2 MB (2 instances) | 0.07% |
