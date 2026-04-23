import { prisma } from "../src/lib/prisma";
import { TrangThaiDuAn } from "@prisma/client";

async function investigate() {
    const ids = [111028, 111032, 111036]; // Approximate IDs from previous run or similar
    const pEndsInApril = await prisma.duAn.findMany({
        where: {
            ngayKetThuc: {
                gte: new Date("2026-04-01T00:00:00Z"),
                lte: new Date("2026-04-30T23:59:59Z")
            }
        }
    });

    console.log(`Projects ending in April (currently excluded):`);
    let excludedSum = 0;
    pEndsInApril.forEach(p => {
        console.log(`- ${p.tenDuAn}: Monthly=${p.doanhThuTheoThang}, EndDate=${p.ngayKetThuc?.toISOString()}`);
        excludedSum += p.doanhThuTheoThang || 0;
    });
    console.log(`Total revenue from projects ending in April: ${excludedSum}`);
}

investigate().finally(() => prisma.$disconnect());
