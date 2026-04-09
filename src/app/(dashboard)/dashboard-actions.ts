"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { TrangThaiDuAn, UserRole, LogStatus } from "@prisma/client";
import { logger } from "@/lib/logger";
import { unstable_cache } from "next/cache";

// Cache TTL: 5 minutes. Keyed by user id+role so ADMIN and non-ADMIN get separate caches.
async function _getDashboardOverview(userId: string, userRole: string) {
    try {
        const whereClause: any = {};
        // All authenticated users see all project data (no role-based filtering)

        const totalProjects = await prisma.duAn.count({ where: whereClause });
        
        const revAgg = await prisma.duAn.aggregate({
            where: whereClause,
            _sum: { tongDoanhThuDuKien: true }
        });
        const totalRevenue = revAgg._sum.tongDoanhThuDuKien || 0;
        
        const signedProjects = await prisma.duAn.count({
            where: {
                AND: [whereClause, { trangThaiHienTai: TrangThaiDuAn.DA_KY_HOP_DONG }]
            }
        });

        // Urgent care: null or > 15 days ago
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        const urgentWhere = {
            AND: [
                whereClause,
                {
                    OR: [
                        { ngayChamsocCuoiCung: null },
                        { ngayChamsocCuoiCung: { lt: fifteenDaysAgo } }
                    ]
                }
            ]
        };
        const urgentCare = await prisma.duAn.count({ where: urgentWhere });

        // Status breakdown using GroupBy
        const statusGroups = await prisma.duAn.groupBy({
            by: ['trangThaiHienTai'],
            where: whereClause,
            _count: { id: true }
        });
        const statusCounts = Object.values(TrangThaiDuAn).reduce((acc: any, status) => {
            const group = statusGroups.find((g: any) => g.trangThaiHienTai === status);
            acc[status] = group ? group._count.id : 0;
            return acc;
        }, {});

        // Top 5 urgent
        const topUrgent = await prisma.duAn.findMany({
            where: urgentWhere,
            orderBy: { ngayChamsocCuoiCung: 'asc' }, // Returns nulls first in SQLite
            take: 5,
            include: { khachHang: true, am: true }
        });

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
        logger.error({ msg: "Dashboard Stats Error", err: error instanceof Error ? error.message : error });
        return { error: `DEV: ${error?.message || "Unknown error"}` } as any;
    }
}

// Module-level cached version — Next.js requires unstable_cache at module scope.
// userId/userRole args are automatically incorporated into the cache key.
const _cachedDashboardOverview = unstable_cache(
    _getDashboardOverview,
    ['dashboard-overview'],
    { revalidate: 300 }
);

// Public export: resolves session outside cache, then calls module-level cached fn
export async function getDashboardOverview() {
    const sessionRes = await (auth.api as any).getSession({ headers: await headers() });
    const user = sessionRes?.user;
    if (!user) return { error: "Yêu cầu đăng nhập" };
    return _cachedDashboardOverview(user.id, user.role);
}

