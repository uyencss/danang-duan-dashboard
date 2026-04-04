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

- [ ] Tạo `src/app/(dashboard)/du-an/[id]/comment-actions.ts`
  - `getComments(projectId)` — lấy danh sách comments + replies (nested)
    - Include: user (name, role, avatarUrl)
    - Order: createdAt ASC
  - `createComment(data)` — tạo bình luận mới (top-level)
  - `replyComment(data)` — reply (parentId = comment gốc)
  - `deleteComment(id)` — xóa (chỉ Admin hoặc chính chủ)

### 2. Zod Schema

- [ ] `projectId`: required, number
- [ ] `content`: required, min 2 chars, max 1000 chars
- [ ] `parentId`: optional, number (null = top-level comment)

### 3. Comments Component

- [ ] Tạo `src/components/du-an/project-comments.tsx`
  - Hiển thị danh sách comments
  - Mỗi comment:
    - Avatar + Tên user + Role badge (Admin/User)
    - Nội dung
    - Timestamp (relative: "2 giờ trước", "Hôm qua")
    - Nút "Trả lời" (reply)
    - Nút "Xóa" (nếu có quyền)
  - Reply: hiển thị indent dưới comment cha (1 level)

### 4. Comment Input

- [ ] Textarea + nút "Gửi bình luận"
- [ ] Reply mode: textarea xuất hiện dưới comment đang reply
  - Hiển thị "Đang trả lời @username" + nút cancel
- [ ] Clear textarea sau khi submit thành công

### 5. Empty State

- [ ] "Chưa có bình luận nào. Hãy bắt đầu cuộc trao đổi!"

### 6. Permission

- [ ] Admin: comment trên mọi dự án
- [ ] User: comment trên dự án được phân công
- [ ] Delete: chỉ Admin hoặc người viết comment

---

## Tiêu chí hoàn thành

- [ ] Admin tạo comment trên bất kỳ dự án nào
- [ ] User reply comment (threaded 1-level)
- [ ] Hiển thị thread đúng: comment cha + replies indent
- [ ] Timestamp relative hiển thị đúng
- [ ] Delete hoạt động đúng quyền
- [ ] Empty state hiển thị khi chưa có comment
