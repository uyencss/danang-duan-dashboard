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
  console.log("Adding missing columns to Turso...");
  try {
    // Add banned, banReason, banExpires
    await client.execute("ALTER TABLE User ADD COLUMN banned BOOLEAN NOT NULL DEFAULT 0");
    await client.execute("ALTER TABLE User ADD COLUMN banReason TEXT");
    await client.execute("ALTER TABLE User ADD COLUMN banExpires DATETIME");
    
    // Better Auth might also need these if not already there
    // These were missing in some earlier versions of the schema
    // Check if isActive is already there (it was cid 9)
    
    console.log("Successfully updated Turso cloud schema!");
  } catch (error: any) {
    console.error("Failed to update schema:", error.message);
  } finally {
    client.close();
  }
}

main();
