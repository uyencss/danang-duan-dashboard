
const { Pool } = require("pg");
const pool = new Pool({ connectionString: 'postgresql://postgres:Pg_Secure_2026DbPwV2@100.68.79.40:5432/mobi_prod' });

async function check() {
  const res = await pool.query(`
    SELECT id, "tenDuAn", "ngayBatDau", "createdAt" 
    FROM "DuAn" 
    WHERE "ngayBatDau" > '2026-04-30'
    LIMIT 10
  `);
  res.rows.forEach(r => {
    console.log(`ID: ${r.id} | CreatedAt: ${r.createdAt.toISOString()} | Start: ${r.ngayBatDau.toISOString()}`);
  });
  await pool.end();
}
check();