export async function getAMPerformance() {
    try {
        const now = new Date("2026-04-08T00:00:00Z");
        const currentYear = now.getUTCFullYear();
        const currentMonth = now.getUTCMonth() + 1;
        const monthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
        const monthEnd = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59));

        // 1. Fetch all users who are AMs to ensure they all appear in the chart
        const amUsers = await prisma.user.findMany({
            where: { role: UserRole.AM, isActive: true },
            select: { id: true, name: true }
        });

        // 2. Fetch all projects where these AMs are involved (Main or Support)
        const projects = await prisma.duAn.findMany({
            where: {
                OR: [
                    { amId: { in: amUsers.map(u => u.id) } },
                    { amHoTroId: { in: amUsers.map(u => u.id) } }
                ],
                trangThaiHienTai: { not: TrangThaiDuAn.THAT_BAI }
            },
            include: {
                nhatKy: {
                    where: {
                        ngayGio: { gte: monthStart, lte: monthEnd }
                        // Removed status: APPROVED to show "any activity" as approach
                    },
                    select: { projectId: true }
                }
            }
        });

        // 3. Calculate metrics for each AM
        const amPerformanceData = amUsers.map(am => {
            // Include projects where they are either primary or support AM
            const myProjects = projects.filter(p => p.amId === am.id || p.amHoTroId === am.id);
            
            // Metric 1: soLuongTiepCan (1 Project = 1 Approach, any status except Failed)
            const soLuongTiepCan = myProjects.length;

            // Metric 2: soHopDongDaKy (Only Primary AM counts for signed tally?) 
            // Usually, count all involvements.
            const signedProjects = myProjects.filter(p => p.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG);
            const soHopDongDaKy = signedProjects.length;

            // Metric 3: doanhThuDaKy (Active monthly revenue for signed projects)
            const doanhThuDaKy = signedProjects.reduce((sum, p) => {
                const active = getActiveMonths_Utility(p.ngayBatDau, p.ngayKetThuc, monthStart, monthEnd);
                return active > 0 ? sum + (p.doanhThuTheoThang || 0) : sum;
            }, 0);

            // Metric 4: doanhThuKyVong (Full project value for expectation projects not signed yet)
            const kyVongProjects = myProjects.filter(p => p.isKyVong === true && p.trangThaiHienTai !== TrangThaiDuAn.DA_KY_HOP_DONG);
            const doanhThuKyVong = kyVongProjects.reduce((sum, p) => sum + p.tongDoanhThuDuKien, 0);

            // Metric 5: doanhThuDuKienThang (Final dashboard bar value)
            const doanhThuDuKienThang = doanhThuDaKy + doanhThuKyVong;

            return {
                id: am.id,
                name: am.name,
                soLuongTiepCan,
                soHopDongDaKy,
                doanhThuDaKy,
                doanhThuKyVong,
                doanhThuDuKienThang
            };
        });

        // Sorted by name for consistent chart labels or by revenue? 
        // User wants "Dashboard AM" to be intuitive, sorting by revenue helps see leaders.
        return amPerformanceData.sort((a, b) => b.doanhThuDuKienThang - a.doanhThuDuKienThang);
    } catch (e: any) {
        logger.error({ msg: "AM Performance Error", err: e instanceof Error ? e.message : e });
        return [];
    }
}


