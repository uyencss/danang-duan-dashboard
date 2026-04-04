# Task 17 — Thông báo Thời gian thực (Real-time Notifications for Comments)
**Phase:** 5 (Optimization & Real-time)  
**Priority:** P1  
**Status:** ✅ Done  
**PRD Ref:** FR-15, NFR-03 (Performance & UX)
**DB Ref:** [database-design.md](../database-design.md) — Section 3.7 (BinhLuan)

---

## Mục tiêu

Khi có bình luận mới hoặc phản hồi mới, người dùng liên quan (AM dự án, Admin, hoặc người được tag) sẽ nhận được thông báo ngay lập tức mà không cần tải lại trang.

---

## Danh sách công việc

### 1. Hạ tầng Real-time
- [x] Lựa chọn giải pháp: Server-Sent Events (SSE) hoặc WebSockets (Ably/Pusher).
- [x] Thiết lập Provider (Ably API Keys trong `.env`).
- [x] Tạo `src/lib/realtime.ts` để quản lý kết nối.

### 2. Sự kiện Phát tin (Broadcast)
- [x] Tích hợp phát tin vào `createComment` actions.
- [x] Channel: `project-{projectId}`.

### 3. Thành phần Nhận tin (Listener)
- [x] Integrate useEffect vào `ProjectComments` để lắng nghe thiết lập kênh `project-{projectId}`.
- [x] Sử dụng `router.refresh()` để cập nhật danh sách bình luận (Next.js App Router paradigm).

### 4. Thông báo UI (Notification System)
- [x] Hiển thị Toast (Sonner) thông báo nội dung bình luận mới: "[Tên] vừa bình luận: [Nội dung...]".
- [x] (Nâng cao) Thêm trung tâm thông báo (Notification Bell) trên Sidebar/Layout.

### 5. Tối ưu hóa
- [x] Đảm bảo bảo mật: Component kiểm tra ID người gửi để không tự ping chính mình.
- [x] Xử lý ngắt kết nối/kết nối lại qua Ably.

---

## Tiêu chí hoàn thành

- [x] Người dùng A bình luận, người dùng B thấy bình luận hiện ra ngay lập tức (< 2s delay).
- [x] Thông báo toast hiển thị đúng nội dung.
- [x] Không gây lỗi memory leak do mở quá nhiều kết nối (`return () => channel.unsubscribe()`).
- [x] Hoạt động ổn định trên môi trường Production.
