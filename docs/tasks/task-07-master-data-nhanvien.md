# Task 07 — Quản lý Nhân viên / Tài khoản (Master Data)
**Phase:** 2 (Layout & Master Data CRUD)  
**Priority:** P0  
**Status:** ✅ Done  
**PRD Ref:** FR-03, FR-04, Section 3 (Roles & Permissions)  
**DB Ref:** [database-design.md](../database-design.md) — Section 3.1 (User)

---

## Mục tiêu

Admin quản lý tài khoản nhân viên: tạo user mới, cập nhật thông tin, phân quyền role, quản lý địa bàn.

---

## Danh sách công việc

### 1. Server Actions

- [ ] Tạo `src/app/(dashboard)/admin/nhan-vien/actions.ts`
  - `getUserList()` — danh sách (search, filter by role, filter by diaBan)
  - `createUser(data)` — tạo mới (hash password)
  - `updateUser(id, data)` — cập nhật thông tin (không đổi password)
  - `resetUserPassword(id)` — reset mật khẩu
  - `toggleUserActive(id)` — khóa/mở tài khoản
  - `changeUserRole(id, role)` — đổi role (ADMIN ↔ USER)

### 2. Zod Validation Schema

- [ ] `name`: required, min 2 chars
- [ ] `email`: required, unique, valid email
- [ ] `password`: required, min 8 chars (chỉ khi tạo mới)
- [ ] `role`: enum UserRole
- [ ] `diaBan`: optional string (Tổ 1, Tổ 2...)

### 3. DataTable Page — Nhân viên

- [ ] Tạo `src/app/(dashboard)/admin/nhan-vien/page.tsx`
  - Columns: STT, Họ tên, Email, Role (badge), Địa bàn, Trạng thái, Actions
  - Search: theo tên, email
  - Filter: theo Role, theo Địa bàn
  - Pagination + Sorting

### 4. Create User Dialog

- [ ] Component `user-form-dialog.tsx`
  - Fields: Họ tên, Email, Mật khẩu, Role (Select), Địa bàn (Select/Input)
  - Password field chỉ hiển thị khi tạo mới

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
