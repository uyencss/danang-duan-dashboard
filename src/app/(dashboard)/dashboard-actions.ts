"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { TrangThaiDuAn, UserRole, LogStatus } from "@prisma/client";
import { logger } from "@/lib/logger";
import { unstable_cache } from "next/cache";
import { getDeduplicatedMasterRevenue } from "@/lib/utils/master-revenue-sync";

// Cache TTL: 5 minutes. Keyed by user id+role so ADMIN and non-ADMIN get separate caches.
async function _getDashboardOverview(userId: string, userRole: string) {
    try {
        const whereClause: any = {
            isPendingDelete: { not: true }
        };
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

        // Urgent care: null or > 10 days ago (Standardized to 10 days as per business request)
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        const urgentWhere = {
            AND: [
                whereClause,
                {
                    OR: [
                        { ngayChamsocCuoiCung: null },
                        { ngayChamsocCuoiCung: { lt: tenDaysAgo } }
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
    { revalidate: 300, tags: ['dashboard-overview'] }
);

// Public export: resolves session outside cache, then calls module-level cached fn
export async function getDashboardOverview() {
    const sessionRes = await (auth.api as any).getSession({ headers: await headers() });
    const user = sessionRes?.user;
    if (!user) return { error: "Yêu cầu đăng nhập" };
    // Bỏ qua cache để cập nhật tức thì khi đang xử lý dữ liệu lỗi
    return _getDashboardOverview(user.id, user.role);
}

export async function getAMPerformance(selectedMonth?: number) {
    try {
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const currentMonth = selectedMonth || now.getUTCMonth() + 1;
        const monthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
        const monthEnd = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59));

        // 1. Fetch all AM users
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
            select: {
                id: true,
                amId: true,
                amHoTroId: true,
                trangThaiHienTai: true,
                isKyVong: true,
                tongDoanhThuDuKien: true,
                nam: true,
                thang: true,
                ngayBatDau: true,
                ngayKetThuc: true,
            }
        });

        // 3. Get deduped MasterRevenue slices for this month
        //    (Same source of truth as Board Overview — getBoardOverview)
        const slices = await getDeduplicatedMasterRevenue(currentYear, currentMonth);

        // Build map: projectId -> total monthly revenue from MasterRevenue
        const projectMonthRevenue = new Map<number, number>();
        for (const s of slices) {
            const prev = projectMonthRevenue.get(s.projectId) || 0;
            projectMonthRevenue.set(s.projectId, prev + s.doanhThu);
        }

        // 4. Calculate metrics for each AM
        const amPerformanceData = amUsers.map(am => {
            const myProjects = projects.filter(p => p.amId === am.id || p.amHoTroId === am.id);

            // ── Filter projects active in the selected month (date range overlap) ──
            const activeInMonth = myProjects.filter(p => {
                const start = new Date(p.ngayBatDau);
                if (start > monthEnd) return false; // starts after this month
                if (p.ngayKetThuc) {
                    const end = new Date(p.ngayKetThuc);
                    if (end < monthStart) return false; // ended before this month
                }
                return true;
            });

            // Metric 1: soLuongTiepCan — projects active in selected month
            const soLuongTiepCan = activeInMonth.length;

            // Metric 2: soHopDongDaKy — signed projects with revenue in selected month
            const signedWithRevenue = activeInMonth.filter(p =>
                p.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG &&
                projectMonthRevenue.has(p.id)
            );
            const soHopDongDaKy = signedWithRevenue.length;

            // Metric 3: doanhThuDaKy — from MasterRevenue (consistent with Board Overview)
            const doanhThuDaKy = signedWithRevenue.reduce((sum, p) => {
                return sum + (projectMonthRevenue.get(p.id) || 0);
            }, 0);

            // Metric 4: doanhThuKyVong — expectation projects targeted for this month
            const kyVongProjects = activeInMonth.filter(p => 
                p.isKyVong === true && 
                p.trangThaiHienTai !== TrangThaiDuAn.DA_KY_HOP_DONG &&
                p.trangThaiHienTai !== TrangThaiDuAn.THAT_BAI &&
                p.nam === currentYear &&
                p.thang === currentMonth
            );
            const doanhThuKyVong = kyVongProjects.reduce((sum, p) => sum + p.tongDoanhThuDuKien, 0);

            // Metric 5: doanhThuDuKienThang
            const doanhThuDuKienThang = doanhThuDaKy + doanhThuKyVong;

            // ── Convert to triệu đồng ──
            const doanhThuDaKyTrieu = Math.round(doanhThuDaKy / 1_000_000);
            const doanhThuKyVongTrieu = Math.round(doanhThuKyVong / 1_000_000);
            const doanhThuDuKienThangTrieu = Math.round(doanhThuDuKienThang / 1_000_000);

            return {
                id: am.id,
                name: am.name,
                soLuongTiepCan,
                soHopDongDaKy,
                doanhThuDaKy: doanhThuDaKyTrieu,
                doanhThuKyVong: doanhThuKyVongTrieu,
                doanhThuDuKienThang: doanhThuDuKienThangTrieu
            };
        });

        return amPerformanceData.sort((a, b) => b.doanhThuDuKienThang - a.doanhThuDuKienThang);
    } catch (e: any) {
        logger.error({ msg: "AM Performance Error", err: e instanceof Error ? e.message : e });
        return [];
    }
}


async function _getKPITimeSeries(userId: string, userRole: string, granularity: 'thang' | 'quy' | 'nam' = 'thang') {
    try {
        let whereClause: any = {
            trangThaiHienTai: { not: TrangThaiDuAn.THAT_BAI },
            isPendingDelete: { not: true }
        };
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
                revenue: Math.round((g._sum.tongDoanhThuDuKien || 0) / 1_000_000),
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

        let projectFilter: any = {
            trangThaiHienTai: { not: TrangThaiDuAn.THAT_BAI },
            isPendingDelete: { not: true }
        };
        const now = new Date();
        const currentYear = 2026;
        let contextMonth = now.getFullYear() === currentYear ? now.getMonth() + 1 : 12;

        let kpiFilter: any = { nam: currentYear }; // Default to current year 2026

        if (filter?.type === 'nam' && filter.year) {
            kpiFilter.nam = filter.year;
            if (filter.year !== currentYear) contextMonth = 12;
        } else if (filter?.type === 'quy' && filter.year && filter.quarter) {
            contextMonth = filter.quarter * 3;
            kpiFilter.nam = filter.year;
            const qMonths = filter.quarter === 1 ? [1, 2, 3] : filter.quarter === 2 ? [4, 5, 6] : filter.quarter === 3 ? [7, 8, 9] : [10, 11, 12];
            kpiFilter.thang = { in: qMonths };
        } else if (filter?.type === 'thang' && filter.year && filter.month) {
            contextMonth = filter.month;
            kpiFilter.nam = filter.year;
            kpiFilter.thang = filter.month;
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
                ngayBatDau: true,
                ngayKetThuc: true
            }
        });

        const diaBanMap = new Map();
        const staffMap = new Map();

        projects.forEach((p: any) => {
            const project = p as any;

            const hasTotal = project.tongDoanhThuDuKien && project.tongDoanhThuDuKien > 0;
            const hasMonthly = project.doanhThuTheoThang && project.doanhThuTheoThang > 0;

            const pStart = new Date(project.ngayBatDau);
            const pEnd = project.ngayKetThuc ? new Date(project.ngayKetThuc) : null;
            
            // Period calculation (Consistent with getBoardOverview)
            let periodStart: Date;
            let periodEnd: Date;

            if (filter?.type === 'thang' && filter.month) {
                periodStart = new Date(Date.UTC(currentYear, filter.month - 1, 1));
                periodEnd = new Date(Date.UTC(currentYear, filter.month, 0, 23, 59, 59));
            } else if (filter?.type === 'quy' && filter.quarter) {
                periodStart = new Date(Date.UTC(currentYear, (filter.quarter - 1) * 3, 1));
                periodEnd = new Date(Date.UTC(currentYear, (filter.quarter - 1) * 3 + 3, 0, 23, 59, 59));
            } else {
                // Year or ALL
                const targetYear = filter?.year || currentYear;
                periodStart = new Date(Date.UTC(targetYear, 0, 1));
                periodEnd = new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59));
            }

            const activeMonths = getActiveMonths_Utility(pStart, pEnd, periodStart, periodEnd);
            
            const projRevValue = calculateEffectiveRevenue_Utility(project, periodStart, periodEnd);

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

        const kpiRecords = await (prisma as any).chiTieuKpi.findMany({ where: kpiFilter });
        let kpiTotal = 0;
        kpiRecords.forEach((k: any) => {
            kpiTotal += Number(k.anNinhMang || 0) + Number(k.giaiPhapCntt || 0) + Number(k.duAnCds || 0) + Number(k.cnsAnNinh || 0) + Number(k.cloudDc || 0);
        });

        return {
            diaBanData: Array.from(diaBanMap.values()).map(({ staffCount, ...rest }) => ({
                ...rest,
                revenue: Math.round(rest.revenue / 1_000_000),
                signedRevenue: Math.round(rest.signedRevenue / 1_000_000),
                otherRevenue: Math.round(rest.otherRevenue / 1_000_000),
                staffCount: staffCount.size
            })).sort((a, b) => b.revenue - a.revenue),
            topStaffData: Array.from(staffMap.values())
                .map(s => ({
                    ...s,
                    revenue: Math.round(s.revenue / 1_000_000),
                    signedRevenue: Math.round(s.signedRevenue / 1_000_000),
                    otherRevenue: Math.round(s.otherRevenue / 1_000_000),
                    conversionRate: s.totalProjects > 0 ? (s.contracts / s.totalProjects) * 100 : 0
                }))
                .sort((a, b) => b.revenue - a.revenue),
            kpiTotal: Math.round(kpiTotal)
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

/**
 * QUY TẮC TÍNH TOÁN BẮT BUỘC (MANDATORY REVENUE LOGIC)
 * 1. Sử dụng khoảng nửa mở [Tháng Bắt đầu, Tháng Kết thúc).
 * 2. Loại trừ tháng kết thúc: Nếu dự án kết thúc trong tháng X, tháng X KHÔNG tính doanh thu.
 * 3. Dự án bán đứt: Nếu bắt đầu & kết thúc cùng tháng, tính 1 tháng duy nhất.
 * 4. Luôn sử dụng UTC Midnight để tính toán để tránh lệch múi giờ.
 * KHÔNG THAY ĐỔI trừ khi có yêu cầu nghiệp vụ mới.
 */
function getActiveMonths_Utility(start: Date, end: Date | null, periodStart: Date, periodEnd: Date): number {
    const sMY = start.getUTCFullYear() * 12 + start.getUTCMonth();
    const psMY = periodStart.getUTCFullYear() * 12 + periodStart.getUTCMonth();
    const peMY = periodEnd.getUTCFullYear() * 12 + periodEnd.getUTCMonth();

    if (end) {
        const eMY = end.getUTCFullYear() * 12 + end.getUTCMonth();
        
        // TRƯỜNG HỢP ĐẶC BIỆT: Dự án bán đứt (Bắt đầu và kết thúc trong cùng 1 tháng)
        if (sMY === eMY) {
            // Chỉ ghi nhận nếu tháng đang xét nằm trong khoảng period
            return (psMY <= sMY && sMY <= peMY) ? 1 : 0;
        }

        // TRƯỜNG HỢP DỰ ÁN KÉO DÀI: Đến tháng kết thúc thì KHÔNG ghi nhận nữa
        // Tức là tháng active cuối cùng là eMY - 1
        const lastActiveMY = eMY - 1;

        // Xác định khoảng giao nhau giữa [sMY, lastActiveMY] và [psMY, peMY]
        const rangeStart = Math.max(sMY, psMY);
        const rangeEnd = Math.min(lastActiveMY, peMY);

        if (rangeStart > rangeEnd) return 0;
        return rangeEnd - rangeStart + 1;
    }

    // Dự án không có ngày kết thúc (active mãi mãi)
    const rangeStart = Math.max(sMY, psMY);
    const rangeEnd = peMY;

    if (rangeStart > rangeEnd) return 0;
    return rangeEnd - rangeStart + 1;
}

/**
 * Centralized revenue calculation logic for signed projects.
 * Follows business rules for monthly recognition and total value capping.
 */
function calculateEffectiveRevenue_Utility(p: { 
    ngayBatDau: Date; 
    ngayKetThuc: Date | null; 
    doanhThuTheoThang: number | null; 
    tongDoanhThuDuKien: number 
}, periodStart: Date, periodEnd: Date): number {
    const active = getActiveMonths_Utility(new Date(p.ngayBatDau), p.ngayKetThuc ? new Date(p.ngayKetThuc) : null, periodStart, periodEnd);
    if (active <= 0) return 0;

    // 1. If monthly revenue is provided, distribute it across active months
    if (p.doanhThuTheoThang && p.doanhThuTheoThang > 0) {
        const totalInPeriod = p.doanhThuTheoThang * active;
        // Apply cap: Resulting revenue in any window cannot exceed project's total value
        return Math.min(totalInPeriod, p.tongDoanhThuDuKien);
    } 
    
    // 2. Fallback for one-off projects (Bán đứt) where monthly is 0 or missing
    // Recognize full amount in the START month.
    const start = new Date(p.ngayBatDau);
    const sMY = start.getUTCFullYear() * 12 + start.getUTCMonth();
    const psMY = periodStart.getUTCFullYear() * 12 + periodStart.getUTCMonth();
    const peMY = periodEnd.getUTCFullYear() * 12 + periodEnd.getUTCMonth();
    
    if (sMY >= psMY && sMY <= peMY) {
        return p.tongDoanhThuDuKien;
    }

    return 0;
}

export async function getBoardOverview(selectedMonth?: number, selectedQuarter?: number) {
    try {
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const actualCurrentMonth = now.getUTCMonth() + 1;
        
        const currentMonth = selectedMonth || actualCurrentMonth;
        const currentQuarter = selectedQuarter || Math.ceil(actualCurrentMonth / 3);

        const excludeActive = {
            AND: [
                { NOT: { trangThaiHienTai: TrangThaiDuAn.THAT_BAI } },
                { isPendingDelete: { not: true } }
            ]
        };

        const monthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
        const monthEnd = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59));

        const quarterStartMonth = (currentQuarter - 1) * 3;
        const quarterStart = new Date(Date.UTC(currentYear, quarterStartMonth, 1));
        const quarterEnd = new Date(Date.UTC(currentYear, quarterStartMonth + 3, 0, 23, 59, 59));

        const yearStart = new Date(Date.UTC(currentYear, 0, 1));
        const yearEnd = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59));

        // Query all projects that are not pending delete
        const allProjects = await prisma.duAn.findMany({
            where: { isPendingDelete: { not: true } },
            select: {
               id: true,
               tenDuAn: true,
               nam: true,
               thang: true,
               quy: true,
               tongDoanhThuDuKien: true,
               trangThaiHienTai: true,
               isKyVong: true,
               ngayBatDau: true,
               ngayKetThuc: true,
               doanhThuTheoThang: true,
               hienTaiBuoc: true,
               ngayChamsocCuoiCung: true,
               createdAt: true,
               isTrongDiem: true,
               am: { select: { diaBan: true } },
               chuyenVien: { select: { diaBan: true } },
               nhatKy: {
                 orderBy: { ngayGio: 'desc' },
                 take: 1,
                 select: { ngayGio: true }
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

        const getCountFor = (s: TrangThaiDuAn) => uniqueProjects.filter(p => p.trangThaiHienTai === s).length;

        const hienTrangThang = [
            { label: "Mới", count: getCountFor(TrangThaiDuAn.MOI) },
            { label: "Đang làm việc", count: getCountFor(TrangThaiDuAn.DANG_LAM_VIEC) },
            { label: "Đã demo", count: getCountFor(TrangThaiDuAn.DA_DEMO) },
            { label: "Đã gửi báo giá", count: getCountFor(TrangThaiDuAn.DA_GUI_BAO_GIA) },
            { label: "Đã ký hợp đồng", count: getCountFor(TrangThaiDuAn.DA_KY_HOP_DONG) },
            { label: "Thất bại", count: getCountFor(TrangThaiDuAn.THAT_BAI) }
        ];

        // Get deduplicated MasterRevenue slices for the current year
        const slices = await getDeduplicatedMasterRevenue(currentYear);

        const allKpis = await prisma.chiTieuKpi.findMany({
            where: { nam: currentYear }
        });
        
        const quarterMonths = [(currentQuarter - 1) * 3 + 1, (currentQuarter - 1) * 3 + 2, (currentQuarter - 1) * 3 + 3];

        let kpiThang = 0;
        let kpiQuy = 0;
        let kpiNam = 0;

        allKpis.forEach(k => {
            const sum = Number(k.anNinhMang) + Number(k.giaiPhapCntt) + Number(k.duAnCds) + Number(k.cnsAnNinh) + Number(k.cloudDc);
            kpiNam += sum;
            if (k.thang === currentMonth) {
                kpiThang += sum;
            }
            if (quarterMonths.includes(k.thang)) {
                kpiQuy += sum;
            }
        });

        // 1. DT Tổng dự án
        const signedSlices = slices.filter(s => s.duAn.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG);
        const rawSignedYearlyRevenue = signedSlices.reduce((sum, s) => sum + s.doanhThu, 0);

        const nonSignedActiveProjects = uniqueProjects.filter(p => 
            p.trangThaiHienTai !== TrangThaiDuAn.DA_KY_HOP_DONG &&
            p.trangThaiHienTai !== TrangThaiDuAn.THAT_BAI
        );
        const rawNonSignedRevenue = nonSignedActiveProjects.reduce((sum, p) => sum + p.tongDoanhThuDuKien, 0);
        const rawDtTongDuAn = rawSignedYearlyRevenue + rawNonSignedRevenue;

        // 2. DT Tháng đã ký
        const currentMonthSlices = slices.filter(s => s.thang === currentMonth);
        const signedCurrentMonthSlices = currentMonthSlices.filter(s => s.duAn.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG);
        const rawDtThangDaKy = signedCurrentMonthSlices.reduce((sum, s) => sum + s.doanhThu, 0);

        // 3. DT Dự kiến tháng
        const expectedProjectsInMonth = uniqueProjects.filter(p => 
            p.isKyVong === true && 
            p.trangThaiHienTai !== TrangThaiDuAn.DA_KY_HOP_DONG &&
            p.trangThaiHienTai !== TrangThaiDuAn.THAT_BAI &&
            p.nam === currentYear &&
            p.thang === currentMonth
        );
        const rawExpectedRevenue = expectedProjectsInMonth.reduce((sum, p) => sum + p.tongDoanhThuDuKien, 0);
        const rawDtDuKienThang = rawDtThangDaKy + rawExpectedRevenue;

        // 4. DT theo quý
        const quarterSlices = signedSlices.filter(s => quarterMonths.includes(s.thang));
        const rawDtTheoQuy = quarterSlices.reduce((sum, s) => sum + s.doanhThu, 0);

        const expectedProjectsInQuarter = uniqueProjects.filter(p => 
            p.isKyVong === true && 
            p.trangThaiHienTai !== TrangThaiDuAn.DA_KY_HOP_DONG &&
            p.trangThaiHienTai !== TrangThaiDuAn.THAT_BAI &&
            p.nam === currentYear &&
            p.thang && quarterMonths.includes(p.thang)
        );
        const rawExpectedRevenueQuarter = expectedProjectsInQuarter.reduce((sum, p) => sum + p.tongDoanhThuDuKien, 0);
        const rawDtDuKienQuy = rawDtTheoQuy + rawExpectedRevenueQuarter;

        // 5. DT theo năm
        const rawDtTheoNam = signedSlices.reduce((sum, s) => sum + s.doanhThu, 0);

        const expectedProjectsInYear = uniqueProjects.filter(p => 
            p.isKyVong === true && 
            p.trangThaiHienTai !== TrangThaiDuAn.DA_KY_HOP_DONG &&
            p.trangThaiHienTai !== TrangThaiDuAn.THAT_BAI &&
            p.nam === currentYear
        );
        const rawExpectedRevenueYear = expectedProjectsInYear.reduce((sum, p) => sum + p.tongDoanhThuDuKien, 0);
        const rawDtDuKienNam = rawDtTheoNam + rawExpectedRevenueYear;

        // ── Convert to triệu đồng ONCE at the very end ──
        const dtTongDuAn = Math.round(rawDtTongDuAn / 1_000_000);
        const dtThangDaKy = Math.round(rawDtThangDaKy / 1_000_000);
        const dtDuKienThang = Math.round(rawDtDuKienThang / 1_000_000);
        const dtTheoQuy = Math.round(rawDtTheoQuy / 1_000_000);
        const dtDuKienQuy = Math.round(rawDtDuKienQuy / 1_000_000);
        const dtTheoNam = Math.round(rawDtTheoNam / 1_000_000);
        const dtDuKienNam = Math.round(rawDtDuKienNam / 1_000_000);

        const percMetric2 = kpiThang > 0 ? (dtThangDaKy / kpiThang) * 100 : 0;
        const percMetric3 = kpiThang > 0 ? (dtDuKienThang / kpiThang) * 100 : 0;
        const percTheoQuy = kpiQuy > 0 ? (dtTheoQuy / kpiQuy) * 100 : 0;
        const percDuKienQuy = kpiQuy > 0 ? (dtDuKienQuy / kpiQuy) * 100 : 0;
        const percTheoNam = kpiNam > 0 ? (dtTheoNam / kpiNam) * 100 : 0;
        const percDuKienNam = kpiNam > 0 ? (dtDuKienNam / kpiNam) * 100 : 0;

        const projectsFull = uniqueProjects.filter(p => p.trangThaiHienTai !== TrangThaiDuAn.THAT_BAI);

        const stepCounts: Record<string, number> = {};
        projectsFull.forEach(p => {
            const step = p.hienTaiBuoc || "Chưa cập nhật";
            stepCounts[step] = (stepCounts[step] || 0) + 1;
        });

        const tenDaysAgoThreshold = new Date();
        tenDaysAgoThreshold.setDate(tenDaysAgoThreshold.getDate() - 10);
        
        const alertTo: Record<string, number> = { "Tổ 1": 0, "Tổ 2": 0, "Tổ 3": 0, "Tổ dự án": 0 };
        
        projectsFull.forEach(p => {
            const pAny = p as any;
            const lastLog = pAny.nhatKy?.[0]?.ngayGio;
            const lastUpdate = lastLog ? new Date(lastLog) : (p.ngayChamsocCuoiCung ? new Date(p.ngayChamsocCuoiCung) : new Date(p.createdAt));
            
            if (lastUpdate < tenDaysAgoThreshold) {
                const amGroup = pAny.am?.diaBan;
                const cvGroup = pAny.chuyenVien?.diaBan;
                
                // Add to teams based on involvement
                const involvedTeams = new Set<string>();
                if (amGroup && alertTo.hasOwnProperty(amGroup)) involvedTeams.add(amGroup);
                if (cvGroup && alertTo.hasOwnProperty(cvGroup)) involvedTeams.add(cvGroup);
                
                // If CV is in Project Team but AM is elsewhere, count both
                // If they are in different teams, count both to make sure no one misses it
                involvedTeams.forEach(team => {
                    alertTo[team]++;
                });
            }
        });


        return {
            revenueMetrics: {
                dtTongDuAn,
                dtThangDaKyValue: dtThangDaKy,
                dtThangDaKyPerc: percMetric2,
                dtDuKienThangValue: dtDuKienThang,
                dtDuKienThangPerc: percMetric3,
                dtTheoQuyValue: dtTheoQuy,
                dtTheoQuyPerc: percTheoQuy,
                dtDuKienQuyValue: dtDuKienQuy,
                dtDuKienQuyPerc: percDuKienQuy,
                dtTheoNamValue: dtTheoNam,
                dtTheoNamPerc: percTheoNam,
                dtDuKienNamValue: dtDuKienNam,
                dtDuKienNamPerc: percDuKienNam,
            },
            projectMetrics: {
                tongSoDuAn: projectsFull.length,
                duAnTrongDiem: projectsFull.filter(p => p.isTrongDiem).length,
                duAnKyVong: projectsFull.filter(p => p.isKyVong).length,
                hienTrangThang,
                thongKeTheoBuoc: Object.entries(stepCounts).map(([label, count]) => ({ label, count })),
                canhBaoTheoTo: Object.entries(alertTo).map(([label, count]) => ({ label, count }))
            }
        };
    } catch (e: any) {
        return { error: e.message };
    }
}

