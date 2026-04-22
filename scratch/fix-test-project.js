const { Client } = require('pg');

const connectionString = "postgresql://postgres:Pg_Secure_2026DbPwV2@100.68.79.40:5432/mobi_prod";

async function main() {
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log("CONNECTED");

    // Fix the "test" project (and any project for customer 'test' that is isKyVong)
    const res = await client.query('UPDATE "DuAn" SET "thang" = 4 WHERE "id" = 122276');
    
    console.log("FIXED_PROJECTS", res.rowCount);

    // Verify
    const verify = await client.query('SELECT "tenDuAn", "thang" FROM "DuAn" WHERE "id" = 122276');
    console.log("VERIFICATION", JSON.stringify(verify.rows, null, 2));

  } catch (err) {
    console.error("ERROR", err.stack);
  } finally {
    await client.end();
  }
}

main();
