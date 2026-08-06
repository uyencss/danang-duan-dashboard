"use server";

/**
 * Master Revenue Sync Engine (Bảng 4)
 * ────────────────────────────────────────────────────────────────────
 * Aggregates monthly revenue from all 3 source types into the
 * MasterRevenue table for fast dashboard queries.
 *
 * Source priority for deduplication via maHopDong:
 *   1. ECONTRACT_INVOICE (actual invoiced — most reliable)
 *   2. CLOUD_DISTRIBUTE  (fixed allocation)
 *   3. PIPELINE           (projected/estimated)
 *
 * All dates normalized to UTC 00:00:00.
 */

import prisma from "@/lib/prisma";
import {
  generateCloudDistributeMonthlyView,
  generateEContractMonthlyView,
  type MonthlyRevenueView,
} from "@/lib/utils/source-revenue-engine";
import { generateRevenueSchedule, type ContractInput } from "@/lib/utils/revenue-engine";

// ── Source priority for deduplication ─────────────────────────────
const SOURCE_PRIORITY: Record<string, number> = {
  ECONTRACT_INVOICE: 1,  // Highest — already invoiced
  CLOUD_DISTRIBUTE: 2,
  PIPELINE: 3,           // Lowest — estimated
};

/**
 * Syncs MasterRevenue rows for a SINGLE project.
 * Called after create/update/import operations.
 */
export async function syncMasterRevenue(projectId: number) {
  try {
    const project = await prisma.duAn.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        sourceType: true,
        maHopDong: true,
        tongDoanhThuDuKien: true,
        doanhThuTheoThang: true,
        ngayBatDau: true,
        ngayKetThuc: true,
        soKy1GoiCuoc: true,
        amId: true,
        chuyenVienId: true,
        trangThaiHienTai: true,
        invoiceRecords: {
          select: {
            thangGhiNhan: true,
            namGhiNhan: true,
            doanhThuTheoThang: true,
          },
        },
        revenueSlices: {
          select: {
            thangBaoCao: true,
            namBaoCao: true,
            doanhThuPhanBo: true,
            loaiDoanhThu: true,
            isManualEdit: true,
          },
        },
      },
    });

    if (!project) return;

    // Generate monthly revenue rows based on source type
    const rows = generateMasterRows(project);

    // Atomic: delete old + insert new
    await prisma.$transaction(
      async (tx) => {
        await tx.masterRevenue.deleteMany({ where: { projectId } });
        if (rows.length > 0) {
          await tx.masterRevenue.createMany({
            data: rows.map((r) => ({
              projectId,
              maHopDong: project.maHopDong || null,
              sourceType: project.sourceType,
              nam: r.nam,
              thang: r.thang,
              doanhThu: r.doanhThu,
              loaiDoanhThu: r.loaiDoanhThu,
              amId: project.amId,
              chuyenVienId: project.chuyenVienId,
            })),
          });
        }
      },
      { timeout: 300000 }
    );
  } catch (error) {
    console.error(
      `[MasterRevenue] Failed to sync for project ${projectId}:`,
      error
    );
  }
}

/**
 * Syncs MasterRevenue rows for MULTIPLE projects in bulk.
 */
