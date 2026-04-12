# Tech Stack — MobiFone Project Tracker
**Version:** 1.3.0 | **Updated:** 2026-04-09

---

## 1. Tổng quan công nghệ

| Layer | Technology | Version | Vai trò |
|-------|-----------|---------|---------|
| **Framework** | Next.js | 16.2.x | Fullstack React framework (App Router) |
| **Runtime** | React | 19.2.x | UI library (Stable React Compiler) |
| **Language** | TypeScript | 5.8.x | Type safety |
| **Styling** | Tailwind CSS | 4.2.x | Utility-first CSS (Oxide engine, CSS-first config) |
| **UI Components** | shadcn/ui | CLI v4.x | Copy-paste component library (Radix UI) |
| **Charts** | Recharts | 3.8.x | Data visualization cho dashboards |
| **ORM** | Prisma | 7.6.x | Database access & migration |
| **Database (Dev)** | SQLite | 3.x | Dev database (local file) |
| **Database (Prod)** | Turso (libSQL) | Direct HTTP | Direct HTTP connection to Turso Cloud. Ensures stability through proxy. |
| **Auth** | Better Auth | latest | Authentication & authorization (thay thế Auth.js/NextAuth) |
| **Form Validation** | React Hook Form + Zod | RHF 7.72.x + Zod 3.23.x | Form management & schema validation |
| **Bundler** | Turbopack | Integrated | Default bundler trong Next.js 16 |
| **Real-time** | Server-Sent Events (SSE) | Native | Chat & notifications real-time streaming |
| **Logging** | Pino & rotating-file-stream | 9.x / 3.x | Structured NDJSON logging & file rotation |
| **Package Manager** | pnpm | 10.x | Fast, disk-efficient package manager |

---

## 2. Chi tiết từng công nghệ

### 2.1 Next.js 16 (App Router)

**Phiên bản:** `16.2.x` (stable, released Q1/2026)

```bash
npx create-next-app@latest ./ --typescript --tailwind --app --src-dir --turbopack
```

**Tính năng chính sử dụng:**

| Feature | Mô tả | Áp dụng |
|---------|--------|---------|
| **App Router** | File-based routing with layouts, loading, error states | Toàn bộ routing |
| **Turbopack** | Default bundler — 10x faster Fast Refresh | Dev & Build |
| **Server Components** | Zero-JS components render trên server | Dashboard pages, data tables |
| **Server Actions** | Mutate data trực tiếp từ server | CRUD operations |
| **Cache Components** | `use cache` directive thay PPR | Dashboard data caching |
| **React Compiler** | Auto-memoization, không cần `useMemo`/`useCallback` | Toàn bộ codebase |
| **proxy.ts** | Thay thế `middleware.ts` — rõ ràng hơn về network boundary | Auth + RBAC guards (4-role enforcement) |
| **Metadata API** | SEO-optimized metadata per route | Mọi trang |
| **Streaming** | Progressive rendering with `<Suspense>` | Dashboard charts loading |
| **SSE** | Server-Sent Events for real-time data push | Chat & notification streams |

