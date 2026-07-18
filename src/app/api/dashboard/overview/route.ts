import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TrangThaiDuAn, LogStatus } from "@prisma/client";
import { withLogging } from "@/lib/logger/api-logger";
import { logger } from "@/lib/logger";
import { requireApiRole } from "@/lib/auth-utils";
import { withCache } from "@/lib/cache";
import { getDeduplicatedMasterRevenue } from "@/lib/utils/master-revenue-sync";
export const dynamic = "force-dynamic";

/**
 * Helper function to calculate active months within a specific period (e.g., a Month, Quarter or Year)
 * @param start Project start date
 * @param end Project end date (optional)
 * @param periodStart Start of the period to check
 * @param periodEnd End of the period to check
 */
function getActiveMonths(start: Date, end: Date | null, periodStart: Date, periodEnd: Date): number {
  const s = start > periodStart ? start : periodStart;
  const e = !end || end > periodEnd ? periodEnd : end;

  if (s > e) return 0;

  // Calculate distinct months between s and e
  // Example: April 8 to May 15 -> April, May -> 2 months
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
  return Math.max(0, months);
}

async function computeDashboardOverview() {
  const now = new Date("2026-04-08T00:00:00Z"); // As per user request context
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  const excludeFailed = {
    NOT: { trangThaiHienTai: TrangThaiDuAn.THAT_BAI }
  };

  const monthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
  const monthEnd = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59));

  const quarterStartMonth = (currentQuarter - 1) * 3;
  const quarterStart = new Date(Date.UTC(currentYear, quarterStartMonth, 1));
  const quarterEnd = new Date(Date.UTC(currentYear, quarterStartMonth + 3, 0, 23, 59, 59));

  const yearStart = new Date(Date.UTC(currentYear, 0, 1));
  const yearEnd = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59));

  const allProjects = await prisma.duAn.findMany({
    where: { isPendingDelete: { not: true } },
    include: {
      am: { select: { diaBan: true } },
      nhatKy: {
        where: { status: LogStatus.APPROVED },
        orderBy: { ngayGio: "desc" },
        take: 1
      }
    }
  });

  // Deduplicate by project name (case-insensitive & trimmed), prioritizing more advanced statuses
  const uniqueProjectsMap = new Map<string, typeof allProjects[0]>();
  const statusPriority: Record<TrangThaiDuAn, number> = {
    [TrangThaiDuAn.DA_KY_HOP_DONG]: 6,
    [TrangThaiDuAn.DA_GUI_BAO_GIA]: 5,
    [TrangThaiDuAn.DA_DEMO]: 4,
    [TrangThaiDuAn.DANG_LAM_VIEC]: 3,
    [TrangThaiDuAn.MOI]: 2,
    [TrangThaiDuAn.THAT_BAI]: 1,
  };

  allProjects.forEach(p => {
    const key = p.tenDuAn.trim().toLowerCase();
    if (!uniqueProjectsMap.has(key)) {
      uniqueProjectsMap.set(key, p);
    } else {
      const existing = uniqueProjectsMap.get(key)!;
      const existingPriority = statusPriority[existing.trangThaiHienTai] || 0;
      const currentPriority = statusPriority[p.trangThaiHienTai] || 0;
      if (currentPriority > existingPriority) {
        uniqueProjectsMap.set(key, p);
      }
    }
  });
  const uniqueProjects = Array.from(uniqueProjectsMap.values());

  // projects is the active subset (not failed) of unique projects for revenue calculations
  const projects = uniqueProjects.filter(p => p.trangThaiHienTai !== TrangThaiDuAn.THAT_BAI);

  // Get deduplicated MasterRevenue slices for the current year
  const slices = await getDeduplicatedMasterRevenue(currentYear);

  const kpi = await prisma.chiTieuKpi.findUnique({
    where: { nam_thang: { nam: currentYear, thang: currentMonth } }
  });
  const kpiThang = kpi ? (kpi.anNinhMang + kpi.giaiPhapCntt + kpi.duAnCds + kpi.cnsAnNinh) : 0;

  // 1. DT Tổng dự án = DT theo tháng của dự án Đã ký hợp đồng + Tổng DT của các dự án active khác (không phải Đã ký HD hoặc Thất bại)
  const signedSlices = slices.filter(s => s.duAn.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG);
  const rawSignedYearlyRevenue = signedSlices.reduce((sum, s) => sum + s.doanhThu, 0);

  const nonSignedActiveProjects = uniqueProjects.filter(p => 
      p.trangThaiHienTai !== TrangThaiDuAn.DA_KY_HOP_DONG &&
      p.trangThaiHienTai !== TrangThaiDuAn.THAT_BAI
  );
  const rawNonSignedRevenue = nonSignedActiveProjects.reduce((sum, p) => sum + p.tongDoanhThuDuKien, 0);

  const rawDtTongDuAn = rawSignedYearlyRevenue + rawNonSignedRevenue;

  // 2. DT Tháng đã ký: sum of monthly revenue for current month (e.g. July) where project is signed.
  const currentMonthSlices = slices.filter(s => s.thang === currentMonth);
  const signedCurrentMonthSlices = currentMonthSlices.filter(s => s.duAn.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG);
  const rawDtThangDaKy = signedCurrentMonthSlices.reduce((sum, s) => sum + s.doanhThu, 0);

  // 3. DT Dự kiến tháng: DT tháng đã ký + DT of projects in currentMonth with isKyVong === true (excluding signed & failed)
  const expectedProjectsInMonth = uniqueProjects.filter(p => 
      p.isKyVong === true && 
      p.trangThaiHienTai !== TrangThaiDuAn.DA_KY_HOP_DONG &&
      p.trangThaiHienTai !== TrangThaiDuAn.THAT_BAI &&
      p.nam === currentYear &&
      p.thang === currentMonth
  );
  const rawExpectedRevenue = expectedProjectsInMonth.reduce((sum, p) => sum + p.tongDoanhThuDuKien, 0);
  const rawDtDuKienThang = rawDtThangDaKy + rawExpectedRevenue;

  // 4. DT theo quý: DT of standard calendar quarter months (Q1: 1,2,3; Q2: 4,5,6; Q3: 7,8,9; Q4: 10,11,12)
  const quarterMonths = [(currentQuarter - 1) * 3 + 1, (currentQuarter - 1) * 3 + 2, (currentQuarter - 1) * 3 + 3];
  const quarterSlices = signedSlices.filter(s => quarterMonths.includes(s.thang));
  const rawDtTheoQuy = quarterSlices.reduce((sum, s) => sum + s.doanhThu, 0);

  // 5. DT theo năm: sum of monthly revenues for all months (1-12) of signed projects in currentYear.
  const rawDtTheoNam = signedSlices.reduce((sum, s) => sum + s.doanhThu, 0);

  // ── Convert to triệu đồng ONCE at the very end ──
  const dtTongDuAn = Math.round(rawDtTongDuAn / 1_000_000);
  const dtThangDaKy = Math.round(rawDtThangDaKy / 1_000_000);
  const dtDuKienThang = Math.round(rawDtDuKienThang / 1_000_000);
  const dtTheoQuy = Math.round(rawDtTheoQuy / 1_000_000);
  const dtTheoNam = Math.round(rawDtTheoNam / 1_000_000);

  const percentageHTKH_Metric2 = kpiThang > 0 ? (dtThangDaKy / kpiThang) * 100 : 0;
  const percentageHTKH_Metric3 = kpiThang > 0 ? (dtDuKienThang / kpiThang) * 100 : 0;

  const tongSoDuAn = uniqueProjects.length;
  const duAnTrongDiem = uniqueProjects.filter(p => p.isTrongDiem).length;

  const statusOrder = [
    TrangThaiDuAn.MOI,
    TrangThaiDuAn.DANG_LAM_VIEC,
    TrangThaiDuAn.DA_DEMO,
    TrangThaiDuAn.DA_GUI_BAO_GIA,
    TrangThaiDuAn.DA_KY_HOP_DONG,
    TrangThaiDuAn.THAT_BAI
  ];
  const hienTrangThang = statusOrder.map(status => ({
    label: status,
    count: uniqueProjects.filter(p => p.trangThaiHienTai === status).length
  }));

  const stepCounts: Record<string, number> = {};
  projects.forEach(p => {
    const step = p.hienTaiBuoc || "Chưa cập nhật";
    stepCounts[step] = (stepCounts[step] || 0) + 1;
  });
  const thongKeTheoBuoc = Object.entries(stepCounts).map(([label, count]) => ({ label, count }));

  const fifteenDaysAgo = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000));
  const territorialAlerts: Record<string, number> = {
    "Tổ 1": 0,
    "Tổ 2": 0,
    "Tổ 3": 0,
    "Tổ dự án": 0
  };

  projects.forEach(p => {
    const latestLog = p.nhatKy[0];
    const lastUpdate = latestLog ? new Date(latestLog.ngayGio) : new Date(p.createdAt);

    if (lastUpdate < fifteenDaysAgo) {
      const diaBan = p.am?.diaBan || "Khác";
      if (territorialAlerts.hasOwnProperty(diaBan)) {
        territorialAlerts[diaBan]++;
      } else {
        territorialAlerts["Khác"] = (territorialAlerts["Khác"] || 0) + 1;
      }
    }
  });
  const canhBaoTheoTo = Object.entries(territorialAlerts).map(([label, count]) => ({ label, count }));

  return {
    revenueMetrics: {
      dtTongDuAn,
      dtThangDaKy: { value: dtThangDaKy, percentage: percentageHTKH_Metric2 },
      dtDuKienThang: { value: dtDuKienThang, percentage: percentageHTKH_Metric3 },
      dtTheoQuy,
      dtTheoNam
    },
    projectMetrics: {
      tongSoDuAn,
      duAnTrongDiem,
      hienTrangThang,
      thongKeTheoBuoc,
      canhBaoTheoTo
    }
  };
}

export const GET = withLogging(async (req: Request) => {
  try {
    const authResult = await requireApiRole("ADMIN", "USER", "AM", "CV");
    if (authResult.error) return authResult.error;

    const data = await withCache("dashboard:overview", 60, computeDashboardOverview);
    return NextResponse.json(data);

  } catch (error: any) {
    logger.error({ msg: "Dashboard calculation error", err: error instanceof Error ? error.message : error });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