async function _getKPITimeSeries(userId: string, userRole: string, granularity: 'thang' | 'quy' | 'nam' = 'thang') {
    try {
        let whereClause: any = {};
        // All authenticated users see all KPI data (no role-based filtering)

        let byFields: ('nam' | 'quy' | 'thang')[] = ['nam'];
        if (granularity === 'quy') byFields.push('quy');
        if (granularity === 'thang') byFields.push('thang');

        // Use array of groups instead of fetching all projects
        const groups = await prisma.duAn.groupBy({
            by: byFields,
            where: whereClause,
            _count: { id: true },
            _sum: { tongDoanhThuDuKien: true }
        });

        // Group by for signed contracts separately
        const signedGroups = await prisma.duAn.groupBy({
            by: byFields,
            where: {
                AND: [whereClause, { trangThaiHienTai: TrangThaiDuAn.DA_KY_HOP_DONG }]
            },
            _count: { id: true }
        });

        const timeSeriesMap = new Map();

        groups.forEach((g: any) => {
            let timeKey = "";
            let sortKey = g.nam * 1000;
            if (granularity === 'nam') {
                timeKey = `${g.nam}`;
            } else if (granularity === 'quy') {
                timeKey = `Q${g.quy}/${g.nam}`;
                sortKey += g.quy! * 10;
            } else {
                timeKey = `T${g.thang}/${g.nam}`;
                sortKey += g.thang!;
            }

            // Find matching signed group
            const sg = signedGroups.find((sg: any) => 
                sg.nam === g.nam && 
                (granularity !== 'quy' || sg.quy === g.quy) &&
                (granularity !== 'thang' || sg.thang === g.thang)
            );

            timeSeriesMap.set(timeKey, {
                timeLabel: timeKey,
                revenue: g._sum.tongDoanhThuDuKien || 0,
                newProjects: g._count.id || 0,
                signedContracts: sg ? (sg._count.id || 0) : 0,
                sortKey
            });
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
        logger.error({ msg: "getKPITimeSeries Error", err: error instanceof Error ? error.message : error });
        return { error: `Lỗi tải dữ liệu KPI: ${error?.message || "Unknown error"}` } as any;
    }
}

const _cachedKPITimeSeries = unstable_cache(
    _getKPITimeSeries,
    ['kpi-timeseries'],
    { revalidate: 300 }
);

export async function getKPITimeSeries(granularity: 'thang' | 'quy' | 'nam' = 'thang') {
    const sessionRes = await (auth.api as any).getSession({ headers: await headers() });
    const user = sessionRes?.user;
    if (!user) return { error: "Yêu cầu đăng nhập" };
    return _cachedKPITimeSeries(user.id, user.role, granularity);
}

async function _getDiaBanAnalytics(userId: string, userRole: string, filter?: { type: 'all' | 'nam' | 'quy' | 'thang', year?: number, quarter?: number, month?: number }) {
    try {
        const personals = await prisma.user.findMany({
            where: {
                role: { in: ['AM', 'CV', 'USER'] as any },
                NOT: { diaBan: "Lãnh đạo" }
            },
            select: { id: true, name: true, diaBan: true }
        });

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

        const projects = await (prisma.duAn as any).findMany({
            where: projectFilter,
            select: {
                id: true,
                tongDoanhThuDuKien: true,
                doanhThuTheoThang: true,
                thang: true,
                nam: true,
                trangThaiHienTai: true,
                amId: true,
                amHoTroId: true,
                chuyenVienId: true,
                cvHoTro1Id: true,
                cvHoTro2Id: true,
                ngayKetThuc: true
            }
        });

        const diaBanMap = new Map();
        const staffMap = new Map();

        projects.forEach((p: any) => {
            const project = p as any;

            const hasTotal = project.tongDoanhThuDuKien && project.tongDoanhThuDuKien > 0;
            const hasMonthly = project.doanhThuTheoThang && project.doanhThuTheoThang > 0;

            let projRevValue = 0;
            let monthsPassed = 1;
            const pThang = project.thang || 1;
            const pNam = project.nam || currentYear;
            const ngayKetThuc = project.ngayKetThuc ? new Date(project.ngayKetThuc) : null;

            if (pNam === currentYear) {
                monthsPassed = contextMonth - pThang + 1;
            } else if (pNam < currentYear) {
                monthsPassed = (12 - pThang + 1) + contextMonth;
            }
            if (monthsPassed < 1) monthsPassed = 1;

            if (ngayKetThuc) {
                const endY = ngayKetThuc.getFullYear();
                const endM = ngayKetThuc.getMonth() + 1;
                let maxMonths = monthsPassed;
                if (endY < currentYear) {
                   maxMonths = 0; 
                } else if (endY === currentYear) {
                   if (pNam === currentYear) {
                       maxMonths = endM - pThang + 1;
                   } else {
                       maxMonths = (12 - pThang + 1) + endM;
                   }
                }
                if (monthsPassed > maxMonths) monthsPassed = Math.max(0, maxMonths);
            }

            if (monthsPassed > 0) {
                if (hasTotal && hasMonthly) {
                    projRevValue = monthsPassed * (project.doanhThuTheoThang || 0);
                } else if (hasMonthly && !hasTotal) {
                    projRevValue = monthsPassed * (project.doanhThuTheoThang || 0);
                } else if (hasTotal && !hasMonthly) {
                    projRevValue = project.tongDoanhThuDuKien;
                }
            }

            const isSigned = project.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG;

            const involvedIds = Array.from(new Set([
                project.amId,
                project.amHoTroId,
                project.chuyenVienId,
                project.cvHoTro1Id,
                project.cvHoTro2Id
            ].filter(id => !!id)));

            // Credit EACH staff member fully in staffMap
            involvedIds.forEach(id => {
                const staff = personals.find((u: any) => u.id === id);
                if (staff) {
                    const diaBan = staff.diaBan || "Chưa phân công";
                    if (!staffMap.has(staff.id)) {
                        staffMap.set(staff.id, { id: staff.id, name: staff.name, diaBan: diaBan, revenue: 0, signedRevenue: 0, otherRevenue: 0, contracts: 0, totalProjects: 0 });
                    }
                    const st = staffMap.get(staff.id);
                    st.totalProjects += 1;
                    st.revenue += projRevValue;
                    if (isSigned) {
                        st.contracts += 1;
                        st.signedRevenue += projRevValue;
                    } else {
                        st.otherRevenue += projRevValue;
                    }
                }
            });

            // Credit Dia Ban ONLY ONCE per project (usually using the main AM's location)
            const primaryAMId = project.amId || project.amHoTroId || project.chuyenVienId;
            const primaryStaff = primaryAMId ? personals.find((u: any) => u.id === primaryAMId) : null;
            const diaBan = primaryStaff?.diaBan || "Chưa phân công";

            if (!diaBanMap.has(diaBan)) {
                diaBanMap.set(diaBan, { name: diaBan, revenue: 0, signedRevenue: 0, otherRevenue: 0, projects: 0, contracts: 0, staffCount: new Set() });
            }
            const dbRef = diaBanMap.get(diaBan);
            dbRef.projects += 1;
            dbRef.revenue += projRevValue;
            if (isSigned) {
                dbRef.contracts += 1;
                dbRef.signedRevenue += projRevValue;
            } else {
                dbRef.otherRevenue += projRevValue;
            }

            // Record all distinct staff seen in this Dia Ban
            involvedIds.forEach(id => {
                const staff = personals.find((u: any) => u.id === id);
                if (staff && (staff.diaBan || "Chưa phân công") === diaBan) {
                    dbRef.staffCount.add(staff.id);
                }
            });
        });

        // 3. Fetch matching KPI
        let kpiFilter: any = {};
        if (filter?.type === 'nam' && filter.year) {
            kpiFilter.nam = filter.year;
        } else if (filter?.type === 'quy' && filter.year && filter.quarter) {
            kpiFilter.nam = filter.year;
            let qMonths: number[] = [];
            if (filter.quarter === 1) qMonths = [1, 2, 3];
            else if (filter.quarter === 2) qMonths = [4, 5, 6];
            else if (filter.quarter === 3) qMonths = [7, 8, 9];
            else if (filter.quarter === 4) qMonths = [10, 11, 12];
            kpiFilter.thang = { in: qMonths };
        } else if (filter?.type === 'thang' && filter.year && filter.month) {
            kpiFilter.nam = filter.year;
            kpiFilter.thang = filter.month;
        }

        const kpiRecords = await (prisma as any).chiTieuKpi.findMany({ where: kpiFilter });
        let kpiTotal = 0;
        kpiRecords.forEach((k: any) => {
            kpiTotal += Number(k.anNinhMang || 0) + Number(k.giaiPhapCntt || 0) + Number(k.duAnCds || 0) + Number(k.cnsAnNinh || 0);
        });

        return {
            diaBanData: Array.from(diaBanMap.values()).map(d => ({
                ...d,
                staffCount: d.staffCount.size
            })).sort((a, b) => b.revenue - a.revenue),
            topStaffData: Array.from(staffMap.values())
                .map(s => ({
                    ...s,
                    conversionRate: s.totalProjects > 0 ? (s.contracts / s.totalProjects) * 100 : 0
                }))
                .sort((a, b) => b.revenue - a.revenue),
            kpiTotal
        };
    } catch (error: any) {
        logger.error({ msg: "getDiaBanAnalytics Error", err: error instanceof Error ? error.message : error });
        return { error: `Lỗi phân tích địa bàn: ${error?.message}` } as any;
    }
}

const _cachedDiaBanAnalytics = unstable_cache(
    _getDiaBanAnalytics,
    ['diaban-analytics'],
    { revalidate: 300 }
);

export async function getDiaBanAnalytics(filter?: { type: 'all' | 'nam' | 'quy' | 'thang', year?: number, quarter?: number, month?: number }) {
    const sessionRes = await (auth.api as any).getSession({ headers: await headers() });
    const user = sessionRes?.user;
    if (!user) return { error: "Yêu cầu đăng nhập" };
    return _cachedDiaBanAnalytics(user.id, user.role, filter);
}

export async function getHoanThanhKeHoachData() {
    try {
        const kpis = await (prisma.chiTieuKpi as any).findMany({ where: { nam: 2026 } });
        const projects = await (prisma.duAn as any).findMany({
            where: { nam: 2026 },
            select: {
                id: true,
                tongDoanhThuDuKien: true,
                doanhThuTheoThang: true,
                thang: true,
                nam: true,
                trangThaiHienTai: true
            }
        });
        return { projects, kpis };
    } catch (e: any) {
        return { error: e.message };
    }
}

function getActiveMonths_Utility(start: Date, end: Date | null, periodStart: Date, periodEnd: Date): number {
  const s = start > periodStart ? start : periodStart;
  const e = !end || end > periodEnd ? periodEnd : end;
  if (s > e) return 0;
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
  return Math.max(0, months);
}

export async function getBoardOverview() {
    try {
        const now = new Date("2026-04-08T00:00:00Z");
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

        const projects = await prisma.duAn.findMany({
            where: excludeFailed,
            include: {
              am: { select: { diaBan: true } }
            }
        });

        const kpi = await prisma.chiTieuKpi.findUnique({
            where: { nam_thang: { nam: currentYear, thang: currentMonth } }
        });
        const kpiThang = kpi ? (kpi.anNinhMang + kpi.giaiPhapCntt + kpi.duAnCds + kpi.cnsAnNinh) : 0;

        const dtTongDuAn = projects.reduce((sum, p) => p.nam === currentYear ? sum + p.tongDoanhThuDuKien : sum, 0);

        const signedProjects = projects.filter(p => p.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG);
        const dtThangDaKy = signedProjects.reduce((sum, p) => {
            const active = getActiveMonths_Utility(p.ngayBatDau, p.ngayKetThuc, monthStart, monthEnd);
            return active > 0 ? sum + (p.doanhThuTheoThang || 0) : sum;
        }, 0);
        const percMetric2 = kpiThang > 0 ? (dtThangDaKy / kpiThang) * 100 : 0;

        const expectedProjects = projects.filter(p => p.isKyVong === true && p.trangThaiHienTai !== TrangThaiDuAn.DA_KY_HOP_DONG);
        const dtDuKienThang = dtThangDaKy + expectedProjects.reduce((sum, p) => sum + p.tongDoanhThuDuKien, 0);
        const percMetric3 = kpiThang > 0 ? (dtDuKienThang / kpiThang) * 100 : 0;

        const dtTheoQuy = signedProjects.reduce((sum, p) => {
            const activeInQ = getActiveMonths_Utility(p.ngayBatDau, p.ngayKetThuc, quarterStart, quarterEnd);
            return sum + ((p.doanhThuTheoThang || 0) * activeInQ);
        }, 0);

        const dtTheoNam = signedProjects.reduce((sum, p) => {
            const activeInY = getActiveMonths_Utility(p.ngayBatDau, p.ngayKetThuc, yearStart, yearEnd);
            return sum + ((p.doanhThuTheoThang || 0) * activeInY);
        }, 0);

        const allProjectsForStatus = await prisma.duAn.findMany({ select: { trangThaiHienTai: true } });
        const hienTrangThang = [
            { label: "Mới", count: allProjectsForStatus.filter(p => p.trangThaiHienTai === TrangThaiDuAn.MOI).length },
            { label: "Đang làm việc", count: allProjectsForStatus.filter(p => p.trangThaiHienTai === TrangThaiDuAn.DANG_LAM_VIEC).length },
            { label: "Đã demo", count: allProjectsForStatus.filter(p => p.trangThaiHienTai === TrangThaiDuAn.DA_DEMO).length },
            { label: "Đã gửi báo giá", count: allProjectsForStatus.filter(p => p.trangThaiHienTai === TrangThaiDuAn.DA_GUI_BAO_GIA).length },
            { label: "Đã ký hợp đồng", count: allProjectsForStatus.filter(p => p.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG).length },
            { label: "Thất bại", count: allProjectsForStatus.filter(p => p.trangThaiHienTai === TrangThaiDuAn.THAT_BAI).length }
        ];

        const stepCounts: Record<string, number> = {};
        projects.forEach(p => {
            const step = p.hienTaiBuoc || "Chưa cập nhật";
            stepCounts[step] = (stepCounts[step] || 0) + 1;
        });

        const fifteenDaysAgo = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000));
        const alertTo: Record<string, number> = { "Tổ 1": 0, "Tổ 2": 0, "Tổ 3": 0, "Tổ dự án": 0 };
        projects.forEach(p => {
            const lastUpdate = p.ngayChamsocCuoiCung ? new Date(p.ngayChamsocCuoiCung) : new Date(p.createdAt);
            if (lastUpdate < fifteenDaysAgo) {
                const diaBan = p.am?.diaBan || "";
                if (alertTo.hasOwnProperty(diaBan)) alertTo[diaBan]++;
            }
        });

        return {
            revenueMetrics: {
                dtTongDuAn,
                dtThangDaKyValue: dtThangDaKy,
                dtThangDaKyPerc: percMetric2,
                dtDuKienThangValue: dtDuKienThang,
                dtDuKienThangPerc: percMetric3,
                dtTheoQuy,
                dtTheoNam
            },
            projectMetrics: {
                tongSoDuAn: projects.length,
                duAnTrongDiem: projects.filter(p => p.isTrongDiem).length,
                hienTrangThang,
                thongKeTheoBuoc: Object.entries(stepCounts).map(([label, count]) => ({ label, count })),
                canhBaoTheoTo: Object.entries(alertTo).map(([label, count]) => ({ label, count }))
            }
        };
    } catch (e: any) {
        return { error: e.message };
    }
}

