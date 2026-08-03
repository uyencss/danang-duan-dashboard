"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PhanLoaiKH, TrangThaiDuAn } from "@prisma/client";
import { requireRole } from "@/lib/auth-utils";
import { cacheInvalidate } from "@/lib/cache";

// ─── Types ────────────────────────────────────────────────────────
export interface CSKHRow {
  id: number;
  ten: string;
  phanLoai: PhanLoaiKH;
  // Contact info dates
  ngaySinhDauMoi: string | null;
  ngaySinhLanhDao: string | null;
  ngayKyNiem: string | null;
  dauMoiTiepCan: string | null;
  lanhDaoDonVi: string | null;
  // Full data for edit form
  diaChi: string | null;
  soDienThoai: string | null;
  email: string | null;
  soDienThoaiDauMoi: string | null;
  soDienThoaiLanhDao: string | null;
  ngayThanhLap: string | null;
  ghiChu: string | null;
  isActive: boolean;
  // Leader assignment
  lanhDaoTheoDoiId: string | null;
  lanhDaoTheoDoiName: string | null;
  // Derived from projects
  chuyenVienChuTri: string | null; // "Nguyễn Văn A - Tổ 1"
  chuyenVienChuTriId: string | null;
  // Aggregated counts
  duAnDangTheoDoi: number;
  duAnTrongDiem: number;
  duAnDaKy: number;
}

export interface LeaderOption {
  id: string;
  name: string;
  role: string;
  diaBan: string | null;
}

// ─── Main data fetch ──────────────────────────────────────────────
export async function getCSKHData(phanLoai?: string) {
  await requireRole("ADMIN", "USER", "AM", "CV", "LEADER");

  try {
    const whereClause: any = {};
    if (phanLoai && phanLoai !== "ALL") {
      whereClause.phanLoai = phanLoai as PhanLoaiKH;
    }

    const customers = await prisma.khachHang.findMany({
      where: whereClause,
      include: {
        lanhDaoTheoDoi: {
          select: { id: true, name: true },
        },
        duAns: {
          where: { isPendingDelete: false },
          select: {
            id: true,
            trangThaiHienTai: true,
            isTrongDiem: true,
            chuyenVienId: true,
            updatedAt: true,
            chuyenVien: {
              select: { id: true, name: true, diaBan: true },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const rows: CSKHRow[] = customers.map((kh) => {
      // Aggregated project counts
      const activeDuAns = kh.duAns.filter(
        (da) =>
          da.trangThaiHienTai !== TrangThaiDuAn.DA_KY_HOP_DONG &&
          da.trangThaiHienTai !== TrangThaiDuAn.THAT_BAI
      );

      const duAnDaKy = kh.duAns.filter(
        (da) => da.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG
      ).length;

      const duAnTrongDiem = kh.duAns.filter(
        (da) => da.isTrongDiem
      ).length;

      // Lead specialist — CV from most recent active project
      const leadProject = activeDuAns[0] || kh.duAns[0]; // fallback to any project
      const cv = leadProject?.chuyenVien;
      const chuyenVienChuTri = cv
        ? `${cv.name}${cv.diaBan ? ` - ${cv.diaBan}` : ""}`
        : null;

      return {
        id: kh.id,
        ten: kh.ten,
        phanLoai: kh.phanLoai,
        ngaySinhDauMoi: kh.ngaySinhDauMoi?.toISOString() ?? null,
        ngaySinhLanhDao: kh.ngaySinhLanhDao?.toISOString() ?? null,
        ngayKyNiem: kh.ngayKyNiem?.toISOString() ?? null,
        dauMoiTiepCan: kh.dauMoiTiepCan,
        lanhDaoDonVi: kh.lanhDaoDonVi,
        diaChi: kh.diaChi,
        soDienThoai: kh.soDienThoai,
        email: kh.email,
        soDienThoaiDauMoi: kh.soDienThoaiDauMoi,
        soDienThoaiLanhDao: kh.soDienThoaiLanhDao,
        ngayThanhLap: kh.ngayThanhLap?.toISOString() ?? null,
        ghiChu: kh.ghiChu,
        isActive: kh.isActive,
        lanhDaoTheoDoiId: kh.lanhDaoTheoDoiId,
        lanhDaoTheoDoiName: kh.lanhDaoTheoDoi?.name ?? null,
        chuyenVienChuTri,
        chuyenVienChuTriId: cv?.id ?? null,
        duAnDangTheoDoi: activeDuAns.length,
        duAnTrongDiem,
        duAnDaKy,
      };
    });

    return { data: rows };
  } catch (error) {
    console.error("[CSKH] Fetch error:", error);
    return { error: "Lỗi khi tải dữ liệu CSKH" };
  }
}

// ─── Leader options for dropdown ──────────────────────────────────
export async function getLeaderOptions(): Promise<{ data: LeaderOption[] }> {
  await requireRole("ADMIN", "USER", "AM", "CV", "LEADER");

  try {
    const users = await prisma.user.findMany({
      where: {
        role: "LEADER",
        isActive: true,
        banned: false,
      },
      select: {
        id: true,
        name: true,
        role: true,
        diaBan: true,
      },
      orderBy: { name: "asc" },
    });

    return { data: users };
  } catch (error) {
    console.error("[CSKH] Leader options error:", error);
    return { data: [] };
  }
}

// ─── Update leader assignment ─────────────────────────────────────
export async function updateLanhDaoTheoDoi(
  khachHangId: number,
  userId: string | null
) {
  await requireRole("ADMIN", "USER");

  try {
    await prisma.khachHang.update({
      where: { id: khachHangId },
      data: { lanhDaoTheoDoiId: userId },
    });

    await cacheInvalidate("options:khachhang");
    revalidatePath("/admin/khach-hang/cskh");
    revalidatePath("/admin/khach-hang");
    return { success: true };
  } catch (error) {
    console.error("[CSKH] Update leader error:", error);
    return { error: "Lỗi khi cập nhật lãnh đạo theo dõi" };
  }
}

// ─── Sync phanLoai from DuAn.linhVuc back to KhachHang ──────────
export async function syncPhanLoaiFromDuAn() {
  await requireRole("ADMIN");

  try {
    // Find all KH whose projects have a different linhVuc than KH's phanLoai
    const customers = await prisma.khachHang.findMany({
      select: {
        id: true,
        ten: true,
        phanLoai: true,
        duAns: {
          where: { isPendingDelete: false },
          select: { linhVuc: true },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    });

    let updated = 0;
    for (const kh of customers) {
      if (kh.duAns.length === 0) continue;
      const latestLinhVuc = kh.duAns[0].linhVuc;
      // PhanLoaiKH and LinhVuc share the same values
      if (latestLinhVuc && latestLinhVuc !== kh.phanLoai) {
        await prisma.khachHang.update({
          where: { id: kh.id },
          data: { phanLoai: latestLinhVuc as unknown as PhanLoaiKH },
        });
        updated++;
        console.log(`[Sync phanLoai] ${kh.ten}: ${kh.phanLoai} → ${latestLinhVuc}`);
      }
    }

    return { success: true, updated };
  } catch (error) {
    console.error("[Sync phanLoai] Error:", error);
    return { error: "Lỗi khi đồng bộ phân loại" };
  }
}
