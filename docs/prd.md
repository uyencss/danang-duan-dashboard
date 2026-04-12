# Product Requirements Document (PRD)
# Hệ thống Quản trị Báo cáo Dự án Tập trung
## MobiFone Project Tracker

---

**Version:** 1.5.0  
**Date:** 2026-04-12  
**Product Manager:** Trung tâm Kinh doanh Giải pháp số - MobiFone Đà Nẵng  
**Status:** Draft

| Tài liệu liên quan | Đường dẫn |
|---------------------|-----------|
| Tech Stack & Architecture | [tech-stack.md](./tech-stack.md) |
| Database Design | [database-design.md](./database-design.md) |
| System Architecture | [architecture.md](./architecture.md) |

---

## 1. Bối cảnh & Vấn đề (Context & Problem Statement)

### 1.1 Bối cảnh

Trung tâm Kinh doanh Giải pháp số - MobiFone Đà Nẵng quản lý dự án trên hai mảng chính:

| Mảng | Phạm vi |
|------|---------|
| **B2B / B2G** | Cloud, IT, Chuyển đổi số |
| **B2A** | Công nghệ cho Công an |

Hiện tại toàn bộ quy trình theo dõi dự án, chăm sóc khách hàng và báo cáo được thực hiện **thủ công** qua file Excel **"BaoCaoNgay"** — gây ra tình trạng dữ liệu phân tán, nhân đôi doanh thu, và không có khả năng tra cứu realtime.

### 1.2 Vấn đề cần giải quyết

1. **Dữ liệu phân tán:** Mỗi AM/Chuyên viên báo cáo riêng lẻ trên sheet Excel, không có nguồn dữ liệu tập trung.
2. **Nhân đôi doanh thu:** Không có cơ chế ràng buộc quan hệ, cùng một dự án có thể bị nhập nhiều lần với doanh thu khác nhau.
3. **Không realtime:** Lãnh đạo muốn xem tổng hợp phải chờ nhân viên gửi báo cáo thủ công.
4. **Không theo dõi được lịch sử chăm sóc:** Thiếu timeline hoạt động, không biết dự án nào bị bỏ quên.

---

## 2. Mục tiêu kinh doanh (Business Objectives)

| # | Mục tiêu | Mô tả | Đo lường |
|---|----------|-------|----------|
| O1 | Số hóa quy trình | Thay thế hoàn toàn nhập liệu thủ công từ "BaoCaoNgay" Excel | 100% dữ liệu mới được nhập qua hệ thống |
| O2 | Nguồn dữ liệu duy nhất | Cơ sở dữ liệu quan hệ Master-Detail ngăn chặn nhân đôi dữ liệu và doanh thu | 0% dữ liệu trùng lặp |
| O3 | Dashboard thời gian thực | Lãnh đạo tra cứu chỉ số bất kỳ lúc nào, không cần chờ báo cáo | Thời gian ra quyết định giảm > 50% |
| O4 | Giám sát chăm sóc KH | Tự động cảnh báo dự án bị bỏ quên, đảm bảo không để mất cơ hội | Giảm % dự án > 15 ngày không chăm sóc |

---

## 3. Đối tượng người dùng & Phân quyền (User Roles & Permissions)

Hệ thống sử dụng **4 vai trò (roles)** với mô hình RBAC (Role-Based Access Control) tập trung, được kiểm soát ở 4 tầng: Edge Proxy → Server Component → Server Action → API Route.

### 3.1 ADMIN — Quản trị viên (Admin)

