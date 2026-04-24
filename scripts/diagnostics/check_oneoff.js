
const { Pool } = require("pg");
const pool = new Pool({ connectionString: 'postgresql://postgres:Pg_Secure_2026DbPwV2@100.68.79.40:5432/mobi_prod' });

async function check() {
  console.log("Checking 'Bán đứt' (One-off) projects in April...");
  
  // Projects where start and end month are April 2026
  const aprilMY = 2026 * 12 + 3;
  
  const res = await pool.query(`
    SELECT id, "tenDuAn", "ngayBatDau", "ngayKetThuc", "doanhThuTheoThang", "tongDoanhThuDuKien"
    FROM "DuAn"
    WHERE "trangThaiHienTai" = 'DA_KY_HOP_DONG'
  `);

  const oneOffs = res.rows.filter(p => {
    const s = new Date(p.ngayBatDau);
    const e = p.ngayKetThuc ? new Date(p.ngayKetThuc) : null;
    if (!e) return false;
    
    const sMY = s.getUTCFullYear() * 12 + s.getUTCMonth();
    const eMY = e.getUTCFullYear() * 12 + e.getUTCMonth();
    
    return sMY === aprilMY && eMY === aprilMY;
  });

  console.log(`Found ${oneOffs.length} one-off projects in April.`);
  let totalRev = 0;
  oneOffs.forEach(p => {
    console.log(`- ${p.id}: ${p.tenDuAn} | DT Tháng: ${p.doanhThuTheoThang} | DT Tổng: ${p.tongDoanhThuDuKien}`);
    totalRev += (p.doanhThuTheoThang || 0);
  });
  console.log(`Total One-off Revenue for April: ${totalRev}`);

  await pool.end();
}
check();
