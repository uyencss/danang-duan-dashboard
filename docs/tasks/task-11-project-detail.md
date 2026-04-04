# Task 11 — Trang Chi tiết Dự án (Project Detail)
**Phase:** 3 (Project Master & Task Logs)  
**Priority:** P0  
**Status:** ✅ Done
**PRD Ref:** FR-08, FR-12, FR-15  
**DB Ref:** [database-design.md](../database-design.md) — Section 3.5, 3.6, 3.7

---

## Mục tiêu

Trang chi tiết dự án hiển thị overview, trạng thái nổi bật, timeline CSKH (Task Logs), và thread bình luận.

---

## Danh sách công việc

### 1. Server Actions

- [x] `getDuAnDetail(id)` — lấy chi tiết dự án:
  - [x] Include: KhachHang, SanPham, AM, ChuyenVien
  - [x] Include: NhatKyCongViec[] (ordered by ngayGio DESC)
  - [x] Include: BinhLuan[] (with replies, ordered by timestamp)
  - [x] Compute: isNeedsCare, daysSinceLastCare
- [ ] `updateDuAn(id, data)` — cập nhật thông tin dự án (optional)

### 2. Detail Page

- [x] Tạo `src/app/(dashboard)/du-an/[id]/page.tsx`
- [x] Layout: Tabs hoặc sections layout

### 3. Overview Section

- [x] Project Info Card:
  - [x] Tên dự án, Lĩnh vực (badge)
  - [x] Khách hàng: tên + phân loại + địa chỉ
  - [x] Sản phẩm: nhóm + tên chi tiết
  - [x] AM + Chuyên viên
  - [x] Doanh thu dự kiến (formatted)
  - [x] Số HĐ / Mã HĐ
  - [x] Ngày bắt đầu + Tuần/Tháng/Quý/Năm
- [x] Status Card:
  - [x] Trạng thái hiện tại (large color-coded badge)
  - [x] Ngày chăm sóc cuối cùng
  - [x] Smart Alert badge nếu cần
  - [x] Số ngày kể từ chăm sóc cuối

### 4. Timeline Section (FR-12)

- [x] Tạo component `task-log-timeline.tsx`
  - [x] Hiển thị dạng vertical timeline
  - [x] Mỗi entry:
    - [x] Thời gian (ngayGio)
    - [x] Người thực hiện (user.name)
    - [x] Trạng thái mới (color badge)
    - [x] Nội dung chi tiết
  - [x] Sorted: mới nhất lên trên
  - [x] Empty state: "Chưa có nhật ký công việc"

### 5. Quick Update Button

- [x] Nút "Cập nhật nhanh" → mở Quick Update Modal (Task 10)
- [x] Nút chỉ hiển thị cho AM/CV được phân công hoặc Admin

### 6. Comments Section (FR-15)

- [x] Tạo component `project-comments.tsx`
  - [x] Hiển thị thread bình luận (xem Task 12 chi tiết) - *Placeholder implemented*
  - [x] Tích hợp vào detail page

### 7. Permission

- [x] Admin: xem tất cả dự án
- [x] User: chỉ xem dự án được phân công
- [x] 404 nếu dự án không tồn tại hoặc không có quyền

---

## Tiêu chí hoàn thành

- [x] Detail page hiển thị đầy đủ thông tin dự án
- [x] Trạng thái hiện tại nổi bật với color-coded badge
- [x] Timeline Task Logs hiển thị đúng thứ tự thời gian
- [x] Quick Update button hoạt động đúng
- [x] Comments section hiển thị (delegate chi tiết cho Task 12)
- [x] Smart Alert hiển thị đúng
- [x] Permission check đúng
