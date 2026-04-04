"use server";

import prisma from "@/lib/prisma";
import { TrangThaiDuAn, UserRole } from "@prisma/client";

export async function getAMManagementData(filters?: { year?: number, quarter?: number, month?: number }) {
  try {
    const now = new Date();
    const contextYear = filters?.year || 2026;
    
    // Determine the context month and quarter
    let contextMonth = filters?.month || (now.getFullYear() === contextYear ? now.getMonth() + 1 : 12);
    let contextQuarter = filters?.quarter || Math.floor((contextMonth - 1) / 3) + 1;

    // If a quarter is specifically selected but no month, we use the last month of that quarter as context
    if (filters?.quarter && !filters?.month) {
        contextMonth = filters.quarter * 3;
    }

    // 1. Get all AM users
    const ams = await prisma.user.findMany({
      where: { role: UserRole.AM },
      select: { id: true, name: true, diaBan: true }
    });

    // 2. Initial stats structure
    const amStats = ams.map(am => ({
      id: am.id,
      name: am.name,
      team: am.diaBan || "Chưa phân công",
      monthlyRev: 0,
      monthlyContracts: 0,
      quarterlyRev: 0,
      quarterlyContracts: 0,
      yearlyRev: 0,
      yearlyContracts: 0,
      monthlyOutreach: 0,
      totalOutreach: 0,
      conversionRate: 0,
      rankMonth: 0,
      rankQuarter: 0,
      rankYear: 0
    }));

    // 3. Get all projects for the context year
    const projects = await prisma.duAn.findMany({
      where: {
        nam: contextYear
      }
    });

    // 4. Process each project and credit ALL involved AMs using the SPECIFIC requested formulas
    projects.forEach(p => {
        const involvedAMIds = [(p as any).amId, (p as any).amHoTroId].filter((id): id is string => !!id);
        const isSigned = p.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG;

        // Cumulative outreach counting (Số lượng dự án có chứa tên AM đó)
        involvedAMIds.forEach(amId => {
            const amStat = amStats.find(s => s.id === amId);
            if (amStat) amStat.totalOutreach += 1;
        });

        if (!isSigned) return;

        const hasTotal = p.tongDoanhThuDuKien && p.tongDoanhThuDuKien > 0;
        const hasMonthly = (p as any).doanhThuTheoThang && (p as any).doanhThuTheoThang > 0;

        let projMonthly = 0;
        let projQuarterly = 0;
        let projYearly = 0;

        // Case 1: Both "Tổng doanh thu" and "Doanh thu theo tháng" are provided
        if (hasTotal && hasMonthly) {
            projMonthly = (p as any).doanhThuTheoThang!;
            projQuarterly = contextMonth * (p as any).doanhThuTheoThang!;
            projYearly = p.tongDoanhThuDuKien;
        } 
        // Case 2: Only "Doanh thu theo tháng" is provided
        else if (hasMonthly) {
            projMonthly = (p as any).doanhThuTheoThang!;
            projQuarterly = contextMonth * (p as any).doanhThuTheoThang!;
            projYearly = 12 * (p as any).doanhThuTheoThang!;
        }
        // Case 3: Only "Tổng doanh thu dự kiến" is provided
        else if (hasTotal) {
            projMonthly = p.tongDoanhThuDuKien;
            projQuarterly = p.tongDoanhThuDuKien;
            projYearly = p.tongDoanhThuDuKien;
        }

        involvedAMIds.forEach(amId => {
            const amStat = amStats.find(s => s.id === amId);
            if (!amStat) return;

            // Yearly: All signed projects in context year contribute
            amStat.yearlyRev += projYearly;
            amStat.yearlyContracts += 1;

            // Monthly & Quarterly contexts based on 'thang'
            if (p.thang <= contextMonth && (p as any).quy <= contextQuarter) {
                // Monthly Rev: Sum of active monthly rates
                amStat.monthlyRev += projMonthly;
                
                // Outreach: Total projects handled up to now
                amStat.monthlyOutreach += 1;

                // Quarterly Rev: Cumulative contribution
                amStat.quarterlyRev += projQuarterly;
                amStat.quarterlyContracts += 1;

                // Monthly Contracts: ONLY projects signed in this specific month
                if (p.thang === contextMonth) {
                    amStat.monthlyContracts += 1;
                }
            }
        });
    });

    // 5. Calculate Conversion Rate based on formula: Signed / Total Involved
    amStats.forEach(stat => {
        stat.conversionRate = stat.totalOutreach > 0 ? (stat.yearlyContracts / stat.totalOutreach) * 100 : 0;
    });

    // 5. Calculate Rankings based on revenue
    const calculateRanks = (list: typeof amStats, key: 'monthlyRev' | 'quarterlyRev' | 'yearlyRev', rankKey: 'rankMonth' | 'rankQuarter' | 'rankYear') => {
        const sorted = [...list].sort((a, b) => b[key] - a[key]);
        list.forEach(item => {
            item[rankKey] = sorted.findIndex(s => s.id === item.id) + 1;
        });
    };

    calculateRanks(amStats, 'monthlyRev', 'rankMonth');
    calculateRanks(amStats, 'quarterlyRev', 'rankQuarter');
    calculateRanks(amStats, 'yearlyRev', 'rankYear');

    return { data: amStats };
  } catch (error: any) {
    console.error("getAMManagementData error:", error);
    return { error: `Lỗi tải dữ liệu AM: ${error?.message || "Unknown error"}` };
  }
}
