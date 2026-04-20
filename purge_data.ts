
import { prisma } from "./src/lib/prisma";

async function main() {
  console.log("Bắt đầu làm sạch dữ liệu...");

  // 1. Xóa tất cả Dự án (sẽ tự động xóa Nhật ký, Bình luận, Tin nhắn, Thông báo do Cascade)
  const delDuAn = await prisma.duAn.deleteMany({});
  console.log(`- Đã xóa ${delDuAn.count} dự án.`);

  // 2. Xóa Khách hàng
  const delKH = await prisma.khachHang.deleteMany({});
  console.log(`- Đã xóa ${delKH.count} khách hàng.`);

  // 3. Xóa Sản phẩm
  const delSP = await prisma.sanPham.deleteMany({});
  console.log(`- Đã xóa ${delSP.count} sản phẩm.`);

  // 4. Xóa KPI (Nếu muốn xóa trắng chỉ tiêu)
  const delKPI = await prisma.chiTieuKpi.deleteMany({});
  console.log(`- Đã xóa ${delKPI.count} bản ghi KPI.`);

  // 5. Xóa Khảo sát CATP (Nếu cần sạch sẽ hoàn toàn)
  const delSurvey = await prisma.policeSurvey.deleteMany({});
  console.log(`- Đã xóa ${delSurvey.count} khảo sát CATP.`);

  console.log("==> HỆ THỐNG ĐÃ ĐƯỢC LÀM SẠCH HOÀN TOÀN.");
}

main()
  .catch(e => {
    console.error("Lỗi khi làm sạch dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