**Cấu trúc routing:**
```
src/
├── proxy.ts                       # Auth + RBAC proxy gate (Next.js 16)
├── lib/
│   ├── rbac.ts                    # Centralized RBAC config
│   └── auth-utils.ts              # Server-side auth helpers
├── contexts/
│   └── user-context.tsx           # Client-side RBAC context
├── app/
│   ├── (auth)/                    # Auth group (login, register)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/               # Protected dashboard group
│   │   ├── layout.tsx             # Sidebar + Header layout
│   │   ├── dashboard-wrapper.tsx  # UserProvider wrapper
│   │   ├── page.tsx               # Dashboard Tổng quan
│   │   ├── du-an/
│   │   │   ├── page.tsx           # CRM & DS Dự án
│   │   │   ├── tao-moi/page.tsx   # Tạo dự án mới
│   │   │   └── [id]/page.tsx      # Chi tiết dự án
│   │   ├── nhan-su/page.tsx       # Tổng hợp nhân sự (ADMIN, USER only)
│   │   ├── kpi/page.tsx           # KPI Thời gian (ADMIN, USER only)
│   │   ├── dia-ban/page.tsx       # Top Địa bàn (ADMIN, USER only)
│   │   └── admin/                 # Admin-area routes (mixed access)
│   │       ├── khach-hang/        # ALL roles
│   │       ├── san-pham/          # ADMIN, USER only
│   │       ├── kpi/               # ALL roles
│   │       └── users/             # ADMIN, USER only
│   │           ├── page.tsx       # User management + role overview
│   │           ├── actions.ts     # CRUD + bulk role update
│   │           ├── users-table.tsx # Role filter tabs, checkboxes
│   │           └── role-overview-cards.tsx
│   ├── api/                       # API Routes (with requireApiRole guards)
│   │   ├── auth/[...all]/route.ts
│   │   ├── du-an/route.ts
│   │   ├── dashboard/overview/route.ts  # requireApiRole(ALL)
│   │   ├── admin/email/send/route.ts    # requireApiRole(ADMIN, USER)
│   │   └── analytics/route.ts
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Tailwind CSS v4 config
```

**Custom Hooks:**
```
src/hooks/
├── use-project-chat.ts        # Chat state & SSE connection
├── use-typing-indicator.ts    # Typing broadcast hook
└── use-online-presence.ts     # Presence tracking hook
```

---

### 2.2 Tailwind CSS v4

**Phiên bản:** `4.2.x` (Oxide engine, CSS-first config)

```bash
npm install tailwindcss @tailwindcss/postcss
```

**Thay đổi quan trọng so với v3:**
- **Không còn `tailwind.config.js`** — cấu hình trực tiếp trong CSS
- **Oxide engine** (Rust) — build nhanh hơn 5x, incremental 100x
- **CSS-native directives:** `@theme`, `@utility`, `@variant`
- **Automatic content detection** — không cần khai báo `content[]`

**MobiFone Theme Configuration** (`globals.css`):
```css
@import "tailwindcss";

@theme {
  /* MobiFone Brand Colors */
  --color-primary: #0D1F3C;
  --color-primary-light: #1A3A6B;
  --color-secondary: #0058BC;
  --color-secondary-container: #0070EB;
  --color-accent: #007AFF;

  /* Surfaces */
  --color-surface: #F8FAFC;
  --color-surface-container: #F2F4F6;
  --color-surface-elevated: #FFFFFF;

  /* Semantic */
  --color-success: #16A34A;
  --color-warning: #F59E0B;
  --color-danger: #E31837;
  --color-info: #3B82F6;

  /* Typography */
  --font-sans: "Inter", system-ui, sans-serif;

  /* Spacing & Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}
```

---

### 2.3 shadcn/ui (CLI v4)

**Version:** CLI `v4.1.x`

```bash
npx shadcn@latest init        # Existing project
npx shadcn@latest create      # New project (visual builder)
```

**Components sử dụng:**

| Component | Sử dụng cho |
|-----------|-------------|
| `Button` | CTAs, actions |
| `DataTable` | Project list, Master data tables |
| `Dialog` / `Sheet` | Quick Update modal, CRUD forms |
| `Select` / `Combobox` | Search & Select dropdowns |
| `Badge` | Status badges, alert badges |
| `Card` | KPI cards, overview cards |
| `Tabs` | Dashboard view switching |
| `Form` | All forms (with React Hook Form) |
| `Toast` / `Sonner` | Success/error notifications |
| `Calendar` / `DatePicker` | Date selection |
| `Avatar` | User avatars in comments |
| `Skeleton` | Loading states |
| `Command` | Command palette search |
| `Tooltip` | Help text |
| `DropdownMenu` | Action menus |
| `ScrollArea` | Chat message scroll container |
| `AlertProvider` | Global alert dialog (`useAlert`) |
| `ModalProvider` | Global generic modal (`useModal`) |