export async function syncMasterRevenueMany(projectIds: number[]) {
  if (projectIds.length === 0) return;
  try {
    const projects = await prisma.duAn.findMany({
      where: { id: { in: projectIds } },
      select: {
        id: true,
        sourceType: true,
        maHopDong: true,
        tongDoanhThuDuKien: true,
        doanhThuTheoThang: true,
        ngayBatDau: true,
        ngayKetThuc: true,
        soKy1GoiCuoc: true,
        amId: true,
        chuyenVienId: true,
        trangThaiHienTai: true,
        invoiceRecords: {
          select: {
            thangGhiNhan: true,
            namGhiNhan: true,
            doanhThuTheoThang: true,
          },
        },
        revenueSlices: {
          select: {
            thangBaoCao: true,
            namBaoCao: true,
            doanhThuPhanBo: true,
            loaiDoanhThu: true,
            isManualEdit: true,
          },
        },
      },
    });

    const masterRowsToInsert: any[] = [];

    for (const project of projects) {
      const rows = generateMasterRows(project);
      for (const r of rows) {
        masterRowsToInsert.push({
          projectId: project.id,
          maHopDong: project.maHopDong || null,
          sourceType: project.sourceType,
          nam: r.nam,
          thang: r.thang,
          doanhThu: r.doanhThu,
          loaiDoanhThu: r.loaiDoanhThu,
          amId: project.amId,
          chuyenVienId: project.chuyenVienId,
        });
      }
    }

    // Atomic delete and bulk insert inside an interactive transaction to ensure timeout works
    await prisma.$transaction(
      async (tx) => {
        // Chunk the operations if projectIds is very large (e.g., > 1000)
        const CHUNK_SIZE = 500;
        for (let i = 0; i < projectIds.length; i += CHUNK_SIZE) {
          const chunkProjectIds = projectIds.slice(i, i + CHUNK_SIZE);
          
          await tx.masterRevenue.deleteMany({
            where: { projectId: { in: chunkProjectIds } },
          });

          // Filter masterRowsToInsert that belong to this chunk's projects
          const chunkRows = masterRowsToInsert.filter((r) => chunkProjectIds.includes(r.projectId));
          
          if (chunkRows.length > 0) {
            await tx.masterRevenue.createMany({
              data: chunkRows,
            });
          }
        }
      },
      { timeout: 300000 } // 5 minutes timeout
    );
  } catch (error) {
    console.error(
      `[MasterRevenue] Failed to bulk sync for ${projectIds.length} projects:`,
      error
    );
  }
}

/**
 * Generates MasterRevenue row data from a project based on its sourceType.
 */
function generateMasterRows(
  project: {
    id: number;
    sourceType: string;
    tongDoanhThuDuKien: number;
    doanhThuTheoThang: number | null;
    ngayBatDau: Date | string;
    ngayKetThuc: Date | string | null;
    soKy1GoiCuoc: number | null;
    trangThaiHienTai: string;
    invoiceRecords: Array<{
      thangGhiNhan: number;
      namGhiNhan: number;
      doanhThuTheoThang: number;
    }>;
    revenueSlices: Array<{
      thangBaoCao: number;
      namBaoCao: number;
      doanhThuPhanBo: number;
      loaiDoanhThu: string;
      isManualEdit: boolean;
    }>;
  }
): Array<{ nam: number; thang: number; doanhThu: number; loaiDoanhThu: "KY_MOI" | "DUY_TRI" }> {
  const rows: Array<{ nam: number; thang: number; doanhThu: number; loaiDoanhThu: "KY_MOI" | "DUY_TRI" }> = [];

  switch (project.sourceType) {
    case "PIPELINE": {
      // Pipeline: Use RevenueDistribution (amortization engine) if signed,
      // otherwise use manual overrides or zero
      if (project.revenueSlices.length > 0) {
        for (const slice of project.revenueSlices) {
          rows.push({
            nam: slice.namBaoCao,
            thang: slice.thangBaoCao,
            doanhThu: slice.doanhThuPhanBo,
            loaiDoanhThu: slice.loaiDoanhThu as "KY_MOI" | "DUY_TRI",
          });
        }
      }
      // If no slices exist (not signed yet), we still record it as a pipeline
      // project with zero monthly revenue — the total is in DuAn.tongDoanhThuDuKien
      break;
    }

    case "CLOUD_DISTRIBUTE": {
      // Cloud-Distribute: Fixed N months from ngayBatDau
      const dtTheoThang = project.doanhThuTheoThang || 0;
      const soKy = project.soKy1GoiCuoc || 0;
      const tongDoanhThu = project.tongDoanhThuDuKien || 0;
      if (dtTheoThang > 0 && soKy > 0) {
        const start = new Date(project.ngayBatDau);
        const startMonth = start.getUTCMonth(); // 0-indexed
        const startYear = start.getUTCFullYear();

        // Determine start month of contract for KY_MOI classification
        const contractStartMonth = startMonth + 1; // 1-indexed
        const contractStartYear = startYear;

        for (let i = 0; i < soKy; i++) {
          const totalMonths = startMonth + i;
          const targetMonth = (totalMonths % 12) + 1; // 1-indexed
          const targetYear = startYear + Math.floor(totalMonths / 12);

          const isStartMonth =
            targetMonth === contractStartMonth &&
            targetYear === contractStartYear;

          let doanhThuKy = dtTheoThang;
          if (i === soKy - 1 && tongDoanhThu > 0) {
            doanhThuKy = tongDoanhThu - (dtTheoThang * (soKy - 1));
          }

          rows.push({
            nam: targetYear,
            thang: targetMonth,
            doanhThu: doanhThuKy,
            loaiDoanhThu: isStartMonth ? "KY_MOI" : "DUY_TRI",
          });
        }
      }
      break;
    }

    case "ECONTRACT_INVOICE": {
      // EContract-Invoice: Historical placement by thangGhiNhan
      const start = new Date(project.ngayBatDau);
      const contractStartMonth = start.getUTCMonth() + 1;
      const contractStartYear = start.getUTCFullYear();

      for (const record of project.invoiceRecords) {
        if (record.thangGhiNhan >= 1 && record.thangGhiNhan <= 12) {
          const isStartMonth =
            record.thangGhiNhan === contractStartMonth &&
            record.namGhiNhan === contractStartYear;

          rows.push({
            nam: record.namGhiNhan,
            thang: record.thangGhiNhan,
            doanhThu: record.doanhThuTheoThang,
            loaiDoanhThu: isStartMonth ? "KY_MOI" : "DUY_TRI",
          });
        }
      }
      break;
    }
  }

  // Apply manual overrides from RevenueDistribution
  for (const override of project.revenueSlices) {
    if (override.isManualEdit) {
      const existingIdx = rows.findIndex(
        (r) => r.nam === override.namBaoCao && r.thang === override.thangBaoCao
      );
      if (existingIdx >= 0) {
        rows[existingIdx].doanhThu = override.doanhThuPhanBo;
      } else {
        rows.push({
          nam: override.namBaoCao,
          thang: override.thangBaoCao,
          doanhThu: override.doanhThuPhanBo,
          loaiDoanhThu: override.loaiDoanhThu as "KY_MOI" | "DUY_TRI",
        });
      }
    }
  }

  return rows;
}

