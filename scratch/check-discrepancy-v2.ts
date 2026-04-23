import { prisma } from "../src/lib/prisma";

async function check() {
    const projects = await prisma.duAn.findMany({
        where: {
            tenDuAn: {
                in: [
                    "54/2026/MOBIFONE CA-MOBIFONE/HTC-ĐN",
                    "50/2026/MOBIFONE CA-MOBIFONE/SACYL-ĐN",
                    "34 /2026/MOBIFONE-MOBIFONE CA/MBF-DANANG"
                ]
            }
        }
    });

    projects.forEach(p => {
        console.log(`${p.tenDuAn}: Start=${p.ngayBatDau.toISOString()}, End=${p.ngayKetThuc?.toISOString()}, Monthly=${p.doanhThuTheoThang}`);
    });
}
check().finally(() => prisma.$disconnect());