**Cài đặt components:**
```bash
npx shadcn@latest add button card dialog data-table form select combobox badge tabs toast avatar skeleton command tooltip dropdown-menu calendar sheet
```

---

### 2.4 Recharts 3.8

**Version:** `3.8.x` (React 19 compatible)

```bash
npm install recharts
```

**Charts sử dụng:**

| Chart Type | Dashboard View | Component |
|-----------|---------------|-----------|
| `FunnelChart` | Tổng quan | Phân phối trạng thái dự án |
| `BarChart` (grouped) | Tổng hợp Nhân sự | Doanh thu & HĐ theo AM |
| `BarChart` (horizontal) | Tổng quan | Top 5 AM performance |
| `LineChart` | KPI Thời gian | Xu hướng doanh thu/dự án |
| `Treemap` / Heatmap | Top Địa bàn | Matrix địa bàn sinh lời |
| `PieChart` | Tổng quan | Phân bố loại khách hàng |

---

### 2.5 Prisma ORM v7

**Version:** `7.6.x` (LTS stable)

```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider sqlite
```

**Tính năng sử dụng:**
- **Prisma Schema** — declarative data modeling
- **Prisma Migrate** — database migration management
- **Prisma Client** — auto-generated type-safe query builder
- **Prisma Studio** — visual database browser (dev)
- **Relation queries** — nested reads/writes
- **Transactions** — batch operations (Task Log + Project update)

**Database strategy:**
```
Development:  SQLite (direct)    file:./dev.db
Production:   Turso Direct HTTP
              ├─ Reads:  remote-cloud.db (zero latency, FREE)
              ├─ Writes: forwarded to Turso Cloud primary
              └─ Sync:   auto-sync every 60s + manual after writes
```

**Direct HTTP Configuration:**
```typescript
import { createClient } from "@libsql/client";

// Production: local file + remote sync
const client = createClient({
  url: "file:./data/remote-cloud.db",     // Read from local
  syncUrl: process.env.TURSO_DATABASE_URL!, // Sync with remote
  authToken: process.env.TURSO_AUTH_TOKEN!,
  syncPeriod: 60,                           // Auto-sync interval
});
```

---

### 2.6 Better Auth + RBAC Layer

**Thay thế:** Auth.js / NextAuth.js v5 (deprecated, chuyển sang Better Auth)

```bash
npm install better-auth
```

**Tính năng:**
- Email/Password authentication
- Session management (JWT + Database sessions)
- 4-role RBAC system (ADMIN, USER, AM, CV) — centralized in `src/lib/rbac.ts`
- Next.js App Router integration
- Edge-compatible via `proxy.ts` (Next.js 16 pattern)

**RBAC Architecture:**

The RBAC system is **not** a Better Auth plugin — it's a custom layer built on top of Better Auth sessions, enforced at 4 levels:

```
src/lib/rbac.ts          ← Single source of truth for role-route mappings
src/lib/auth-utils.ts    ← Server-side helpers: requireRole(), requireApiRole()
src/proxy.ts             ← Edge-level enforcement on every request
src/contexts/user-context.tsx ← Client-side role context for UI
```

| File | Purpose | Used By |
|------|---------|---------|
| `rbac.ts` | `AppRole` type, `ROLE_METADATA`, `ROUTE_PERMISSIONS[]`, `getRequiredRoles()`, `canRoleAccess()` | proxy, sidebar, server actions, client components |
| `auth-utils.ts` | `requireAuth()`, `requireRole()`, `requireApiRole()`, `hasAccess()` | Server components, server actions, API routes |
| `proxy.ts` | Intercepts every non-public request, checks session + RBAC | Next.js 16 proxy layer |
| `user-context.tsx` | `UserProvider` + `useUser()` hook, exposes `canAccess(route)` | Client components, sidebar, dashboard wrapper |

**Role Definitions:**

