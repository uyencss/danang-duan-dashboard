import { auth } from "../src/lib/auth";
import { PrismaClient, PhanLoaiKH, TrangThaiDuAn, UserRole, LinhVuc } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { loadScriptEnv, runMandatoryDbBackup } from "./db-safety";

loadScriptEnv();

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type TableCounts = {
  users: number;
  projects: number;
  customers: number;
  products: number;
  comments: number;
  logs: number;
  sessions: number;
  accounts: number;
  verifications: number;
};

async function getTableCounts(): Promise<TableCounts> {
  const [
    users,
    projects,
    customers,
    products,
    comments,
    logs,
    sessions,
    accounts,
    verifications,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.duAn.count(),
    prisma.khachHang.count(),
    prisma.sanPham.count(),
    prisma.binhLuan.count(),
    prisma.nhatKyCongViec.count(),
    prisma.session.count(),
    prisma.account.count(),
    prisma.verification.count(),
  ]);

  return {
    users,
    projects,
    customers,
    products,
    comments,
    logs,
    sessions,
    accounts,
    verifications,
  };
}

async function main() {
  const shouldReset = process.env.SEED_RESET === "true";

  if (shouldReset) {
    await runMandatoryDbBackup({
      operation: "seed-reset",
      getPreflightData: async () => ({ rowCountsBeforeReset: await getTableCounts() }),
      getLogicalSnapshot: async () => ({
        createdAt: new Date().toISOString(),
        notes: "Generated before destructive seed for non-file database URL.",
        users: await prisma.user.findMany(),
        khachHang: await prisma.khachHang.findMany(),
        sanPham: await prisma.sanPham.findMany(),
        duAn: await prisma.duAn.findMany(),
        nhatKyCongViec: await prisma.nhatKyCongViec.findMany(),
        binhLuan: await prisma.binhLuan.findMany(),
        session: await prisma.session.findMany(),
        account: await prisma.account.findMany(),
        verification: await prisma.verification.findMany(),
      }),
    });
    console.log("SEED_RESET=true -> cleaning up database...");
    await prisma.verification.deleteMany();
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    await prisma.binhLuan.deleteMany();
    await prisma.nhatKyCongViec.deleteMany();
    await prisma.duAn.deleteMany();
    await prisma.sanPham.deleteMany();
    await prisma.khachHang.deleteMany();
    await prisma.user.deleteMany();
  } else {
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      console.log("Seed skipped: existing data detected. Use SEED_RESET=true if you want a destructive reset.");
      return;
    }
  }

  console.log("Seeding with Better Auth API...");

  // Since we are in Node, we can use auth.api directly
  const createAuthUser = async (data: { name: string, email: string, role: UserRole, diaBan?: string, password: string }) => {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!existing) {
      await (auth.api as any).signUpEmail({
        body: {
          email: data.email,
          password: data.password,
          name: data.name,
          role: data.role,
          diaBan: data.diaBan,
        },
      });
    }

    // we use sign up to let better auth handle hashing
    // After sign up, we might need to manually update the user for role/diaBan if signUpEmail didn't pick them up.
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
      linhVuc: LinhVuc.CHINH_PHU,
      tongDoanhThuDuKien: 450,
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
