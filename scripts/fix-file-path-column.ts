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
  console.log("Fixing FileDinhKem schema on Turso...");
  
  try {
    // Thêm cột filePath
    console.log("Adding filePath column...");
    await client.execute("ALTER TABLE FileDinhKem ADD COLUMN filePath TEXT NOT NULL DEFAULT ''");
    console.log("Added filePath column.");
    
    // Convert dữ liệu cũ từ url sang filePath
    console.log("Migrating old url data to filePath...");
    await client.execute("UPDATE FileDinhKem SET filePath = replace(url, '/uploads/', '') WHERE url LIKE '/uploads/%'");
    
    console.log("Successfully updated Turso cloud schema for FileDinhKem!");
  } catch (error: any) {
    console.error("Failed to update schema:", error.message);
  } finally {
    client.close();
  }
}

main();
