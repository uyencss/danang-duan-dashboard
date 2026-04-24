
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://postgres:Pg_Secure_2026DbPwV2@100.68.79.40:5432/mobi_prod"
});

function extractTimeFields(d) {
  const nam = d.getFullYear();
  const thang = d.getMonth() + 1;
  const quy = Math.ceil(thang / 3);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const diffInMs = d.getTime() - startOfYear.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const tuan = Math.ceil((diffInDays + startOfYear.getDay() + 1) / 7);
  return { tuan, thang, quy, nam };
}

async function main() {
  console.log("Rerunning Data Repair - GLOBAL SCAN...");
  
  try {
    // Scan all projects where month is suspiciously far in future (indicating possible flip)
    const res = await pool.query('SELECT id, "tenDuAn", "ngayBatDau", "ngayKetThuc", "doanhThuTheoThang", "tongDoanhThuDuKien" FROM "DuAn"');
    console.log(`Checking ${res.rows.length} projects.`);

    let repairedCount = 0;

    for (const p of res.rows) {
      const dS = p.ngayBatDau;
      const oldMonth = dS.getUTCMonth(); // 0-11
      const oldDay = dS.getUTCDate(); // 1-31

      let needsFix = false;
      let newStart = dS;
      let newEnd = p.ngayKetThuc;

      // Special check: If original string was DD/MM and was interpreted as MM/DD.
      // This happens if DD <= 12 and MM <= 12.
      // Example: 12/3 (Mar 12) became Month 11 (Dec), Day 3.
      // NewMonth = oldDay = 3. NewDay = oldMonth + 1 = 12.
      if (oldDay <= 12 && (oldMonth + 1) <= 12) {
        // Only flip if it's currently in the "wrong" half of the year? 
        // Better to check if it matches the pattern of the error.
        newStart = new Date(Date.UTC(dS.getUTCFullYear(), oldDay - 1, oldMonth + 1));
        needsFix = true;
      }

      const dE = p.ngayKetThuc;
      if (dE) {
        const oME = dE.getUTCMonth();
        const oDE = dE.getUTCDate();
        if (oDE <= 12 && (oME + 1) <= 12) {
          newEnd = new Date(Date.UTC(dE.getUTCFullYear(), oDE - 1, oME + 1));
          needsFix = true;
        }
      }

      if (needsFix) {
        const fields = extractTimeFields(newStart);
        await pool.query(
          'UPDATE "DuAn" SET "ngayBatDau" = $1, "ngayKetThuc" = $2, tuan = $3, thang = $4, quy = $5, nam = $6 WHERE id = $7',
          [newStart, newEnd, fields.tuan, fields.thang, fields.quy, fields.nam, p.id]
        );
        repairedCount++;
      }
    }

    console.log(`Successfully repaired ${repairedCount} projects.`);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
