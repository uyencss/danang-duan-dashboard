
const { Pool } = require("pg");
const fs = require("fs");

const pool = new Pool({
  connectionString: "postgresql://postgres:Pg_Secure_2026DbPwV2@100.68.79.40:5432/mobi_prod"
});

async function main() {
  console.log("Generating fresh export after repair...");
  
  try {
    const res = await pool.query('SELECT id, "tenDuAn", "trangThaiHienTai", "ngayBatDau", "ngayKetThuc", "doanhThuTheoThang", "isKyVong", nam, thang FROM "DuAn"');
    const projects = res.rows;
    
    // Period: April 2026 (Month index 3)
    const periodStartMY = 2026 * 12 + 3;
    const periodEndMY = 2026 * 12 + 3;

    const notCounted = [];

    projects.forEach(p => {
      const start = new Date(p.ngayBatDau);
      const end = p.ngayKetThuc ? new Date(p.ngayKetThuc) : null;
      const sMY = start.getUTCFullYear() * 12 + start.getUTCMonth();
      
      let isCounted = false;

      if (p.trangThaiHienTai === 'DA_KY_HOP_DONG') {
        if (end) {
          const eMY = end.getUTCFullYear() * 12 + end.getUTCMonth();
          if (sMY === eMY) {
            if (sMY === periodStartMY) isCounted = true;
          } else {
            const lastActiveMY = eMY - 1;
            if (periodStartMY >= sMY && periodEndMY <= lastActiveMY) isCounted = true;
          }
        } else {
          if (periodStartMY >= sMY) isCounted = true;
        }
      } 
      
      if (!isCounted && p.isKyVong === true && p.trangThaiHienTai !== 'DA_KY_HOP_DONG') {
        if (p.nam === 2026 && p.thang === 4) isCounted = true;
      }

      if (!isCounted) {
        let reason = "";
        if (sMY > periodStartMY) {
          reason = "Bắt đầu muộn (Ngày BĐ: " + start.toISOString().split('T')[0] + ")";
        } else if (end && (end.getUTCFullYear() * 12 + end.getUTCMonth()) <= periodStartMY) {
          reason = "Đã kết thúc hoặc kết thúc đúng tháng 4 (Ngày KT: " + end.toISOString().split('T')[0] + ")";
        } else if (p.trangThaiHienTai !== 'DA_KY_HOP_DONG') {
          reason = "Chừa ký HĐ và không đánh dấu dự kiến Tháng 4";
        } else {
          reason = "Khác";
        }
        notCounted.push({ ...p, reason });
      }
    });

    const header = "ID,Tên Dự Án,Trạng Thái,Ngày Bắt Đầu,Ngày Kết Thúc,Doanh Thu Tháng,Lý Do\n";
    const csvContent = header + notCounted.map(p => {
      const safeName = p.tenDuAn.replace(/"/g, '""');
      const startStr = new Date(p.ngayBatDau).toISOString().split('T')[0];
      const endStr = p.ngayKetThuc ? new Date(p.ngayKetThuc).toISOString().split('T')[0] : "";
      return `${p.id},"${safeName}",${p.trangThaiHienTai},${startStr},${endStr},${p.doanhThuTheoThang || 0},"${p.reason}"`;
    }).join("\n");

    fs.writeFileSync("danh_sach_khong_tinh_doanh_thu_thang_4_LAN_2.csv", "\ufeff" + csvContent, "utf8");
    console.log(`Success: Exported ${notCounted.length} projects.`);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