/**
 * Rebuilds ALL MasterRevenue data from scratch.
 * Used for initial migration or admin bulk-refresh.
 */
export async function rebuildAllMasterRevenue(): Promise<{
  projectCount: number;
  sliceCount: number;
}> {
  console.log("[MasterRevenue] Starting full rebuild...");

  const projects = await prisma.duAn.findMany({
    where: { isPendingDelete: false },
    select: {
      id: true,
      sourceType: true,
      maHopDong: true,
      tongDoanhThuDuKien: true,
      doanhThuTheoThang: true,
      ngayBatDau: true,
      ngayKetThuc: true,
      soKy1GoiCuoc: true,
      amId: true,
      chuyenVienId: true,
      trangThaiHienTai: true,
      invoiceRecords: {
        select: {
          thangGhiNhan: true,
          namGhiNhan: true,
          doanhThuTheoThang: true,
        },
      },
      revenueSlices: {
        select: {
          thangBaoCao: true,
          namBaoCao: true,
          doanhThuPhanBo: true,
          loaiDoanhThu: true,
          isManualEdit: true,
        },
      },
    },
  });

  console.log(`[MasterRevenue] Processing ${projects.length} projects...`);

  // Clear all existing MasterRevenue
  await prisma.masterRevenue.deleteMany({});

  let totalSlices = 0;
  const batchSize = 50;

  for (let i = 0; i < projects.length; i += batchSize) {
    const batch = projects.slice(i, i + batchSize);
    const allRows = batch.flatMap((p) => {
      const rows = generateMasterRows(p);
      return rows.map((r) => ({
        projectId: p.id,
        maHopDong: p.maHopDong || null,
        sourceType: p.sourceType,
        nam: r.nam,
        thang: r.thang,
        doanhThu: r.doanhThu,
        loaiDoanhThu: r.loaiDoanhThu,
        amId: p.amId,
        chuyenVienId: p.chuyenVienId,
      }));
    });

    if (allRows.length > 0) {
      await prisma.masterRevenue.createMany({ data: allRows });
      totalSlices += allRows.length;
    }
  }

  console.log(
    `[MasterRevenue] Done. Created ${totalSlices} rows for ${projects.length} projects.`
  );
  return { projectCount: projects.length, sliceCount: totalSlices };
}

