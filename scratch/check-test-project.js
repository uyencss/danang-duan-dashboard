const { Client } = require('pg');

const connectionString = "postgresql://postgres:Pg_Secure_2026DbPwV2@100.68.79.40:5432/mobi_prod";

async function main() {
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log("CONNECTED");

    // Search for projects where KhachHang.ten = 'test'
    const res = await client.query('SELECT d.*, k.ten as "khName" FROM "DuAn" d JOIN "KhachHang" k ON d."customerId" = k.id WHERE k.ten = \'test\' AND d."isPendingDelete" = false');
    
    if (res.rows.length > 0) {
      console.log("PROJECT_FOUND");
      console.log(JSON.stringify(res.rows, null, 2));
    } else {
      console.log("PROJECT_NOT_FOUND");
    }
  } catch (err) {
    console.error("ERROR", err.stack);
  } finally {
    await client.end();
  }
}

main();
