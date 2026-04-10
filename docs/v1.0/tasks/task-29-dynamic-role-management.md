# Task 29 — Dynamic Role Management (Database-Driven RBAC)
**Phase:** 7 (Security & Access Control)  
**Priority:** P1  
**Status:** 🔲 To Do  
**PRD Ref:** Section 3 (User Roles & Permissions)  
**Tech Ref:** [tech-stack.md](../tech-stack.md) — Section 2.6 (Better Auth)  
**UI Ref:** [docs/ui/06-role-management.html](../ui/06-role-management.html)

---

## Bối cảnh & Vấn đề hiện tại

Task 28 đã triển khai RBAC với cấu hình **hardcode** trong `src/lib/rbac.ts`. Route-permission mapping được khai báo tĩnh trong mã nguồn:

```typescript
// src/lib/rbac.ts — hiện tại hardcode
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  { pattern: "/", roles: ALL_ROLES, exact: true },
  { pattern: "/kpi", roles: ["ADMIN", "USER"] },
  // ...
];
```

**Vấn đề:**
1. **Không linh hoạt** — Mỗi khi cần thay đổi quyền truy cập menu cho 1 role, phải sửa code và deploy lại.
2. **Không có giao diện quản lý** — Admin không thể tự assign/revoke menu cho role qua UI.
3. **Không lưu lịch sử** — Không biết ai đổi quyền gì, khi nào.
4. **Không mở rộng được** — Nếu thêm role mới hoặc menu mới, phải sửa nhiều file.

**Mục tiêu:** Chuyển toàn bộ role-permission mapping từ file tĩnh sang database, xây giao diện quản lý phân quyền theo design `06-role-management.html`, và cung cấp API/server actions để admin có thể gán menu cho role linh động.

---

## Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│  /admin/roles (Role Management Page)                            │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐ │
│  │  Role List Panel │  │  Permission Matrix Panel             │ │
│  │  ┌──────────────┐│  │  ┌────────────┬────┬─────┬────┬───┐ │ │
│  │  │ ADMIN (active)││  │  │ Menu/Route │Xem │Thêm │Sửa │Xóa│ │ │
│  │  │ USER          ││  │  ├────────────┼────┼─────┼────┼───┤ │ │
│  │  │ AM            ││  │  │ Dashboard  │ ✓  │ ✓   │ ✓  │ ✓ │ │ │
│  │  │ CV            ││  │  │ CRM Dự án  │ ✓  │ ✓   │ ✓  │ ✓ │ │ │
│  │  └──────────────┘│  │  │ KPI        │ ✓  │ ✓   │ ✓  │ ✓ │ │ │
│  │                  │  │  │ Quản lý AM │ -  │ -   │ -  │ - │ │ │
│  │  [Edit Role]     │  │  └────────────┴────┴─────┴────┴───┘ │ │
│  │  [Security Card] │  │  [Hủy bỏ] [Lưu Thay đổi]           │ │
│  └──────────────────┘  └──────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  API & System Permissions (Toggles)                         ││
│  │  [Xuất báo cáo Excel/CSV] [Truy cập Logs Hệ thống]        ││
│  └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │  Database (Prisma/SQLite)   │
              │  ┌─────────────────────────┐│
              │  │ MenuPermission          ││
              │  │ id, menuKey, role,      ││
              │  │ canView, canCreate,     ││
              │  │ canEdit, canDelete      ││
              │  └─────────────────────────┘│
              │  ┌─────────────────────────┐│
              │  │ MenuItem (registry)     ││
              │  │ id, key, label, href,   ││
              │  │ icon, section, sortOrder││
              │  └─────────────────────────┘│
              │  ┌─────────────────────────┐│
              │  │ RoleConfig              ││
              │  │ id, role, label, desc,  ││
              │  │ color, updatedBy, ...   ││
              │  └─────────────────────────┘│
              └─────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │  src/lib/rbac.ts (refactor) │
              │  getRequiredRoles() now     │
              │  reads from DB (cached)     │
              └─────────────────────────────┘
                            │
                  ┌─────────┴──────────┐
                  ▼                    ▼
           proxy.ts              sidebar.tsx
        (route guard)        (menu visibility)
