/*
  Warnings:

  - You are about to drop the column `soHopDong` on the `DuAn` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "KhachHang" ADD COLUMN "dauMoiTiepCan" TEXT;
ALTER TABLE "KhachHang" ADD COLUMN "ghiChu" TEXT;
ALTER TABLE "KhachHang" ADD COLUMN "lanhDaoDonVi" TEXT;
ALTER TABLE "KhachHang" ADD COLUMN "ngayKyNiem" DATETIME;
ALTER TABLE "KhachHang" ADD COLUMN "ngaySinhDauMoi" DATETIME;
ALTER TABLE "KhachHang" ADD COLUMN "ngaySinhLanhDao" DATETIME;
ALTER TABLE "KhachHang" ADD COLUMN "ngayThanhLap" DATETIME;
ALTER TABLE "KhachHang" ADD COLUMN "soDienThoaiDauMoi" TEXT;
ALTER TABLE "KhachHang" ADD COLUMN "soDienThoaiLanhDao" TEXT;

-- CreateTable
CREATE TABLE "ChiTieuKpi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nam" INTEGER NOT NULL,
    "thang" INTEGER NOT NULL,
    "anNinhMang" REAL NOT NULL DEFAULT 0,
    "giaiPhapCntt" REAL NOT NULL DEFAULT 0,
    "duAnCds" REAL NOT NULL DEFAULT 0,
    "cnsAnNinh" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,
    "relatedId" TEXT,
    "projectId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DuAn" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FileDinhKem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "logId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FileDinhKem_logId_fkey" FOREIGN KEY ("logId") REFERENCES "NhatKyCongViec" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoleConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "role" TEXT NOT NULL,
    "description" TEXT,
    "isStatic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "icon" TEXT,
    "parentId" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MenuItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MenuPermission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "roleId" INTEGER NOT NULL,
    "menuId" INTEGER NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MenuPermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RoleConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MenuPermission_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "MenuItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BinhLuan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BinhLuan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DuAn" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BinhLuan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BinhLuan_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BinhLuan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BinhLuan" ("content", "createdAt", "id", "parentId", "projectId", "updatedAt", "userId") SELECT "content", "createdAt", "id", "parentId", "projectId", "updatedAt", "userId" FROM "BinhLuan";
DROP TABLE "BinhLuan";
ALTER TABLE "new_BinhLuan" RENAME TO "BinhLuan";
CREATE INDEX "BinhLuan_projectId_idx" ON "BinhLuan"("projectId");
CREATE INDEX "BinhLuan_userId_idx" ON "BinhLuan"("userId");
CREATE INDEX "BinhLuan_parentId_idx" ON "BinhLuan"("parentId");
CREATE INDEX "BinhLuan_projectId_createdAt_idx" ON "BinhLuan"("projectId", "createdAt");
CREATE TABLE "new_DuAn" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "amId" TEXT,
    "amHoTroId" TEXT,
    "chuyenVienId" TEXT,
    "cvHoTro1Id" TEXT,
    "cvHoTro2Id" TEXT,
    "tenDuAn" TEXT NOT NULL,
    "linhVuc" TEXT NOT NULL DEFAULT 'CHINH_PHU',
    "tongDoanhThuDuKien" REAL NOT NULL DEFAULT 0,
    "doanhThuTheoThang" REAL DEFAULT 0,
    "maHopDong" TEXT,
    "ngayBatDau" DATETIME NOT NULL,
    "ngayKetThuc" DATETIME,
    "isTrongDiem" BOOLEAN NOT NULL DEFAULT false,
    "isKyVong" BOOLEAN NOT NULL DEFAULT false,
    "hienTaiBuoc" TEXT,
    "isPendingDelete" BOOLEAN NOT NULL DEFAULT false,
    "deleteRequestedAt" DATETIME,
    "tuan" INTEGER NOT NULL,
    "thang" INTEGER NOT NULL,
    "quy" INTEGER NOT NULL,
    "nam" INTEGER NOT NULL,
    "ngayChamsocCuoiCung" DATETIME,
    "trangThaiHienTai" TEXT NOT NULL DEFAULT 'MOI',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DuAn_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "KhachHang" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DuAn_productId_fkey" FOREIGN KEY ("productId") REFERENCES "SanPham" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DuAn_amId_fkey" FOREIGN KEY ("amId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DuAn_amHoTroId_fkey" FOREIGN KEY ("amHoTroId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DuAn_chuyenVienId_fkey" FOREIGN KEY ("chuyenVienId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DuAn_cvHoTro1Id_fkey" FOREIGN KEY ("cvHoTro1Id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DuAn_cvHoTro2Id_fkey" FOREIGN KEY ("cvHoTro2Id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DuAn" ("amId", "chuyenVienId", "createdAt", "customerId", "id", "linhVuc", "maHopDong", "nam", "ngayBatDau", "ngayChamsocCuoiCung", "productId", "quy", "tenDuAn", "thang", "tongDoanhThuDuKien", "trangThaiHienTai", "tuan", "updatedAt") SELECT "amId", "chuyenVienId", "createdAt", "customerId", "id", "linhVuc", "maHopDong", "nam", "ngayBatDau", "ngayChamsocCuoiCung", "productId", "quy", "tenDuAn", "thang", "tongDoanhThuDuKien", "trangThaiHienTai", "tuan", "updatedAt" FROM "DuAn";
DROP TABLE "DuAn";
ALTER TABLE "new_DuAn" RENAME TO "DuAn";
CREATE INDEX "DuAn_customerId_idx" ON "DuAn"("customerId");
CREATE INDEX "DuAn_productId_idx" ON "DuAn"("productId");
CREATE INDEX "DuAn_amId_idx" ON "DuAn"("amId");
CREATE INDEX "DuAn_chuyenVienId_idx" ON "DuAn"("chuyenVienId");
CREATE INDEX "DuAn_trangThaiHienTai_idx" ON "DuAn"("trangThaiHienTai");
CREATE INDEX "DuAn_linhVuc_idx" ON "DuAn"("linhVuc");
CREATE INDEX "DuAn_nam_quy_thang_idx" ON "DuAn"("nam", "quy", "thang");
CREATE INDEX "DuAn_ngayChamsocCuoiCung_idx" ON "DuAn"("ngayChamsocCuoiCung");
CREATE INDEX "DuAn_updatedAt_idx" ON "DuAn"("updatedAt");
CREATE INDEX "DuAn_tenDuAn_idx" ON "DuAn"("tenDuAn");
CREATE INDEX "DuAn_isPendingDelete_idx" ON "DuAn"("isPendingDelete");
CREATE TABLE "new_NhatKyCongViec" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "ngayGio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trangThaiMoi" TEXT NOT NULL,
    "noiDungChiTiet" TEXT NOT NULL,
    "buoc" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NhatKyCongViec_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DuAn" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NhatKyCongViec_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_NhatKyCongViec" ("createdAt", "id", "ngayGio", "noiDungChiTiet", "projectId", "trangThaiMoi", "userId") SELECT "createdAt", "id", "ngayGio", "noiDungChiTiet", "projectId", "trangThaiMoi", "userId" FROM "NhatKyCongViec";
DROP TABLE "NhatKyCongViec";
ALTER TABLE "new_NhatKyCongViec" RENAME TO "NhatKyCongViec";
CREATE INDEX "NhatKyCongViec_projectId_idx" ON "NhatKyCongViec"("projectId");
CREATE INDEX "NhatKyCongViec_userId_idx" ON "NhatKyCongViec"("userId");
CREATE INDEX "NhatKyCongViec_projectId_ngayGio_idx" ON "NhatKyCongViec"("projectId", "ngayGio");
CREATE TABLE "new_TinNhan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TinNhan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DuAn" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TinNhan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TinNhan" ("content", "createdAt", "id", "isDeleted", "isEdited", "projectId", "type", "updatedAt", "userId") SELECT "content", "createdAt", "id", "isDeleted", "isEdited", "projectId", "type", "updatedAt", "userId" FROM "TinNhan";
DROP TABLE "TinNhan";
ALTER TABLE "new_TinNhan" RENAME TO "TinNhan";
CREATE INDEX "TinNhan_projectId_createdAt_idx" ON "TinNhan"("projectId", "createdAt");
CREATE INDEX "TinNhan_userId_idx" ON "TinNhan"("userId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "hashedPassword" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "diaBan" TEXT DEFAULT 'Chưa phân công',
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "banExpires" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatarUrl", "createdAt", "diaBan", "email", "emailVerified", "hashedPassword", "id", "image", "isActive", "lastLoginAt", "name", "role", "updatedAt") SELECT "avatarUrl", "createdAt", "diaBan", "email", "emailVerified", "hashedPassword", "id", "image", "isActive", "lastLoginAt", "name", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_diaBan_idx" ON "User"("diaBan");
CREATE INDEX "User_updatedAt_idx" ON "User"("updatedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ChiTieuKpi_nam_idx" ON "ChiTieuKpi"("nam");

-- CreateIndex
CREATE UNIQUE INDEX "ChiTieuKpi_nam_thang_key" ON "ChiTieuKpi"("nam", "thang");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_projectId_idx" ON "Notification"("projectId");

-- CreateIndex
CREATE INDEX "FileDinhKem_logId_idx" ON "FileDinhKem"("logId");

-- CreateIndex
CREATE UNIQUE INDEX "RoleConfig_role_key" ON "RoleConfig"("role");

-- CreateIndex
CREATE INDEX "RoleConfig_role_idx" ON "RoleConfig"("role");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItem_name_key" ON "MenuItem"("name");

-- CreateIndex
CREATE INDEX "MenuItem_parentId_idx" ON "MenuItem"("parentId");

-- CreateIndex
CREATE INDEX "MenuItem_order_idx" ON "MenuItem"("order");

-- CreateIndex
CREATE INDEX "MenuPermission_roleId_idx" ON "MenuPermission"("roleId");

-- CreateIndex
CREATE INDEX "MenuPermission_menuId_idx" ON "MenuPermission"("menuId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuPermission_roleId_menuId_key" ON "MenuPermission"("roleId", "menuId");

-- CreateIndex
CREATE INDEX "KhachHang_updatedAt_idx" ON "KhachHang"("updatedAt");

-- CreateIndex
CREATE INDEX "SanPham_nhom_tenChiTiet_idx" ON "SanPham"("nhom", "tenChiTiet");
