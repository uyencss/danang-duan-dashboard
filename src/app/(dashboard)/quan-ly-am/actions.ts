"use server";

import prisma from "@/lib/prisma";
import { TrangThaiDuAn, UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth-utils";

export async function getAMManagementData(filters?: { year?: number, quarter?: number, month?: number }) {
  try {
    await requireRole("ADMIN", "USER");
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
      where: { 
        role: UserRole.AM,
        NOT: { diaBan: "Lãnh đạo" }
      },
      select: { id: true, name: true, diaBan: true }
    });

    // 2. Initial stats structure
    const amStats = ams.map((am: any) => ({
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
      rankYear: 0,
      expectedRev: 0
    }));

    // 3. Get all projects for the context year
    const projects = await prisma.duAn.findMany({
      where: {
        nam: contextYear
      },
      select: {
        amId: true,
        amHoTroId: true,
        tongDoanhThuDuKien: true,
        doanhThuTheoThang: true,
        thang: true,
        quy: true,
        nam: true,
        trangThaiHienTai: true,
        ngayKetThuc: true
      }
    });

    // 4. Process each project and credit ALL involved AMs using the SPECIFIC requested formulas
    projects.forEach((p: any) => {
        const involvedAMIds = [(p as any).amId, (p as any).amHoTroId].filter((id): id is string => !!id);
        const isSigned = p.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG;

        const hasTotal = p.tongDoanhThuDuKien && p.tongDoanhThuDuKien > 0;
        const hasMonthly = (p as any).doanhThuTheoThang && (p as any).doanhThuTheoThang > 0;

        const ngayKetThuc = (p as any).ngayKetThuc ? new Date((p as any).ngayKetThuc) : null;
        let isDeadThisMonth = false;
        let activeQuarterMonths = contextMonth;
        let activeYearlyMonths = 12;

        if (ngayKetThuc) {
            const eY = ngayKetThuc.getFullYear();
            const eM = ngayKetThuc.getMonth() + 1;
            
            if (eY < contextYear || (eY === contextYear && eM < contextMonth)) {
                isDeadThisMonth = true;
            }
            if (eY === contextYear) {
                if (eM < contextMonth) activeQuarterMonths = eM;
                activeYearlyMonths = eM;
            } else if (eY < contextYear) {
                activeQuarterMonths = 0;
                activeYearlyMonths = 0;
            }
        }

        let projMonthly = 0;
        let projQuarterly = 0;
        let projYearly = 0;

        // Case 1: Both "Tổng doanh thu" and "Doanh thu theo tháng" are provided
        if (hasTotal && hasMonthly) {
            projMonthly = isDeadThisMonth ? 0 : (p as any).doanhThuTheoThang!;
            projQuarterly = activeQuarterMonths * (p as any).doanhThuTheoThang!;
            projYearly = p.tongDoanhThuDuKien;
        } 
        // Case 2: Only "Doanh thu theo tháng" is provided
        else if (hasMonthly) {
            projMonthly = isDeadThisMonth ? 0 : (p as any).doanhThuTheoThang!;
            projQuarterly = activeQuarterMonths * (p as any).doanhThuTheoThang!;
            projYearly = activeYearlyMonths * (p as any).doanhThuTheoThang!;
        }
        // Case 3: Only "Tổng doanh thu dự kiến" is provided
        else if (hasTotal) {
            projMonthly = isDeadThisMonth ? 0 : p.tongDoanhThuDuKien;
            projQuarterly = p.tongDoanhThuDuKien;
            projYearly = p.tongDoanhThuDuKien;
        }

        involvedAMIds.forEach(amId => {
            const amStat = amStats.find((s: any) => s.id === amId);
            if (!amStat) return;

            // Outreach: Total projects handled in this/past months
            if (p.thang <= contextMonth && (p as any).quy <= contextQuarter) {
                amStat.monthlyOutreach += 1;
            }

            // Cumulative outreach (Yearly context)
            amStat.totalOutreach += 1;
            
            // Expected Revenue (Total projected revenue of all projects they are in)
            amStat.expectedRev += p.tongDoanhThuDuKien || 0;

            if (!isSigned) return;

            // Yearly: All signed projects in context year contribute
            amStat.yearlyRev += projYearly;
            amStat.yearlyContracts += 1;

            // Monthly & Quarterly contexts based on 'thang'
            if (p.thang <= contextMonth && (p as any).quy <= contextQuarter) {
                // Monthly Rev: Sum of active monthly rates
                amStat.monthlyRev += projMonthly;
                
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
    amStats.forEach((stat: any) => {
        stat.conversionRate = stat.totalOutreach > 0 ? (stat.yearlyContracts / stat.totalOutreach) * 100 : 0;
    });

    // 5. Calculate Rankings based on revenue
    const calculateRanks = (list: typeof amStats, key: 'monthlyRev' | 'quarterlyRev' | 'yearlyRev', rankKey: 'rankMonth' | 'rankQuarter' | 'rankYear') => {
        const sorted = [...list].sort((a, b) => b[key] - a[key]);
        list.forEach((item: any) => {
            item[rankKey] = sorted.findIndex((s: any) => s.id === item.id) + 1;
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
