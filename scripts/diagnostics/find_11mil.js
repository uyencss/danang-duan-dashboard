
const { Pool } = require("pg");
const pool = new Pool({ connectionString: 'postgresql://postgres:Pg_Secure_2026DbPwV2@100.68.79.40:5432/mobi_prod' });

async function check() {
  const res = await pool.query(`
    SELECT id, "tenDuAn", "ngayBatDau", "ngayKetThuc", "doanhThuTheoThang", "tongDoanhThuDuKien", "trangThaiHienTai"
    FROM "DuAn"
    WHERE "trangThaiHienTai" = 'DA_KY_HOP_DONG'
  `);

  const psMY = 2026 * 12 + 3;

  function isCounted(p) {
    const s = new Date(p.ngayBatDau);
    const sMY = s.getUTCFullYear() * 12 + s.getUTCMonth();
    const e = p.ngayKetThuc ? new Date(p.ngayKetThuc) : null;
    
    if (e) {
      const eMY = e.getUTCFullYear() * 12 + e.getUTCMonth();
      if (sMY === eMY) return sMY === psMY;
      const lastActiveMY = eMY - 1;
      return psMY >= sMY && psMY <= lastActiveMY;
    }
    return psMY >= sMY;
  }

  const notCounted = res.rows.filter(p => !isCounted(p));
  
  const results = [];
  notCounted.forEach(p => {
    const s = new Date(p.ngayBatDau);
    const e = p.ngayKetThuc ? new Date(p.ngayKetThuc) : null;
    const sMY = s.getUTCFullYear() * 12 + s.getUTCMonth();
    const eMY = e ? e.getUTCFullYear() * 12 + e.getUTCMonth() : null;

    let cat = "Other";
    if (sMY > psMY) cat = "Starts After April";
    else if (eMY === psMY) cat = "Ends In April (Excluded)";
    else if (eMY < psMY) cat = "Ended Before April";

    results.push({
      id: p.id,
      name: p.tenDuAn,
      start: p.ngayBatDau.toISOString().split('T')[0],
      end: p.ngayKetThuc ? p.ngayKetThuc.toISOString().split('T')[0] : 'None',
      rev: p.doanhThuTheoThang,
      cat
    });
  });

  // Calculate totals by category
  const totals = {};
  results.forEach(r => {
    if (!totals[r.cat]) totals[r.cat] = { count: 0, revenue: 0 };
    totals[r.cat].count++;
    totals[r.cat].revenue += r.rev;
  });

  console.log("Summary of EXCLUDED revenue by category:");
  console.log(totals);

  // Deep check for projects ending in April - are any of them "Bán đứt"?
  const endsInApril = results.filter(r => r.cat === "Ends In April (Excluded)");
  console.log("\nSample projects ending in April (Excluded):");
  console.log(endsInApril.slice(0, 10));

  await pool.end();
}
check();