```

---

## Danh sách công việc

### 1. Database Schema — Prisma Models

- [ ] Tạo model `MenuItem` (registry tất cả menu/route trong hệ thống):
  ```prisma
  model MenuItem {
    id        Int      @id @default(autoincrement())
    key       String   @unique   // e.g. "dashboard", "crm-du-an", "kpi"
    label     String             // "Dashboard Tổng quan"
    href      String             // "/"
    icon      String?            // "LayoutDashboard" (lucide icon name)
    section   String   @default("main")  // "main" | "admin"
    sortOrder Int      @default(0)
    isActive  Boolean  @default(true)
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    permissions MenuPermission[]

    @@index([section, sortOrder])
  }
  ```
- [ ] Tạo model `MenuPermission` (mỗi dòng = 1 role x 1 menu):
  ```prisma
  model MenuPermission {
    id        Int      @id @default(autoincrement())
    menuKey   String
    role      UserRole
    canView   Boolean  @default(false)
    canCreate Boolean  @default(false)
    canEdit   Boolean  @default(false)
    canDelete Boolean  @default(false)
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    menu MenuItem @relation(fields: [menuKey], references: [key], onDelete: Cascade)

    @@unique([menuKey, role])
    @@index([role])
  }
  ```
- [ ] Tạo model `RoleConfig` (metadata động cho mỗi role):
  ```prisma
  model RoleConfig {
    id          Int      @id @default(autoincrement())
    role        UserRole @unique
    label       String             // "Quản trị viên (Admin)"
    description String?            // Mô tả chi tiết
    color       String   @default("purple")  // purple, indigo, blue, emerald
    updatedBy   String?            // userId của người cuối cùng sửa
    updatedAt   DateTime @updatedAt
    createdAt   DateTime @default(now())
  }
  ```
- [ ] Chạy migration: `npx prisma migrate dev --name add-dynamic-rbac`

### 2. Seed Script — Khởi tạo dữ liệu ban đầu

- [ ] Tạo seed data cho `MenuItem`: đăng ký tất cả 15 menu hiện có trong sidebar
  ```
  main: Dashboard Tổng quan (/), CRM & DS Dự án (/du-an), Khách hàng (/admin/khach-hang),
        Phân tích & KPI (/kpi), Top Địa bàn (/dia-ban), Quản lý AM (/quan-ly-am),
        Quản lý Chuyên viên (/quan-ly-cv)
  admin: Sản phẩm (/admin/san-pham), Quản lý User (/admin/users), Giao KPI (/admin/kpi),
         Theo dõi các bước (/du-an/tracking), Dự án đã xoá (/admin/du-an-da-xoa),
         Phân quyền (/admin/roles)
  cta: Khởi tạo Dự án CĐS (/du-an/tao-moi)
  ```
- [ ] Tạo seed data cho `MenuPermission`: map quyền hiện tại từ `ROUTE_PERMISSIONS` hardcode
  - ADMIN/USER: canView=true cho tất cả menu
  - AM/CV: canView=true chỉ cho Dashboard, CRM, Khách hàng, Giao KPI, Khởi tạo Dự án
- [ ] Tạo seed data cho `RoleConfig`: 4 role với label, description, color từ `ROLE_METADATA`

### 3. Refactor `src/lib/rbac.ts` — Database-Driven

- [ ] Giữ nguyên `AppRole`, `ROLE_METADATA` (sẽ fallback nếu DB chưa sẵn sàng)
- [ ] Thêm function `getMenuPermissionsFromDB()`: query tất cả MenuPermission, cache kết quả
- [ ] Refactor `getRequiredRoles(pathname)`: thay vì đọc `ROUTE_PERMISSIONS` hardcode, đọc từ DB
  - Match pathname → MenuItem.href → lấy danh sách role có `canView=true`
  - Fallback về hardcode `ROUTE_PERMISSIONS` nếu DB query lỗi (build-time, migration chưa chạy)
- [ ] Thêm function `invalidateRbacCache()`: gọi khi admin thay đổi permission (revalidate)
- [ ] Thêm function `getRoleConfig(role)`: lấy label/description/color từ DB (hoặc fallback ROLE_METADATA)
- [ ] Thêm function `getMenuItemsForRole(role)`: lấy danh sách menu mà role được `canView`

### 4. Server Actions — Role Management (`src/app/(dashboard)/admin/roles/actions.ts`)

- [ ] `getMenuItems()` — lấy tất cả MenuItem (sorted by section + sortOrder)
- [ ] `getPermissionsForRole(role)` — lấy MenuPermission[] cho 1 role cụ thể
- [ ] `getAllPermissions()` — lấy full ma trận permission (4 roles x N menus)
- [ ] `updatePermissionsForRole(role, permissions[])` — cập nhật hàng loạt
  - Input: `{ menuKey, canView, canCreate, canEdit, canDelete }[]`
  - Validate: chỉ ADMIN mới được thay đổi (requireRole)
  - Transaction: upsert từng MenuPermission
  - Sau khi lưu: gọi `invalidateRbacCache()` + `revalidatePath`
- [ ] `getRoleConfigs()` — lấy tất cả RoleConfig
- [ ] `updateRoleConfig(role, data)` — cập nhật label/description/color
  - Validate: chỉ ADMIN
  - Lưu `updatedBy` = caller userId
- [ ] `selectAllPermissions(role)` — bật tất cả canView cho 1 role
- [ ] `deselectAllPermissions(role)` — tắt tất cả canView cho 1 role (trừ Dashboard — luôn giữ)

### 5. Page & Components — `/admin/roles`

#### 5a. Page (`src/app/(dashboard)/admin/roles/page.tsx`)
- [ ] Server component, `requireRole("ADMIN")` — chỉ Admin mới truy cập
- [ ] Fetch: `getMenuItems()`, `getAllPermissions()`, `getRoleConfigs()`
- [ ] Render layout 2 cột theo design `06-role-management.html`:
  - Cột trái (4/12): Role List Panel
  - Cột phải (8/12): Permission Matrix + API Permissions

#### 5b. Role List Panel (`role-list-panel.tsx`)
- [ ] Hiển thị 4 role cards (ADMIN, USER, AM, CV) với badge màu, label, description
- [ ] Click chọn role → cập nhật Permission Matrix bên phải (active state = `role-card-active`)
- [ ] Nút Edit (icon bút chì) → mở dialog chỉnh sửa RoleConfig (label, description, color)

#### 5c. Permission Matrix Panel (`permission-matrix.tsx`)
- [ ] Bảng: cột Menu/Route + 4 cột checkbox (Xem, Thêm mới, Chỉnh sửa, Xóa)
- [ ] Mỗi dòng = 1 MenuItem, mỗi checkbox = 1 field (canView, canCreate, canEdit, canDelete)
- [ ] Header hiển thị role đang chỉnh sửa: "Ma trận Quyền hạn: ADMIN"
- [ ] Nút "Chọn tất cả" / "Bỏ chọn tất cả" (quick toggle)
- [ ] Nút "Hủy bỏ" (reset về state ban đầu) + "Lưu Thay đổi" (submit to server action)
- [ ] Toast thông báo thành công/thất bại

#### 5d. Edit Role Dialog (`edit-role-dialog.tsx`)
- [ ] Dialog modal theo design (dark header, form body)
- [ ] Fields: Tên hiển thị (Label), Mô tả chi tiết, Màu sắc (color picker với 5 options)
- [ ] Submit → `updateRoleConfig(role, data)`

#### 5e. API & System Permissions Section
- [ ] Toggle switches cho: "Xuất báo cáo Excel/CSV", "Truy cập Logs Hệ thống"
- [ ] Lưu vào MenuPermission với `menuKey` = "api-export", "api-logs" (system-level permissions)

### 6. Refactor Sidebar — Database-Driven Menu

- [ ] Refactor `src/components/layout/sidebar.tsx`:
  - Thay `mainNavItems` / `adminNavItems` hardcode → lấy từ DB qua `getMenuItemsForRole(role)`
  - Giữ icon mapping (lucide name → component) trong 1 map constant
  - Fallback: nếu DB không có data, dùng hardcode hiện tại
- [ ] Cập nhật `DashboardWrapper`:
  - Server layout fetch `getMenuItemsForRole(role)` → pass xuống Sidebar
  - Hoặc: Sidebar gọi server action client-side (nếu cần real-time updates)

### 7. Refactor Proxy — Database-Driven Route Guard

- [ ] Cập nhật `src/proxy.ts`:
  - `getRequiredRoles()` đã tự động đọc DB (từ bước 3)
  - Đảm bảo caching layer hoạt động (tránh query DB mỗi request)
  - Fallback nếu DB lỗi: cho phép truy cập (hoặc dùng hardcode)

### 8. Add Menu to Sidebar Navigation

- [ ] Thêm menu "Phân quyền Vai trò" vào sidebar `adminNavItems`:
  - `{ label: "Phân quyền", href: "/admin/roles", icon: Shield, allowedRoles: ["ADMIN"] }`
  - Chỉ ADMIN thấy (không phải USER)
- [ ] Trong `MenuItem` seed: đăng ký `/admin/roles` với `canView` chỉ cho ADMIN

### 9. Caching Strategy

- [ ] Implement cache layer cho permissions (tránh query DB mỗi request):
  - Option A: In-memory cache with TTL (30 giây) — đơn giản, đủ cho single-server
  - Option B: `unstable_cache` / `revalidateTag` — Next.js native
- [ ] `invalidateRbacCache()` được gọi khi:
  - Admin lưu thay đổi permissions
  - Admin update role config
- [ ] Caching phải hoạt động đúng cả trong proxy.ts (Node.js context) và server components

### 10. Migration Script — Chuyển dữ liệu từ hardcode sang DB

- [ ] Tạo script `scripts/seed-rbac.ts`:
  - Đọc `ROUTE_PERMISSIONS` và `ROLE_METADATA` từ `rbac.ts`
  - Insert vào `MenuItem`, `MenuPermission`, `RoleConfig`
  - Idempotent: chạy nhiều lần không bị duplicate (upsert)
- [ ] Tích hợp vào `prisma/seed.ts` nếu phù hợp

---

## Cấu trúc file

```
prisma/
├── schema.prisma              # [MODIFIED] Thêm MenuItem, MenuPermission, RoleConfig
├── seed.ts                    # [MODIFIED] Thêm RBAC seed data

