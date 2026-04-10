# Task 20 — Fix & Nâng Cấp Hệ Hệ Thống Mention (@)
**Phase:** 4
**Priority:** P1
**Status:** ✅ Done
**PRD Ref:** FR-14, FR-15

---

## Mục tiêu

Cải thiện tính năng gõ `@` trong hệ thống bình luận của dự án: hiển thị danh sách người dùng để nhắc đến, highlight toàn bộ tên người được nhắc đến chứ không phải từ đầu tiên, và tích hợp thông báo realtime khi một người bị nhắc đến.

---

## Danh sách công việc

### 1. Fix hiển thị dropdown danh sách user khi gõ `@`
- [x] Khi nhập ký tự `@`, kích hoạt popup/dropdown gợi ý người dùng (có thể trong dự án hoặc trong hệ thống).
- [x] Lọc gợi ý theo từ khóa người dùng đang gõ sau ký tự `@`.
- [x] Hỗ trợ chọn người dùng bằng chuột hoặc bàn phím.

### 2. Highlight toàn bộ họ tên của user
- [x] Chèn format chứa định danh người dùng vào text (vd: `@[Tên đầy đủ](user_id)` hoặc định dạng đặc biệt để không bị tách rời tên).
- [x] Update renderer hiển thị comment: detect `@Tên Đầy Đủ` để áp dụng class highlight (vd: `text-blue-500 font-bold`) cho toàn bộ chuỗi tên.

### 3. Thông báo đẩy (Push Notification) realtime
- [x] Tích hợp cơ chế thông báo cho hệ thống khi tạo bình luận chứa `@mention`.
- [x] Xác định các user được nhắc đến.
- [x] Push notification realtime đến web app của các user đó.

---

## Tiêu chí hoàn thành

- [x] Typing `@` sẽ hiển thị danh sách gợi ý user chính xác và kịp thời.
- [x] Toàn bộ chuỗi tên người dùng được highlight màu xanh đậm thay vì chỉ chữ/từ đầu tiên.
- [x] Khi có người dùng gửi bình luận chứa tag mention đến một/vài user khác, các user đó (nếu đang mở ứng dụng) sẽ nhận được thông báo đẩy.
