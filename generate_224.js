
const { Pool } = require("pg");
const fs = require("fs");

const pool = new Pool({
  connectionString: "postgresql://postgres:Pg_Secure_2026DbPwV2@100.68.79.40:5432/mobi_prod"
});

async function main() {
  const aprilMY = 2026 * 12 + 3;

  const res = await pool.query(`
    SELECT id, "tenDuAn", "ngayBatDau", "ngayKetThuc", "doanhThuTheoThang", "tongDoanhThuDuKien", "trangThaiHienTai"
    FROM "DuAn"
    WHERE "trangThaiHienTai" = 'DA_KY_HOP_DONG'
  `);

  function getReason(p) {
    const s = new Date(p.ngayBatDau);
    const sMY = s.getUTCFullYear() * 12 + s.getUTCMonth();
    const e = p.ngayKetThuc ? new Date(p.ngayKetThuc) : null;
    
    if (e) {
      const eMY = e.getUTCFullYear() * 12 + e.getUTCMonth();
      if (sMY === eMY) {
        if (sMY === aprilMY) return null; // Counted
        return sMY > aprilMY ? "Bat dau sau thang 4" : "Ket thuc truoc thang 4";
      }
      const lastActiveMY = eMY - 1;
      if (aprilMY >= sMY && aprilMY <= lastActiveMY) return null; // Counted
      
      if (sMY > aprilMY) return "Bat dau sau thang 4";
      if (eMY === aprilMY) return "Ket thuc dung thang 4 (Quy tac dang loai bo)";
      if (eMY < aprilMY) return "Da ket thuc truoc thang 4";
    }
    
    if (sMY > aprilMY) return "Bat dau sau thang 4";
    return null;
  }

  const notCounted = res.rows.filter(p => getReason(p) !== null).map(p => ({
    ...p,
    reason: getReason(p)
  }));

  const header = "ID,Ten Du An,Ngay Bat Dau,Ngay Ket Thuc,Doanh Thu Thang,Ly Do\n";
  const rows = notCounted.map(p => {
    return `${p.id},"${p.tenDuAn.replace(/"/g, '""')}",${p.ngayBatDau.toISOString().split('T')[0]},${p.ngayKetThuc ? p.ngayKetThuc.toISOString().split('T')[0] : "None"},${p.doanhThuTheoThang},"${p.reason}"`;
  }).join("\n");

  fs.writeFileSync("danh_sach_224_du_an_dang_bi_loai.csv", "\ufeff" + header + rows, "utf8");
  console.log(`Success: Exported ${notCounted.length} projects to danh_sach_224_du_an_dang_bi_loai.csv`);
  await pool.end();
}
main();
