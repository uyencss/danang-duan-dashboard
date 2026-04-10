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

- [x] Edit: cập nhật name, email, diaBan, role
- [x] Reset Password / Toggle Active: khóa/mở tài khoản thông qua Better-Auth Admin API (banned fields)
- [x] Không cho phép Admin tự khóa chính mình

### 6. Toast Notifications

- [x] CRUD success / error messages
- [x] "Không thể khóa tài khoản đang đăng nhập"

### 7. Import Dữ liệu

- [x] Tính năng Bulk Import (Nhập từ file CSV) cho tài khoản nhân viên

---

## Tiêu chí hoàn thành

- [x] Admin tạo/sửa/khóa tài khoản nhân viên
- [x] Password được hash trước khi lưu
- [x] Role assignment và role-based visibility hoạt động đúng
- [x] DataTable search + filter (role, địa bàn) + pagination
- [x] Admin không thể tự khóa chính mình
- [x] User bị khóa không thể đăng nhập
- [x] Import CSV hàng loạt hoạt động ổn định
