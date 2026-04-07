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

- [x] Tạo `src/app/(dashboard)/layout.tsx`
  - Sidebar (left) + Main content (right)
  - Header bar với user info, role badge, sign-out
  - MobiFone gradient: Dark Blue → Light Blue cho sidebar
  - Background: White / Light Gray cho content area

### 2. Sidebar Component

- [x] Tạo `src/components/layout/sidebar.tsx`
- [x] Navigation items (theo PRD Section 7 + routing):

  | Label | Route | Icon | Role |
  |-------|-------|------|------|
  | Dashboard Tổng quan | `/` | LayoutDashboard | ADMIN, USER |
  | CRM & DS Dự án | `/du-an` | FolderKanban | ALL |
  | Khách hàng | `/admin/khach-hang` | Building2 | ALL |
  | Tổng hợp Nhân sự | `/nhan-su` | Users | ADMIN, USER |
  | Phân tích & KPI | `/kpi` | TrendingUp | ADMIN, USER |
  | Top Địa bàn | `/dia-ban` | MapPin | ADMIN, USER |
  | Quản lý AM | `/quan-ly-am` | UserCheck | ADMIN |
  | Quản lý Chuyên viên | `/quan-ly-cv` | GraduationCap | ADMIN |
  | --- Quản trị --- | | | |
  | Sản phẩm | `/admin/san-pham` | Package | ADMIN, USER |
  | Quản lý User | `/admin/users` | UserCog | ADMIN |
  | Giao KPI | `/admin/kpi` | Target | ADMIN, USER |
  | Dự án đã xoá | `/admin/du-an-da-xoa` | Trash2 | ADMIN, USER |

- [x] Active state highlight cho route hiện tại
- [x] Admin section chỉ hiển thị khi có quyền hiển thị
- [x] Collapse/expand sidebar trên tablet

### 3. Header Component

- [x] Tạo `src/components/layout/header.tsx`
  - Logo / App title: "MobiFone Project Tracker"
  - Breadcrumb navigation
  - User avatar + tên + role badge
  - Sign out button

### 4. Responsive Design

- [x] Desktop (≥1024px): Sidebar expanded + full content
- [x] Tablet (≥768px): Sidebar collapsible (icon only) + full content
- [x] Mobile (<768px): Sidebar ẩn, hiển thị qua hamburger menu (optional — out of scope v1)

### 5. Loading & Error States

- [x] Tạo `src/app/(dashboard)/loading.tsx` — skeleton loading
- [x] Tạo `src/app/(dashboard)/error.tsx` — error boundary
- [x] Tạo `src/app/not-found.tsx` — 404 page

---

## Tiêu chí hoàn thành

- [ ] Sidebar hiển thị đúng menu items theo role (Admin vs User)
- [ ] Navigation hoạt động đúng (click → route change → active state)
- [ ] MobiFone theme: gradient sidebar, white content area
- [ ] Responsive: sidebar collapse trên tablet
- [ ] Loading skeleton hiển thị khi page đang load
- [ ] User info + sign out hoạt động trên header