| Quyền | Mô tả |
|-------|-------|
| Dashboard Tổng quan | Toàn quyền truy cập |
| CRM & DS Dự án | Xem/tạo/sửa tất cả dự án |
| Khách hàng | CRUD quản lý khách hàng |
| Giao KPI | Xem và cấu hình KPI |
| Tổng hợp Nhân sự | Truy cập đầy đủ |
| KPI Thời gian | Truy cập đầy đủ |
| Top Địa bàn | Truy cập đầy đủ |
| Quản lý AM / CV | Xem và quản lý AM, CV |
| Sản phẩm | CRUD quản lý sản phẩm |
| Quản lý User | Tạo/khóa tài khoản, **phân quyền role**, bulk role update |
| Email Service | Gửi email từ hệ thống |
| Dự án đã xóa | Xem, khôi phục, xóa vĩnh viễn |
| Tracking | Theo dõi tiến độ dự án |

### 3.2 USER — Quản trị viên (Chuyên viên)

| Quyền | Mô tả |
|-------|-------|
| Tất cả tab chức năng | Truy cập giống ADMIN |
| Quản lý User | Có thể xem và chỉnh sửa user |
| Master Data | Quản lý CRUD Sản phẩm, Khách hàng |

> **Lưu ý:** ADMIN và USER có quyền truy cập **tất cả các Tab chức năng** trong hệ thống.

### 3.3 AM — Account Manager

| Quyền | Mô tả |
|-------|-------|
| Dashboard Tổng quan | ✅ Truy cập |
| CRM & DS Dự án | ✅ Xem/thao tác dự án được giao |
| Khách hàng | ✅ Xem danh sách khách hàng |
| Giao KPI | ✅ Xem KPI |
| Khởi tạo dự án CĐS | ✅ Tạo dự án mới |
| Tổng hợp Nhân sự | ❌ Không truy cập |
| KPI Thời gian | ❌ Không truy cập |
| Top Địa bàn | ❌ Không truy cập |
| Admin pages | ❌ Không truy cập (trừ Khách hàng, KPI) |

### 3.4 CV — Chuyên viên

| Quyền | Mô tả |
|-------|-------|
| Dashboard Tổng quan | ✅ Truy cập |
| CRM & DS Dự án | ✅ Xem/thao tác dự án được giao |
| Khách hàng | ✅ Xem danh sách khách hàng |
| Giao KPI | ✅ Xem KPI |
| Khởi tạo dự án CĐS | ✅ Tạo dự án mới |
| Tổng hợp Nhân sự | ❌ Không truy cập |
| KPI Thời gian | ❌ Không truy cập |
| Top Địa bàn | ❌ Không truy cập |
| Admin pages | ❌ Không truy cập (trừ Khách hàng, KPI) |

> **Quy tắc:** AM và CV chỉ được truy cập **Dashboard Tổng quan, CRM & DS dự án, Khách hàng, Giao KPI**, và nút **Khởi tạo dự án CĐS**.

### 3.5 Permission Matrix (Tổng hợp)

| Menu / Route | ADMIN | USER | AM | CV |
|-------------|:-----:|:----:|:--:|:--:|
| Dashboard Tổng quan (`/`) | ✅ | ✅ | ✅ | ✅ |
| CRM & DS Dự án (`/du-an`) | ✅ | ✅ | ✅ | ✅ |
| Tạo dự án (`/du-an/tao-moi`) | ✅ | ✅ | ✅ | ✅ |
| Khách hàng (`/admin/khach-hang`) | ✅ | ✅ | ✅ | ✅ |
| Giao KPI (`/admin/kpi`) | ✅ | ✅ | ✅ | ✅ |
| Tổng hợp Nhân sự (`/nhan-su`) | ✅ | ✅ | ❌ | ❌ |
| KPI Thời gian (`/kpi`) | ✅ | ✅ | ❌ | ❌ |
| Top Địa bàn (`/dia-ban`) | ✅ | ✅ | ❌ | ❌ |
| Quản lý AM (`/quan-ly-am`) | ✅ | ✅ | ❌ | ❌ |
| Quản lý CV (`/quan-ly-cv`) | ✅ | ✅ | ❌ | ❌ |
| Sản phẩm (`/admin/san-pham`) | ✅ | ✅ | ❌ | ❌ |
| User Management (`/admin/users`) | ✅ | ✅ | ❌ | ❌ |
| Dự án đã xóa (`/admin/du-an-da-xoa`) | ✅ | ✅ | ❌ | ❌ |
| Tracking (`/du-an/tracking`) | ✅ | ✅ | ❌ | ❌ |
| Email Service (`/email-service`) | ✅ | ✅ | ❌ | ❌ |

