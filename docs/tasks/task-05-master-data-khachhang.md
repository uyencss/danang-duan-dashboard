# Task 05 — CRUD Khách hàng (Master Data)
**Phase:** 2 (Layout & Master Data CRUD)  
**Priority:** P0  
**Status:** ✅ Done  
**PRD Ref:** FR-01, FR-04  
**DB Ref:** [database-design.md](../database-design.md) — Section 3.3 (KhachHang)

---

## Mục tiêu

Admin quản lý CRUD đầy đủ danh mục Khách hàng với DataTable, tìm kiếm, và phân trang.

---

## Danh sách công việc

### 1. Server Actions

- [ ] Tạo `src/app/(dashboard)/admin/khach-hang/actions.ts`
  - `getKhachHangList()` — lấy danh sách (hỗ trợ search, filter, pagination)
  - `createKhachHang(data)` — tạo mới, validate bằng Zod
  - `updateKhachHang(id, data)` — cập nhật
  - `deleteKhachHang(id)` — xóa (kiểm tra FK: nếu còn DuAn liên quan → reject)
  - `toggleKhachHangActive(id)` — bật/tắt trạng thái isActive

### 2. Zod Validation Schema

- [ ] Tạo schema validate:
  - `ten`: required, min 2 chars
  - `phanLoai`: enum PhanLoaiKH
  - `diaChi`: optional string
  - `soDienThoai`: optional, format SĐT Việt Nam
  - `email`: optional, valid email format

### 3. DataTable Page

- [ ] Tạo `src/app/(dashboard)/admin/khach-hang/page.tsx`
  - shadcn DataTable component
  - Columns: STT, Tên KH, Phân loại (badge), Địa chỉ, SĐT, Email, Trạng thái, Actions
  - Tìm kiếm: search theo tên khách hàng (realtime)
  - Lọc: filter theo Phân loại (Chính phủ / DN / Công an)
  - Phân trang: 10/20/50 rows per page
  - Sorting: click header để sort

### 4. Create/Edit Dialog

- [ ] Tạo component `khach-hang-form-dialog.tsx`
  - shadcn Dialog / Sheet
  - React Hook Form + Zod validation
  - Fields: Tên, Phân loại (Select), Địa chỉ, SĐT, Email
  - Mode: Create (empty) / Edit (pre-filled)
  - Submit → revalidate danh sách

### 5. Delete Confirmation

- [ ] Alert Dialog xác nhận trước khi xóa
- [ ] Nếu KH còn DuAn liên quan → hiển thị lỗi "Không thể xóa, khách hàng còn dự án liên quan"
- [ ] Gợi ý: "Bạn có thể tắt trạng thái hoạt động thay vì xóa"

### 6. Toast Notifications

- [ ] Thành công: "Tạo khách hàng thành công", "Cập nhật thành công", "Xóa thành công"
- [ ] Lỗi: hiển thị message cụ thể

---

## Tiêu chí hoàn thành

- [ ] Admin tạo/sửa/xóa/toggle Khách hàng thành công
- [ ] DataTable hiển thị đúng dữ liệu với search + filter + pagination + sort
- [ ] Validation hoạt động đúng (required fields, email format)
- [ ] FK protection: không xóa được KH còn dự án
- [ ] Toast notifications hiển thị đúng
- [ ] Non-admin không truy cập được trang này
