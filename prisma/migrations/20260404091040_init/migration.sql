-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "diaBan" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KhachHang" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ten" TEXT NOT NULL,
    "phanLoai" TEXT NOT NULL,
    "diaChi" TEXT,
    "soDienThoai" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SanPham" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nhom" TEXT NOT NULL,
    "tenChiTiet" TEXT NOT NULL,
    "moTa" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DuAn" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "amId" TEXT NOT NULL,
    "chuyenVienId" TEXT,
    "tenDuAn" TEXT NOT NULL,
    "linhVuc" TEXT NOT NULL DEFAULT 'B2B_B2G',
    "tongDoanhThuDuKien" REAL NOT NULL DEFAULT 0,
    "soHopDong" TEXT,
    "maHopDong" TEXT,
    "ngayBatDau" DATETIME NOT NULL,
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
    CONSTRAINT "DuAn_amId_fkey" FOREIGN KEY ("amId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DuAn_chuyenVienId_fkey" FOREIGN KEY ("chuyenVienId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NhatKyCongViec" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "ngayGio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trangThaiMoi" TEXT NOT NULL,
    "noiDungChiTiet" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NhatKyCongViec_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DuAn" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NhatKyCongViec_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BinhLuan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BinhLuan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DuAn" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BinhLuan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BinhLuan_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BinhLuan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_diaBan_idx" ON "User"("diaBan");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "KhachHang_phanLoai_idx" ON "KhachHang"("phanLoai");

-- CreateIndex
CREATE INDEX "KhachHang_ten_idx" ON "KhachHang"("ten");

-- CreateIndex
CREATE INDEX "SanPham_nhom_idx" ON "SanPham"("nhom");

-- CreateIndex
CREATE INDEX "DuAn_customerId_idx" ON "DuAn"("customerId");

-- CreateIndex
CREATE INDEX "DuAn_productId_idx" ON "DuAn"("productId");

-- CreateIndex
CREATE INDEX "DuAn_amId_idx" ON "DuAn"("amId");

-- CreateIndex
CREATE INDEX "DuAn_chuyenVienId_idx" ON "DuAn"("chuyenVienId");

-- CreateIndex
CREATE INDEX "DuAn_trangThaiHienTai_idx" ON "DuAn"("trangThaiHienTai");

-- CreateIndex
CREATE INDEX "DuAn_linhVuc_idx" ON "DuAn"("linhVuc");

-- CreateIndex
CREATE INDEX "DuAn_nam_quy_thang_idx" ON "DuAn"("nam", "quy", "thang");

-- CreateIndex
CREATE INDEX "DuAn_ngayChamsocCuoiCung_idx" ON "DuAn"("ngayChamsocCuoiCung");

-- CreateIndex
CREATE INDEX "NhatKyCongViec_projectId_idx" ON "NhatKyCongViec"("projectId");

-- CreateIndex
CREATE INDEX "NhatKyCongViec_userId_idx" ON "NhatKyCongViec"("userId");

-- CreateIndex
CREATE INDEX "BinhLuan_projectId_idx" ON "BinhLuan"("projectId");

-- CreateIndex
CREATE INDEX "BinhLuan_userId_idx" ON "BinhLuan"("userId");

-- CreateIndex
CREATE INDEX "BinhLuan_parentId_idx" ON "BinhLuan"("parentId");
