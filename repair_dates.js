
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
  console.log("Starting Data Repair for flipped dates...");
  
  try {
    // Get projects imported today
    const res = await pool.query('SELECT id, "tenDuAn", "ngayBatDau", "ngayKetThuc" FROM "DuAn" WHERE "createdAt" >= CURRENT_DATE');
    console.log(`Found ${res.rows.length} projects to check.`);

    let repairedCount = 0;

    for (const p of res.rows) {
      let needsFix = false;
      let newStart = p.ngayBatDau;
      let newEnd = p.ngayKetThuc;

      // Logic: If month <= 12 and day <= 12, there's a high risk of being flipped.
      // Especially if the user says "all list" is wrong.
      // We flip back: NewMonth = OldDay, NewDay = OldMonth
      
      const dS = p.ngayBatDau;
      // We check if it was flipped. Since all were intended as D/M/Y, 
      // if it was parsed as M/D/Y where D_old <= 12, it's flipped.
      
      // Specifically for the December case:
      // Old: 2026-12-03 (Dec 3) -> New: 2026-03-12 (Mar 12)
      
      const flipDate = (d) => {
        if (!d) return null;
        const oldMonth = d.getMonth(); // 0-11
        const oldDay = d.getDate(); // 1-31
        
        // Only flip if oldDay <= 12 (because if it was > 12, standard parsing would have failed or been correct)
        // Wait, if string was "03/12/2026" (Dec 3), it became Month=2, Day=12? NO.
        // String "12/3/2026" (Mar 12) became Dec 3 (Month=11, Day=3).
        // To get Mar 12 back: NewMonth = 2, NewDay = 12.
        // oldDay is 3. oldMonth+1 is 12.
        if (oldDay <= 12 && (oldMonth + 1) <= 12) {
          return new Date(d.getFullYear(), oldDay - 1, oldMonth + 1);
        }
        return d;
      };

      const flippedStart = flipDate(dS);
      if (flippedStart.getTime() !== dS.getTime()) {
        newStart = flippedStart;
        needsFix = true;
      }

      const dE = p.ngayKetThuc;
      if (dE) {
        const flippedEnd = flipDate(dE);
        if (flippedEnd.getTime() !== dE.getTime()) {
          newEnd = flippedEnd;
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
