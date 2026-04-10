# Task 28 — RBAC (Role-Based Access Control) Implementation
**Phase:** 7 (Security & Access Control)  
**Priority:** P0  
**Status:** 🔲 To Do  
**PRD Ref:** Section 3 (User Roles & Permissions), NFR-04 (Security)  
**Tech Ref:** [tech-stack.md](../tech-stack.md) — Section 2.6 (Better Auth)

---

## Bối cảnh & Vấn đề hiện tại

Hệ thống hiện tại có 4 role: `ADMIN`, `USER`, `AM`, `CV` (định nghĩa trong Prisma enum `UserRole`). Tuy nhiên, kiểm soát quyền truy cập chỉ được thực hiện rời rạc qua `requireRole()` trong từng page component và `allowedRoles` trong sidebar. Các lỗ hổng chính:

1. **Không có middleware** — user biết URL có thể truy cập trực tiếp vào route bị hạn chế.
2. **Server Actions không được bảo vệ** — bất kỳ user nào đã đăng nhập đều có thể gọi `deleteUser`, `updateUser`, `bulkCreateUsers`.
3. **API Routes không kiểm tra role** — `/api/admin/email/send` không có auth/role check.
4. **Không có cấu hình phân quyền tập trung** — mỗi page tự khai báo role riêng, dễ sai sót.
5. **Giao diện quản lý role thiếu** — trang `/admin/users` chỉ có dropdown chọn role, không có tổng quan phân quyền.

### Yêu cầu phân quyền:

| Role | Menu được truy cập |
|------|-------------------|
| **ADMIN** (Quản trị viên) | Tất cả các Tab chức năng |
| **USER** (Quản trị viên - Chuyên viên) | Tất cả các Tab chức năng |
| **CV** (Chuyên viên) | Dashboard tổng quan, CRM & DS dự án, Khách hàng, Giao KPI, Khởi tạo dự án CĐS |
| **AM** (Account Manager) | Dashboard tổng quan, CRM & DS dự án, Khách hàng, Giao KPI, Khởi tạo dự án CĐS |

---

## Mục tiêu

1. Tạo cấu hình RBAC tập trung (`src/lib/rbac.ts`) làm nguồn duy nhất cho route-to-role mapping.
2. Kích hoạt Next.js middleware (`src/middleware.ts`) để bảo vệ route ở tầng edge.
3. Thêm role guard cho tất cả server actions.
4. Thêm role check cho tất cả API routes.
5. Tạo React Context (`UserContext`) cho client-side role-aware rendering.
6. Nâng cấp trang `/admin/users` với giao diện quản lý role trực quan.
7. Đảm bảo sidebar phù hợp 100% với bảng phân quyền.

---

## Danh sách công việc

### 1. Centralized RBAC Config (`src/lib/rbac.ts`)

- [ ] Tạo `ROUTE_PERMISSIONS`: map route pattern → allowed roles
- [ ] Tạo `PUBLIC_ROUTES`: routes không cần auth (`/login`, `/api/auth/*`)
- [ ] Tạo `ALL_ROLES_ROUTES`: routes mà tất cả role đều truy cập được
- [ ] Tạo `getRequiredRoles(pathname)`: hàm match pathname → allowed roles
- [ ] Tạo `ROLE_METADATA`: label, description, color cho mỗi role (tiếng Việt)
- [ ] Export type `RoutePermission` cho type-safety

### 2. Next.js 16 Proxy (`src/proxy.ts`)

- [ ] Cập nhật `src/proxy.ts` với centralized RBAC (Next.js 16 dùng proxy.ts thay vì middleware.ts)
- [ ] Check session qua Better Auth (`/api/auth/get-session`)
- [ ] Import `getRequiredRoles()` từ `src/lib/rbac.ts`
- [ ] Redirect unauthenticated → `/login`
- [ ] Redirect unauthorized → `/du-an` (safe landing page cho CV/AM)
- [ ] Cho phép `/api/auth/*`, `/_next/*`, static assets đi qua
- [ ] Attach `x-request-id` header

### 3. Server Action Role Guards

- [ ] Thêm `requireRole("ADMIN", "USER")` vào `src/app/(dashboard)/admin/users/actions.ts`:
  - `createUser`, `updateUser`, `deleteUser`, `toggleUserStatus`, `resetUserPassword`, `bulkCreateUsers`
