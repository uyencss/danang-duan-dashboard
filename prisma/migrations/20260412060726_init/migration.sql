-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'AM', 'CV', 'USER');

-- CreateEnum
CREATE TYPE "LogStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PhanLoaiKH" AS ENUM ('CHINH_PHU', 'DOANH_NGHIEP', 'CONG_AN');

-- CreateEnum
CREATE TYPE "TrangThaiDuAn" AS ENUM ('MOI', 'DANG_LAM_VIEC', 'DA_DEMO', 'DA_GUI_BAO_GIA', 'DA_KY_HOP_DONG', 'THAT_BAI');

-- CreateEnum
CREATE TYPE "LinhVuc" AS ENUM ('CHINH_PHU', 'DOANH_NGHIEP', 'CONG_AN');

-- CreateEnum
CREATE TYPE "LoaiTinNhan" AS ENUM ('TEXT', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "hashedPassword" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "diaBan" TEXT DEFAULT 'Chưa phân công',
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KhachHang" (
    "id" SERIAL NOT NULL,
    "ten" TEXT NOT NULL,
    "phanLoai" "PhanLoaiKH" NOT NULL,
    "diaChi" TEXT,
    "soDienThoai" TEXT,
    "email" TEXT,
    "dauMoiTiepCan" TEXT,
    "soDienThoaiDauMoi" TEXT,
    "ngaySinhDauMoi" TIMESTAMP(3),
    "lanhDaoDonVi" TEXT,
    "soDienThoaiLanhDao" TEXT,
    "ngaySinhLanhDao" TIMESTAMP(3),
    "ngayThanhLap" TIMESTAMP(3),
    "ngayKyNiem" TIMESTAMP(3),
    "ghiChu" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KhachHang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SanPham" (
    "id" SERIAL NOT NULL,
    "nhom" TEXT NOT NULL,
    "tenChiTiet" TEXT NOT NULL,
    "moTa" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SanPham_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuAn" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "amId" TEXT,
    "amHoTroId" TEXT,
    "chuyenVienId" TEXT,
    "cvHoTro1Id" TEXT,
    "cvHoTro2Id" TEXT,
    "tenDuAn" TEXT NOT NULL,
    "linhVuc" "LinhVuc" NOT NULL DEFAULT 'CHINH_PHU',
    "tongDoanhThuDuKien" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "doanhThuTheoThang" DOUBLE PRECISION DEFAULT 0,
    "maHopDong" TEXT,
    "ngayBatDau" TIMESTAMP(3) NOT NULL,
    "ngayKetThuc" TIMESTAMP(3),
    "isTrongDiem" BOOLEAN NOT NULL DEFAULT false,
    "isKyVong" BOOLEAN NOT NULL DEFAULT false,
    "hienTaiBuoc" TEXT,
    "isPendingDelete" BOOLEAN NOT NULL DEFAULT false,
    "deleteRequestedAt" TIMESTAMP(3),
    "tuan" INTEGER NOT NULL,
    "thang" INTEGER NOT NULL,
    "quy" INTEGER NOT NULL,
    "nam" INTEGER NOT NULL,
    "ngayChamsocCuoiCung" TIMESTAMP(3),
    "trangThaiHienTai" "TrangThaiDuAn" NOT NULL DEFAULT 'MOI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DuAn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NhatKyCongViec" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "ngayGio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trangThaiMoi" "TrangThaiDuAn" NOT NULL,
    "noiDungChiTiet" TEXT NOT NULL,
    "buoc" TEXT,
    "status" "LogStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NhatKyCongViec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BinhLuan" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BinhLuan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TinNhan" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "LoaiTinNhan" NOT NULL DEFAULT 'TEXT',
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TinNhan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChiTieuKpi" (
    "id" SERIAL NOT NULL,
    "nam" INTEGER NOT NULL,
    "thang" INTEGER NOT NULL,
    "anNinhMang" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "giaiPhapCntt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "duAnCds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cnsAnNinh" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChiTieuKpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,
    "relatedId" TEXT,
    "projectId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileDinhKem" (
    "id" SERIAL NOT NULL,
    "logId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileDinhKem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleConfig" (
    "id" SERIAL NOT NULL,
    "role" "UserRole" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT 'purple',
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "icon" TEXT,
    "section" TEXT NOT NULL DEFAULT 'main',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuPermission" (
    "id" SERIAL NOT NULL,
    "menuKey" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuPermission_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "User_updatedAt_idx" ON "User"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- CreateIndex
CREATE INDEX "KhachHang_phanLoai_idx" ON "KhachHang"("phanLoai");

-- CreateIndex
CREATE INDEX "KhachHang_ten_idx" ON "KhachHang"("ten");

-- CreateIndex
CREATE INDEX "KhachHang_updatedAt_idx" ON "KhachHang"("updatedAt");

-- CreateIndex
CREATE INDEX "SanPham_nhom_idx" ON "SanPham"("nhom");

-- CreateIndex
CREATE INDEX "SanPham_nhom_tenChiTiet_idx" ON "SanPham"("nhom", "tenChiTiet");

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
CREATE INDEX "DuAn_updatedAt_idx" ON "DuAn"("updatedAt");

-- CreateIndex
CREATE INDEX "DuAn_tenDuAn_idx" ON "DuAn"("tenDuAn");

-- CreateIndex
CREATE INDEX "DuAn_isPendingDelete_idx" ON "DuAn"("isPendingDelete");

-- CreateIndex
CREATE INDEX "NhatKyCongViec_projectId_idx" ON "NhatKyCongViec"("projectId");

-- CreateIndex
CREATE INDEX "NhatKyCongViec_userId_idx" ON "NhatKyCongViec"("userId");

-- CreateIndex
CREATE INDEX "NhatKyCongViec_projectId_ngayGio_idx" ON "NhatKyCongViec"("projectId", "ngayGio");

-- CreateIndex
CREATE INDEX "BinhLuan_projectId_idx" ON "BinhLuan"("projectId");

-- CreateIndex
CREATE INDEX "BinhLuan_userId_idx" ON "BinhLuan"("userId");

-- CreateIndex
CREATE INDEX "BinhLuan_parentId_idx" ON "BinhLuan"("parentId");

-- CreateIndex
CREATE INDEX "BinhLuan_projectId_createdAt_idx" ON "BinhLuan"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "TinNhan_projectId_createdAt_idx" ON "TinNhan"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "TinNhan_userId_idx" ON "TinNhan"("userId");

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
CREATE UNIQUE INDEX "MenuItem_key_key" ON "MenuItem"("key");

-- CreateIndex
CREATE INDEX "MenuItem_section_sortOrder_idx" ON "MenuItem"("section", "sortOrder");

-- CreateIndex
CREATE INDEX "MenuPermission_role_idx" ON "MenuPermission"("role");

-- CreateIndex
CREATE UNIQUE INDEX "MenuPermission_menuKey_role_key" ON "MenuPermission"("menuKey", "role");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuAn" ADD CONSTRAINT "DuAn_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "KhachHang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuAn" ADD CONSTRAINT "DuAn_productId_fkey" FOREIGN KEY ("productId") REFERENCES "SanPham"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuAn" ADD CONSTRAINT "DuAn_amId_fkey" FOREIGN KEY ("amId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuAn" ADD CONSTRAINT "DuAn_amHoTroId_fkey" FOREIGN KEY ("amHoTroId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuAn" ADD CONSTRAINT "DuAn_chuyenVienId_fkey" FOREIGN KEY ("chuyenVienId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuAn" ADD CONSTRAINT "DuAn_cvHoTro1Id_fkey" FOREIGN KEY ("cvHoTro1Id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuAn" ADD CONSTRAINT "DuAn_cvHoTro2Id_fkey" FOREIGN KEY ("cvHoTro2Id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NhatKyCongViec" ADD CONSTRAINT "NhatKyCongViec_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DuAn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NhatKyCongViec" ADD CONSTRAINT "NhatKyCongViec_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinhLuan" ADD CONSTRAINT "BinhLuan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DuAn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinhLuan" ADD CONSTRAINT "BinhLuan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinhLuan" ADD CONSTRAINT "BinhLuan_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BinhLuan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TinNhan" ADD CONSTRAINT "TinNhan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DuAn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TinNhan" ADD CONSTRAINT "TinNhan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DuAn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileDinhKem" ADD CONSTRAINT "FileDinhKem_logId_fkey" FOREIGN KEY ("logId") REFERENCES "NhatKyCongViec"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuPermission" ADD CONSTRAINT "MenuPermission_menuKey_fkey" FOREIGN KEY ("menuKey") REFERENCES "MenuItem"("key") ON DELETE CASCADE ON UPDATE CASCADE;
