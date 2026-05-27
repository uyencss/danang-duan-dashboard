"use server";

/**
 * Phase 4: Revenue-based KPI Indicators powered by the RevenueDistribution table.
 * ────────────────────────────────────────────────────────────────────────────────
 * Instead of computing revenue by scanning the Project model with date logic,
 * these functions query pre-computed monthly revenue slices.
 *
 * CT3 & CT6: Sum of doanhThuPhanBo WHERE loaiDoanhThu = 'KY_MOI'
 *            (optionally filtered by product group via SanPham join)
 * CT7:       Sum of doanhThuPhanBo WHERE loaiDoanhThu = 'DUY_TRI'
 * CT8:       Total sum = CT3 + CT7 (or SUM of all doanhThuPhanBo)
 */

import prisma from "@/lib/prisma";
import { LoaiDoanhThu, TrangThaiDuAn } from "@prisma/client";

export interface CTMetrics {
  ct3_kyMoi: number;       // Revenue from new contracts in the period
  ct6_kyMoiByGroup: Record<string, number>; // CT3 broken down by product group
  ct7_duyTri: number;      // Revenue from recurring/maintenance in the period
  ct8_total: number;       // CT3 + CT7
  projectCount: number;    // Number of distinct projects in the distribution
  kyMoiCount: number;      // Number of KY_MOI slices
  duyTriCount: number;     // Number of DUY_TRI slices
}

/**
 * Queries the RevenueDistribution table for a specific month+year
 * and returns pre-computed CT metrics.
 * 
 * Only considers projects with status DA_KY_HOP_DONG (signed contracts).
 */
export async function getCTMetrics(
  thang: number,
  nam: number,
  options?: { nhomSP?: string }
): Promise<CTMetrics> {
  // Base filter: matching month/year with signed contracts only
  const baseWhere: any = {
    thangBaoCao: thang,
    namBaoCao: nam,
    duAn: {
      trangThaiHienTai: TrangThaiDuAn.DA_KY_HOP_DONG,
      isPendingDelete: false,
    },
  };

  // Optionally filter by product group
  if (options?.nhomSP) {
    baseWhere.duAn.sanPham = { nhom: options.nhomSP };
  }

  const distributions = await prisma.revenueDistribution.findMany({
    where: baseWhere,
    select: {
      doanhThuPhanBo: true,
      loaiDoanhThu: true,
      projectId: true,
      duAn: {
        select: {
          sanPham: { select: { nhom: true } },
        },
      },
    },
  });

  let ct3_kyMoi = 0;
  let ct7_duyTri = 0;
  const ct6_byGroup: Record<string, number> = {};
  const projectIds = new Set<number>();
  let kyMoiCount = 0;
  let duyTriCount = 0;

  for (const d of distributions) {
    projectIds.add(d.projectId);
    const nhom = d.duAn.sanPham?.nhom || "Khác";

    if (d.loaiDoanhThu === LoaiDoanhThu.KY_MOI) {
      ct3_kyMoi += d.doanhThuPhanBo;
      ct6_byGroup[nhom] = (ct6_byGroup[nhom] || 0) + d.doanhThuPhanBo;
      kyMoiCount++;
    } else {
      ct7_duyTri += d.doanhThuPhanBo;
      duyTriCount++;
    }
  }

  return {
    ct3_kyMoi: Math.round(ct3_kyMoi * 100) / 100,
    ct6_kyMoiByGroup: Object.fromEntries(
      Object.entries(ct6_byGroup).map(([k, v]) => [k, Math.round(v * 100) / 100])
    ),
    ct7_duyTri: Math.round(ct7_duyTri * 100) / 100,
    ct8_total: Math.round((ct3_kyMoi + ct7_duyTri) * 100) / 100,
    projectCount: projectIds.size,
    kyMoiCount,
    duyTriCount,
  };
}

/**
 * Returns CT metrics for a range of months (e.g., a full quarter or year).
 */
export async function getCTMetricsRange(
  nam: number,
  fromMonth: number,
  toMonth: number
): Promise<CTMetrics> {
  const months = Array.from(
    { length: toMonth - fromMonth + 1 },
    (_, i) => fromMonth + i
  );

  const distributions = await prisma.revenueDistribution.findMany({
    where: {
      namBaoCao: nam,
      thangBaoCao: { in: months },
      duAn: {
        trangThaiHienTai: TrangThaiDuAn.DA_KY_HOP_DONG,
        isPendingDelete: false,
      },
    },
    select: {
      doanhThuPhanBo: true,
      loaiDoanhThu: true,
      projectId: true,
      duAn: {
        select: {
          sanPham: { select: { nhom: true } },
        },
      },
    },
  });

  let ct3_kyMoi = 0;
  let ct7_duyTri = 0;
  const ct6_byGroup: Record<string, number> = {};
  const projectIds = new Set<number>();
  let kyMoiCount = 0;
  let duyTriCount = 0;

  for (const d of distributions) {
    projectIds.add(d.projectId);
    const nhom = d.duAn.sanPham?.nhom || "Khác";

    if (d.loaiDoanhThu === LoaiDoanhThu.KY_MOI) {
      ct3_kyMoi += d.doanhThuPhanBo;
      ct6_byGroup[nhom] = (ct6_byGroup[nhom] || 0) + d.doanhThuPhanBo;
      kyMoiCount++;
    } else {
      ct7_duyTri += d.doanhThuPhanBo;
      duyTriCount++;
    }
  }

  return {
    ct3_kyMoi: Math.round(ct3_kyMoi * 100) / 100,
    ct6_kyMoiByGroup: Object.fromEntries(
      Object.entries(ct6_byGroup).map(([k, v]) => [k, Math.round(v * 100) / 100])
    ),
    ct7_duyTri: Math.round(ct7_duyTri * 100) / 100,
    ct8_total: Math.round((ct3_kyMoi + ct7_duyTri) * 100) / 100,
    projectCount: projectIds.size,
    kyMoiCount,
    duyTriCount,
  };
}
