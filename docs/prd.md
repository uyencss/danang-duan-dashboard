# Product Requirements Document (PRD)
# Hệ thống Quản trị Báo cáo Dự án Tập trung
## MobiFone Project Tracker

---

**Version:** 1.3.0  
**Date:** 2026-04-07  
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

### 3.1 Admin (Lãnh đạo)

| Quyền | Mô tả |
|-------|-------|
| Dashboard | Toàn quyền truy cập tất cả Dashboard views |
| Master Data | Quản lý CRUD hoàn chỉnh Danh mục (Khách hàng, Sản phẩm, Nhân viên) |
| Quản lý User | Tạo/khóa tài khoản, phân quyền Role |
| Dự án | Xem tất cả dự án, bình luận (comment) trên mọi dự án |
| Chat | Truy cập chat trên mọi dự án, gửi/sửa/xóa tin nhắn |

### 3.2 User (AM / Chuyên viên)

| Quyền | Mô tả |
|-------|-------|
| Dự án | Chỉ thao tác trên dự án được phân công (AM hoặc Chuyên viên) |
| Nhật ký | Thêm/cập nhật Task Log cho dự án của mình |
| KPI | Xem báo cáo KPI cá nhân |
| Bình luận | Reply bình luận từ Admin |
| Chat | Gửi/nhận tin nhắn trong chat dự án được phân công |

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
- Phân quyền người dùng (Role-based Access Control)
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

### 6.6 Chat Dự án Thời gian thực (Project Chat)

| ID | Yêu cầu | Priority |
|----|---------|----------|
| FR-19 | Mỗi dự án có 1 chat channel riêng, chỉ thành viên (AM, CV, Admin) truy cập | P1 |
| FR-20 | Gửi/nhận tin nhắn thời gian thực (< 1s delay), hỗ trợ sửa (trong 15 phút) và xóa mềm | P1 |
| FR-21 | Typing indicator ("Nguyễn Văn A đang nhập...") và online presence (ai đang online) | P1 |
| FR-22 | Tin nhắn hệ thống tự động khi trạng thái dự án thay đổi (ví dụ: "Dự án đã chuyển sang Đang làm việc") | P2 |

### 6.5 Smart Alerts — Cảnh báo Thông minh

| ID | Yêu cầu | Priority |
|----|---------|----------|
| FR-16 | Tự động tính `(NgàyHiệnTại - ngayChamsocCuoiCung)` | P0 |
| FR-17 | Nếu > 15 ngày → hiển thị badge **RED** "Cần chăm sóc gấp" trên Dashboard và Project List | P0 |
| FR-18 | Dự án chưa từng được chăm sóc (`ngayChamsocCuoiCung = null`) → cũng flag cảnh báo | P0 |

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
| NFR-04 | Security | Role-based access control, mật khẩu mã hóa, Cloudflare Tunnels (Zero Trust) |
| NFR-05 | Scalability | SQLite cục bộ (Dev) → Turso Embedded Replicas (Production) bằng Docker container, hỗ trợ multi-instance |
| NFR-06 | Availability | Có sẵn hệ thống backup DB, quản lý cấu hình safe db-reset qua script quản trị |
| NFR-07 | Embedded Replicas | Sử dụng Turso Embedded Replicas cho zero-latency reads — file SQLite cục bộ tự đồng bộ từ remote Turso primary. Reads miễn phí, không giới hạn. Writes forward lên cloud. Bandwidth sync < 3GB/tháng (free tier) |
| NFR-08 | Multi-Instance | Hỗ trợ 2 instances chạy đồng thời với eventually-consistent data (sync period ≤ 60s). Mỗi instance có replica riêng, Docker volume persist qua restarts |

---

## 10. Lộ trình phát triển (Execution Phases)

> ⚠️ **Protocol:** Mỗi Phase hoàn thành → dừng lại chờ review trước khi sang Phase tiếp theo.

