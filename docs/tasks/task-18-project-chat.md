# Task 18 — Chat Dự án Thời gian thực (Real-time Project Chat)
**Phase:** 5 (Optimization & Real-time)  
**Priority:** P1  
**Status:** ⏳ Todo  
**PRD Ref:** FR-19, FR-20, FR-21, FR-22  
**DB Ref:** [database-design.md](../database-design.md) — Section 3.8 (TinNhan)  
**Depends on:** Task 12 (Bình luận), Task 17 (Real-time Notifications)

---

## Mục tiêu

Xây dựng hệ thống **chat thời gian thực** tích hợp vào mỗi dự án. Mỗi dự án hoạt động như một **chat channel** riêng biệt, cho phép các thành viên dự án (AM, Chuyên viên, Admin) trao đổi trực tiếp, nhanh chóng và liên tục — khác với hệ thống bình luận (threaded comments) hiện tại vốn dùng cho từng chủ đề cụ thể.

### Phân biệt Chat vs Bình luận

| Tiêu chí | Bình luận (Task 12) | Chat (Task 18) |
|----------|--------------------|--------------------|
| **Mục đích** | Trao đổi theo chủ đề, có cấu trúc thread | Trao đổi nhanh, liên tục, phi cấu trúc |
| **Giao diện** | Thread cha-con, indent | Chat box dạng messenger, tin nhắn liên tiếp |
| **Real-time** | Tải lại trang để xem mới (trừ khi dùng Task 17) | Hiển thị tin nhắn mới ngay lập tức |
| **Typing indicator** | Không | Có — "Nguyễn Văn A đang nhập..." |
| **Online presence** | Không | Có — hiển thị ai đang online |
| **Scroll behavior** | Phân trang theo comment | Infinite scroll lên trên, auto-scroll xuống khi có tin mới |

---

## Danh sách công việc

### 1. Database Schema

- [ ] Tạo model `TinNhan` (ChatMessage) trong `schema.prisma`:
  ```prisma
  model TinNhan {
    id        Int      @id @default(autoincrement())
    projectId Int
    userId    String
    content   String
    type      LoaiTinNhan @default(TEXT)
    isEdited  Boolean  @default(false)
    isDeleted Boolean  @default(false)
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    duAn DuAn @relation(fields: [projectId], references: [id], onDelete: Cascade)
    user User @relation(fields: [userId], references: [id])

    @@index([projectId, createdAt])
    @@index([userId])
  }

  enum LoaiTinNhan {
    TEXT       // Tin nhắn văn bản
    SYSTEM     // Tin nhắn hệ thống (user joined, status changed)
  }
  ```
- [ ] Thêm relation `tinNhan TinNhan[]` vào model `User` và `DuAn`.
- [ ] Chạy migration: `npx prisma migrate dev --name add-chat-messages`

### 2. Server Actions

- [ ] Tạo `src/app/(dashboard)/du-an/[id]/chat-actions.ts`:
  - `getMessages(projectId, cursor?, limit=50)` — lấy tin nhắn với cursor-based pagination (load older messages)
  - `sendMessage(data: { projectId, content })` — gửi tin nhắn mới
  - `editMessage(messageId, content)` — sửa tin nhắn (chỉ chính chủ, trong 15 phút)
  - `deleteMessage(messageId)` — soft-delete (set `isDeleted = true`)
- [ ] Validation với Zod:
  - `content`: required, min 1 char, max 2000 chars
  - `projectId`: required, number
- [ ] Permission check:
  - Chỉ Admin hoặc thành viên dự án (AM/CV) mới được gửi/xem tin nhắn
  - Sửa/xóa: chỉ chính chủ hoặc Admin

### 3. Real-time Infrastructure

- [ ] Tạo `src/lib/chat-realtime.ts`:
  - Sử dụng **Server-Sent Events (SSE)** hoặc **Ably/Pusher** (tuỳ thuộc Task 17 chọn gì)
  - Channel naming: `project-chat-{projectId}`
  - Events:
    - `new-message` — tin nhắn mới
    - `edit-message` — tin nhắn được sửa
    - `delete-message` — tin nhắn bị xóa
    - `typing-start` — user bắt đầu gõ
    - `typing-stop` — user ngừng gõ
    - `presence-update` — user online/offline

- [ ] Tạo API Route `src/app/api/du-an/[id]/chat/stream/route.ts`:
  - GET endpoint trả về SSE stream cho project chat channel
  - Auth check: chỉ thành viên dự án mới subscribe được
  - Heartbeat mỗi 30 giây để giữ kết nối

### 4. Custom Hooks

- [ ] Tạo `src/hooks/use-project-chat.ts`:
  ```typescript
  export function useProjectChat(projectId: number) {
    // - messages: tin nhắn hiện tại (state)
    // - sendMessage(content): gửi tin nhắn
    // - loadMore(): tải tin nhắn cũ hơn (cursor pagination)
    // - hasMore: còn tin nhắn cũ để tải không
    // - isConnected: trạng thái kết nối SSE
  }
  ```

- [ ] Tạo `src/hooks/use-typing-indicator.ts`:
  ```typescript
  export function useTypingIndicator(projectId: number) {
    // - typingUsers: string[] — danh sách user đang gõ
    // - startTyping(): broadcast "đang gõ"
    // - stopTyping(): broadcast "ngừng gõ"
    // - Debounce: tự stop sau 3 giây không gõ
  }
  ```

- [ ] Tạo `src/hooks/use-online-presence.ts`:
  ```typescript
  export function useOnlinePresence(projectId: number) {
    // - onlineUsers: User[] — ai đang online trong channel
    // - Heartbeat interval
  }
  ```

