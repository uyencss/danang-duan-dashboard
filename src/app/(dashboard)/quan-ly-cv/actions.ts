"use server";

import prisma from "@/lib/prisma";
import { TrangThaiDuAn, UserRole } from "@prisma/client";

export async function getCVManagementData(filters?: { year?: number, quarter?: number, month?: number }) {
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

    // 1. Get all CV users
    const cvs = await prisma.user.findMany({
      where: { 
        role: { in: [UserRole.CV, UserRole.USER] },
        NOT: { diaBan: "Lãnh đạo" }
      },
      select: { id: true, name: true, diaBan: true }
    });

    // 2. Initial stats structure
    const cvStats = cvs.map((cv: any) => ({
      id: cv.id,
      name: cv.name,
      team: cv.diaBan || "Chưa phân công",
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
        chuyenVienId: true,
        cvHoTro1Id: true,
        cvHoTro2Id: true,
        tongDoanhThuDuKien: true,
        doanhThuTheoThang: true,
        thang: true,
        quy: true,
        nam: true,
        trangThaiHienTai: true,
        ngayKetThuc: true
      }
    });

    // 4. Process each project and credit ALL involved CVs using the SPECIFIC requested formulas
    projects.forEach((p: any) => {
        const involvedCVIds = [(p as any).chuyenVienId, (p as any).cvHoTro1Id, (p as any).cvHoTro2Id].filter((id): id is string => !!id);
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

        involvedCVIds.forEach(cvId => {
            const cvStat = cvStats.find((s: any) => s.id === cvId);
            if (!cvStat) return;

            // Outreach: Total projects handled in this/past months
            if (p.thang <= contextMonth && (p as any).quy <= contextQuarter) {
                cvStat.monthlyOutreach += 1;
            }

            // Cumulative outreach (Yearly context)
            cvStat.totalOutreach += 1;
            
            // Expected Revenue (Total projected revenue of all projects they are in)
            cvStat.expectedRev += p.tongDoanhThuDuKien || 0;

            if (!isSigned) return;

            // Yearly: All signed projects in context year contribute
            cvStat.yearlyRev += projYearly;
            cvStat.yearlyContracts += 1;

            // Monthly & Quarterly contexts based on 'thang'
            if (p.thang <= contextMonth && (p as any).quy <= contextQuarter) {
                // Monthly Rev: Sum of active monthly rates
                cvStat.monthlyRev += projMonthly;
                
                // Quarterly Rev: Cumulative contribution
                cvStat.quarterlyRev += projQuarterly;
                cvStat.quarterlyContracts += 1;

                // Monthly Contracts: ONLY projects signed in this specific month
                if (p.thang === contextMonth) {
                    cvStat.monthlyContracts += 1;
                }
            }
        });
    });

    // 5. Calculate Conversion Rate based on formula: Signed / Total Involved
    cvStats.forEach((stat: any) => {
        stat.conversionRate = stat.totalOutreach > 0 ? (stat.yearlyContracts / stat.totalOutreach) * 100 : 0;
    });

    const calculateRanks = (list: typeof cvStats, key: 'monthlyRev' | 'quarterlyRev' | 'yearlyRev', rankKey: 'rankMonth' | 'rankQuarter' | 'rankYear') => {
        const sorted = [...list].sort((a, b) => b[key] - a[key]);
        list.forEach((item: any) => {
            item[rankKey] = sorted.findIndex((s: any) => s.id === item.id) + 1;
        });
    };

    calculateRanks(cvStats, 'monthlyRev', 'rankMonth');
    calculateRanks(cvStats, 'quarterlyRev', 'rankQuarter');
    calculateRanks(cvStats, 'yearlyRev', 'rankYear');

    return { data: cvStats };
  } catch (error: any) {
    console.error("getCVManagementData error:", error);
    return { error: `Lỗi tải dữ liệu Chuyên viên: ${error?.message || "Unknown error"}` };
  }
}
