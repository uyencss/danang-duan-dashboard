# Task 02 — Database Schema & Seed Data
**Phase:** 1 (Initialization & DB Schema)  
**Priority:** P0  
**Status:** ✅ Done  
**PRD Ref:** Section 6 (all FR), Section 8 (Data Flows)  
**Tech Ref:** [database-design.md](../database-design.md) — toàn bộ

---

## Mục tiêu

Viết `schema.prisma` đầy đủ theo database-design.md, chạy migration, và seed dữ liệu mẫu để phục vụ phát triển.

---

## Danh sách công việc

### 1. Prisma Schema — Enums

- [ ] Định nghĩa `enum UserRole` (ADMIN, USER)
- [ ] Định nghĩa `enum PhanLoaiKH` (CHINH_PHU, DOANH_NGHIEP, CONG_AN)
- [ ] Định nghĩa `enum TrangThaiDuAn` (MOI, DANG_LAM_VIEC, DA_DEMO, DA_GUI_BAO_GIA, DA_KY_HOP_DONG, THAT_BAI)
- [ ] Định nghĩa `enum LinhVuc` (B2B_B2G, B2A)

### 2. Prisma Schema — Models

- [ ] Model `User` — theo database-design.md Section 3.1
  - id (cuid), name, email (unique), hashedPassword, role, diaBan, avatarUrl, isActive
  - Relations: duAnAM[], duAnCV[], nhatKy[], binhLuan[], sessions[]
  - Indexes: email, role, diaBan
- [ ] Model `Session` — theo Section 3.2 (Better Auth)
  - id, userId (FK→User), token (unique), expiresAt
- [ ] Model `KhachHang` — theo Section 3.3
  - id (autoincrement), ten, phanLoai, diaChi, soDienThoai, email, isActive
  - Indexes: phanLoai, ten
- [ ] Model `SanPham` — theo Section 3.4
  - id (autoincrement), nhom, tenChiTiet, moTa, isActive
  - Indexes: nhom
- [ ] Model `DuAn` — theo Section 3.5
  - id (autoincrement), customerId (FK), productId (FK), amId (FK), chuyenVienId (FK)
  - tenDuAn, linhVuc, tongDoanhThuDuKien, soHopDong, maHopDong
  - ngayBatDau, tuan, thang, quy, nam (auto-calc)
  - ngayChamsocCuoiCung, trangThaiHienTai
  - Indexes: composite (nam,quy,thang), ngayChamsocCuoiCung, trangThaiHienTai, linhVuc
- [ ] Model `NhatKyCongViec` — theo Section 3.6
  - id (autoincrement), projectId (FK→DuAn, CASCADE), userId (FK→User)
  - ngayGio, trangThaiMoi, noiDungChiTiet
- [ ] Model `BinhLuan` — theo Section 3.7
  - id (autoincrement), projectId (FK→DuAn, CASCADE), userId (FK→User)
  - content, parentId (FK→BinhLuan, self-referencing)

### 3. Migration

- [ ] Chạy `npx prisma migrate dev --name init`
- [ ] Verify file `prisma/dev.db` được tạo
- [ ] Chạy `npx prisma studio` — confirm tables hiển thị đúng

### 4. Prisma Client

- [ ] Tạo `src/lib/prisma.ts` — singleton PrismaClient pattern
- [ ] Verify import và query test thành công

### 5. Utility Functions

- [ ] Tạo `src/lib/utils/time-extract.ts` — hàm `extractTimeFields(date)` theo database-design.md Section 4.1
- [ ] Tạo `src/lib/utils/smart-alert.ts` — hàm `isNeedsCare(lastCare)` theo Section 4.3

### 6. Seed Data

- [ ] Tạo `prisma/seed.ts` theo database-design.md Section 6:
  - 1 Admin + 3 Users (AM/CV) — different diaBan
  - 6 KhachHang (mix Chính phủ, DN, Công an)
  - 6 SanPham (Cloud, IOC, Camera AI, mInvoice...)
  - 3 DuAn mẫu — varied statuses
  - 5 NhatKyCongViec entries — timeline
  - 3 BinhLuan entries — reply thread
- [ ] Cấu hình seed script trong `package.json`
- [ ] Chạy `npx prisma db seed` thành công

---

## Tiêu chí hoàn thành

- [ ] `npx prisma migrate dev` không lỗi
- [ ] Prisma Studio hiển thị đúng 7 tables + 4 enums
- [ ] Seed data chạy thành công, dữ liệu mẫu hiển thị trong Studio
- [ ] Utility functions (extractTimeFields, isNeedsCare) có unit logic đúng
- [ ] Relations (FK) hoạt động đúng — query nested reads thành công