---

## 4. Phạm vi hệ thống (System Scope)

Hệ thống web application quản lý toàn bộ vòng đời dự án từ giai đoạn tiếp cận khách hàng đến ký hợp đồng, tích hợp nhật ký công việc hàng ngày và báo cáo phân tích đa chiều.

### 4.1 Trong phạm vi (In Scope)

- Quản lý danh mục (Master Data): Khách hàng, Sản phẩm, Nhân viên
- Quản lý vòng đời dự án (Project Lifecycle Management)
- Thùng rác dự án (Recycle Bin - Soft Delete)
- Nhật ký công việc hàng ngày (Daily Task Logs)
- Bình luận & trao đổi trên dự án (Project Comments)
- Chat thời gian thực theo dự án (Real-time Project Chat)
- Dashboard & báo cáo phân tích (Analytics & Reporting)
- Phân quyền người dùng 4 vai trò (RBAC: ADMIN, USER, AM, CV) — bảo vệ multi-layer
- Quản lý user & role (Admin user page with bulk role update)
- Cảnh báo thông minh (Smart Alerts)

### 4.2 Ngoài phạm vi (Out of Scope — v1.0)

- Quản lý tài chính chi tiết (invoicing, payment tracking)
- Tích hợp email/SMS notification
- Mobile native app
- Import/export dữ liệu từ Excel cũ (migration tool)

---

## 5. UI/UX Guidelines

### 5.1 Design Language

| Tiêu chí | Yêu cầu |
|----------|---------|
| Style | Modern, minimalist |
| Performance | Page load < 2 giây |
| Responsiveness | Laptop/PC (primary) + Tablet portrait (secondary — tra cứu nhanh cho lãnh đạo) |

### 5.2 Color Palette (MobiFone Theme)

| Element | Color |
|---------|-------|
| Primary Elements | Dark Blue → Light Blue Gradient |
| Background | White hoặc Light Gray — làm nổi bật dữ liệu |
| Alert (Overdue > 15 ngày) | RED + Badge "Cần chăm sóc gấp" |
| Success | Green |
| Warning | Amber / Yellow |

### 5.3 UX Patterns

- **"Search & Select" dropdown** với phản hồi gõ thời gian thực — áp dụng cho chọn Khách hàng, Sản phẩm, Nhân viên
- **1-Click Update** button trực tiếp trên danh sách dự án — mở modal rút gọn
- **Smart Alerts** hiển thị tự động trên Dashboard và Project List
- **Timeline** hiển thị lịch sử chăm sóc dạng dòng thời gian trên trang chi tiết dự án

---

## 6. Yêu cầu chức năng (Functional Requirements)

### 6.1 Quản lý Master Data (Admin)

| ID | Yêu cầu | Priority |
|----|---------|----------|
| FR-01 | Admin CRUD danh mục Khách hàng (tên, phân loại, địa chỉ, SĐT, email, đầu mối/lãnh đạo) | P0 |
| FR-02 | Admin CRUD danh mục Sản phẩm (nhóm, tên chi tiết, mô tả) | P0 |
| FR-03 | Admin quản lý tài khoản Nhân viên (tên, email, role, địa bàn) | P0 |
| FR-04 | Tất cả Master Data hiển thị dạng DataTable có tìm kiếm, phân trang | P0 |
| FR-04b| Admin cấu hình chỉ tiêu KPI theo quý/tháng | P1 |

### 6.2 Quản lý Dự án (Project Management)

