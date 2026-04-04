# Task 09 — Danh sách Dự án (Project List / CRM View)
**Phase:** 3 (Project Master & Task Logs)  
**Priority:** P0  
**Status:** ✅ Done
**PRD Ref:** FR-07, FR-09, FR-16, FR-17, FR-18, Section 7 View 2  
**DB Ref:** [database-design.md](../database-design.md) — Section 3.5 (DuAn)

---

## Mục tiêu

DataGrid hiển thị toàn bộ dự án với lọc đa chiều, tìm kiếm nhanh, Smart Alert badge, và nút 1-Click Update.

---

## Danh sách công việc

### 1. Server Actions

- [x] `getDuAnList(filters)` — danh sách dự án với:
  - Search: theo tên dự án
  - Filter: theo phân loại KH, sản phẩm, trạng thái, lĩnh vực, AM
  - include: KhachHang, SanPham, AM, ChuyenVien
  - include: count(NhatKyCongViec), count(BinhLuan)

### 2. Base View Layer

- [x] Tạo `src/app/(dashboard)/du-an/page.tsx`
- [x] Tạo `src/app/(dashboard)/du-an/projects-table.tsx` (TanStack Table)

### 3. Filters Section (Header)

- [x] Search Bar (input)
- [x] Multi-Select / Select dropdowns:
  - Phân loại KH (CHINH_PHU, DOANH_NGHIEP, CONG_AN)
  - Sản phẩm (lấy từ Master Data)
  - Trạng thái (NativeEnum TrangThaiDuAn)
  - Lĩnh vực (NativeEnum LinhVuc)
  - AM phụ trách (lấy từ Master Data)

### 4. Data Table Columns (FR-07, FR-16)

- [x] **Tên dự án** — Link đến chi tiết dự án
- [x] **Sản phẩm** — badge tên chi tiết
- [x] **Khách hàng** — tên + badge phân loại (color-coded)
- [x] **Trạng thái** — badge lớn (color-coded theo ENUM)
- [x] **AM Phụ trách** — avatar / tên
- [x] **Doanh thu** — currency format
- [x] **CSKH (Smart Alert)** (FR-09):
  - Tính `ngayHienTai - ngayChamsocCuoiCung`
  - Nếu > 15 ngày: badge RED "Cần chăm sóc gấp" + hiệu ứng nhấp nháy
  - Else: badge GREEN "Ổn định"
- [x] **Tương tác**: Icon Số nhật ký / Số bình luận

### 5. Actions Column

- [x] Nút **"Update"** (Quick Update Modal — Task 10)
- [x] Menu [Dropdown]: Chi tiết, Chỉnh sửa, Xóa

---

## Tiêu chí hoàn thành

- [x] Danh sách dự án hiển thị đúng dữ liệu
- [x] Tìm kiếm và lọc hoạt động tức thì (server-side filtering)
- [x] Badge trạng thái hiển thị đúng màu
- [x] Smart Alert hiển thị đúng dự án trễ hạn chăm sóc
- [x] Hiển thị đúng avatar/tên AM phụ trách
- [x] Responsive trên màn hình laptop/desktop
- [x] Phân quyền: User chỉ thấy dự án mình phụ trách, Admin thấy tất cả.
