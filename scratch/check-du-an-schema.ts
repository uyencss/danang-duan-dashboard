import { createClient } from "@libsql/client";
import "dotenv/config";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error("Missing remote config");
    return;
  }

  const client = createClient({ url, authToken });
  console.log("Checking DuAn table columns on Turso...");
  try {
    const res = await client.execute("PRAGMA table_info(DuAn)");
    const columns = res.rows.map((row: any) => row.name);
    console.log("DuAn table columns:", columns);
    
    if (!columns.includes("isTrongDiem")) console.log("MISSING: isTrongDiem");
    if (!columns.includes("isKyVong")) console.log("MISSING: isKyVong");
  } catch (error) {
    console.error("Failed to check schema:", error);
  } finally {
    client.close();
  }
}

main();
