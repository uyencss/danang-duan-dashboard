import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { TrangThaiDuAn } from "@prisma/client";

function getActiveMonths(start: Date, end: Date | null, periodStart: Date, periodEnd: Date): number {
    const sMY = start.getUTCFullYear() * 12 + start.getUTCMonth();
    const psMY = periodStart.getUTCFullYear() * 12 + periodStart.getUTCMonth();
    const peMY = periodEnd.getUTCFullYear() * 12 + periodEnd.getUTCMonth();

    if (end) {
        const eMY = end.getUTCFullYear() * 12 + end.getUTCMonth();
        if (sMY === eMY) {
            return (psMY <= sMY && sMY <= peMY) ? 1 : 0;
        }
        const lastActiveMY = eMY - 1;
        const rangeStart = Math.max(sMY, psMY);
        const rangeEnd = Math.min(lastActiveMY, peMY);
        if (rangeStart > rangeEnd) return 0;
        return rangeEnd - rangeStart + 1;
    }
    const rangeStart = Math.max(sMY, psMY);
    const rangeEnd = peMY;
    if (rangeStart > rangeEnd) return 0;
    return rangeEnd - rangeStart + 1;
}

export async function POST(req: Request) {
    try {
        const { startDate, endDate, includeExpected } = await req.json();
        const start = new Date(startDate);
        const end = new Date(endDate);

        const sYear = start.getUTCFullYear();
        const eYear = end.getUTCFullYear();
        const sMonth = start.getUTCMonth() + 1;
        const eMonth = end.getUTCMonth() + 1;

        // Calculate Target (KPI)
        const kpis = await prisma.chiTieuKpi.findMany();
        let target = 0;
        kpis.forEach(k => {
            const kMY = k.nam * 12 + k.thang;
            const sMY = sYear * 12 + sMonth;
            const eMY = eYear * 12 + eMonth;
            if (kMY >= sMY && kMY <= eMY) {
                target += Number(k.anNinhMang || 0) + Number(k.giaiPhapCntt || 0) + Number(k.duAnCds || 0) + Number(k.cnsAnNinh || 0) + Number(k.cloudDc || 0);
            }
        });

        // Calculate Actual
        const projects = await prisma.duAn.findMany({
            where: {
                isPendingDelete: { not: true },
                trangThaiHienTai: { not: TrangThaiDuAn.THAT_BAI }
            }
        });

        let actual = 0;
        projects.forEach(p => {
            const isSigned = p.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG;
            const isExpected = p.isKyVong === true && !isSigned;

            if (isSigned || (includeExpected && isExpected)) {
                const activeMonths = getActiveMonths(new Date(p.ngayBatDau), p.ngayKetThuc ? new Date(p.ngayKetThuc) : null, start, end);
                if (activeMonths > 0) {
                    let totalInPeriod = 0;
                    if (p.doanhThuTheoThang) {
                        totalInPeriod = p.doanhThuTheoThang * activeMonths;
                    } else if (p.soKy1GoiCuoc) {
                        totalInPeriod = ((p.tongDoanhThuDuKien || 0) / p.soKy1GoiCuoc) * activeMonths;
                    } else {
                        // If no monthly breakdown is available, assume the total expected revenue is counted
                        totalInPeriod = p.tongDoanhThuDuKien || 0;
                    }
                    // Bounding by tongDoanhThuDuKien if applicable (assuming tongDoanhThuDuKien represents the total lifetime value)
                    actual += Math.min(totalInPeriod, p.tongDoanhThuDuKien || Infinity);
                }
            }
        });

        // Convert actual to Triệu đồng because target is in Triệu đồng
        actual = actual / 1000000;

        return NextResponse.json({ target, actual, gap: Math.max(0, target - actual) });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
