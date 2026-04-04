"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { TrangThaiDuAn, UserRole } from "@prisma/client";

export async function getDashboardOverview() {
  try {
    const sessionRes = await (auth.api as any).getSession({
      headers: await headers()
    });
    const user = sessionRes?.user;
    if (!user) return { error: "Yêu cầu đăng nhập" };

    const whereClause: any = {};
    if (user.role !== "ADMIN") {
        whereClause.OR = [
            { amId: user.id },
            { chuyenVienId: user.id }
        ];
    }

    const projects = await prisma.duAn.findMany({
      where: whereClause,
      include: { khachHang: true, am: true }
    });

    const totalProjects = projects.length;
    const totalRevenue = projects.reduce((acc, p) => acc + p.tongDoanhThuDuKien, 0);
    const signedProjects = projects.filter(p => p.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG).length;
    
    // Urgent care: nul or > 15 days
    const urgentCare = projects.filter(p => {
        if (!p.ngayChamsocCuoiCung) return true;
        const diff = (new Date().getTime() - new Date(p.ngayChamsocCuoiCung).getTime()) / (1000 * 60 * 60 * 24);
        return diff > 15;
    }).length;

    // Status breakdown for Funnel
    const statusCounts = Object.values(TrangThaiDuAn).reduce((acc: any, status) => {
        acc[status] = projects.filter(p => p.trangThaiHienTai === status).length;
        return acc;
    }, {});

    // Top 5 urgent
    const topUrgent = projects
        .filter(p => !p.ngayChamsocCuoiCung || (new Date().getTime() - new Date(p.ngayChamsocCuoiCung).getTime()) / (1000 * 60 * 60 * 24) > 15)
        .sort((a, b) => {
            const dateA = a.ngayChamsocCuoiCung ? new Date(a.ngayChamsocCuoiCung).getTime() : 0;
            const dateB = b.ngayChamsocCuoiCung ? new Date(b.ngayChamsocCuoiCung).getTime() : 0;
            return dateA - dateB;
        })
        .slice(0, 5);

    const totalCustomers = await prisma.khachHang.count();

    return {
        stats: {
            totalProjects,
            totalCustomers,
            totalRevenue,
            signedProjects,
            urgentCare
        },
        statusCounts,
        topUrgent
    };
  } catch (error: any) {
    console.error("Dashboard Stats Error:", error);
    return { error: `DEV: ${error?.message || "Unknown error"}` };
  }
}

