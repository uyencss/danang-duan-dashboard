
const { Pool } = require("pg");
const pool = new Pool({ connectionString: 'postgresql://postgres:Pg_Secure_2026DbPwV2@100.68.79.40:5432/mobi_prod' });

async function check() {
  const res = await pool.query(`
    SELECT id, "tenDuAn", "ngayBatDau" 
    FROM "DuAn" 
    WHERE "ngayBatDau" > '2026-04-30' 
    AND "trangThaiHienTai" = 'DA_KY_HOP_DONG'
    LIMIT 20
  `);
  res.rows.forEach(r => {
    console.log(`- ${r.id}: ${r.tenDuAn} | Start: ${r.ngayBatDau.toISOString()}`);
  });
  await pool.end();
}
check();
