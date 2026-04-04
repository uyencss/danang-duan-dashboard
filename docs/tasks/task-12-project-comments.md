# Task 12 — Hệ thống Trao đổi & Bình luận (Project Comments)
**Phase:** 3 (Advanced CRM)  
**Priority:** P1  
**Status:** ✅ Done  
**PRD Ref:** FR-14, FR-15
**Design Ref:** [chi_tiet_du_an.png](../../artifacts/03_chi_tiet_du_an_1775291248482.png)
 — Section 3.7 (BinhLuan)

---

## Mục tiêu

Hệ thống bình luận threaded trên dự án: Admin comment, User reply — tích hợp vào trang chi tiết dự án.

---

## Danh sách công việc

### 1. Server Actions

- [x] Tạo `src/app/(dashboard)/du-an/[id]/comment-actions.ts`
  - [x] `getComments(projectId)` — lấy danh sách comments + replies (nested)
    - [x] Include: user (name, role, avatarUrl)
    - [x] Order: createdAt ASC
  - [x] `createComment(data)` — tạo bình luận mới (top-level)
  - [x] `replyComment(data)` — reply (parentId = comment gốc)
  - [x] `deleteComment(id)` — xóa (chỉ Admin hoặc chính chủ)

### 2. Zod Schema

- [x] `projectId`: required, number
- [x] `content`: required, min 2 chars, max 1000 chars
- [x] `parentId`: optional, number (null = top-level comment)

### 3. Comments Component

- [x] Tạo `src/components/du-an/project-comments.tsx`
  - [x] Hiển thị danh sách comments
  - [x] Mỗi comment:
    - [x] Avatar + Tên user + Role badge (Admin/User)
    - [x] Nội dung
    - [x] Timestamp (relative: "2 giờ trước", "Hôm qua")
    - [x] Nút "Trả lời" (reply)
    - [x] Nút "Xóa" (nếu có quyền)
  - [x] Reply: hiển thị indent dưới comment cha (1 level)

### 4. Comment Input

- [x] Textarea + nút "Gửi bình luận"
- [x] Reply mode: textarea xuất hiện dưới comment đang reply
  - [x] Hiển thị "Đang trả lời @username" + nút cancel
- [x] Clear textarea sau khi submit thành công

### 5. @Mention System

- [x] Người dùng gõ `@` sẽ xuất hiện autocomplete list gợi ý tên user trong các user đã tham gia bình luận.
- [x] Phím `Tab` để chọn người dùng đang focus. Tự động chèn template `@username` thay vì chỉ name.
- [x] Highlight text comment: nếu text có chứa string match pattern format `@username`, màu text sẽ là xanh bold để nhận diện mention.

### 6. Empty State

- [x] "Chưa có bình luận nào. Hãy bắt đầu cuộc trao đổi!"

### 7. Permission

- [x] Admin: comment trên mọi dự án
- [x] User: comment trên dự án được phân công
- [x] Delete: chỉ Admin hoặc người viết comment

---

## Tiêu chí hoàn thành

- [x] Admin tạo comment trên bất kỳ dự án nào
- [x] User reply comment (threaded 1-level)
- [x] Hiển thị thread đúng: comment cha + replies indent + highlight `@username` ở cấp 2
- [x] Timestamp relative hiển thị đúng
- [x] Delete hoạt động đúng quyền
- [x] Empty state hiển thị khi chưa có comment
- [x] Tính năng Autocomplete người dùng và mention highlighting hoạt động ổn định.
