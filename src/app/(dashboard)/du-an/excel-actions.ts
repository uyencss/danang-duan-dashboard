"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/auth-utils";
import { revalidatePath, revalidateTag } from "next/cache";
import { TrangThaiDuAn, PhanLoaiKH, LinhVuc } from "@prisma/client";
import { extractTimeFields } from "@/lib/utils/time-extract";
import { cacheInvalidate } from "@/lib/cache";
import { syncReplica } from "@/lib/utils/sync";

function parseExcelDate(val: any): Date {
  if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
  if (!val) return new Date();
  
  const str = val.toString().trim();
  
  // 1. Trường hợp định dạng số của Excel (số ngày tính từ 1900)
  if (/^\d+(\.\d+)?$/.test(str)) {
    const excelEpoch = new Date(1899, 11, 30);
    const days = parseFloat(str);
    return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
  }

  // 2. ƯU TIÊN parse DD/MM/YYYY hoặc DD-MM-YYYY (Tránh lỗi đảo ngược Ngày/Tháng của Date gốc)
  const parts = str.split(/[\/\-]/);
  if (parts.length === 3) {
    const d2 = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    if (!isNaN(d2.getTime())) return d2;
  }

  // 3. Thử parse mặc định nếu không khớp định dạng chuẩn
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  
  return new Date();
}

/**
 * Helper to safely parse numbers from Excel strings.
 * Handles both dot (.) and comma (,) decimal separators.
 */
