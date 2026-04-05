# Task 19 — Cập nhật Dashboard KPI, Excel Export và Database Safety
**Phase:** 4 (Analytics & Advanced CRM)  
**Priority:** P0  
**Status:** ✅ Done  
**PRD Ref:** FR-04b, Dashboard Views (3, 4)
**DB Ref:** [database-design.md](../database-design.md) — ChiTieuKpi, Update DuAn & KhachHang fields

---

## Mục tiêu

Cập nhật, hoàn thiện các tính năng CRM cuối cùng bao gồm:
1. Giao diện báo cáo và Performance Dashboard (Lọc theo thời gian, tính toán KPI tổng hợp).
2. Chức năng Export Excel cho các báo cáo quản lý.
3. System DB Tools an toàn (Safe Migrations, Backup, Seed).
4. Cải tiến Form UI với SearchableSelect (Dropup component) và tối ưu Dashboard UX.

---

## Danh sách công việc đã thực hiện

### 1. Database & Security
- [x] Áp dụng `onDelete: Cascade` và `SetNull` cho các relation để tăng tính toàn vẹn dư liệu (Cascade User -> NhatKy, BinhLuan, TinNhan).
- [x] Tạo công cụ Seed & Database Safety (`db-safety.ts`, `migrate-reset-safe.ts`).
- [x] Cập nhật Prisma Schema: Bổ sung các thông tin chi tiết (Liên hệ, Kỷ niệm) vào `KhachHang`.
- [x] Cập nhật `.gitignore` ẩn các file database backups và AI configs.

### 2. Quản lý KPI (Admin Dashboard)
- [x] Tạo model `ChiTieuKpi` trong schema Prisma kết hợp với chức năng thiết lập mục tiêu hàng tháng/quý.
- [x] Xây dựng UI Tracker để quản trị viên đánh giá chỉ tiêu kinh doanh theo lĩnh vực (Mạng, CNTT, CĐS, An ninh).
- [x] Dynamic time filtering (Tuần/Tháng/Quý/Năm) cho Dashboard hiệu suất AM/CV.

### 3. CRM Export Excel
- [x] Khởi tạo library export Excel hỗ trợ tải xuống định dạng `xlsx`.
- [x] Tích hợp One-click Export trên các màn hình quản lý dự án, báo cáo AM, CV.

### 4. UI/UX Enhancements
- [x] Thay thế Select mặc định thành **SearchableSelect** để tối ưu tốc độ chọn liệu cho form Dự án.
- [x] Quản trị thanh cuộn cho bảng dữ liệu ngang bằng component **StickyScrollContainer** (Fix scrollbar UI bugs).
- [x] Chèn Logo MobiFone và thiết kế lại Header/Sidebar cho phù hợp bộ nhận diện nền tối (Dark Navy).
- [x] Mở rộng form dự án cho phép gán AM Hỗ trợ và CV Hỗ trợ (1, 2) phối hợp.

---

## Tiêu chí hoàn thành

- [x] Dữ liệu Excel xuất ra định dạng chuẩn (Human readable headers).
- [x] Dashboard UI (AM/Admin) không bị giật lag, timezone/filter chuẩn xác, sticky scrollbar hoạt động tốt.
- [x] Hệ thống quản trị dữ liệu tránh lỗi mất mát (Safe DB Reset Scripts).
