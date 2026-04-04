import "dotenv/config";
import { auth } from "../src/lib/auth";
import { PrismaClient, PhanLoaiKH, TrangThaiDuAn, UserRole, LinhVuc } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Cleaning up database...");
  await prisma.verification.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.binhLuan.deleteMany();
  await prisma.nhatKyCongViec.deleteMany();
  await prisma.duAn.deleteMany();
  await prisma.sanPham.deleteMany();
  await prisma.khachHang.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding with Better Auth API...");

  // Since we are in Node, we can use auth.api directly
  const createAuthUser = async (data: { name: string, email: string, role: UserRole, diaBan?: string, password: string }) => {
    // we use sign up to let better auth handle hashing
    const res = await (auth.api as any).signUpEmail({
        body: {
            email: data.email,
            password: data.password,
            name: data.name,
            // better auth v1 needs metadata for additional fields if using signUp
            role: data.role,
            diaBan: data.diaBan,
        }
    });

    // After sign up, we might need to manually update the user for role/diaBan if signUpEmail didn't pick them up
    // Better Auth v1 signUp might only take name/email/password.
    const user = await prisma.user.update({
        where: { email: data.email },
        data: {
            role: data.role,
            diaBan: data.diaBan,
            emailVerified: true
        }
    });
    
    return user;
  };

  const admin = await createAuthUser({
    name: "Admin Lãnh đạo",
    email: "admin@mobifone.vn",
    role: UserRole.ADMIN,
    diaBan: "Tất cả",
    password: "admin123",
  });

  const am1 = await createAuthUser({
    name: "Nguyễn Văn An",
    email: "an.nv@mobifone.vn",
    role: UserRole.USER,
    diaBan: "Tổ 1 - Hải Châu",
    password: "user1234",
  });

  const cv1 = await createAuthUser({
    name: "Trần Thị Bình",
    email: "binh.tt@mobifone.vn",
    role: UserRole.USER,
    diaBan: "Tổ 1 - Hải Châu",
    password: "user1234",
  });

  // ===== KHÁCH HÀNG =====
  const kh1 = await prisma.khachHang.create({ data: { ten: "Sở Y tế Đà Nẵng", phanLoai: PhanLoaiKH.CHINH_PHU, diaChi: "103 Hùng Vương, Hải Châu" }});
  const kh2 = await prisma.khachHang.create({ data: { ten: "UBND Quận Hải Châu", phanLoai: PhanLoaiKH.CHINH_PHU, diaChi: "54 Bạch Đằng, Hải Châu" }});

  // ===== SẢN PHẨM =====
  const sp1 = await prisma.sanPham.create({ data: { nhom: "Cloud", tenChiTiet: "Cloud Server MobiFone" }});

  // ===== DỰ ÁN MẪU =====
  const duAn1 = await prisma.duAn.create({
    data: {
      tenDuAn: "Triển khai Cloud Server cho Sở Y tế",
      customerId: kh1.id,
      productId: sp1.id,
      amId: am1.id,
      chuyenVienId: cv1.id,
      linhVuc: LinhVuc.B2B_B2G,
      tongDoanhThuDuKien: 450,
      soHopDong: "HĐ-2026-001",
      maHopDong: "MBF-DN-001",
      ngayBatDau: new Date("2026-01-01"),
      tuan: 1, thang: 1, quy: 1, nam: 2026,
      ngayChamsocCuoiCung: new Date("2026-03-20"),
      trangThaiHienTai: TrangThaiDuAn.DA_KY_HOP_DONG,
    },
  });

  console.log("✅ Seed data created successfully using Better Auth API!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
