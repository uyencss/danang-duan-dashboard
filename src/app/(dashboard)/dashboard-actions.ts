"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { TrangThaiDuAn, UserRole } from "@prisma/client";
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
        console.error("Dashboard Stats Error:", error);
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
        const currentMonth = now.getFullYear() === currentYear ? now.getMonth() + 1 : 12;
        let contextMonth = currentMonth;
        let isSingleMonth = false;

        if (filter?.type === 'nam' && filter.year) {
            projectFilter.nam = filter.year;
            contextMonth = filter.year < currentYear ? 12 : currentMonth;
        } else if (filter?.type === 'quy' && filter.year && filter.quarter) {
            projectFilter.nam = filter.year;
            // Fetch all projects for the year, filter manually in memory
            const quarterEndMonth = filter.quarter * 3;
            contextMonth = filter.year < currentYear ? quarterEndMonth : Math.min(quarterEndMonth, currentMonth);
        } else if (filter?.type === 'thang' && filter.year && filter.month) {
            projectFilter.nam = filter.year;
            // Fetch all projects for the year, filter manually in memory
            contextMonth = filter.month;
            isSingleMonth = true;
        }

        // Fetch users who are personnel (AM, CV, USER)
        const personals = await prisma.user.findMany({
            where: {
                role: { in: ['AM', 'CV', 'USER'] as any },
                NOT: { diaBan: "Lãnh đạo" }
            },
            select: { id: true, name: true, diaBan: true, role: true }
        });

        const analytics = personals.map((p: any) => ({
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
            where: projectFilter,
            select: {
                amId: true,
                amHoTroId: true,
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

        let uniqueSignedRevenue = 0;
        let uniqueOtherRevenue = 0;
        let uniqueContracts = 0;
        let uniqueProjects = 0;

        projects.forEach((proj: any) => {
            const involvedIds = [
                (proj as any).amId,
                (proj as any).amHoTroId,
                (proj as any).chuyenVienId,
                (proj as any).cvHoTro1Id,
                (proj as any).cvHoTro2Id
            ].filter((id): id is string => !!id);

            const hasTotal = proj.tongDoanhThuDuKien && proj.tongDoanhThuDuKien > 0;
            const hasMonthly = (proj as any).doanhThuTheoThang && (proj as any).doanhThuTheoThang > 0;
            const pThang = (proj as any).thang || 1;

            let projRevValue = 0;

            const ngayKetThuc = (proj as any).ngayKetThuc ? new Date((proj as any).ngayKetThuc) : null;

            if (isSingleMonth) {
                // Check if project ended before this context month
                const isEndedBeforeM = ngayKetThuc && (
                    ngayKetThuc.getFullYear() < (filter?.year || currentYear) ||
                    (ngayKetThuc.getFullYear() === (filter?.year || currentYear) && (ngayKetThuc.getMonth() + 1) < contextMonth)
                );

                if (!isEndedBeforeM) {
                    if (hasMonthly) {
                        if (pThang <= contextMonth) {
                            projRevValue = (proj as any).doanhThuTheoThang!;
                        }
                    } else if (hasTotal) {
                        if (pThang === contextMonth) {
                            projRevValue = proj.tongDoanhThuDuKien;
                        }
                    }
                }
            } else {
                // Period cumulative logic
                if (pThang <= contextMonth) {
                    let monthsPassed = contextMonth - pThang + 1;
                    
                    if (ngayKetThuc && ngayKetThuc.getFullYear() <= (filter?.year || currentYear)) {
                       const endM = ngayKetThuc.getMonth() + 1;
                       const maxActive = endM - pThang + 1;
                       if (ngayKetThuc.getFullYear() < (filter?.year || currentYear)) {
                           monthsPassed = 0;
                       } else if (monthsPassed > maxActive) {
                           monthsPassed = Math.max(0, maxActive);
                       }
                    }

                    if (monthsPassed < 1 && !ngayKetThuc) monthsPassed = 1;

                    if (monthsPassed > 0) {
                        if (hasMonthly) {
                            projRevValue = monthsPassed * (proj as any).doanhThuTheoThang!;
                        } else if (hasTotal) {
                            projRevValue = proj.tongDoanhThuDuKien;
                        }
                    }
                }
            }

            if (projRevValue === 0) return;

            uniqueProjects++;
            if (proj.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG) {
                uniqueSignedRevenue += projRevValue;
                uniqueContracts++;
            } else if (proj.trangThaiHienTai !== TrangThaiDuAn.THAT_BAI) {
                uniqueOtherRevenue += projRevValue;
            }

            involvedIds.forEach(id => {
                const stat = analytics.find((a: any) => a.id === id);
                if (!stat) return;

                stat.projects += 1;
                stat.totalRevenue += projRevValue;

                if (proj.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG) {
                    stat.signedRevenue += projRevValue;
                    stat.contracts += 1;
                } else if (proj.trangThaiHienTai !== TrangThaiDuAn.THAT_BAI) {
                    stat.otherRevenue += projRevValue;
                }
            });
        });

        // Map for compatibility with older dashboard views
        const finalAnalytics = analytics.map((a: any) => ({
            ...a,
            revenue: a.totalRevenue,
            count: a.projects,
            signed: a.contracts
        }));

        const analyticsSorted = finalAnalytics.sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

        // Filter and sort for AMs
        const amAnalytics = finalAnalytics.filter((a: any) => (a.role as string) === 'AM');
        const topAMSigned = [...amAnalytics]
            .filter((a: any) => a.signedRevenue > 0)
            .sort((a, b) => b.signedRevenue - a.signedRevenue)
            .slice(0, 5);
        const topAMOthers = [...amAnalytics]
            .filter((a: any) => a.otherRevenue > 0)
            .sort((a, b) => b.otherRevenue - a.otherRevenue)
            .slice(0, 5);

        // Filter and sort for CVs
        const cvAnalytics = finalAnalytics.filter((a: any) => (a.role as string) === 'CV');
        const topCVSigned = [...cvAnalytics]
            .filter((a: any) => a.signedRevenue > 0)
            .sort((a, b) => b.signedRevenue - a.signedRevenue)
            .slice(0, 5);
        const topCVOthers = [...cvAnalytics]
            .filter((a: any) => a.otherRevenue > 0)
            .sort((a, b) => b.otherRevenue - a.otherRevenue)
            .slice(0, 5);

        // Lowest Revenue rankings (Bottom 5)
        const bottomAMSigned = [...amAnalytics]
            .sort((a, b) => a.signedRevenue - b.signedRevenue)
            .slice(0, 5);
        const bottomAMOthers = [...amAnalytics]
            .sort((a, b) => a.otherRevenue - b.otherRevenue)
            .slice(0, 5);

        const bottomCVSigned = [...cvAnalytics]
            .sort((a, b) => a.signedRevenue - b.signedRevenue)
            .slice(0, 5);
        const bottomCVOthers = [...cvAnalytics]
            .sort((a, b) => a.otherRevenue - b.otherRevenue)
            .slice(0, 5);

        return {
            data: analyticsSorted,
            summary: {
                totalSignedRevenue: uniqueSignedRevenue,
                totalOtherRevenue: uniqueOtherRevenue,
                totalContracts: uniqueContracts,
                totalProjects: uniqueProjects
            },
            topAMSigned,
            topAMOthers,
            topCVSigned,
            topCVOthers,
            bottomAMSigned,
            bottomAMOthers,
            bottomCVSigned,
            bottomCVOthers
        };
    } catch (error: any) {
        console.error("getAMPerformance Error:", error);
        return { error: `Lỗi tải dữ liệu AM: ${error?.message || "Unknown error"}` };
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
        console.error("getKPITimeSeries Error:", error);
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
        console.error("getDiaBanAnalytics Error:", error);
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
