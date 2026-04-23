import { prisma } from "../src/lib/prisma";

async function checkOne() {
    const p = await prisma.duAn.findFirst({
        where: { tenDuAn: "54/2026/MOBIFONE CA-MOBIFONE/HTC-ĐN" }
    });
    console.log(`Project: ${p?.tenDuAn} | EndDate: ${p?.ngayKetThuc?.toISOString()}`);
}
checkOne().finally(() => prisma.$disconnect());
