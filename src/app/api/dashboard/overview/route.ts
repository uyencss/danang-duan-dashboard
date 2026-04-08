import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TrangThaiDuAn } from "@prisma/client";

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

export async function GET() {
  try {
    const now = new Date("2026-04-08T00:00:00Z"); // As per user request context
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);

    // Common filter: Exclude "Thất bại"
    const excludeFailed = {
      NOT: { trangThaiHienTai: TrangThaiDuAn.THAT_BAI }
    };

    // Current period dates
    const monthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const monthEnd = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59));

    const quarterStartMonth = (currentQuarter - 1) * 3;
    const quarterStart = new Date(Date.UTC(currentYear, quarterStartMonth, 1));
    const quarterEnd = new Date(Date.UTC(currentYear, quarterStartMonth + 3, 0, 23, 59, 59));

    const yearStart = new Date(Date.UTC(currentYear, 0, 1));
    const yearEnd = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59));

    // 1. Fetch Projects & KPI
    const projects = await prisma.duAn.findMany({
      where: excludeFailed,
      include: {
        am: { select: { diaBan: true } },
        nhatKy: {
          where: { status: "APPROVED" },
          orderBy: { ngayGio: "desc" },
          take: 1
        }
      }
    });

    const kpi = await prisma.chiTieuKpi.findUnique({
      where: { nam_thang: { nam: currentYear, thang: currentMonth } }
    });
    const kpiThang = kpi ? (kpi.anNinhMang + kpi.giaiPhapCntt + kpi.duAnCds + kpi.cnsAnNinh) : 0;

    // --- LAYER 1: REVENUE METRICS ---

    // 1. dtTongDuAn: SUM of tongDoanhThu for ALL projects in current year (excluding failed)
    const dtTongDuAn = projects.reduce((sum, p) => {
      // Assuming "in current year" means projects that started or are active in current year
      // But typically it means project.nam === currentYear
      return p.nam === currentYear ? sum + p.tongDoanhThuDuKien : sum;
    }, 0);

    // 2. dtThangDaKy (Signed + Active in current month)
    const signedProjects = projects.filter(p => p.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG);
    const dtThangDaKy = signedProjects.reduce((sum, p) => {
      const active = getActiveMonths(p.ngayBatDau, p.ngayKetThuc, monthStart, monthEnd);
      return active > 0 ? sum + (p.doanhThuTheoThang || 0) : sum;
    }, 0);
    const percentageHTKH_Metric2 = kpiThang > 0 ? (dtThangDaKy / kpiThang) * 100 : 0;

    // 3. dtDuKienThang (Metric 2 + Expected projects)
    const expectedProjects = projects.filter(p => p.isKyVong === true && p.trangThaiHienTai !== TrangThaiDuAn.DA_KY_HOP_DONG);
    const dtDuKienThang = dtThangDaKy + expectedProjects.reduce((sum, p) => sum + p.tongDoanhThuDuKien, 0);
    const percentageHTKH_Metric3 = kpiThang > 0 ? (dtDuKienThang / kpiThang) * 100 : 0;

    // 4. dtTheoQuy
    const dtTheoQuy = signedProjects.reduce((sum, p) => {
      const activeMonthsInQuarter = getActiveMonths(p.ngayBatDau, p.ngayKetThuc, quarterStart, quarterEnd);
      return sum + ((p.doanhThuTheoThang || 0) * activeMonthsInQuarter);
    }, 0);

    // 5. dtTheoNam
    const dtTheoNam = signedProjects.reduce((sum, p) => {
      const activeMonthsInYear = getActiveMonths(p.ngayBatDau, p.ngayKetThuc, yearStart, yearEnd);
      return sum + ((p.doanhThuTheoThang || 0) * activeMonthsInYear);
    }, 0);

    // --- LAYER 2: PROJECT METRICS ---

    // 6. tongSoDuAn
    const tongSoDuAn = projects.length;

    // 7. duAnTrongDiem
    const duAnTrongDiem = projects.filter(p => p.isTrongDiem).length;

    // 8. hienTrangThang (Grouping project counts by status - INCLUDES Failed)
    // We need to fetch all projects for this metric
    const allProjectsForStatus = await prisma.duAn.findMany({
      select: { trangThaiHienTai: true }
    });
    const statusOrder = [
      TrangThaiDuAn.MOI,
      TrangThaiDuAn.DANG_LAM_VIEC,
      TrangThaiDuAn.DA_DEMO,
      TrangThaiDuAn.DA_GUI_BAO_GIA,
      TrangThaiDuAn.DA_KY_HOP_DONG,
      TrangThaiDuAn.THAT_BAI
    ];
    const hienTrangThang = statusOrder.map(status => ({
      label: status, // Will be mapped to Vietnamese in UI
      count: allProjectsForStatus.filter(p => p.trangThaiHienTai === status).length
    }));

    // 9. thongKeTheoBuoc (Grouping by hienTaiBuoc)
    const stepCounts: Record<string, number> = {};
    projects.forEach(p => {
      const step = p.hienTaiBuoc || "Chưa cập nhật";
      stepCounts[step] = (stepCounts[step] || 0) + 1;
    });
    const thongKeTheoBuoc = Object.entries(stepCounts).map(([label, count]) => ({ label, count }));

    // 10. canhBaoTheoTo (Last update > 15 days)
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

    return NextResponse.json({
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
    });

  } catch (error: any) {
    console.error("Dashboard calculation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