| ID | Yêu cầu | Priority |
|----|---------|----------|
| FR-05 | Tạo/Cập nhật dự án: chọn Khách hàng, Sản phẩm (Hỗ trợ Creatable-Select để thêm mới inline), gán AM/CV, nhập tài chính, tick Dự án trọng điểm, và Ngày kết thúc | P0 |
| FR-05b| Soft Delete (Xóa mềm): Lưu trữ dự án vào Thùng rác đối với Admin (Khôi phục hoặc Xóa vĩnh viễn) thay vì xóa ngay | P1 |
| FR-06 | Auto-extract Week/Month/Quarter/Year từ `Ngày bắt đầu dự án` | P0 |
| FR-07 | Danh sách dự án dạng DataGrid: lọc đa chiều, tìm kiếm nhanh, Excel Export | P0 |
| FR-08 | Trang chi tiết dự án: overview, trạng thái hiện tại, timeline CSKH, thread bình luận | P0 |
| FR-09 | 1-Click Update: button trên list → modal (Date auto, Status dropdown, Summary text) → cập nhật `ngayChamsocCuoiCung` và `trangThaiHienTai` | P0 |

### 6.3 Nhật ký Công việc (Task Logs)

| ID | Yêu cầu | Priority |
|----|---------|----------|
| FR-10 | User thêm Task Log: chọn trạng thái mới, nhập nội dung chi tiết, ngày giờ auto (cho phép chỉnh) | P0 |
| FR-11 | **Business Rule:** Tạo Task Log → transaction cập nhật `DuAn.ngayChamsocCuoiCung` + `DuAn.trangThaiHienTai` | P0 |
| FR-12 | Hiển thị toàn bộ Task Log dạng Timeline trên trang chi tiết dự án | P0 |

### 6.4 Bình luận Dự án (Project Comments)

| ID | Yêu cầu | Priority |
|----|---------|----------|
| FR-13 | Admin bình luận trên bất kỳ dự án nào | P1 |
| FR-14 | User reply bình luận (threaded comments — self-referencing) | P1 |
| FR-15 | Hiển thị thread bình luận trên trang chi tiết dự án | P1 |

### 6.5 Smart Alerts — Cảnh báo Thông minh

| ID | Yêu cầu | Priority |
|----|---------|----------|
| FR-16 | Tự động tính `(NgàyHiệnTại - ngayChamsocCuoiCung)` | P0 |
| FR-17 | Nếu > 15 ngày → hiển thị badge **RED** "Cần chăm sóc gấp" trên Dashboard và Project List | P0 |
| FR-18 | Dự án chưa từng được chăm sóc (`ngayChamsocCuoiCung = null`) → cũng flag cảnh báo | P0 |

### 6.6 Chat Dự án Thời gian thực (Project Chat)

| ID | Yêu cầu | Priority |
|----|---------|----------|
| FR-19 | Mỗi dự án có 1 chat channel riêng, chỉ thành viên (AM, CV, Admin) truy cập | P1 |
| FR-20 | Gửi/nhận tin nhắn thời gian thực (< 1s delay), hỗ trợ sửa (trong 15 phút) và xóa mềm | P1 |
| FR-21 | Typing indicator ("Nguyễn Văn A đang nhập...") và online presence (ai đang online) | P1 |
| FR-22 | Tin nhắn hệ thống tự động khi trạng thái dự án thay đổi (ví dụ: "Dự án đã chuyển sang Đang làm việc") | P2 |

### 6.7 RBAC — Phân quyền truy cập (Role-Based Access Control)

