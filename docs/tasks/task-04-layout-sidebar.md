# Task 04 — Layout & Sidebar Navigation
**Phase:** 2 (Layout & Master Data CRUD)  
**Priority:** P0  
**Status:** ✅ Done  
**PRD Ref:** Section 5 (UI/UX Guidelines), Section 7 (Dashboard views)  
**Tech Ref:** [tech-stack.md](../tech-stack.md) — Section 2.1 (Routing), 2.2 (Tailwind Theme)

---

## Mục tiêu

Xây dựng layout chính với Sidebar navigation theo MobiFone theme, responsive trên Desktop và Tablet.

---

## Danh sách công việc

### 1. Dashboard Layout

- [ ] Tạo `src/app/(dashboard)/layout.tsx`
  - Sidebar (left) + Main content (right)
  - Header bar với user info, role badge, sign-out
  - MobiFone gradient: Dark Blue → Light Blue cho sidebar
  - Background: White / Light Gray cho content area

### 2. Sidebar Component

- [ ] Tạo `src/components/layout/sidebar.tsx`
- [ ] Navigation items (theo PRD Section 7 + routing):

  | Label | Route | Icon | Role |
  |-------|-------|------|------|
  | Tổng quan | `/` | LayoutDashboard | ALL |
  | Dự án | `/du-an` | FolderKanban | ALL |
  | Nhân sự | `/nhan-su` | Users | ALL |
  | KPI | `/kpi` | TrendingUp | ALL |
  | Địa bàn | `/dia-ban` | MapPin | ALL |
  | --- Quản lý --- | | | ADMIN |
  | Khách hàng | `/admin/khach-hang` | Building2 | ADMIN |
  | Sản phẩm | `/admin/san-pham` | Package | ADMIN |
  | Nhân viên | `/admin/nhan-vien` | UserCog | ADMIN |
  | Tài khoản | `/admin/users` | Shield | ADMIN |

- [ ] Active state highlight cho route hiện tại
- [ ] Admin section chỉ hiển thị khi role = ADMIN
- [ ] Collapse/expand sidebar trên tablet

### 3. Header Component

- [ ] Tạo `src/components/layout/header.tsx`
  - Logo / App title: "MobiFone Project Tracker"
  - Breadcrumb navigation
  - User avatar + tên + role badge
  - Sign out button

### 4. Responsive Design

- [ ] Desktop (≥1024px): Sidebar expanded + full content
- [ ] Tablet (≥768px): Sidebar collapsible (icon only) + full content
- [ ] Mobile (<768px): Sidebar ẩn, hiển thị qua hamburger menu (optional — out of scope v1)

### 5. Loading & Error States

- [ ] Tạo `src/app/(dashboard)/loading.tsx` — skeleton loading
- [ ] Tạo `src/app/(dashboard)/error.tsx` — error boundary
- [ ] Tạo `src/app/not-found.tsx` — 404 page

---

## Tiêu chí hoàn thành

- [ ] Sidebar hiển thị đúng menu items theo role (Admin vs User)
- [ ] Navigation hoạt động đúng (click → route change → active state)
- [ ] MobiFone theme: gradient sidebar, white content area
- [ ] Responsive: sidebar collapse trên tablet
- [ ] Loading skeleton hiển thị khi page đang load
- [ ] User info + sign out hoạt động trên header
