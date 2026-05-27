"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { rebuildAllRevenueDistributions } from "@/lib/utils/revenue-sync";

export async function getRevenueDistributionData(year: number) {
  await requireRole("ADMIN", "USER");

  const distributions = await prisma.revenueDistribution.findMany({
    where: { namBaoCao: year },
    include: {
      duAn: {
        select: {
          id: true,
          tenDuAn: true,
          tongDoanhThuDuKien: true,
          ngayBatDau: true,
          ngayKetThuc: true,
          trangThaiHienTai: true,
          maHopDong: true,
          khachHang: { select: { ten: true } },
          sanPham: { select: { nhom: true, tenChiTiet: true } },
          am: { select: { name: true } },
          chuyenVien: { select: { name: true } },
        },
      },
    },
    orderBy: [{ projectId: "asc" }, { thangBaoCao: "asc" }],
  });

  // Group by projectId
  const projectMap = new Map<number, {
    id: number;
    tenDuAn: string;
    tongDoanhThuDuKien: number;
    ngayBatDau: Date;
    ngayKetThuc: Date | null;
    trangThai: string;
    maHopDong: string | null;
    khachHang: string;
    sanPham: string;
    nhomSP: string;
    am: string;
    cv: string;
    months: Record<number, { doanhThu: number; soNgay: number; loai: string }>;
  }>();

  for (const d of distributions) {
    if (!projectMap.has(d.projectId)) {
      projectMap.set(d.projectId, {
        id: d.duAn.id,
        tenDuAn: d.duAn.tenDuAn,
        tongDoanhThuDuKien: d.duAn.tongDoanhThuDuKien,
        ngayBatDau: d.duAn.ngayBatDau,
        ngayKetThuc: d.duAn.ngayKetThuc,
        trangThai: d.duAn.trangThaiHienTai,
        maHopDong: d.duAn.maHopDong,
        khachHang: d.duAn.khachHang?.ten || "—",
        sanPham: d.duAn.sanPham?.tenChiTiet || "—",
        nhomSP: d.duAn.sanPham?.nhom || "—",
        am: d.duAn.am?.name || "—",
        cv: d.duAn.chuyenVien?.name || "—",
        months: {},
      });
    }

    const entry = projectMap.get(d.projectId)!;
    entry.months[d.thangBaoCao] = {
      doanhThu: d.doanhThuPhanBo,
      soNgay: d.soNgayActive,
      loai: d.loaiDoanhThu,
    };
  }

  // Calculate column totals
  const monthTotals: Record<number, number> = {};
  const monthKyMoi: Record<number, number> = {};
  const monthDuyTri: Record<number, number> = {};

  for (let m = 1; m <= 12; m++) {
    monthTotals[m] = 0;
    monthKyMoi[m] = 0;
    monthDuyTri[m] = 0;
  }

  for (const project of projectMap.values()) {
    for (const [month, data] of Object.entries(project.months)) {
      const m = parseInt(month);
      monthTotals[m] += data.doanhThu;
      if (data.loai === "KY_MOI") monthKyMoi[m] += data.doanhThu;
      else monthDuyTri[m] += data.doanhThu;
    }
  }

  return {
    projects: Array.from(projectMap.values()),
    monthTotals,
    monthKyMoi,
    monthDuyTri,
  };
}

export async function triggerRebuildAll() {
  await requireRole("ADMIN");
  const result = await rebuildAllRevenueDistributions();
  return result;
}
