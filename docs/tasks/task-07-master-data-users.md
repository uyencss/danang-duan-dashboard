# Task 07 — Quản lý Nhân viên / Tài khoản (Users)
**Phase:** 2 (Layout & Master Data CRUD)  
**Priority:** P0  
**Status:** ✅ Done (Updated)  
**PRD Ref:** FR-03, FR-04, Section 3 (Roles & Permissions)  
**DB Ref:** [database-design.md](../database-design.md) — Section 3.1 (User)

---

## Mục tiêu

Admin quản lý tài khoản nhân sự: tạo user mới, cập nhật thông tin, phân quyền role (ADMIN, AM, CV), quản lý địa bàn.

---

## Danh sách công việc

### 1. Server Actions

- [x] Tạo `src/app/(dashboard)/admin/users/actions.ts`
  - `getUserList()` — danh sách (search, filter by role, filter by diaBan)
  - `createUser(data)` — tạo mới (hash password)
  - `updateUser(id, data)` — cập nhật thông tin (không đổi password)
  - `resetUserPassword(id)` — reset mật khẩu
  - `toggleUserActive(id)` — khóa/mở tài khoản
  - `changeUserRole(id, role)` — đổi role (ADMIN, AM, CV)

### 2. Zod Validation Schema

- [x] `name`: required, min 2 chars
- [x] `email`: required, unique, valid email
- [x] `password`: required, min 8 chars (chỉ khi tạo mới)
- [x] `role`: enum UserRole (ADMIN, AM, CV)
- [x] `diaBan`: optional string (Tổ 1, Tổ 2...)

### 3. DataTable Page — Tài khoản User

- [x] Tạo `src/app/(dashboard)/admin/users/page.tsx`
  - Columns: STT, Họ tên, Email, Role (badge: Quản trị, AM, Chuyên viên), Địa bàn, Trạng thái, Actions
  - Search: theo tên, email
  - Filter: theo Role, theo Địa bàn
  - Pagination + Sorting

### 4. Create User Dialog

- [x] Component `user-form-dialog.tsx`
  - Fields: Họ tên, Email, Mật khẩu, Role (Select: ADMIN, AM, CV), Địa bàn (Select/Input)
  - Password field chỉ hiển thị khi tạo mới
  - Role selection: AM (Account Manager), CV (Chuyên viên), ADMIN (Quản trị viên)

### 5. User Actions

- [ ] Edit: cập nhật name, email, diaBan, role
- [ ] Reset Password: confirm dialog → generate hoặc input mật khẩu mới
- [ ] Toggle Active: khóa/mở tài khoản (không xóa)
- [ ] Không cho phép Admin tự khóa chính mình

### 6. Toast Notifications

- [ ] CRUD success / error messages
- [ ] "Không thể khóa tài khoản đang đăng nhập"

---

## Tiêu chí hoàn thành

- [ ] Admin tạo/sửa/khóa tài khoản nhân viên
- [ ] Password được hash trước khi lưu
- [ ] Role assignment hoạt động đúng
- [ ] DataTable search + filter (role, địa bàn) + pagination
- [ ] Admin không thể tự khóa chính mình
- [ ] User bị khóa không thể đăng nhập