| Phase | Scope | Deliverables | Status |
|-------|-------|-------------|--------|
| **Phase 1** | Initialization & DB Schema | Setup project (Next.js, Shadcn, Tailwind, Prisma). Viết `schema.prisma`, seed data | ⏳ Todo |
| **Phase 2** | Layout & Master Data CRUD | MobiFone-themed Sidebar layout. Admin pages CRUD: Khách hàng, Sản phẩm, Nhân viên | ⏳ Todo |
| **Phase 3** | Project Master & Task Logs | Form tạo dự án (Search & Select), Project List, 1-Click Update modal, Detail page (Timeline + Comments), 15-day Smart Alert | ⏳ Todo |
| **Phase 4** | Analytics & Dashboards | 5 Dashboard views với Recharts: Tổng quan, CRM, Nhân sự, KPI, Địa bàn | ⏳ Todo |
| **Phase 5** | Real-time & Chat | Thông báo thời gian thực (SSE/Pusher), Chat channel per project với typing indicator & online presence | ⏳ Todo |
| **Phase 6** | Embedded Replicas & Multi-Instance | Turso Embedded Replicas cho zero-latency reads. 2 Docker instances với local SQLite sync. Sync utilities, health checks | ⏳ Todo |

---

## 11. Tiêu chí nghiệm thu (Acceptance Criteria)

### Chức năng

- [ ] Admin CRUD đầy đủ Master Data (Khách hàng, Sản phẩm, Nhân viên)
- [ ] User tạo dự án mới với Search & Select dropdown phản hồi thời gian thực
- [ ] 1-Click Update tạo Task Log và cập nhật đúng `ngayChamsocCuoiCung` + `trangThaiHienTai` (transaction)
- [ ] Smart Alert hiển thị badge khi > 15 ngày không chăm sóc hoặc chưa từng chăm sóc
- [ ] Threaded comments hoạt động đúng (Admin comment, User reply)
- [ ] Chat thời gian thực: gửi/nhận tin nhắn < 1s, typing indicator, online presence
- [ ] Mỗi dự án có chat channel riêng, chỉ thành viên truy cập
- [ ] 5 Dashboard views render đúng dữ liệu với Recharts

### UI/UX

- [ ] Giao diện responsive: Desktop/Laptop + Tablet portrait
- [ ] MobiFone theme: gradient xanh đậm → xanh nhạt, nền trắng/xám nhẹ
- [ ] Page load < 2 giây cho các trang chính

### Dữ liệu

- [ ] Không có dữ liệu dự án/doanh thu bị nhân đôi
- [ ] Ràng buộc FK hoạt động đúng (xóa KH → không được xóa nếu còn dự án liên quan)
- [ ] Auto-extract Tuần/Tháng/Quý/Năm chính xác từ ngày bắt đầu

### Infrastructure — Embedded Replicas

- [ ] Reads được phục vụ từ local SQLite replica (latency < 1ms)
- [ ] Writes được forward lên Turso cloud và sync ngược về local
- [ ] 2 instances chạy đồng thời, dữ liệu nhất quán sau sync period (≤ 60s)
- [ ] Docker volumes persist local replica file qua container restarts
- [ ] Prisma CLI migrations vẫn chạy đúng với remote Turso
- [ ] Sync bandwidth < 3GB/tháng (free tier limit)
- [ ] Health check script báo cáo trạng thái sync chính xác

---

## Phụ lục: Tham chiếu kỹ thuật

> Chi tiết kỹ thuật implementation được tách thành tài liệu riêng:

- **Tech Stack & Architecture:** Xem [tech-stack.md](./tech-stack.md) — bao gồm Next.js 16, Tailwind CSS v4, shadcn/ui, Prisma v7, Better Auth, routing structure, deployment strategy.
- **Database Design:** Xem [database-design.md](./database-design.md) — bao gồm ERD, Prisma schema, table definitions, business rules (auto-extract, transaction, smart alert), migration strategy, seed data.