src/
├── proxy.ts                   # [MODIFIED] getRequiredRoles() đọc DB (cached)
├── lib/
│   └── rbac.ts               # [MODIFIED] Refactor: DB-driven + cache + fallback
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx        # [MODIFIED] Fetch menu items for role
│   │   ├── admin/
│   │   │   └── roles/
│   │   │       ├── page.tsx              # [NEW] Role management page
│   │   │       ├── actions.ts            # [NEW] Server actions
│   │   │       ├── role-list-panel.tsx    # [NEW] Left panel
│   │   │       ├── permission-matrix.tsx  # [NEW] Right panel
│   │   │       └── edit-role-dialog.tsx   # [NEW] Edit modal
│   │   └── dashboard-wrapper.tsx  # [MODIFIED] Pass menu items to sidebar
│   └── components/layout/
│       └── sidebar.tsx        # [MODIFIED] DB-driven menu items

scripts/
└── seed-rbac.ts               # [NEW] Migration from hardcode to DB
```

---

## Data Flow (Save Permissions)

```
Admin clicks "Lưu Thay đổi"
        │
        ▼
permission-matrix.tsx → updatePermissionsForRole(role, permissions[])
        │
        ▼
actions.ts:
  1. requireRole("ADMIN") — verify caller
  2. prisma.$transaction → upsert MenuPermission rows
  3. invalidateRbacCache() — clear cached permissions
  4. revalidatePath("/admin/roles")
  5. Return { success: true }
        │
        ▼
