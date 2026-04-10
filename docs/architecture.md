# System Architecture — MobiFone Project Tracker
**Version:** 1.3.0 | **Updated:** 2026-04-09

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
| **Proxy/Auth** | `src/proxy.ts` | Authentication + RBAC gate (Next.js 16 proxy pattern) |
| **RBAC** | `src/lib/rbac.ts` | Centralized role-permission config, route-to-role mapping |
| **API** | `src/app/api/` | REST Route Handlers |
| **Server Actions** | `src/app/(dashboard)/*/actions.ts` | Direct server mutations (with role guards) |
| **Real-time** | `src/app/api/*/stream/` | SSE streams for chat & notifications |
| **Service** | `src/lib/services/` | Business logic, validation |
| **Data Access** | `src/lib/prisma.ts` | Prisma Client + libSQL Embedded Replica |
| **Sync** | `src/lib/utils/sync.ts` | Replica sync utilities (syncReplica, withSync) |
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
│   │   │       ├── roles/
│   │   │       │   ├── page.tsx               # Role Management
│   │   │       │   ├── actions.ts             # Roles server actions
│   │   │       │   ├── menu-manager.tsx       # Menu configuration UI
│   │   │       │   └── permission-matrix.tsx  # Dynamic RBAC matrix
│   │   │       └── users/
│   │   │           ├── page.tsx            # User management (role overview cards)
│   │   │           ├── actions.ts          # CRUD + bulkUpdateRole + getUserCountsByRole
│   │   │           ├── users-table.tsx     # Role filter tabs, bulk role update
│   │   │           └── role-overview-cards.tsx  # Visual role summary cards
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
│   ├── contexts/
│   │   └── user-context.tsx       # UserProvider + useUser (client-side RBAC)
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── use-alert.tsx      # Global AlertProvider + hook
│   │   │   └── use-modal.tsx      # Global ModalProvider + hook
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx        # Role-aware menu filtering
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
│   │       ├── permissions.ts     # Legacy permission helpers (superseded by rbac.ts)
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

## 5. Authentication & Authorization (RBAC)

### 5.1 Auth Flow (Better Auth + RBAC)

```
┌─────────┐     ┌────────────┐     ┌──────────┐
│  Login   │────▶│ Better Auth│────▶│ Session  │
│  Page    │     │   API      │     │   DB     │
└─────────┘     └────────────┘     └──────────┘
                      │
                      ▼
              ┌──────────────┐
              │  proxy.ts    │ ←── Checks session + RBAC on every request
              │(Auth + RBAC) │
              └──────┬───────┘
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
      /dashboard  /admin/*   /api/*
      (ALL roles) (varies)   (role guard)
```

### 5.2 Four-Role System

The system defines four roles with distinct access levels, configured centrally in `src/lib/rbac.ts`:

| Role | Label (Vietnamese) | Full Access | Restricted Access |
|------|-------------------|-------------|-------------------|
| **ADMIN** | Quản trị viên (Admin) | All menus, all admin pages, user management | — |
| **USER** | Quản trị viên (Chuyên viên) | All menus, same as ADMIN except user management scope | — |
| **AM** | Account Manager | — | Dashboard, CRM & DS dự án, Khách hàng, Giao KPI, Khởi tạo dự án CĐS |
| **CV** | Chuyên viên | — | Dashboard, CRM & DS dự án, Khách hàng, Giao KPI, Khởi tạo dự án CĐS |

### 5.3 RBAC Architecture — Defense in Depth

Access control is enforced at **four layers**, ensuring no single bypass can grant unauthorized access:

```
Request Flow:

[Browser] ──→ [1. proxy.ts] ──→ [2. Server Component] ──→ [3. Server Action] ──→ [4. API Route]
               (edge RBAC)       (page-level guard)       (mutation guard)       (endpoint guard)
```