export async function getAMPerformance(filter?: { type: 'all' | 'nam' | 'quy' | 'thang', year?: number, quarter?: number, month?: number }) {
    try {
        const sessionRes = await (auth.api as any).getSession({
            headers: await headers()
        });
        const currentUser = sessionRes?.user;
        if (!currentUser) return { error: "Yêu cầu đăng nhập" };

        let projectFilter: any = {};
        const now = new Date();
        const currentYear = 2026;
        let contextMonth = now.getFullYear() === currentYear ? now.getMonth() + 1 : 12;

        if (filter?.type === 'nam' && filter.year) {
            projectFilter.nam = filter.year;
            if (filter.year !== currentYear) contextMonth = 12;
        } else if (filter?.type === 'quy' && filter.year && filter.quarter) {
            projectFilter.nam = filter.year;
            projectFilter.quy = filter.quarter;
            contextMonth = filter.quarter * 3;
        } else if (filter?.type === 'thang' && filter.year && filter.month) {
            projectFilter.nam = filter.year;
            projectFilter.thang = filter.month;
            contextMonth = filter.month;
        }

        // Fetch users who are personnel (AM, CV, USER)
        const personals = await prisma.user.findMany({
            where: {
                role: { in: ['AM', 'CV', 'USER'] as any }
            },
            select: { id: true, name: true, diaBan: true, role: true }
        });

        const analytics = personals.map(p => ({
            id: p.id,
            name: p.name,
            role: p.role,
            diaBan: p.diaBan || "Chưa phân công",
            signedRevenue: 0,
            otherRevenue: 0,
            totalRevenue: 0,
            contracts: 0,
            projects: 0
        }));

        const projects = await prisma.duAn.findMany({
            where: projectFilter
        });

        projects.forEach(proj => {
            const involvedIds = [
                (proj as any).amId, 
                (proj as any).amHoTroId, 
                (proj as any).chuyenVienId, 
                (proj as any).cvHoTro1Id, 
                (proj as any).cvHoTro2Id
            ].filter((id): id is string => !!id);

            const hasTotal = proj.tongDoanhThuDuKien && proj.tongDoanhThuDuKien > 0;
            const hasMonthly = (proj as any).doanhThuTheoThang && (proj as any).doanhThuTheoThang > 0;

            let projRevValue = 0;
            if (hasMonthly) {
                projRevValue = contextMonth * (proj as any).doanhThuTheoThang!;
            } else if (hasTotal) {
                projRevValue = proj.tongDoanhThuDuKien;
            }

            involvedIds.forEach(id => {
                const stat = analytics.find(a => a.id === id);
                if (!stat) return;

                stat.projects += 1;
                stat.totalRevenue += projRevValue;

                if (proj.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG) {
                    stat.signedRevenue += projRevValue;
                    stat.contracts += 1;
                } else {
                    stat.otherRevenue += projRevValue;
                }
            });
        });

        // Map for compatibility with older dashboard views
        const finalAnalytics = analytics.map(a => ({
            ...a,
            revenue: a.totalRevenue,
            count: a.projects,
            signed: a.contracts
        }));

        const analyticsSorted = finalAnalytics.sort((a, b) => b.totalRevenue - a.totalRevenue);

        // Filter and sort for AMs
        const amAnalytics = finalAnalytics.filter(a => (a.role as string) === 'AM');
        const topAMSigned = [...amAnalytics]
            .filter(a => a.signedRevenue > 0)
            .sort((a, b) => b.signedRevenue - a.signedRevenue)
            .slice(0, 5);
        const topAMOthers = [...amAnalytics]
            .filter(a => a.otherRevenue > 0)
            .sort((a, b) => b.otherRevenue - a.otherRevenue)
            .slice(0, 5);
 
        // Filter and sort for CVs
        const cvAnalytics = finalAnalytics.filter(a => (a.role as string) === 'CV');
        const topCVSigned = [...cvAnalytics]
            .filter(a => a.signedRevenue > 0)
            .sort((a, b) => b.signedRevenue - a.signedRevenue)
            .slice(0, 5);
        const topCVOthers = [...cvAnalytics]
            .filter(a => a.otherRevenue > 0)
            .sort((a, b) => b.otherRevenue - a.otherRevenue)
            .slice(0, 5);
 
        // Lowest Revenue rankings (Bottom 5)
        const bottomAM = [...amAnalytics]
            .sort((a, b) => a.totalRevenue - b.totalRevenue)
            .slice(0, 5);
        const bottomCV = [...cvAnalytics]
            .sort((a, b) => a.totalRevenue - b.totalRevenue)
            .slice(0, 5);

        return { 
            data: analyticsSorted,
            topAMSigned,
            topAMOthers,
            topCVSigned,
            topCVOthers,
            bottomAM,
            bottomCV
        };
    } catch (error: any) {
        console.error("getAMPerformance Error:", error);
        return { error: `Lỗi tải dữ liệu AM: ${error?.message || "Unknown error"}` };
    }
}

export async function getKPITimeSeries(granularity: 'thang' | 'quy' | 'nam' = 'thang') {
    try {
        const sessionRes = await (auth.api as any).getSession({
            headers: await headers()
        });
        const currentUser = sessionRes?.user;
        if (!currentUser) return { error: "Yêu cầu đăng nhập" };

        let whereClause: any = {};
        if (currentUser.role !== "ADMIN") {
            whereClause.OR = [
                { amId: currentUser.id },
                { chuyenVienId: currentUser.id }
            ];
        }

        const projects = await prisma.duAn.findMany({
            where: whereClause,
            select: {
                id: true,
                tongDoanhThuDuKien: true,
                trangThaiHienTai: true,
                createdAt: true,
                thang: true,
                quy: true,
                nam: true
            }
        });

        const timeSeriesMap = new Map();

        projects.forEach(p => {
            let timeKey = "";
            let originalDate = p.createdAt;

            if (granularity === 'nam') {
                timeKey = `${p.nam}`;
            } else if (granularity === 'quy') {
                timeKey = `Q${p.quy}/${p.nam}`;
            } else {
                timeKey = `T${p.thang}/${p.nam}`;
            }

            if (!timeSeriesMap.has(timeKey)) {
                timeSeriesMap.set(timeKey, {
                    timeLabel: timeKey,
                    revenue: 0,
                    newProjects: 0,
                    signedContracts: 0,
                    sortKey: p.nam * 1000 + (granularity === 'thang' ? p.thang : granularity === 'quy' ? p.quy * 10 : 0)
                });
            }

            const current = timeSeriesMap.get(timeKey);
            current.newProjects += 1;
            current.revenue += p.tongDoanhThuDuKien;
            if (p.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG) {
                current.signedContracts += 1;
            }
        });

        const sortedData = Array.from(timeSeriesMap.values()).sort((a, b) => a.sortKey - b.sortKey);

        let growth = null;
        if (sortedData.length >= 2) {
            const currentPeriod = sortedData[sortedData.length - 1];
            const previousPeriod = sortedData[sortedData.length - 2];
            growth = {
                revenueGrowth: previousPeriod.revenue > 0 ? ((currentPeriod.revenue - previousPeriod.revenue) / previousPeriod.revenue) * 100 : 0,
                projectGrowth: previousPeriod.newProjects > 0 ? ((currentPeriod.newProjects - previousPeriod.newProjects) / previousPeriod.newProjects) * 100 : 0,
                contractGrowth: previousPeriod.signedContracts > 0 ? ((currentPeriod.signedContracts - previousPeriod.signedContracts) / previousPeriod.signedContracts) * 100 : 0,
            };
        }

        return {
            data: sortedData.map(({ sortKey, ...rest }) => rest), // Omit sortKey
            growth
        };

    } catch (error: any) {
        console.error("getKPITimeSeries Error:", error);
        return { error: `Lỗi tải dữ liệu KPI: ${error?.message || "Unknown error"}` };
    }
}

