
const { Pool } = require("pg");
const pool = new Pool({ connectionString: 'postgresql://postgres:Pg_Secure_2026DbPwV2@100.68.79.40:5432/mobi_prod' });

async function check() {
  console.log("Deep analysis of April Revenue Calculation...");

  const now = new Date("2026-04-08T00:00:00Z");
  const monthStart = new Date(Date.UTC(2026, 3, 1));
  const monthEnd = new Date(Date.UTC(2026, 3, 30, 23, 59, 59));
  
  const psMY = 2026 * 12 + 3;
  const peMY = 2026 * 12 + 3;

  function getActiveMonths(start, end) {
    if (!start) return 0;
    const s = new Date(start);
    const sMY = s.getUTCFullYear() * 12 + s.getUTCMonth();
    
    if (end) {
      const e = new Date(end);
      const eMY = e.getUTCFullYear() * 12 + e.getUTCMonth();
      
      if (sMY === eMY) {
        return (psMY <= sMY && sMY <= peMY) ? 1 : 0;
      }
      
      const lastActiveMY = eMY - 1;
      const rangeStart = Math.max(sMY, psMY);
      const rangeEnd = Math.min(lastActiveMY, peMY);
      if (rangeStart > rangeEnd) return 0;
      return rangeEnd - rangeStart + 1;
    }
    
    const rangeStart = Math.max(sMY, psMY);
    const rangeEnd = peMY;
    if (rangeStart > rangeEnd) return 0;
    return rangeEnd - rangeStart + 1;
  }

  const res = await pool.query(`
    SELECT id, "tenDuAn", "ngayBatDau", "ngayKetThuc", "doanhThuTheoThang", "tongDoanhThuDuKien", "trangThaiHienTai"
    FROM "DuAn"
    WHERE "isPendingDelete" = false
    AND "trangThaiHienTai" = 'DA_KY_HOP_DONG'
  `);

  let totalMapped = 0;
  let countMapped = 0;

  res.rows.forEach(p => {
    const active = getActiveMonths(p.ngayBatDau, p.ngayKetThuc);
    if (active > 0) {
      countMapped++;
      totalMapped += (p.doanhThuTheoThang || 0);
    }
  });

  console.log(`System calculation for April: ${totalMapped} Tr.đ (${countMapped} projects)`);

  // Now let's see which projects have (Start == End AND TotRev == MonRev) but are NOT counted
  const banDutExcluded = res.rows.filter(p => {
    const s = new Date(p.ngayBatDau);
    const e = p.ngayKetThuc ? new Date(p.ngayKetThuc) : null;
    if (!e) return false;
    
    const isBanDut = s.getTime() === e.getTime() && p.tongDoanhThuDuKien === p.doanhThuTheoThang;
    const active = getActiveMonths(p.ngayBatDau, p.ngayKetThuc);
    
    const sMY = s.getUTCFullYear() * 12 + s.getUTCMonth();
    return isBanDut && sMY === psMY && active === 0;
  });

  console.log(`One-off projects in April that are EXCLUDED: ${banDutExcluded.length}`);
  banDutExcluded.forEach(p => console.log(`- ${p.id}: ${p.tenDuAn}`));

  await pool.end();
}
check();
