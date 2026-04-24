
import { PrismaClient } from "@prisma/client";

process.env.DATABASE_URL = "postgresql://postgres:Pg_Secure_2026DbPwV2@100.68.79.40:5432/mobi_prod";
const prisma = new PrismaClient();

async function main() {
  console.log("Checking project counts...");
  
  const totalProjects = await prisma.duAn.count();
  console.log(`Total projects in DB: ${totalProjects}`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayBatchLogs = await prisma.nhatKyCongViec.findMany({
    where: {
      createdAt: { gte: today },
      noiDungChiTiet: { startsWith: "Khởi tạo dự án hàng loạt từ Excel [" }
    },
    select: {
      projectId: true,
      noiDungChiTiet: true
    }
  });

  console.log(`Batch logs found for today: ${todayBatchLogs.length}`);
  
  if (todayBatchLogs.length > 0) {
    const uniqueProjectIds = new Set(todayBatchLogs.map(l => l.projectId));
    console.log(`Unique projects linked to today's Excel imports: ${uniqueProjectIds.size}`);
  }

  const allLogs = await prisma.nhatKyCongViec.count({
    where: { noiDungChiTiet: { contains: "BATCH_EXCEL_" } }
  });
  console.log(`Total Excel import logs in DB: ${allLogs}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
