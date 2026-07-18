"use server";

import prisma from "@/lib/prisma";
import { generateRevenueSchedule, type ContractInput } from "@/lib/utils/revenue-engine";
import { syncMasterRevenue } from "@/lib/utils/master-revenue-sync";

/**
 * Persists the revenue schedule for a single project.
 * 1. Deletes all existing RevenueDistribution rows for this projectId.
 * 2. Generates fresh slices via the amortization engine.
 * 3. Bulk-inserts the new slices.
 *
 * Called from createDuAn / updateDuAn after the project is saved.
 */
export async function syncRevenueDistribution(projectId: number) {
  try {
    // Fetch the project to get the contract input
    const project = await prisma.duAn.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        tongDoanhThuDuKien: true,
        ngayBatDau: true,
        ngayKetThuc: true,
        amId: true,
        chuyenVienId: true,
        trangThaiHienTai: true,
      },
    });

    if (!project) return;

    // Only generate distribution for signed contracts with end dates
    const slices = generateRevenueSchedule(project as ContractInput);

    // Atomic: delete old + insert new
    await prisma.$transaction([
      prisma.revenueDistribution.deleteMany({ where: { projectId } }),
      ...(slices.length > 0
        ? [
            prisma.revenueDistribution.createMany({
              data: slices.map((s) => ({
                projectId,
                amId: project.amId,
                chuyenVienId: project.chuyenVienId,
                thangBaoCao: s.thangBaoCao,
                namBaoCao: s.namBaoCao,
                soNgayActive: s.soNgayActive,
                doanhThuPhanBo: s.doanhThuPhanBo,
                loaiDoanhThu: s.loaiDoanhThu,
              })),
            }),
          ]
        : []),
    ]);

    // Cascade sync to MasterRevenue (Bảng 4)
    await syncMasterRevenue(projectId);
  } catch (error) {
    console.error(`[RevenueEngine] Failed to sync distribution for project ${projectId}:`, error);
  }
}

/**
 * Re-generates revenue distributions for ALL projects in the system.
 * Intended for one-time migration or admin bulk-refresh.
 */
export async function rebuildAllRevenueDistributions() {
  const projects = await prisma.duAn.findMany({
    where: {
      ngayKetThuc: { not: null },
      tongDoanhThuDuKien: { gt: 0 },
      isPendingDelete: false,
    },
    select: {
      id: true,
      tongDoanhThuDuKien: true,
      ngayBatDau: true,
      ngayKetThuc: true,
      amId: true,
      chuyenVienId: true,
    },
  });

  console.log(`[RevenueEngine] Rebuilding distributions for ${projects.length} projects...`);

  // Clear all existing distributions first
  await prisma.revenueDistribution.deleteMany({});

  let totalSlices = 0;
  // Process in batches to avoid memory issues
  const batchSize = 50;
  for (let i = 0; i < projects.length; i += batchSize) {
    const batch = projects.slice(i, i + batchSize);
    const allSlices = batch.flatMap((p) => {
      const slices = generateRevenueSchedule(p as ContractInput);
      return slices.map((s) => ({
        projectId: p.id,
        amId: p.amId,
        chuyenVienId: p.chuyenVienId,
        thangBaoCao: s.thangBaoCao,
        namBaoCao: s.namBaoCao,
        soNgayActive: s.soNgayActive,
        doanhThuPhanBo: s.doanhThuPhanBo,
        loaiDoanhThu: s.loaiDoanhThu,
      }));
    });

    if (allSlices.length > 0) {
      await prisma.revenueDistribution.createMany({ data: allSlices });
      totalSlices += allSlices.length;
    }
  }

  console.log(`[RevenueEngine] Done. Created ${totalSlices} distribution slices.`);
  return { projectCount: projects.length, sliceCount: totalSlices };
}