function safeParseFloat(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Replace comma with dot to handle VN format correctly (e.g. 0,062 -> 0.062)
  const str = val.toString().replace(/,/g, '.').trim();
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

export async function importExcelProjects(rows: any[]) {
  try {
    const user = await requireRole("ADMIN", "USER", "AM", "CV");
    if (!user) return { error: "Yêu cầu đăng nhập" };

    const batchId = `BATCH_EXCEL_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const startTime = Date.now();
    console.log(`Bắt đầu Import ${rows.length} dự án...`);

    // 1. Thu thập tất cả Khách hàng và Sản phẩm cần có
    const uniqueKHNames = new Set<string>();
    const uniqueSPKeys = new Set<string>(); // key format: "Nhóm|Tên chi tiết"

    rows.forEach(row => {
      if (row.khachHangName) uniqueKHNames.add(row.khachHangName.trim());
      if (row.nhomSanPham && row.tenSanPham) {
        uniqueSPKeys.add(`${row.nhomSanPham.trim()}|${row.tenSanPham.trim()}`);
      }
    });

    // 2. Pre-fetch Khách hàng hiện có
    const existingKHs = await prisma.khachHang.findMany({
      where: { ten: { in: Array.from(uniqueKHNames) } }
    });
    const khMap = new Map(); // Name -> {id, linhVuc}
    existingKHs.forEach(kh => khMap.set(kh.ten.toLowerCase(), { id: kh.id, linhVuc: kh.phanLoai }));

    // 3. Pre-fetch Sản phẩm hiện có
    const existingSPs = await prisma.sanPham.findMany();
    const spMap = new Map(); // "Nhom|Ten" -> id
    existingSPs.forEach(sp => spMap.set(`${sp.nhom}|${sp.tenChiTiet}`.toLowerCase(), sp.id));

    // 4. Tạo các Khách hàng & Sản phẩm còn thiếu (tuần tự hoặc theo mẻ nhỏ để an toàn)
    for (const name of uniqueKHNames) {
      if (!khMap.has(name.toLowerCase())) {
        // Tìm phanLoai trong rows cho khách hàng này
        const sampleRow = rows.find(r => r.khachHangName?.trim() === name);
        const phanLoaiMap: any = {
           "Chính phủ/Sở ban ngành": PhanLoaiKH.CHINH_PHU,
           "Doanh nghiệp": PhanLoaiKH.DOANH_NGHIEP,
           "Công an": PhanLoaiKH.CONG_AN,
        };
        const pl = phanLoaiMap[sampleRow?.phanLoaiKH] || PhanLoaiKH.DOANH_NGHIEP;
        const newKH = await prisma.khachHang.create({
          data: { ten: name, phanLoai: pl, diaChi: sampleRow?.diaChi || null }
        });
        khMap.set(name.toLowerCase(), { id: newKH.id, linhVuc: pl });
      }
    }

    for (const key of uniqueSPKeys) {
      if (!spMap.has(key.toLowerCase())) {
        const [nhom, ten] = key.split("|");
        const sampleRow = rows.find(r => r.nhomSanPham?.trim() === nhom && r.tenSanPham?.trim() === ten);
        const newSP = await prisma.sanPham.create({
          data: { nhom, tenChiTiet: ten, moTa: sampleRow?.moTaSanPham || null }
        });
        spMap.set(key.toLowerCase(), newSP.id);
      }
    }

    // 5. Khởi tạo Dự Án theo Chunks (ví dụ 20 item mỗi chunk để chạy song song ổn định)
    const chunkSize = 20;
    let successCount = 0;
    const trangThaiMap: any = {
        "Mới": TrangThaiDuAn.MOI,
        "Đang làm việc": TrangThaiDuAn.DANG_LAM_VIEC,
        "Đã demo": TrangThaiDuAn.DA_DEMO,
        "Đã gửi báo giá": TrangThaiDuAn.DA_GUI_BAO_GIA,
        "Đã ký hợp đồng": TrangThaiDuAn.DA_KY_HOP_DONG,
        "Thất bại": TrangThaiDuAn.THAT_BAI,
    };

    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      
      // Chuẩn bị dữ liệu cho cả chunk trước khi mở transaction
      const preparedData = chunk.map(row => {
        if (!row.tenDuAn) return null;
        const khInfo = khMap.get(row.khachHangName?.trim().toLowerCase());
        const spId = spMap.get(`${row.nhomSanPham?.trim()}|${row.tenSanPham?.trim()}`.toLowerCase());
        if (!khInfo || !spId) return null;

        const ngayBatDau = parseExcelDate(row.ngayBatDau);
        const ngayKetThuc = row.ngayKetThuc ? parseExcelDate(row.ngayKetThuc) : null;
        const { tuan, thang, quy, nam } = extractTimeFields(ngayBatDau);
        const trangThai = trangThaiMap[row.trangThaiKhoiTao] || TrangThaiDuAn.MOI;

        return {
          row,
          duAnData: {
            tenDuAn: row.tenDuAn,
            linhVuc: khInfo.linhVuc as unknown as LinhVuc,
            customerId: khInfo.id,
            productId: spId,
            tongDoanhThuDuKien: safeParseFloat(row.tongDoanhThu),
            doanhThuTheoThang: safeParseFloat(row.dtTheoThang),
            maHopDong: row.maHopDong || null,
            ngayBatDau,
            ngayKetThuc,
            tuan,
            thang,
            quy,
            nam,
            amId: row.amId || null,
            amHoTroId: row.amHoTro1Id || null,
            chuyenVienId: row.cvId || null,
            cvHoTro1Id: row.cvHoTro1Id || null,
            cvHoTro2Id: row.cvHoTro2Id || null,
            isTrongDiem: row.isTrongDiem === "Có",
            isKyVong: row.isKyVong === "Có",
            trangThaiHienTai: trangThai,
            ngayChamsocCuoiCung: new Date(),
          },
          trangThai
        };
      }).filter(Boolean);

      if (preparedData.length === 0) continue;

      await prisma.$transaction(async (tx) => {
        // Thực thi song song trong mẻ nhỏ
        await Promise.all(preparedData.map(async (item: any) => {
          const duAn = await tx.duAn.create({ data: item.duAnData });
          await tx.nhatKyCongViec.create({
            data: {
              projectId: duAn.id,
              userId: user.id,
              trangThaiMoi: item.trangThai,
              noiDungChiTiet: `Khởi tạo dự án hàng loạt từ Excel [${batchId}]`,
              ngayGio: new Date(),
              status: "APPROVED",
            }
          });
          successCount++;
        }));
      }, { timeout: 60000 });
      
      if (i % 100 === 0) {
        console.log(`Đã xử lý ${Math.min(i + chunkSize, rows.length)}/${rows.length}...`);
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`Hoàn thành Import ${successCount} dự án trong ${duration}s.`);

    await cacheInvalidate("dashboard:overview", "options:khachhang", "options:sanpham", "options:sanpham-groups");
    (revalidateTag as any)("dashboard-overview");
    revalidatePath("/du-an");
    await syncReplica();

    return { 
      success: true, 
      count: successCount,
      message: `Đã tạo thành công ${successCount} dự án.`
    };
  } catch (error: any) {
    console.error("Lỗi Import Excel:", error);
    return { error: `Lỗi hệ thống: ${error.message || "Không xác định"}` };
  }
}

export async function recallExcelProjects(mode: 'latest' | 'today' = 'latest') {
  try {
    const user = await requireRole("ADMIN", "USER", "AM", "CV");
    if (!user) return { error: "Yêu cầu đăng nhập" };

    const isAdmin = user.role === "ADMIN";
    
    let projectIds: number[] = [];
    let message = "";

    if (mode === 'latest') {
      // 1. Tìm nhật ký import excel gần nhất
      const latestBatchLog = await prisma.nhatKyCongViec.findFirst({
        where: {
          ...(isAdmin ? {} : { userId: user.id }),
          noiDungChiTiet: { startsWith: "Khởi tạo dự án hàng loạt từ Excel [" }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!latestBatchLog) {
        return { error: "Không tìm thấy danh sách dự án nào được tạo hàng loạt gần đây." };
      }

      const match = latestBatchLog.noiDungChiTiet.match(/\[(BATCH_EXCEL_.*?)\]/);
      if (!match) return { error: "Dữ liệu nhật ký không hợp lệ." };

      const batchId = match[1];
      const batchLogs = await prisma.nhatKyCongViec.findMany({
        where: { noiDungChiTiet: { contains: `[${batchId}]` } },
        select: { projectId: true }
      });
      projectIds = batchLogs.map(l => l.projectId);
      message = `Đã thu hồi thành công mẻ vừa tải gần nhất (${projectIds.length} dự án).`;
    } else {
      // 2. Thu hồi TOÀN BỘ trong ngày hôm nay
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todayLogs = await prisma.nhatKyCongViec.findMany({
        where: {
          createdAt: { gte: startOfDay },
          noiDungChiTiet: { startsWith: "Khởi tạo dự án hàng loạt từ Excel [" },
          ...(isAdmin ? {} : { userId: user.id })
        },
        select: { projectId: true }
      });

      projectIds = Array.from(new Set(todayLogs.map(l => l.projectId)));
      message = `Đã dọn sạch toàn bộ ${projectIds.length} dự án tải từ Excel trong ngày hôm nay.`;
    }

    if (projectIds.length === 0) {
      return { error: "Không tìm thấy dự án nào hợp lệ để thu hồi." };
    }

    // 3. Xoá dự án theo Chunks
    const delChunkSize = 100;
    for (let i = 0; i < projectIds.length; i += delChunkSize) {
        const chunk = projectIds.slice(i, i + delChunkSize);
        await prisma.duAn.deleteMany({
            where: { id: { in: chunk } }
        });
    }

    await cacheInvalidate("dashboard:overview");
    (revalidateTag as any)("dashboard-overview");
    revalidatePath("/");
    revalidatePath("/du-an");
    await syncReplica();

    return { 
      success: true, 
      count: projectIds.length,
      message
    };
  } catch (error: any) {
    console.error("Lỗi Thu Hồi Excel:", error);
    return { error: "Lỗi hệ thống khi thu hồi danh sách." };
  }
}