- [ ] Thêm role guard vào `src/app/(dashboard)/admin/san-pham/actions.ts`
- [ ] Thêm role guard vào `src/app/(dashboard)/admin/khach-hang/actions.ts` (tất cả role)
- [ ] Thêm role guard vào `src/app/(dashboard)/quan-ly-am/actions.ts` (ADMIN, USER)
- [ ] Thêm role guard vào `src/app/(dashboard)/quan-ly-cv/actions.ts` (ADMIN, USER)
- [ ] Thêm role guard vào `src/app/(dashboard)/admin/kpi/kpi-actions.ts` (tất cả role)
- [ ] Thêm role guard vào `src/app/(dashboard)/du-an/actions.ts` (tất cả role)

### 4. API Route Role Guards

- [ ] Tạo helper `requireApiRole()` trong `src/lib/auth-utils.ts`
- [ ] Thêm role check vào `/api/admin/email/send` (ADMIN, USER)
- [ ] Thêm role check vào `/api/dashboard/overview` (tất cả authenticated users)

### 5. Client-Side Role Context (`src/contexts/user-context.tsx`)

- [ ] Tạo `UserContext` React Context với `user`, `role`, `canAccess(route)` helper
- [ ] Tạo `UserProvider` component
- [ ] Tạo `useUser()` hook
- [ ] Wrap trong `DashboardWrapper` (`src/app/(dashboard)/dashboard-wrapper.tsx`)

### 6. Enhanced Admin User Management Page (`/admin/users`)

- [ ] Thêm Role Overview cards: mỗi role hiển thị label, description, user count, permissions summary
- [ ] Thêm Role filter tabs: All, Admin, User, AM, CV
- [ ] Sửa role badge: phân biệt USER vs CV (hiện tại cả 2 đều hiển thị "Chuyên viên")
  - ADMIN → "Quản trị viên (Admin)"
  - USER → "Quản trị viên (Chuyên viên)"
  - AM → "AM"
  - CV → "Chuyên viên (CV)"
- [ ] Thêm bulk role update: chọn nhiều user → đổi role hàng loạt
- [ ] Thêm `bulkUpdateRole` server action
- [ ] Log role changes qua hệ thống logging hiện có

### 7. Sidebar Alignment

- [ ] Xác nhận "Giao KPI" visible cho ALL roles
- [ ] Xác nhận "Khởi tạo Dự án CĐS" CTA visible cho ALL roles

---

## Cấu trúc file

```
src/
├── proxy.ts                        # [MODIFIED] Next.js 16 proxy with RBAC
├── lib/
│   ├── rbac.ts                     # [NEW] Centralized RBAC config
│   └── auth-utils.ts              # [MODIFIED] Add requireApiRole()
├── contexts/
│   └── user-context.tsx           # [NEW] Client-side role context
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard-wrapper.tsx  # [MODIFIED] Wrap with UserProvider
│   │   ├── admin/
│   │   │   └── users/
│   │   │       ├── page.tsx       # [MODIFIED] Role overview cards
│   │   │       ├── users-table.tsx # [MODIFIED] Filter tabs, badges, bulk
│   │   │       └── actions.ts    # [MODIFIED] Role guards + bulk action
│   │   ├── quan-ly-am/
│   │   │   └── actions.ts        # [MODIFIED] Role guards
│   │   └── quan-ly-cv/
│   │       └── actions.ts        # [MODIFIED] Role guards
│   └── api/
│       └── admin/email/send/
│           └── route.ts           # [MODIFIED] Role check
├── components/layout/
│   └── sidebar.tsx                # [MODIFIED] Import from rbac.ts
└── proxy.ts                       # [MODIFIED] Updated with centralized RBAC
```

---

## Tiêu chí hoàn thành

- [ ] RBAC config tập trung tại `src/lib/rbac.ts`, được sử dụng bởi middleware + sidebar + page guards
- [ ] Middleware chặn đúng: unauthenticated → `/login`, unauthorized → `/du-an`
- [ ] Tất cả server actions có role guard phù hợp
- [ ] Tất cả API routes có role check
- [ ] CV/AM chỉ thấy: Dashboard, CRM & DS dự án, Khách hàng, Giao KPI, Khởi tạo dự án CĐS
- [ ] ADMIN/USER thấy tất cả menu và chức năng
- [ ] Trang `/admin/users` hiển thị Role Overview cards với thống kê
- [ ] Role filter tabs hoạt động đúng trên bảng users
- [ ] Role badge phân biệt rõ ràng 4 role
- [ ] Bulk role update hoạt động
- [ ] `UserContext` cho phép client components kiểm tra quyền
- [ ] Không có lỗi TypeScript/ESLint
- [ ] Không ảnh hưởng flow đăng nhập/đăng xuất hiện tại
