# Task 08 — Tạo Dự án mới (Project Creation)
**Phase:** 3 (Project Master & Task Logs)  
**Priority:** P0  
**Status:** ✅ Done  
**PRD Ref:** FR-05, FR-06, Section 8.1 (Data Flow: Tạo dự án mới)  
**DB Ref:** [database-design.md](../database-design.md) — Section 3.5 (DuAn), Section 4.1 (Auto-extract)

---

## Mục tiêu

User tạo dự án mới với form Search & Select, auto-extract time fields, và lưu vào database.

---

## Danh sách công việc

### 1. Server Actions

- [ ] Tạo `src/app/(dashboard)/du-an/actions.ts`
  - `createDuAn(data)` — tạo dự án mới:
    1. Validate input (Zod)
    2. Auto-extract tuan/thang/quy/nam từ ngayBatDau
    3. Set trangThaiHienTai = "MOI"
    4. Lưu vào DB
  - `getKhachHangOptions()` — danh sách KH active cho dropdown
  - `getSanPhamOptions()` — danh sách SP active cho dropdown
  - `getUserOptions()` — danh sách nhân viên active cho dropdown

### 2. Zod Validation Schema

- [ ] `customerId`: required, number ≥ 1
- [ ] `productId`: required, number ≥ 1
- [ ] `amId`: required, string (user id)
- [ ] `chuyenVienId`: optional, string
- [ ] `tenDuAn`: required, min 5 chars
- [ ] `linhVuc`: enum LinhVuc
- [ ] `tongDoanhThuDuKien`: required, number ≥ 0
- [ ] `soHopDong`: optional string
- [ ] `maHopDong`: optional string
- [ ] `ngayBatDau`: required, valid date

### 3. Project Creation Page

- [ ] Tạo `src/app/(dashboard)/du-an/tao-moi/page.tsx`
  - Form layout: 2 columns trên desktop, 1 column trên tablet
  - React Hook Form + Zod validation

### 4. Search & Select Components (FR-05)

- [ ] **Khách hàng Combobox**: shadcn Combobox với realtime search
  - Gõ ký tự → filter danh sách → chọn
  - Hiển thị: tên + phân loại (badge)
- [ ] **Sản phẩm Combobox**: tương tự, hiển thị nhóm + tên chi tiết
- [ ] **AM Select**: dropdown nhân viên, filter theo role
- [ ] **Chuyên viên Select**: tương tự

### 5. Form Fields

- [ ] Tên dự án (input text)
- [ ] Lĩnh vực (radio/select: B2B/B2G, B2A)
- [ ] Tổng doanh thu dự kiến (number input, đơn vị: triệu đồng)
- [ ] Số hợp đồng (text, optional)
- [ ] Mã hợp đồng (text, optional)
- [ ] Ngày bắt đầu (DatePicker)

### 6. Auto-extract Time Fields (FR-06)

- [ ] Khi chọn Ngày bắt đầu → hiển thị preview: "Tuần X, Tháng Y, Quý Z, Năm W"
- [ ] Sử dụng `extractTimeFields()` từ `src/lib/utils/time-extract.ts`
- [ ] Lưu tuan, thang, quy, nam vào DB cùng lúc tạo dự án

### 7. Submit & Redirect

- [ ] Submit thành công → toast "Tạo dự án thành công"
- [ ] Redirect đến trang chi tiết dự án `/du-an/[id]`
- [ ] Submit lỗi → hiển thị error message cụ thể

---

## Tiêu chí hoàn thành

- [ ] Form tạo dự án hoạt động end-to-end
- [ ] Search & Select (Combobox) phản hồi gõ realtime
- [ ] Auto-extract time fields chính xác
- [ ] Validation đúng tất cả fields
- [ ] Dự án mới lưu đúng vào DB với trangThaiHienTai = "MOI"
- [ ] Redirect đúng sau submit
