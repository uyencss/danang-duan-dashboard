import { createClient } from "@libsql/client";
import "dotenv/config";

async function main() {
  const localClient = createClient({ url: "file:dev.db" });
  const remoteUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!remoteUrl || !authToken) {
    console.error("Missing remote configuration in .env");
    process.exit(1);
  }

  const remoteClient = createClient({
    url: remoteUrl,
    authToken: authToken,
  });

  const tablesToSync = ["User", "Account", "Session", "Verification"];
  
  for (const table of tablesToSync) {
    console.log(`\n--- Syncing ${table} table ---`);
    console.log(`Reading local ${table} records...`);
    const localRes = await localClient.execute(`SELECT * FROM ${table}`);
    console.log(`Found ${localRes.rows.length} records in local ${table}.`);

    if (localRes.rows.length === 0) {
      console.log(`Skipping empty local table: ${table}`);
      continue;
    }

    console.log(`Checking remote ${table} schema...`);
    const remoteInfo = await remoteClient.execute(`PRAGMA table_info(${table})`);
    const remoteColumns = remoteInfo.rows.map((r: any) => r.name);

    const statements = localRes.rows.map((row: any) => {
      const keys = Object.keys(row).filter(key => remoteColumns.includes(key));
      const placeholders = keys.map(() => "?").join(", ");
      const values = keys.map(key => row[key]);
      
      return {
        sql: `INSERT OR REPLACE INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`,
        args: values,
      };
    });

    try {
      console.log(`Executing ${statements.length} UPSERTs on remote ${table}...`);
      // libSQL batch execution
      await remoteClient.batch(statements);
      console.log(`✅ Successfully synced local ${table} to remote Turso!`);
    } catch (error: any) {
      console.error(`❌ Error syncing ${table}:`, error.message);
    }
  }

  localClient.close();
  remoteClient.close();
}

main();
