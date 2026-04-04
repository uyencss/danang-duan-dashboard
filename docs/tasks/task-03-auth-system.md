# Task 03 — Authentication & Authorization
**Phase:** 1 (Initialization & DB Schema)  
**Priority:** P0  
**Status:** ✅ Done  
**PRD Ref:** Section 3 (User Roles & Permissions), Section 9 NFR-04  
**Tech Ref:** [tech-stack.md](../tech-stack.md) — Section 2.6 (Better Auth)

---

## Mục tiêu

Triển khai hệ thống đăng nhập / phân quyền sử dụng Better Auth, đảm bảo 2 role Admin và User hoạt động đúng.

---

## Danh sách công việc

### 1. Better Auth Configuration

- [ ] Tạo `src/lib/auth.ts` — cấu hình Better Auth server instance
  - Database adapter: Prisma
  - Session strategy: Database sessions
  - Email/Password provider
- [ ] Tạo `src/lib/auth-client.ts` — Better Auth client instance

### 2. Auth API Routes

- [ ] Tạo `src/app/api/auth/[...all]/route.ts` — Better Auth catch-all handler
- [ ] Verify endpoints: `/api/auth/sign-in`, `/api/auth/sign-up`, `/api/auth/sign-out`

### 3. Auth Proxy (Route Protection)

- [ ] Tạo `src/app/proxy.ts` — thay thế middleware.ts (Next.js 16 pattern)
- [ ] Rules:
  - Unauthenticated → redirect to `/login`
  - Authenticated → allow access
  - `/admin/*` routes → chỉ cho `ADMIN` role
  - `/login`, `/register` → redirect to `/` nếu đã login

### 4. Login Page

- [ ] Tạo `src/app/(auth)/login/page.tsx`
  - Form: Email + Password
  - Validation: React Hook Form + Zod
  - UI: shadcn/ui components, MobiFone theme
  - Error handling: sai mật khẩu, tài khoản bị khóa
- [ ] Tạo `src/app/(auth)/layout.tsx` — auth layout (centered, không sidebar)

### 5. Register Page (Admin-only creation)

- [ ] Tạo `src/app/(auth)/register/page.tsx` (hoặc tích hợp vào Admin user management)
- [ ] Chỉ Admin mới được tạo tài khoản mới

### 6. Auth Utilities

- [ ] Tạo helper `getCurrentUser()` — lấy user từ session hiện tại
- [ ] Tạo helper `requireAuth()` — throw nếu chưa đăng nhập
- [ ] Tạo helper `requireAdmin()` — throw nếu không phải Admin

### 7. Session UI

- [ ] Hiển thị tên user + role trên header/sidebar
- [ ] Nút Sign Out hoạt động đúng
- [ ] Redirect đúng sau sign-in / sign-out

---

## Tiêu chí hoàn thành

- [ ] Login thành công với email + password
- [ ] Session persist đúng (refresh page vẫn giữ login)
- [ ] Route protection hoạt động: unauthenticated → redirect `/login`
- [ ] Admin routes chỉ accessible bởi ADMIN role
- [ ] Sign out xóa session và redirect về `/login`
- [ ] User info hiển thị đúng trên UI
