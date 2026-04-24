
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://postgres:Pg_Secure_2026DbPwV2@100.68.79.40:5432/mobi_prod"
});

async function main() {
  console.log("Checking database state via pg...");
  
  try {
    const resCount = await pool.query('SELECT count(*) FROM "DuAn"');
    console.log(`Total projects: ${resCount.rows[0].count}`);

    const resLogs = await pool.query('SELECT count(*) FROM "NhatKyCongViec" WHERE "noiDungChiTiet" LIKE \'%BATCH_EXCEL_%\'');
    console.log(`Total Batch Excel logs: ${resLogs.rows[0].count}`);

    const today = new Date().toISOString().split('T')[0];
    const resToday = await pool.query('SELECT count(*) FROM "NhatKyCongViec" WHERE "noiDungChiTiet" LIKE \'%BATCH_EXCEL_%\' AND "createdAt" >= $1', [today]);
    console.log(`Excel logs created today: ${resToday.rows[0].count}`);

  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await pool.end();
  }
}

main();
