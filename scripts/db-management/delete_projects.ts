import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error("LỖI: DATABASE_URL không được định nghĩa trong file .env hoặc môi trường.");
  process.exit(1);
}

async function main() {
  console.log("=== BẮT ĐẦU QUÁ TRÌNH SAO LƯU VÀ XÓA DỰ ÁN ===");
  console.log("Kết nối tới database:", DB_URL.replace(/:[^:@/]+@/, ":***@"));

  const pool = new Pool({ connectionString: DB_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Kiểm tra số lượng bản ghi trước khi lưu
    console.log("\n1. Đang kiểm tra số lượng dữ liệu hiện tại...");
    const countDuAn = await prisma.duAn.count();
    console.log(`- Số lượng dự án (DuAn): ${countDuAn}`);
    if (countDuAn === 0) {
      console.log("Không có dự án nào để xóa. Thoát script.");
      return;
    }

    const countRevenue = await prisma.revenueDistribution.count();
    const countNhatKy = await prisma.nhatKyCongViec.count();
    const countFile = await prisma.fileDinhKem.count();
    const countNotification = await prisma.notification.count();
    const countBinhLuan = await prisma.binhLuan.count();
    const countTinNhan = await prisma.tinNhan.count();

    console.log(`- Số lượng phân bổ doanh thu (RevenueDistribution): ${countRevenue}`);
    console.log(`- Số lượng nhật ký (NhatKyCongViec): ${countNhatKy}`);
    console.log(`- Số lượng file đính kèm (FileDinhKem): ${countFile}`);
    console.log(`- Số lượng thông báo (Notification): ${countNotification}`);
    console.log(`- Số lượng bình luận (BinhLuan): ${countBinhLuan}`);
    console.log(`- Số lượng tin nhắn (TinNhan): ${countTinNhan}`);

    // 2. Thực hiện Backup
    console.log("\n2. Đang thực hiện sao lưu dữ liệu ra file JSON...");
    
    console.log("  - Đang tải bảng DuAn...");
    const duAns = await prisma.duAn.findMany();
    
    console.log("  - Đang tải bảng RevenueDistribution...");
    const revenues = await prisma.revenueDistribution.findMany();
    
    console.log("  - Đang tải bảng NhatKyCongViec...");
    const nhatKys = await prisma.nhatKyCongViec.findMany();
    
    console.log("  - Đang tải bảng FileDinhKem...");
    const files = await prisma.fileDinhKem.findMany();
    
    console.log("  - Đang tải bảng Notification...");
    const notifications = await prisma.notification.findMany();
    
    console.log("  - Đang tải bảng BinhLuan...");
    const binhLuans = await prisma.binhLuan.findMany();
    
    console.log("  - Đang tải bảng TinNhan...");
    const tinNhans = await prisma.tinNhan.findMany();

    const backupData = {
      createdAt: new Date().toISOString(),
      counts: {
        duAn: duAns.length,
        revenueDistribution: revenues.length,
        nhatKyCongViec: nhatKys.length,
        fileDinhKem: files.length,
        notification: notifications.length,
        binhLuan: binhLuans.length,
        tinNhan: tinNhans.length
      },
      data: {
        duAns,
        revenues,
        nhatKys,
        files,
        notifications,
        binhLuans,
        tinNhans
      }
    };

    const backupDir = path.resolve(process.cwd(), ".backups", "delete-projects");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFilePath = path.join(backupDir, `backup-projects-${timestamp}.json`);
    
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), "utf-8");
    console.log(`=> ĐÃ SAO LƯU THÀNH CÔNG tại: ${backupFilePath}`);
    console.log(`   Dung lượng file: ${(fs.statSync(backupFilePath).size / (1024 * 1024)).toFixed(2)} MB`);

    // 3. Thực hiện Xóa dữ liệu (xóa các bảng phụ trước để tránh khóa ngoại)
    console.log("\n3. Đang thực hiện xóa dữ liệu trong cơ sở dữ liệu...");

    console.log("  - Đang xóa RevenueDistribution...");
    const delRevenues = await prisma.revenueDistribution.deleteMany({});
    console.log(`    Đã xóa ${delRevenues.count} bản ghi.`);

    console.log("  - Đang xóa FileDinhKem...");
    const delFiles = await prisma.fileDinhKem.deleteMany({});
    console.log(`    Đã xóa ${delFiles.count} bản ghi.`);

    console.log("  - Đang xóa NhatKyCongViec...");
    const delNhatKys = await prisma.nhatKyCongViec.deleteMany({});
    console.log(`    Đã xóa ${delNhatKys.count} bản ghi.`);

    console.log("  - Đang xóa BinhLuan...");
    const delBinhLuans = await prisma.binhLuan.deleteMany({});
    console.log(`    Đã xóa ${delBinhLuans.count} bản ghi.`);

    console.log("  - Đang xóa TinNhan...");
    const delTinNhans = await prisma.tinNhan.deleteMany({});
    console.log(`    Đã xóa ${delTinNhans.count} bản ghi.`);

    console.log("  - Đang xóa Notification...");
    const delNotifications = await prisma.notification.deleteMany({});
    console.log(`    Đã xóa ${delNotifications.count} bản ghi.`);

    console.log("  - Đang xóa DuAn...");
    const delDuAn = await prisma.duAn.deleteMany({});
    console.log(`    Đã xóa ${delDuAn.count} bản ghi dự án.`);

    console.log("\n=== QUÁ TRÌNH XÓA DỰ ÁN HOÀN TẤT THÀNH CÔNG ===");

  } catch (error) {
    console.error("LỖI KHI SAO LƯU HOẶC XÓA DỮ LIỆU:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
