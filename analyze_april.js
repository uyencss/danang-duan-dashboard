
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://postgres:Pg_Secure_2026DbPwV2@100.68.79.40:5432/mobi_prod"
});

async function main() {
  console.log("Analyzing projects for April 2026 revenue...");
  
  try {
    const res = await pool.query('SELECT id, "tenDuAn", "trangThaiHienTai", "ngayBatDau", "ngayKetThuc", "isKyVong", nam, thang FROM "DuAn"');
    const projects = res.rows;
    
    // Period: April 2026
    const periodStartMY = 2026 * 12 + 3; // 0-indexed month (April = 3)
    const periodEndMY = 2026 * 12 + 3;

    const notCounted = [];

    projects.forEach(p => {
      const start = new Date(p.ngayBatDau);
      const end = p.ngayKetThuc ? new Date(p.ngayKetThuc) : null;
      
      const sMY = start.getUTCFullYear() * 12 + start.getUTCMonth();
      
      let isCounted = false;

      // 1. Signed projects logic
      if (p.trangThaiHienTai === 'DA_KY_HOP_DONG') {
        if (end) {
          const eMY = end.getUTCFullYear() * 12 + end.getUTCMonth();
          if (sMY === eMY) {
            // Sell-out: counted only if April is that month
            if (sMY === periodStartMY) isCounted = true;
          } else {
            // Recurring: active until eMY - 1
            const lastActiveMY = eMY - 1;
            if (periodStartMY >= sMY && periodEndMY <= lastActiveMY) {
                isCounted = true;
            }
          }
        } else {
          // No end date: active from start onwards
          if (periodStartMY >= sMY) isCounted = true;
        }
      } 
      
      // 2. Expected projects logic
      if (!isCounted && p.isKyVong === true && p.trangThaiHienTai !== 'DA_KY_HOP_DONG') {
        if (p.nam === 2026 && p.thang === 4) {
          isCounted = true;
        }
      }

      if (!isCounted) {
        notCounted.push(p);
      }
    });

    console.log(`Total Projects: ${projects.length}`);
    console.log(`Counted Projects: ${projects.length - notCounted.length}`);
    console.log(`NOT Counted Projects: ${notCounted.length}`);

    // Categorize reasons
    const reasons = {
      not_signed_or_expected: 0,
      too_late_start: 0,
      too_early_end: 0,
      ends_exactly_in_april: 0
    };

    notCounted.forEach(p => {
      const start = new Date(p.ngayBatDau);
      const end = p.ngayKetThuc ? new Date(p.ngayKetThuc) : null;
      const sMY = start.getUTCFullYear() * 12 + start.getUTCMonth();
      
      if (p.trangThaiHienTai === 'DA_KY_HOP_DONG') {
        if (sMY > periodStartMY) {
          reasons.too_late_start++;
        } else if (end) {
          const eMY = end.getUTCFullYear() * 12 + end.getUTCMonth();
          if (eMY <= periodStartMY) {
            reasons.too_early_end++;
            if (eMY === periodStartMY) reasons.ends_exactly_in_april++;
          }
        }
      } else if (p.isKyVong === true) {
        reasons.not_signed_or_expected++; // Expected but not in April
      } else {
        reasons.not_signed_or_expected++; // Neither signed nor expected
      }
    });

    console.log("\nReasons for not counting:");
    console.log(`- Not signed AND not expected in April: ${reasons.not_signed_or_expected}`);
    console.log(`- Signed but starts after April: ${reasons.too_late_start}`);
    console.log(`- Signed but ended before April: ${reasons.too_early_end}`);
    console.log(`  (Of which, ends EXACTLY in April: ${reasons.ends_exactly_in_april} - Rule: Last month not counted)`);

    console.log("\nSample 10 projects NOT counted:");
    notCounted.slice(0, 10).forEach(p => {
      console.log(`- ID: ${p.id} | ${p.tenDuAn} | Status: ${p.trangThaiHienTai} | Start: ${p.ngayBatDau.toISOString().split('T')[0]} | End: ${p.ngayKetThuc ? p.ngayKetThuc.toISOString().split('T')[0] : 'None'}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
