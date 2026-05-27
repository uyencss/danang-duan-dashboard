import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Bắt đầu xóa toàn bộ dự án...");
  try {
    const deleted = await prisma.duAn.deleteMany({});
    console.log(`Đã xóa thành công ${deleted.count} dự án.`);
  } catch (error) {
    console.error("Lỗi khi xóa dự án:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