Sidebar + Proxy now use updated permissions from DB
(next request hits cache miss → fresh DB query → new permissions in effect)
```

---

## Menu Registry (Initial Seed Data)

| key | label | href | section | ADMIN | USER | AM | CV |
|-----|-------|------|---------|-------|------|----|----|
| `dashboard` | Dashboard Tổng quan | `/` | main | View | View | View | View |
| `crm-du-an` | CRM & DS Dự án | `/du-an` | main | All | All | View | View |
| `khach-hang` | Khách hàng | `/admin/khach-hang` | main | All | All | View | View |
| `kpi` | Phân tích & KPI | `/kpi` | main | All | All | - | - |
| `dia-ban` | Top Địa bàn | `/dia-ban` | main | View | View | - | - |
| `quan-ly-am` | Quản lý AM | `/quan-ly-am` | main | All | All | - | - |
| `quan-ly-cv` | Quản lý Chuyên viên | `/quan-ly-cv` | main | All | All | - | - |
| `san-pham` | Sản phẩm | `/admin/san-pham` | admin | All | All | - | - |
| `users` | Quản lý User | `/admin/users` | admin | All | All | - | - |
| `giao-kpi` | Giao KPI | `/admin/kpi` | admin | All | All | View | View |
| `tracking` | Theo dõi các bước | `/du-an/tracking` | admin | View | View | - | - |
| `du-an-da-xoa` | Dự án đã xoá | `/admin/du-an-da-xoa` | admin | All | All | - | - |
| `roles` | Phân quyền | `/admin/roles` | admin | All | - | - | - |
| `tao-du-an` | Khởi tạo Dự án CĐS | `/du-an/tao-moi` | cta | All | All | All | All |

`All` = canView + canCreate + canEdit + canDelete  
`View` = canView only  
`-` = no permissions

---

## Tiêu chí hoàn thành

- [ ] 3 bảng Prisma mới: `MenuItem`, `MenuPermission`, `RoleConfig` — migration thành công
- [ ] Seed script tạo đầy đủ 15 menu + 60 permission records (15 menu x 4 roles) + 4 RoleConfig
- [ ] `getRequiredRoles()` đọc từ DB với cache layer, fallback về hardcode nếu DB lỗi
- [ ] Trang `/admin/roles` render đúng theo design `06-role-management.html`
- [ ] Click role → hiển thị permission matrix tương ứng
- [ ] Checkbox thay đổi → "Lưu Thay đổi" → DB updated → sidebar + proxy reflect changes
- [ ] "Chọn tất cả" / "Bỏ chọn tất cả" hoạt động
- [ ] Edit Role dialog: thay đổi label/description/color → lưu DB
- [ ] Sidebar menu đọc từ DB, fallback về hardcode
- [ ] Proxy route guard đọc từ DB, fallback về hardcode
- [ ] Cache invalidation hoạt động: thay đổi permission → hiệu lực ở phiên tiếp theo
- [ ] Chỉ ADMIN truy cập `/admin/roles` (không phải USER/AM/CV)
- [ ] Không ảnh hưởng flow hiện tại khi DB chưa có data (graceful fallback)
- [ ] Không có lỗi TypeScript/ESLint
