
const { Pool } = require("pg");
const pool = new Pool({ connectionString: 'postgresql://postgres:Pg_Secure_2026DbPwV2@100.68.79.40:5432/mobi_prod' });

async function check() {
  const aprilStart = '2026-04-01';
  const aprilEnd = '2026-04-30';
  
  const res = await pool.query(`
    SELECT id, "tenDuAn", "ngayBatDau", "ngayKetThuc", "doanhThuTheoThang", "tongDoanhThuDuKien"
    FROM "DuAn"
    WHERE "trangThaiHienTai" = 'DA_KY_HOP_DONG'
    AND "ngayBatDau" >= $1 AND "ngayBatDau" <= $2
  `, [aprilStart, aprilEnd]);

  console.log(`Signed projects starting in April: ${res.rows.length}`);
  
  let total = 0;
  res.rows.forEach(p => {
    total += (p.doanhThuTheoThang || 0);
  });
  console.log(`Total revenue from projects starting in April: ${total}`);

  await pool.end();
}
check();
