import { createClient } from "@libsql/client";
import "dotenv/config";

async function main() {
  const remoteUrl = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  // If DATABASE_URL starts with libsql://, we need to handle it or use TURSO_DATABASE_URL
  const connectionUrl = process.env.TURSO_DATABASE_URL || remoteUrl;

  if (!connectionUrl || !authToken) {
    console.error("Missing remote configuration in .env");
    process.exit(1);
  }

  console.log(`Connecting to: ${connectionUrl}`);
  const remoteClient = createClient({
    url: connectionUrl,
    authToken: authToken,
  });

  try {
    console.log("Checking if isKyVong column exists in remote DuAn table...");
    const res = await remoteClient.execute("PRAGMA table_info(DuAn)");
    const columns = res.rows.map((r: any) => r.name);
    
    if (columns.includes("isKyVong")) {
      console.log("✅ Column isKyVong already exists in remote database.");
    } else {
      console.log("Adding isKyVong column to remote DuAn table...");
      // In SQLite/LibSQL, we add it with a default value.
      // Default false is 0
      await remoteClient.execute("ALTER TABLE DuAn ADD COLUMN isKyVong BOOLEAN NOT NULL DEFAULT 0");
      console.log("✅ Successfully added isKyVong column to remote database!");
    }
  } catch (error: any) {
    console.error("❌ Error updating remote database:", error.message);
  } finally {
    remoteClient.close();
  }
}

main();