| ID | Yêu cầu | Priority | Status |
|----|---------|----------|--------|
| FR-23 | Hệ thống hỗ trợ 4 role: ADMIN, USER, AM, CV với cấu hình tập trung | P0 | ✅ Done |
| FR-24 | proxy.ts kiểm tra RBAC trên mọi request (edge-level protection) | P0 | ✅ Done |
| FR-25 | Server Actions có `requireRole()` guard bảo vệ mutations | P0 | ✅ Done |
| FR-26 | API Routes có `requireApiRole()` trả 401/403 JSON response | P0 | ✅ Done |
| FR-27 | Sidebar ẩn/hiện menu items dựa trên role người dùng | P0 | ✅ Done |
| FR-28 | Admin page `/admin/users` hiển thị role overview cards và filter tabs | P1 | ✅ Done |
| FR-29 | Bulk role update: Admin chọn nhiều user và đổi role cùng lúc | P1 | ✅ Done |
| FR-30 | `UserContext` cung cấp `canAccess(route)` cho client components | P1 | ✅ Done |
| FR-31 | Dynamic RBAC: Admin cấu hình menu → role qua UI, lưu DB | P2 | ✅ Done |
| FR-32 | Role management page tại `/admin/roles` với permission matrix UI | P2 | ✅ Done |
| FR-33 | Dynamic Menu Management: Reordering, sorting, active/inactive status via UI | P2 | ✅ Done |

---

## 7. Dashboards & Reporting (5 Views)

### View 1: Dashboard Tổng quan

| Widget | Loại | Mô tả |
|--------|------|-------|
| Status Funnel | Funnel Chart | Phân phối dự án theo trạng thái (MOI → ĐÃ KÝ HĐ) |
| Big Numbers | KPI Cards | Tổng doanh thu dự kiến, Tổng hợp đồng, Tổng dự án |
| Conversion Rates | Metric | Tỷ lệ chuyển đổi giữa các giai đoạn |
| AM/CV Performance | Data Table | Bảng đánh giá hiệu suất AM / Chuyên viên |

### View 2: CRM & DS Dự án

| Widget | Loại | Mô tả |
|--------|------|-------|
| Project Grid | DataTable | Danh sách dự án đầy đủ |
| Filters | Multi-filter | Lọc theo: Loại KH, Sản phẩm, Trạng thái, Lĩnh vực |
| Search | Full-text | Tìm kiếm nhanh theo tên KH, tên dự án |
| CSKH Alert | Badge | Hiển thị alert trực tiếp trên mỗi row |

### View 3: Theo Dõi Nhân Sự

| Widget | Loại | Mô tả |
|--------|------|-------|
| Revenue by Staff | Bar Chart (grouped) | Doanh thu theo AM / Chuyên viên |
| Contracts by Staff | Bar Chart | Số lượng HĐ/Dự án theo AM / Chuyên viên |
| Role & Time Filters | Dropdowns | Lọc theo Role, Tháng, Quý, Năm |

### View 4: KPI Thời gian

| Widget | Loại | Mô tả |
|--------|------|-------|
| Revenue Trend | Line Chart | Xu hướng doanh thu theo thời gian |
| Project Trend | Line Chart | Xu hướng số dự án theo thời gian |
| Granularity | Dropdown | Tuần / Tháng / Quý / Năm |
| KPI Achievement Tracker | Card | Hiển thị % đạt chỉ tiêu KPI theo phòng ban/toàn đơn vị |

### View 5: Top Địa bàn

| Widget | Loại | Mô tả |
|--------|------|-------|
| Territory Matrix | Matrix / Treemap | Địa bàn sinh lời nhất |
| Top Staff | Ranking Table | Nhân viên xuất sắc theo từng địa bàn |

---

## 8. Luồng dữ liệu chính (Key Data Flows)

### 8.1 Tạo dự án mới

```
User chọn KH (Search & Select)
  → Chọn Sản phẩm, AM, CV
  → Nhập tài chính + Ngày bắt đầu
  → [System] Auto-extract Tuần/Tháng/Quý/Năm
  → [System] Set trangThaiHienTai = "MOI"
  → Lưu DuAn mới
```

### 8.2 Cập nhật Task Log (1-Click Update)

```
User click "Cập nhật" trên Project List
  → Modal hiện ra: Date (auto), Status (dropdown), Summary (text)
  → User submit
  → [System] BEGIN TRANSACTION
      → Tạo NhatKyCongViec mới
      → Cập nhật DuAn.ngayChamsocCuoiCung = now()
      → Cập nhật DuAn.trangThaiHienTai = trangThaiMoi
    COMMIT
```

