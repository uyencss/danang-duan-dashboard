# Task 21 — Project Soft Delete & Form Enhancements
**Phase:** 4 (Optimization)
**Priority:** P1
**Status:** ✅ Done
**PRD Ref:** FR-05, FR-05b

---

## Mục tiêu

Tối ưu tính năng quản lý vòng đời dự án: thêm cơ chế "Xóa Mềm" (Soft Delete) qua Thùng Rác để phòng tránh rủi ro mất dữ liệu, bổ sung các biến cờ quan trọng (`isTrongDiem`, `ngayKetThuc`), và nâng cấp trải nghiệm người dùng lúc tạo dự án với Creatable-Select để thêm nhanh Danh Mục (Sản phẩm/Khách hàng).

---

## Danh sách công việc

### 1. Nâng cấp DB và Project Model
- [x] Thêm cột `isTrongDiem` (Boolean - default `false`) dùng icon Star để đánh dấu dự án VIP.
- [x] Thêm cột `ngayKetThuc` để đánh dấu thời hạn hợp đồng/dự án.
- [x] Thêm cột `isPendingDelete` (Cờ xoá mềm) và `deleteRequestedAt` (Thời gian request xoá) cho bảng `DuAn`.

### 2. Implement Soft Delete & Recycle Bin
- [x] Sửa Server Actions (`actions.ts`): Cập nhật logic để xóa dự án sẽ thiết lập `isPendingDelete = true` thay vì xóa `delete` cứng.
- [x] Filter những dự án `isPendingDelete = true` ra khỏi Trang "Danh sách dự án".
- [x] Thêm UI Thùng Rác (Recycle Bin - "Dự án đã xóa") cho role **Admin** dưới dạng URL: `admin/du-an-da-xoa/`.
- [x] Trang bị tính năng "Khôi Phục" và "Xoá Vĩnh Viễn" cho Admin.

### 3. Nâng cấp UI Creatable Select
- [x] Triển khai UI Component `CreatableSelect` (hỗ trợ nhập chữ text custom nếu chưa có trong options dropdown).
- [x] Ứng dụng `CreatableSelect` trong `project-form.tsx` để nhân viên có thể "thêm nhanh" `Khách Hàng` hoặc `Sản Phẩm` mà không cần navigate sang trang Admin Master Data.

### 4. Refactor Branding & UI 
- [x] Logo mới (MobiFone logo) được tick hợp vào application header/sidebar.
- [x] Cập nhật Favicon tương ứng.
- [x] Fix Sticky Scrollbars ngang trong các bảng DataGrid dày đặc.
- [x] Chuẩn hoá hệ thống nút bấm (CTA buttons) đồng bộ gradient và hover colors với brand MobiFone.

---

## Tiêu chí hoàn thành
- [x] Xoá dự án từ Frontend sẽ được push vào Thùng Rác ("Admin > Dự án đã xóa").
- [x] Form tạo nhận diện được `Khách hàng mới` string input trực tiếp.
- [x] Hiển thị Star Rating tại Dashboard cho dự án đánh dấu "Trọng điểm".
- [x] Chạy server báo lỗi nếu xoá hard lúc chưa commit DB.
