import { createClient } from "@libsql/client";
import "dotenv/config";

async function main() {
  const localClient = createClient({ url: process.env.LOCAL_DATABASE_URL || "file:./dev.db" });
  const remoteClient = createClient({ url: process.env.DATABASE_URL! });

  try {
    // Fetch all user tables
    const tableQuery = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_migrations' ORDER BY name;";
    const tablesRes = await localClient.execute(tableQuery);
    const tables = tablesRes.rows.map(r => r.name as string);

    console.log("==================================================");
    console.log("   Data count comparison (Local vs Remote)        ");
    console.log("==================================================");
    console.log(`| ${"Table Name".padEnd(25)} | ${"Local".padEnd(6)} | ${"Remote".padEnd(6)} |`);
    console.log("|---------------------------|--------|--------|");

    for (const table of tables) {
      const localCountRes = await localClient.execute(`SELECT count(*) as count FROM "${table}"`);
      const remoteCountRes = await remoteClient.execute(`SELECT count(*) as count FROM "${table}"`);
      
      const localCount = localCountRes.rows[0].count;
      const remoteCount = remoteCountRes.rows[0].count;
      
      const matchStatus = localCount === remoteCount ? "✅" : "❌";
      console.log(`| ${matchStatus} ${table.padEnd(23)} | ${String(localCount).padEnd(6)} | ${String(remoteCount).padEnd(6)} |`);
    }
    
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Error checking tables:", err);
  }
}

main();
