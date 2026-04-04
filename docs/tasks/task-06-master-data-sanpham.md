# Task 06 — CRUD Sản phẩm (Master Data)
**Phase:** 2 (Layout & Master Data CRUD)  
**Priority:** P0  
**Status:** ✅ Done  
**PRD Ref:** FR-02, FR-04  
**DB Ref:** [database-design.md](../database-design.md) — Section 3.4 (SanPham)

---

## Mục tiêu

Admin quản lý CRUD đầy đủ danh mục Sản phẩm với DataTable.

---

## Danh sách công việc

### 1. Server Actions

- [ ] Tạo `src/app/(dashboard)/admin/san-pham/actions.ts`
  - `getSanPhamList()` — danh sách (search, filter, pagination)
  - `createSanPham(data)` — tạo mới
  - `updateSanPham(id, data)` — cập nhật
  - `deleteSanPham(id)` — xóa (kiểm tra FK: còn DuAn → reject)
  - `toggleSanPhamActive(id)` — bật/tắt

### 2. Zod Validation Schema

- [ ] `nhom`: required, min 2 chars (Cloud, IOC, Hóa đơn ĐT...)
- [ ] `tenChiTiet`: required, min 2 chars
- [ ] `moTa`: optional string

### 3. DataTable Page

- [ ] Tạo `src/app/(dashboard)/admin/san-pham/page.tsx`
  - Columns: STT, Nhóm SP, Tên chi tiết, Mô tả, Trạng thái, Actions
  - Search: theo tên sản phẩm
  - Filter: theo Nhóm sản phẩm
  - Pagination + Sorting

### 4. Create/Edit Dialog

- [ ] Component `san-pham-form-dialog.tsx`
  - Fields: Nhóm (Select/Input), Tên chi tiết, Mô tả (textarea)
  - React Hook Form + Zod

### 5. Delete Protection

- [ ] Alert Dialog xác nhận
- [ ] FK check: còn DuAn liên quan → reject + message

### 6. Toast Notifications

- [ ] CRUD success / error messages

---

## Tiêu chí hoàn thành

- [ ] Admin CRUD Sản phẩm đầy đủ
- [ ] DataTable search + filter + pagination hoạt động
- [ ] FK protection khi xóa
- [ ] Validation đúng
- [ ] Toast notifications đúng
