"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { TrangThaiDuAn } from "@prisma/client";

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

    return {
        stats: {
            totalProjects,
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

export async function getAMPerformance() {
    try {
        const ams = await prisma.user.findMany({
            where: { role: 'USER' } // Simple filter for AMs
        });

        const performance = await Promise.all(ams.map(async (am) => {
            const projects = await prisma.duAn.findMany({
                where: { amId: am.id }
            });

            return {
                name: am.name,
                count: projects.length,
                revenue: projects.reduce((acc, p) => acc + p.tongDoanhThuDuKien, 0),
                signed: projects.filter(p => p.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG).length
            };
        }));

        return { data: performance.sort((a, b) => b.revenue - a.revenue) };
    } catch (error) {
        return { error: "Lỗi tải xếp hạng AM" };
    }
}

export async function getNhanSuAnalytics(filter?: { type: 'all' | 'nam' | 'quy' | 'thang', year?: number, quarter?: number, month?: number }) {
    try {
        const sessionRes = await (auth.api as any).getSession({
            headers: await headers()
        });
        const currentUser = sessionRes?.user;
        if (!currentUser) return { error: "Yêu cầu đăng nhập" };

        let projectFilter: any = {};
        
        if (filter?.type === 'nam' && filter.year) {
            projectFilter.nam = filter.year;
        } else if (filter?.type === 'quy' && filter.year && filter.quarter) {
            projectFilter.nam = filter.year;
            projectFilter.quy = filter.quarter;
        } else if (filter?.type === 'thang' && filter.year && filter.month) {
            projectFilter.nam = filter.year;
            projectFilter.thang = filter.month;
        }

        // Fetch users who are USERs (personnel)
        const personals = await prisma.user.findMany({
            where: { role: 'USER' },
            select: { id: true, name: true, diaBan: true }
        });

        const analytics = await Promise.all(personals.map(async (p) => {
            const projects = await prisma.duAn.findMany({
                where: { 
                    ...projectFilter,
                    OR: [
                        { amId: p.id },
                        { chuyenVienId: p.id }
                    ]
                }
            });

            const totalRevenue = projects.reduce((acc, proj) => acc + proj.tongDoanhThuDuKien, 0);
            const totalContracts = projects.filter(proj => proj.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG).length;
            const totalProjects = projects.length;

            return {
                id: p.id,
                name: p.name,
                diaBan: p.diaBan || "Chưa phân công",
                revenue: totalRevenue,
                contracts: totalContracts,
                projects: totalProjects,
            };
        }));

        // Sort by revenue descending by default
        return { data: analytics.sort((a, b) => b.revenue - a.revenue) };
    } catch (error: any) {
        console.error("getNhanSuAnalytics Error:", error);
        return { error: `Lỗi tải dữ liệu nhân sự: ${error?.message || "Unknown error"}` };
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
            where: { role: 'USER' },
            select: { id: true, name: true, diaBan: true }
        });

        const projects = await prisma.duAn.findMany({
            select: {
                id: true,
                tongDoanhThuDuKien: true,
                trangThaiHienTai: true,
                amId: true,
                chuyenVienId: true
            }
        });

        const diaBanMap = new Map();
        const staffMap = new Map();

        projects.forEach(p => {
            const am = personals.find(u => u.id === p.amId);
            const diaBan = am?.diaBan || "Chưa phân công";

            // Track per staff for Top Ranking
            if (am) {
                if (!staffMap.has(am.id)) {
                    staffMap.set(am.id, { id: am.id, name: am.name, diaBan: diaBan, revenue: 0, contracts: 0, totalProjects: 0 });
                }
                const st = staffMap.get(am.id);
                st.totalProjects += 1;
                st.revenue += p.tongDoanhThuDuKien;
                if (p.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG) st.contracts += 1;
            }

            // Track per Dia Ban
            if (!diaBanMap.has(diaBan)) {
                diaBanMap.set(diaBan, { name: diaBan, revenue: 0, projects: 0, contracts: 0, staffCount: new Set() });
            }
            const dbRef = diaBanMap.get(diaBan);
            dbRef.projects += 1;
            dbRef.revenue += p.tongDoanhThuDuKien;
            if (p.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG) dbRef.contracts += 1;
            if (am) dbRef.staffCount.add(am.id);
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