### 5. Chat UI Component

- [ ] Tạo `src/components/du-an/project-chat.tsx` — Component chính:

  **Header:**
  - Tiêu đề "Chat dự án"
  - Số thành viên online (badge xanh)
  - Nút mở rộng/thu gọn chat panel

  **Message List:**
  - Scroll container với chiều cao cố định (400px default, expandable)
  - Auto-scroll xuống khi có tin nhắn mới (trừ khi user đang scroll lên đọc cũ)
  - "Scroll to bottom" floating button khi user đang ở trên
  - Load more (infinite scroll lên trên) — hiển thị spinner khi loading
  - Grouped messages: tin nhắn liên tiếp cùng user → gộp (chỉ hiển thị avatar 1 lần)
  - Mỗi tin nhắn:
    - Avatar + tên user (với role badge Admin/User)
    - Nội dung tin nhắn
    - Timestamp (giờ:phút, hoặc "Hôm qua 14:30")
    - Context menu (right-click hoặc hover): Sửa / Xóa (nếu quyền)
    - Tin nhắn đã sửa: hiển thị "(đã chỉnh sửa)" nhỏ
    - Tin nhắn đã xóa: hiển thị "Tin nhắn đã bị xóa" (mờ)
  - System messages: hiển thị giữa, nhỏ, màu mờ (ví dụ: "Nguyễn Văn A vừa cập nhật trạng thái dự án")

  **Typing Indicator:**
  - Hiển thị ở cuối danh sách tin nhắn
  - "[Tên user] đang nhập..." (animated dots)

  **Chat Input:**
  - Textarea auto-resize (min 1 line, max 5 lines)
  - Nút Gửi (hoặc Enter để gửi, Shift+Enter xuống dòng)
  - Character counter khi > 1500 ký tự

  **Empty State:**
  - "Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!"
  - Icon chat bubble lớn

### 6. Tích hợp vào Trang Chi tiết Dự án

- [ ] Thêm tab/section "Chat" trong trang `src/app/(dashboard)/du-an/[id]/page.tsx`
- [ ] Layout sử dụng Tabs: `Tổng quan` | `Nhật ký` | `Bình luận` | `Chat`
  - Hoặc: Chat panel luôn hiện bên phải (sidebar chat) nếu màn hình đủ rộng
- [ ] Chat panel responsive: full-width trên mobile, sidebar trên desktop
- [ ] Badge đếm tin nhắn chưa đọc trên tab Chat (nếu có)

### 7. Unread Message Tracking

- [ ] Tạo `src/lib/chat-unread.ts`:
  - Lưu `lastReadMessageId` per user per project vào localStorage (v1)
  - Tính số tin nhắn chưa đọc = messages after lastReadMessageId
  - Đánh dấu đã đọc khi user mở tab Chat
- [ ] Hiển thị unread badge trên tab Chat và Sidebar (nếu có)

### 8. Tối ưu hóa & Edge Cases

- [ ] Reconnection logic: tự kết nối lại khi mất kết nối (exponential backoff)
- [ ] Offline queue: tin nhắn gửi khi offline → retry khi reconnect
- [ ] Rate limiting: max 10 tin nhắn/phút per user
- [ ] XSS prevention: sanitize HTML trong nội dung tin nhắn
- [ ] Performance: virtualized message list nếu > 200 tin nhắn hiển thị
- [ ] Memory management: cleanup SSE connections khi unmount

---

## Cấu trúc Thư mục Mới

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── du-an/
│   │       └── [id]/
│   │           ├── chat-actions.ts        # Server Actions cho chat
│   │           └── page.tsx               # Updated: thêm Chat tab
│   └── api/
│       └── du-an/
│           └── [id]/
│               └── chat/
│                   ├── route.ts           # GET messages, POST send
│                   └── stream/
│                       └── route.ts       # SSE stream endpoint
├── components/
│   └── du-an/
│       ├── project-chat.tsx              # Main chat component
│       ├── chat-message.tsx              # Individual message
│       ├── chat-input.tsx                # Chat input with auto-resize
│       ├── typing-indicator.tsx          # Typing dots animation
│       └── online-users.tsx              # Online presence indicator
├── hooks/
│   ├── use-project-chat.ts              # Chat state & SSE hook
│   ├── use-typing-indicator.ts          # Typing broadcast hook
│   └── use-online-presence.ts           # Presence tracking hook
└── lib/
    ├── chat-realtime.ts                 # SSE/Pusher setup
    └── chat-unread.ts                   # Unread tracking logic
```

---

## Tiêu chí hoàn thành

- [ ] User A gửi tin nhắn trong dự án X, User B thấy tin nhắn hiện ra **ngay lập tức** (< 1s delay)
- [ ] Typing indicator hoạt động đúng: hiển thị khi user đang gõ, ẩn sau 3s không gõ
- [ ] Online presence hiển thị đúng: user vào chat → online, rời → offline
- [ ] Tin nhắn cũ load đúng khi scroll lên (cursor pagination)
- [ ] Sửa tin nhắn trong 15 phút, xóa mềm hoạt động đúng
- [ ] Permission: chỉ thành viên dự án (AM, CV, Admin) mới truy cập được chat
- [ ] Auto-scroll xuống khi có tin nhắn mới (trừ khi user đang đọc tin cũ)
- [ ] Responsive: hoạt động tốt trên Desktop và Tablet
- [ ] Không gây memory leak (cleanup connections đúng cách)
- [ ] Tin nhắn hệ thống tự động khi có thay đổi trạng thái dự án
- [ ] Hoạt động ổn định với 10+ users đồng thời trên cùng 1 project channel