### 8.3 Smart Alert Check

```
[System] Khi render Dashboard / Project List:
  → Với mỗi DuAn: tính daysSinceLastCare = now() - ngayChamsocCuoiCung
  → Nếu daysSinceLastCare > 15 HOẶC ngayChamsocCuoiCung = null
    → Hiển thị badge RED "Cần chăm sóc gấp"
```

---

## 9. Yêu cầu phi chức năng (Non-Functional Requirements)

| # | Requirement | Specification |
|---|------------|---------------|
| NFR-01 | Performance | Page load < 2 giây cho tất cả trang chính |
| NFR-02 | Responsiveness | Desktop/Laptop (primary), Tablet portrait (secondary) |
| NFR-03 | Data Integrity | Ràng buộc FK nghiêm ngặt, không cho phép nhân đôi doanh tự |
| NFR-04 | Security & Ops | Multi-layer RBAC (4 roles × 4 enforcement layers), mật khẩu mã hóa, Cloudflare Tunnels, JWT-authenticated sqld (in-project keys synced via GitHub Secrets), và hệ thống Structured Logging (Pino) với Auto-Redaction. |
| NFR-05 | Scalability | Self-hosted sqld (libSQL Server) trong Docker Compose, hỗ trợ tách biệt dev/prod namespaces |
| NFR-06 | Availability | Có sẵn hệ thống backup DB (Docker volume + SQL dump script), quản lý cấu hình safe db-reset qua script quản trị |
| NFR-07 | Stateless HTTP | Sử dụng Stateless HTTP kết nối đến sqld container (prod: internal Docker, dev: Cloudflare Tunnel) để tránh WebSocket/Hrana issues |
| NFR-08 | Self-Hosted DB | Database tự host trên VPS, không phụ thuộc dịch vụ cloud bên ngoài (Turso). Chi phí $0 cho database. |
| NFR-09 | Dev ↔ Prod Sync | Hỗ trợ đồng bộ dữ liệu giữa dev và prod database namespaces qua script (`pnpm db:sync:*`). Auto-backup trước khi sync prod. |

---

## 10. Lộ trình phát triển (Execution Phases)

> ⚠️ **Protocol:** Mỗi Phase hoàn thành → dừng lại chờ review trước khi sang Phase tiếp theo.

| Phase | Scope | Deliverables | Status |
|-------|-------|-------------|--------|
| **Phase 1** | Initialization & DB Schema | Setup project (Next.js, Shadcn, Tailwind, Prisma). Viết `schema.prisma`, seed data | ✅ Done |
| **Phase 2** | Layout & Master Data CRUD | MobiFone-themed Sidebar layout. Admin pages CRUD: Khách hàng, Sản phẩm, Nhân viên | ✅ Done |
| **Phase 3** | Project Master & Task Logs | Form tạo dự án (Search & Select), Project List, 1-Click Update modal, Detail page (Timeline + Comments), 15-day Smart Alert | ✅ Done |
| **Phase 4** | Analytics & Dashboards | 5 Dashboard views với Recharts: Tổng quan, CRM, Nhân sự, KPI, Địa bàn | ✅ Done |
| **Phase 5** | Real-time & Chat | Thông báo thời gian thực (SSE/Pusher), Chat channel per project với typing indicator & online presence | ✅ Done |
| **Phase 6** | Self-Hosted sqld & Stateless HTTP | Chuyển đổi từ Turso Cloud sang self-hosted sqld (libSQL Server) trong Docker Compose. Kết nối qua Stateless HTTP. Prod: internal Docker, Dev: Cloudflare Tunnel. | ✅ Done |
| **Phase 7** | RBAC — Static Role System | 4-role RBAC (ADMIN, USER, AM, CV), proxy.ts + Server Action + API guards, UserContext, admin user management UI | ✅ Done (Task 28) |
| **Phase 8** | RBAC — Dynamic Role & Menu Management | DB-driven role-menu config, admin `/admin/roles` page with permission matrix, MenuManager, global `useAlert`, `useModal` hooks | ✅ Done (Task 29, 32) |

