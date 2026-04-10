# Task 32 — Dynamic Menu Management & Global Modals
**Phase:** 8 (RBAC & Menu Configuration)  
**Priority:** P1  
**Status:** ✅ Done  
**PRD Ref:** Section 3 (User Roles & Permissions)  
**Tech Ref:** [tech-stack.md](../tech-stack.md)  

---

## Bối cảnh & Vấn đề hiện tại

Trong Task 29, hệ thống đã chuyển RBAC sang Database. Tuy nhiên, việc quản lý thứ tự hiển thị menu (`sortOrder`) và trạng thái hiển thị (`isActive`) vẫn chưa có giao diện tương tác tốt (chỉ phụ thuộc vào Permission Matrix bảng lớn). Bên cạnh đó, việc sử dụng các thông báo `alert()` gốc của trình duyệt làm giảm trải nghiệm người dùng, và các thao tác modal cần có Context chuẩn xuyên suốt hệ thống.

**Mục tiêu:** 
1. Xây dựng giao diện `MenuManager` hỗ trợ sắp xếp thứ tự và ẩn/hiện menu.
2. Tích hợp `isActive` và `sortOrder` vào ma trận quyền.
3. Thay thế các lệnh gọi thông báo gốc bằng `useAlert` context toàn cầu.
4. Triển khai `useModal` cho việc mở modal đồng nhất.

---

## Tóm tắt những thay đổi đã hoàn thành (Latest Code Update)

### 1. Global Context Providers cho UI
- **`AlertProvider` và `useAlert`:** Thay thế `window.alert` và `window.confirm`. Hỗ trợ Promise để chờ người dùng xác nhận. Tích hợp vào root `layout.tsx`.
- **`ModalProvider` và `useModal`:** Trình quản lý linh hoạt để mount mọi component vào Modal Overlay. Tích hợp vào root `layout.tsx`.

### 2. Giao diện Menu Manager (`admin/roles/menu-manager.tsx`)
- Hiển thị danh sách tất cả các Menu/Mô-đun trong hệ thống (chia theo section: main, admin).
- Cho phép quản trị viên điều chỉnh `sortOrder` (thứ tự hiển thị trên Sidebar).
- Cho phép toggle `isActive` vô hiệu hóa module tạm thời.

### 3. Tích hợp vào Permission Matrix
- Cột "Thứ tự" hiển thị `menu.sortOrder` hiện tại với diện mạo badge.
- Các menu có `isActive === false` tự động bị làm mờ (opacity-50 grayscale) để hiển thị rõ module này đang tạm dừng hoạt động.

### 4. Nâng cấp xử lý lỗi trong Server Actions
- Thay thế các đoạn catch `alert()` bằng `useAlert` để cung cấp feedback đồng nhất và UI tốt hơn khi thao tác quyền và vai trò thất bại/thành công.

---

## File tác động

1. `src/components/ui/use-alert.tsx`
2. `src/components/ui/use-modal.tsx`
3. `src/app/layout.tsx` (Wrapped with Providers)
4. `src/app/(dashboard)/admin/roles/menu-manager.tsx`
5. `src/app/(dashboard)/admin/roles/permission-matrix.tsx`
6. `src/app/(dashboard)/admin/roles/actions.ts`

## Tiêu chí hoàn thành
- [x] Lắp Providers thành công mà không gây lỗi Hydration
- [x] Chỉnh sửa được `sortOrder` của menu thông qua hệ thống DB.
- [x] Ẩn hiện menu bằng cờ `isActive`.
- [x] Permission Matrix cập nhật layout giao diện thể hiện chính xác trạng thái từ Database.
- [x] Xử lý lỗi mượt mà sử dụng hooks UI thay vì browser APIs gốc.
