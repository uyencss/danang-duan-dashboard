
const { Pool } = require("pg");
const pool = new Pool({ connectionString: 'postgresql://postgres:Pg_Secure_2026DbPwV2@100.68.79.40:5432/mobi_prod' });

async function check() {
  console.log("Analyzing April Discrepancy...");
  
  // 1. Projects ending in April
  const resEnds = await pool.query(`
    SELECT count(*), sum("doanhThuTheoThang") 
    FROM "DuAn" 
    WHERE "ngayKetThuc" >= '2026-04-01' AND "ngayKetThuc" <= '2026-04-30'
    AND "trangThaiHienTai" = 'DA_KY_HOP_DONG'
  `);
  console.log("Projects ending in April (currently excluded):", resEnds.rows[0]);

  // 2. Projects starting even later
  const resFuture = await pool.query(`
    SELECT count(*), sum("doanhThuTheoThang") 
    FROM "DuAn" 
    WHERE "ngayBatDau" > '2026-04-30'
    AND "trangThaiHienTai" = 'DA_KY_HOP_DONG'
  `);
  console.log("Projects starting after April (excluded):", resFuture.rows[0]);

  await pool.end();
}
check();
