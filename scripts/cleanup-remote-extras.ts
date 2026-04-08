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

  const tablesToCheck = ["User", "Account", "Session"];
  
  for (const table of tablesToCheck) {
    console.log(`\n--- Cleaning up extra ${table} records ---`);
    
    // Get all local IDs for this table
    const localRes = await localClient.execute(`SELECT id FROM ${table}`);
    const localIds = localRes.rows.map((r: any) => r.id);
    
    // Get all remote records
    const remoteRes = await remoteClient.execute(`SELECT id FROM ${table}`);
    const extraRecords = remoteRes.rows.filter((r: any) => !localIds.includes(r.id));
    
    console.log(`Found ${extraRecords.length} extra records in remote ${table}.`);

    if (extraRecords.length > 0) {
      const extraIds = extraRecords.map((r: any) => r.id);
      console.log(`Deleting ${extraRecords.length} records from remote ${table}...`);
      
      const statements = extraIds.map(id => ({
        sql: `DELETE FROM ${table} WHERE id = ?`,
        args: [id],
      }));

      try {
        await remoteClient.batch(statements);
        console.log(`✅ Successfully removed extras from remote ${table}!`);
      } catch (error: any) {
        console.error(`❌ Error deleting from ${table}:`, error.message);
      }
    }
  }

  localClient.close();
  remoteClient.close();
}

main();