| Layer | File(s) | Mechanism | Failure Behavior |
|-------|---------|-----------|-----------------|
| **1. Edge Proxy** | `src/proxy.ts` | `getRequiredRoles(path)` from `rbac.ts` | Redirect to `/du-an` |
| **2. Server Components** | `page.tsx` files | `requireRole()` from `auth-utils.ts` | Redirect to `/du-an` |
| **3. Server Actions** | `actions.ts` files | `requireRole("ADMIN", "USER")` guard | Throws / redirect |
| **4. API Routes** | `route.ts` files | `requireApiRole()` returns 401/403 Response | JSON error response |

### 5.4 Centralized RBAC Config (`src/lib/rbac.ts`)

All route-to-role mappings live in a single file, making it easy to audit and modify:

```typescript
// src/lib/rbac.ts
export type AppRole = "ADMIN" | "USER" | "AM" | "CV";

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // ALL roles can access:
  { pattern: "/",               roles: ALL_ROLES, exact: true },
  { pattern: "/du-an",          roles: ALL_ROLES },
  { pattern: "/du-an/tao-moi",  roles: ALL_ROLES },
  { pattern: "/admin/khach-hang", roles: ALL_ROLES },
  { pattern: "/admin/kpi",      roles: ALL_ROLES },

  // ADMIN + USER only:
  { pattern: "/kpi",            roles: MANAGER_ROLES },
  { pattern: "/dia-ban",        roles: MANAGER_ROLES },
  { pattern: "/quan-ly-am",     roles: MANAGER_ROLES },
  { pattern: "/quan-ly-cv",     roles: MANAGER_ROLES },
  { pattern: "/admin/san-pham", roles: MANAGER_ROLES },
  { pattern: "/admin/users",    roles: MANAGER_ROLES },
  { pattern: "/admin/du-an-da-xoa", roles: MANAGER_ROLES },
  { pattern: "/du-an/tracking", roles: MANAGER_ROLES },
  { pattern: "/email-service",  roles: MANAGER_ROLES },
];

export function getRequiredRoles(pathname: string): AppRole[];
export function canRoleAccess(role: AppRole, pathname: string): boolean;
```

### 5.5 proxy.ts (Next.js 16 Proxy — Auth + RBAC Gate)

```typescript
// src/proxy.ts — replaces traditional middleware.ts in Next.js 16
import { getRequiredRoles, PUBLIC_ROUTES, STATIC_PREFIXES } from "@/lib/rbac";
import type { AppRole } from "@/lib/rbac";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Allow static assets and public routes through
  if (STATIC_PREFIXES.some(p => path.startsWith(p))) return next();
  if (PUBLIC_ROUTES.some(r => path.startsWith(r)))    return next();

  // 2. API routes handle their own auth via requireApiRole()
  if (path.startsWith("/api/")) return next();

  // 3. Fetch session from Better Auth
  const session = await fetchSession(request);
  if (!session) return redirect("/login");

  // 4. RBAC check: match route → get allowed roles → verify
  const userRole = (session.user?.role || "CV") as AppRole;
  const allowedRoles = getRequiredRoles(path);
  if (!allowedRoles.includes(userRole)) {
    return redirect("/du-an"); // fallback to CRM page
  }

  return next();
}
```

### 5.6 Server-Side Auth Helpers (`src/lib/auth-utils.ts`)

```typescript
// Page-level guard (Server Components)
export async function requireRole(...allowedRoles: AppRole[]);
//   Usage: await requireRole("ADMIN", "USER");

// API route guard (Route Handlers)
export async function requireApiRole(...allowedRoles: AppRole[]);
//   Returns { user } or { error: Response(401|403) }

// General helpers
export async function requireAuth();    // Redirect if not logged in
export async function requireAdmin();   // Redirect if not ADMIN
export function hasAccess(role: string, allowedRoles: AppRole[]): boolean;
```

### 5.7 Client-Side RBAC (`src/contexts/user-context.tsx`)

The `UserProvider` wraps the entire dashboard layout, making role information available to all client components:

```typescript
// Any client component can use:
const { role, canAccess, roleLabel } = useUser();

// Conditionally render UI:
if (canAccess("/admin/users")) {
  return <AdminLink />;
}
```

The `Sidebar` component uses this to filter menu items based on the user's role, and `dashboard-wrapper.tsx` provides the `UserProvider` context.

### 5.8 Dynamic RBAC & Menu Management (Implemented)

The RBAC config in `src/lib/rbac.ts` is now integrated with a database-driven model:

| Model | Purpose |
|-------|---------|
| `MenuItem` | Registry of all menu/routes in the system, includes `sortOrder` and `isActive` |
| `MenuPermission` | Join table: which roles can access which menu items |
| `RoleConfig` | Role metadata stored in DB |

Admins can assign menu access to roles and configure menu items (reordering, toggling active states) via a dedicated UI at `/admin/roles` without code changes.

---

## 6. API Design

### 6.1 REST Endpoints

| Method | Endpoint | Role Guard | Description |
|--------|---------|------------|-------------|
| `POST` | `/api/auth/*` | Public | Better Auth routes |
| `GET` | `/api/du-an` | ALL roles | List projects (filtered) |
| `POST` | `/api/du-an` | ALL roles | Create project |
| `GET` | `/api/du-an/[id]` | ALL roles | Project detail |
| `PUT` | `/api/du-an/[id]` | ALL roles | Update project |
| `POST` | `/api/du-an/[id]/nhat-ky` | ALL roles | Add task log |
| `GET` | `/api/du-an/[id]/nhat-ky` | ALL roles | Task log timeline |
| `POST` | `/api/du-an/[id]/binh-luan` | ALL roles | Add comment |
| `GET` | `/api/du-an/[id]/chat` | ALL roles | Get chat messages (cursor pagination) |
| `POST` | `/api/du-an/[id]/chat` | ALL roles | Send chat message |
| `PUT` | `/api/du-an/[id]/chat/[msgId]` | ALL roles | Edit message (owner only, 15min) |
| `DELETE` | `/api/du-an/[id]/chat/[msgId]` | ALL roles | Soft-delete message |
| `GET` | `/api/du-an/[id]/chat/stream` | ALL roles | SSE stream (real-time messages, typing, presence) |
| `GET` | `/api/khach-hang` | ALL roles | List customers |
| `POST` | `/api/khach-hang` | ADMIN, USER | Create customer |
| `PUT` | `/api/khach-hang/[id]` | ADMIN, USER | Update customer |
| `GET` | `/api/san-pham` | ALL roles | List products |
| `POST` | `/api/san-pham` | ADMIN, USER | Create product |
| `GET` | `/api/nhan-vien` | ALL roles | List staff |
| `GET` | `/api/dashboard/overview` | ALL roles | Dashboard overview (`requireApiRole`) |
| `POST` | `/api/admin/email/send` | ADMIN, USER | Send email (`requireApiRole`) |
| `GET` | `/api/analytics/tong-quan` | ADMIN, USER | Analytics overview |
| `GET` | `/api/analytics/nhan-su` | ADMIN, USER | Staff analytics |
| `GET` | `/api/analytics/kpi-thoi-gian` | ADMIN, USER | Time-based KPI |
| `GET` | `/api/analytics/dia-ban` | ADMIN, USER | Territory analytics |

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

### 8.2 Logging Strategy (Pino + rotating-file-stream)

- **Format**: NDJSON (Newline Delimited JSON) để tương thích với các hệ thống ELK / Loki.
- **Auto-Rotation**: Ghi log vào filesystem `logs/app.log`, tự động rotate hàng tháng (`app.YYYY-MM.log.gz`).
- **Data Redaction**: Tự động mã hóa/che giấu (`*`) các trường thông tin nhạy cảm: `password`, `token`, `email`.
- **Request Tracing**: `x-request-id` header được inject qua Middleware để theo dõi hành trình của request qua các logs.

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