| Role | Vietnamese | Access Level |
|------|-----------|-------------|
| `ADMIN` | Quản trị viên (Admin) | Full access — all menus, user management, system config |
| `USER` | Quản trị viên (Chuyên viên) | Full access — all menus, similar to ADMIN |
| `AM` | Account Manager | Restricted — Dashboard, CRM, Khách hàng, KPI, Tạo dự án |
| `CV` | Chuyên viên | Restricted — Dashboard, CRM, Khách hàng, KPI, Tạo dự án |

**Server-Side Usage Examples:**

```typescript
// In a Server Action (src/app/(dashboard)/admin/users/actions.ts)
export async function createUser(data) {
  await requireRole("ADMIN", "USER");
  // ...mutation logic
}

// In an API Route Handler (src/app/api/admin/email/send/route.ts)
export const POST = async (request: Request) => {
  const authResult = await requireApiRole("ADMIN", "USER");
  if (authResult.error) return authResult.error;
  // ...endpoint logic
};
```

**Client-Side Usage Example:**

```typescript
// Any client component within DashboardWrapper
const { role, canAccess, roleLabel } = useUser();

if (canAccess("/admin/users")) {
  return <AdminLink />;
}
```

---

### 2.7 Form Stack

```bash
npm install react-hook-form @hookform/resolvers zod@^3.23.8
```

> ⚠️ **Quan trọng:** Sử dụng **Zod v3.23.x** (không dùng v4) vì `@hookform/resolvers` chưa hỗ trợ hoàn toàn Zod v4 type system.

**Pattern:**
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const projectSchema = z.object({
  customerId: z.number().min(1, "Chọn khách hàng"),
  productId: z.number().min(1, "Chọn sản phẩm"),
  tongDoanhThuDuKien: z.number().min(0),
  ngayBatDau: z.date(),
});

type ProjectForm = z.infer<typeof projectSchema>;
```

---

## 3. Dev Tooling

| Tool | Version | Mục đích |
|------|---------|---------|
| **ESLint** | 9.x (flat config) | Linting |
| **Prettier** | 4.x | Code formatting |
| **pnpm** | 10.x | Package management |
| **Prisma Studio** | Integrated | Database browser |
| **Next.js Devtools MCP** | Integrated | AI agent debugging |
| **Turbopack** | Integrated | Bundling |
| **Pino Pretty** | 13.x | Dev-mode human readable logs console formatter |

---

## 4. Deployment

| Environment | Platform | Database |
|------------|----------|----------|
| **Development** | `localhost:3000` | SQLite (direct) |
| **Production (Instance 1)** | Docker :3000 (VPS) | Direct HTTP |
| **Production (Instance 2)** | Docker :3001 (VPS) | Direct HTTP |

**Build & Deploy:**
```bash
# Development
pnpm dev                    # Turbopack dev server

# Production build
pnpm build                  # Turbopack production build
pnpm start                  # Start production server

# Database
npx prisma migrate dev      # Dev migration
npx prisma migrate deploy   # Production migration
npx prisma studio           # Visual DB browser
```

---

## 5. Version Lock (`package.json` excerpt)

```json
{
  "dependencies": {
    "next": "^16.2.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "tailwindcss": "^4.2.0",
    "@tailwindcss/postcss": "^4.2.0",
    "@prisma/client": "^7.6.0",
    "recharts": "^3.8.0",
    "better-auth": "latest",
    "react-hook-form": "^7.72.0",
    "@hookform/resolvers": "^5.2.0",
    "zod": "^3.23.8",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.500.0",
    "sonner": "^2.0.0",
    "pino": "^9.0.0",
    "rotating-file-stream": "^3.0.0"
  },
  "devDependencies": {
    "prisma": "^7.6.0",
    "typescript": "^5.8.0",
    "@types/react": "^19.2.0",
    "@types/node": "^22.0.0",
    "eslint": "^9.0.0",
    "prettier": "^4.0.0"
  }
}
```