export async function getDiaBanAnalytics() {
    try {
        const sessionRes = await (auth.api as any).getSession({
            headers: await headers()
        });
        const currentUser = sessionRes?.user;
        if (!currentUser) return { error: "Yêu cầu đăng nhập" };

        const personals = await prisma.user.findMany({
            where: {
                role: { in: ['AM', 'CV', 'USER'] as any }
            },
            select: { id: true, name: true, diaBan: true }
        });

        const projects = await (prisma.duAn as any).findMany({
            select: {
                id: true,
                tongDoanhThuDuKien: true,
                trangThaiHienTai: true,
                amId: true,
                amHoTroId: true,
                chuyenVienId: true,
                cvHoTro1Id: true,
                cvHoTro2Id: true
            }
        });

        const diaBanMap = new Map();
        const staffMap = new Map();

        projects.forEach((p: any) => {
            const project = p as any;
            const involvedIds = Array.from(new Set([
                project.amId, 
                project.amHoTroId, 
                project.chuyenVienId,
                project.cvHoTro1Id,
                project.cvHoTro2Id
            ].filter(id => !!id)));
            
            // Credit EACH staff member fully in staffMap
            involvedIds.forEach(id => {
                const staff = personals.find(u => u.id === id);
                if (staff) {
                    const diaBan = staff.diaBan || "Chưa phân công";
                    if (!staffMap.has(staff.id)) {
                        staffMap.set(staff.id, { id: staff.id, name: staff.name, diaBan: diaBan, revenue: 0, contracts: 0, totalProjects: 0 });
                    }
                    const st = staffMap.get(staff.id);
                    st.totalProjects += 1;
                    st.revenue += p.tongDoanhThuDuKien;
                    if (p.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG) st.contracts += 1;
                }
            });

            // Credit Dia Ban ONLY ONCE per project (usually using the main AM's location)
            const primaryAMId = project.amId || project.amHoTroId || project.chuyenVienId;
            const primaryStaff = primaryAMId ? personals.find(u => u.id === primaryAMId) : null;
            const diaBan = primaryStaff?.diaBan || "Chưa phân công";

            if (!diaBanMap.has(diaBan)) {
                diaBanMap.set(diaBan, { name: diaBan, revenue: 0, projects: 0, contracts: 0, staffCount: new Set() });
            }
            const dbRef = diaBanMap.get(diaBan);
            dbRef.projects += 1;
            dbRef.revenue += p.tongDoanhThuDuKien;
            if (p.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG) dbRef.contracts += 1;
            
            // Record all distinct staff seen in this Dia Ban
            involvedIds.forEach(id => {
                const staff = personals.find(u => u.id === id);
                if (staff && (staff.diaBan || "Chưa phân công") === diaBan) {
                    dbRef.staffCount.add(staff.id);
                }
            });
        });

        const diaBanData = Array.from(diaBanMap.values()).map(d => ({
            ...d,
            staffCount: d.staffCount.size
        })).sort((a, b) => b.revenue - a.revenue);

        const topStaffData = Array.from(staffMap.values())
            .map(s => ({
                ...s,
                conversionRate: s.totalProjects > 0 ? (s.contracts / s.totalProjects) * 100 : 0
            }))
            .sort((a, b) => b.revenue - a.revenue);

        return { diaBanData, topStaffData };
    } catch (error: any) {
        console.error("getDiaBanAnalytics Error:", error);
        return { error: `Lỗi phân tích địa bàn: ${error?.message}` };
    }
}


