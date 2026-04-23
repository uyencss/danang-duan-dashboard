import { prisma } from "../src/lib/prisma";

async function check() {
    const pIds = [111028, 111032, 111036];
    const projects = await prisma.duAn.findMany({
        where: { id: { in: pIds } }
    });

    projects.forEach(p => {
        console.log(`${p.tenDuAn}: Start=${p.ngayBatDau.toISOString()}, End=${p.ngayKetThuc?.toISOString()}, Monthly=${p.doanhThuTheoThang}`);
    });
}
check().finally(() => prisma.$disconnect());
