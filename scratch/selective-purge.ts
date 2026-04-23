import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Bắt đầu làm sạch dữ liệu có chọn lọc...");

  // 1. Xóa tất cả Dự án (sẽ tự động xóa Nhật ký, Bình luận, Tin nhắn, Thông báo do Cascade)
  const delDuAn = await prisma.duAn.deleteMany({});
  console.log(`- Đã xóa ${delDuAn.count} dự án.`);

  // 2. Xóa Khách hàng
  const delKH = await prisma.khachHang.deleteMany({});
  console.log(`- Đã xóa ${delKH.count} khách hàng.`);

  // 3. Xóa Sản phẩm
  const delSP = await prisma.sanPham.deleteMany({});
  console.log(`- Đã xóa ${delSP.count} sản phẩm.`);

  console.log("\n==> ĐÃ XÓA XONG DỰ ÁN, KHÁCH HÀNG, SẢN PHẨM.");
  console.log("==> ĐÃ GIỮ LẠI: KHẢO SÁT CATP VÀ GIAO KPI.");
}

main()
  .catch(e => {
    console.error("Lỗi khi làm sạch dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
