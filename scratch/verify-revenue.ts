import { prisma } from "../src/lib/prisma";
import { TrangThaiDuAn } from "@prisma/client";

// Re-implementing the exact utility from getBoardOverview for verification
function getActiveMonths_Utility(start: Date, end: Date | null, periodStart: Date, periodEnd: Date): number {
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

async function verify() {
    const now = new Date(); // Current local April 2026
    const currentYear = 2026;
    const currentMonth = 4; // Current is April

    const monthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const monthEnd = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59));

    console.log(`Calculating for Period: ${monthStart.toISOString()} - ${monthEnd.toISOString()}`);

    const signedProjects = await prisma.duAn.findMany({
        where: {
            trangThaiHienTai: TrangThaiDuAn.DA_KY_HOP_DONG,
            isPendingDelete: { not: true }
        },
        select: {
            id: true,
            tenDuAn: true,
            ngayBatDau: true,
            ngayKetThuc: true,
            doanhThuTheoThang: true,
            tongDoanhThuDuKien: true
        }
    });

    console.log(`Total Signed Projects: ${signedProjects.length}`);

    let totalMonthlyRevenue = 0;
    let includedCount = 0;

    for (const p of signedProjects) {
        const active = getActiveMonths_Utility(new Date(p.ngayBatDau), p.ngayKetThuc ? new Date(p.ngayKetThuc) : null, monthStart, monthEnd);
        if (active > 0) {
            includedCount++;
            const monthlyVal = p.doanhThuTheoThang || 0;
            totalMonthlyRevenue += monthlyVal;
            
            // if (includedCount < 10) {
            //     console.log(`- Project ${p.id}: ${p.tenDuAn} | Start: ${p.ngayBatDau.toISOString()} | End: ${p.ngayKetThuc?.toISOString()} | Monthly: ${monthlyVal}`);
            // }
        }
    }

    console.log(`\n--- RESULTS ---`);
    console.log(`Projects contributing to April: ${includedCount}`);
    console.log(`Raw Total Monthly Revenue (Tr.đ): ${totalMonthlyRevenue}`);
    console.log(`Rounded Total: ${Math.round(totalMonthlyRevenue)}`);
    
    if (Math.round(totalMonthlyRevenue) !== 236) {
        console.warn(`\nMISMATCH! Manual Excel says 236. System says ${totalMonthlyRevenue}`);
        
        // Debugging a few projects that might be borderline
        console.log("\nSome projects ending in April (should be excluded):");
        const endingInApril = signedProjects.filter(p => {
            if (!p.ngayKetThuc) return false;
            const d = new Date(p.ngayKetThuc);
            return d.getUTCFullYear() === 2026 && d.getUTCMonth() === 3; // April is index 3
        });
        endingInApril.slice(0, 5).forEach(p => {
             console.log(`Excluded: ${p.tenDuAn} (Ends ${p.ngayKetThuc!.toISOString()})`);
        });
    } else {
        console.log(`\nMATCH! The system calculation now matches the manual Excel value of 236.`);
    }
}

verify().finally(() => prisma.$disconnect());