/**
 * Gets deduplicated master revenue for dashboard queries.
 * When multiple projects share the same maHopDong, only the highest-priority
 * source is included (ECONTRACT > CLOUD > PIPELINE).
 */
export async function getDeduplicatedMasterRevenue(
  nam: number,
  thang?: number
): Promise<
  Array<{
    projectId: number;
    maHopDong: string | null;
    sourceType: string;
    nam: number;
    thang: number;
    doanhThu: number;
    loaiDoanhThu: string;
    amId: string | null;
    chuyenVienId: string | null;
    duAn: {
      trangThaiHienTai: import("@prisma/client").TrangThaiDuAn;
      isKyVong: boolean;
    };
  }>
> {
  const where: any = {
    nam,
    duAn: { isPendingDelete: false },
  };
  if (thang) where.thang = thang;

  const allRows = await prisma.masterRevenue.findMany({
    where,
    select: {
      projectId: true,
      maHopDong: true,
      sourceType: true,
      nam: true,
      thang: true,
      doanhThu: true,
      loaiDoanhThu: true,
      amId: true,
      chuyenVienId: true,
      duAn: {
        select: {
          trangThaiHienTai: true,
          isKyVong: true,
          tongDoanhThuDuKien: true,
          ngayBatDau: true,
          sanPham: { select: { tenChiTiet: true } },
        }
      }
    },
  });

  // 1. Consolidate (sum) rows from the SAME source type for the same contract/project-month
  const consolidated = new Map<string, typeof allRows[0]>();
  for (const row of allRows) {
    if (!row.duAn) continue;
    const spName = row.duAn?.sanPham?.tenChiTiet?.trim().toLowerCase() || "";
    const startDate = row.duAn?.ngayBatDau ? new Date(row.duAn.ngayBatDau).getTime() : "";
    const contractKey = row.maHopDong
      ? `src:${row.sourceType}:hd:${row.maHopDong}:dt:${row.duAn?.tongDoanhThuDuKien}:sp:${spName}:bd:${startDate}`
      : `pid:${row.projectId}`;
    const key = `${row.sourceType}:${contractKey}:${row.thang}`;
    const existing = consolidated.get(key);
    if (!existing) {
      consolidated.set(key, { ...row });
    } else {
      existing.doanhThu += row.doanhThu;
    }
  }

  // 2. Cross-source deduplication: keep only the highest priority source for each contract/project-month
  // NOTE: CLOUD_DISTRIBUTE and ECONTRACT_INVOICE are INDEPENDENT revenue —
  // same maHopDong from different sources must both be kept and summed.
  // The key includes sourceType intentionally to preserve independent sources.
  const deduped = new Map<string, typeof allRows[0]>();

  for (const row of consolidated.values()) {
    const spName = row.duAn?.sanPham?.tenChiTiet?.trim().toLowerCase() || "";
    const startDate = row.duAn?.ngayBatDau ? new Date(row.duAn.ngayBatDau).getTime() : "";
    const contractKey = row.maHopDong
      ? `src:${row.sourceType}:hd:${row.maHopDong}:dt:${row.duAn?.tongDoanhThuDuKien}:sp:${spName}:bd:${startDate}`
      : `pid:${row.projectId}`;
    const dedupeKey = `${contractKey}:${row.thang}`;

    const existing = deduped.get(dedupeKey);
    if (!existing) {
      deduped.set(dedupeKey, row);
    } else {
      // Keep higher priority (lower number)
      const existingPriority = SOURCE_PRIORITY[existing.sourceType] ?? 99;
      const newPriority = SOURCE_PRIORITY[row.sourceType] ?? 99;
      if (newPriority < existingPriority) {
        deduped.set(dedupeKey, row);
      }
    }
  }

  return Array.from(deduped.values());
}
