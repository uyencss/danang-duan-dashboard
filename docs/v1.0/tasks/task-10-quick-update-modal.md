# Task 10 — 1-Click Update Modal (Quick Log)
**Phase:** 3 (Project Master & Task Logs)  
**Priority:** P0  
**Status:** ✅ Done
**PRD Ref:** FR-09, FR-10, FR-11, Section 8.2 (Data Flow: Task Log Update)  
**DB Ref:** [database-design.md](../database-design.md) — Section 3.6 (NhatKyCongViec), Section 4.2 (Transaction)

---

## Mục tiêu

Modal rút gọn cho phép User cập nhật nhanh trạng thái dự án mà không cần vào trang chi tiết. Mỗi update tạo TaskLog mới + cập nhật project parent.

---

## Danh sách công việc

### 1. Server Action

- [x] Tạo `createTaskLog(data)` trong `src/app/(dashboard)/du-an/actions.ts`
  - Transaction block:
    - [x] Tạo `NhatKyCongViec` mới (Lưu trạng thái lúc update + nội dung)
    - [x] Cập nhật `DuAn` parent:
      - `trangThaiHienTai` = `trangThaiMoi`
      - `ngayChamsocCuoiCung` = `now()`
  - [x] Revalidate `/du-an`

### 2. UI Component

- [x] Tạo `src/components/du-an/quick-update-modal.tsx` (Dialog)
- [x] Form input:
  - Dự án (Disabled, lấy từ context của hàng trong bảng)
  - Trạng thái hiện tại (badge hiển thị)
  - **Trạng thái mới** (Select dropdown: MOI → DA_KY_HOP_DONG)
  - **Nội dung nhật ký** (Textarea, bắt buộc, tối thiểu 10 ký tự)

### 3. Logic & Validation

- [x] Zod schema: `projectId`, `trangThaiMoi`, `noiDungChiTiet`
- [x] `useForm` / `react-hook-form`
- [x] Loading state cho nút "Cập nhật"
- [x] Toast báo thành công: "Đã cập nhật trạng thái dự án!"

### 4. Integration

- [x] Gắn nút **"Update"** vào `ActionsColumn` trong `projects-table.tsx`
- [x] Gắn component `QuickUpdateModal` vào `ProjectList` container (dùng 1 modal chung, quản lý index/selected project)

---

## Tiêu chí hoàn thành (Section 6.5)

- [x] Cập nhật xong bảng tự refresh dữ liệu mới
- [x] `NhatKyCongViec` lưu đúng ID nhân viên thực hiện (lấy từ session)
- [x] `DuAn` parent cập nhật đúng trạng thái hiện tại
- [x] Ngày chăm sóc cuối cùng (`ngayChamsocCuoiCung`) tự động nhảy về ngày hiện tại
- [x] Badge "Cần chăm sóc" (Smart Alert) mất đi ngay lập tức sau khi update
- [x] Chặn nhân viên không được cập nhật dự án không phải của mình (AM/CV check)
- [x] Error handling nếu input < 10 ký tự
