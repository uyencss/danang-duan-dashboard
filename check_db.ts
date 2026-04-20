
import { prisma } from "./src/lib/prisma";
import { TrangThaiDuAn } from "@prisma/client";

async function main() {
  const countAll = await prisma.duAn.count();
  const countPending = await prisma.duAn.count({ where: { isPendingDelete: true } });
  const countActive = await prisma.duAn.count({ where: { isPendingDelete: false } });
  const countSuccess = await prisma.duAn.count({ where: { trangThaiHienTai: { not: 'THAT_BAI' } } });
  
  const sumRevenue = await prisma.duAn.aggregate({
    _sum: { tongDoanhThuDuKien: true },
    where: { isPendingDelete: false, nam: 2026, trangThaiHienTai: { not: 'THAT_BAI' } }
  });

  console.log({
    countAll,
    countPending,
    countActive,
    countSuccess,
    sumRevenue2026Active: sumRevenue._sum.tongDoanhThuDuKien
  });
}

main().catch(console.error);