---

## 11. Tiêu chí nghiệm thu (Acceptance Criteria)

### Chức năng

- [x] Admin CRUD đầy đủ Master Data (Khách hàng, Sản phẩm, Nhân viên)
- [x] User tạo dự án mới với Search & Select dropdown phản hồi thời gian thực
- [x] 1-Click Update tạo Task Log và cập nhật đúng `ngayChamsocCuoiCung` + `trangThaiHienTai` (transaction)
- [x] Smart Alert hiển thị badge khi > 15 ngày không chăm sóc hoặc chưa từng chăm sóc
- [x] Threaded comments hoạt động đúng (Admin comment, User reply)
- [x] Chat thời gian thực: gửi/nhận tin nhắn < 1s, typing indicator, online presence
- [x] Mỗi dự án có chat channel riêng, chỉ thành viên truy cập
- [x] 5 Dashboard views render đúng dữ liệu với Recharts

### RBAC (Role-Based Access Control)

- [x] 4 role hoạt động đúng: ADMIN, USER có full access; AM, CV restricted access
- [x] proxy.ts chặn request tới route không được phép, redirect về `/du-an`
- [x] Server Actions bảo vệ bởi `requireRole()` — reject nếu role không hợp lệ
- [x] API Routes trả JSON error 401/403 qua `requireApiRole()`
- [x] Sidebar ẩn menu items khi user không có quyền truy cập
- [x] Admin user page hiển thị role overview cards, filter tabs theo role
- [x] bulk role update hoạt động đúng cho nhiều user cùng lúc
- [x] `UserContext` cung cấp `canAccess(route)` cho conditional UI rendering
- [x] Dynamic RBAC: Admin cấu hình role → menu qua UI
- [x] Dynamic Menu Management: Reorder và vô hiệu hóa menu linh hoạt

### UI/UX

- [ ] Giao diện responsive: Desktop/Laptop + Tablet portrait
- [ ] MobiFone theme: gradient xanh đậm → xanh nhạt, nền trắng/xám nhẹ
- [ ] Page load < 2 giây cho các trang chính

### Dữ liệu

- [ ] Không có dữ liệu dự án/doanh thu bị nhân đôi
- [ ] Ràng buộc FK hoạt động đúng (xóa KH → không được xóa nếu còn dự án liên quan)
- [ ] Auto-extract Tuần/Tháng/Quý/Năm chính xác từ ngày bắt đầu

### Infrastructure — Self-Hosted sqld

- [ ] sqld container chạy ổn định trong Docker Compose với healthcheck
- [ ] Production (`web` container) kết nối thành công qua `http://sqld:8080` (internal Docker network)
- [ ] Development (local laptop) kết nối thành công qua `https://turso.gpsdna.io.vn` (Cloudflare Tunnel)
- [ ] JWT authentication bắt buộc trên mọi kết nối (không cho anonymous access)
- [ ] Dev và Prod sử dụng tách biệt database namespaces (để tránh dev migration phá prod data)
- [ ] Prisma CLI migrations chạy đúng với cả hai môi trường
- [ ] Docker volume `sqld-data` lưu trữ dữ liệu bền vững qua restart
- [ ] Backup và restore database hoạt động đúng

---

## Phụ lục: Tham chiếu kỹ thuật

> Chi tiết kỹ thuật implementation được tách thành tài liệu riêng:

- **Tech Stack & Architecture:** Xem [tech-stack.md](./tech-stack.md) — bao gồm Next.js 16, Tailwind CSS v4, shadcn/ui, Prisma v7, Better Auth, routing structure, deployment strategy.
- **Database Design:** Xem [database-design.md](./database-design.md) — bao gồm ERD, Prisma schema, table definitions, business rules (auto-extract, transaction, smart alert), migration strategy, seed data.
