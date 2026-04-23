import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting focused data purge (DuAn, KhachHang, SanPham)...");
  
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete all Dự Án (DuAn)
      // This will cascade to NhatKyCongViec, BinhLuan, TinNhan, Notification via prisma schema
      const deletedDuAn = await tx.duAn.deleteMany({});
      console.log(`- Deleted ${deletedDuAn.count} projects (DuAn).`);

      // 2. Delete all Khách Hàng (KhachHang)
      const deletedKH = await tx.khachHang.deleteMany({});
      console.log(`- Deleted ${deletedKH.count} customers (KhachHang).`);

      // 3. Delete all Sản Phẩm (SanPham)
      const deletedSP = await tx.sanPham.deleteMany({});
      console.log(`- Deleted ${deletedSP.count} products (SanPham).`);
    });

    console.log("\nPurge completed successfully!");
    console.log("Preserved tables: PoliceSurvey (CATP), ChiTieuKpi (Giao KPI), User, etc.");

  } catch (error) {
    console.error("Error during purge:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
