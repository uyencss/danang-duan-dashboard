import { createClient } from "@libsql/client";
import "dotenv/config";

async function main() {
  const connectionUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!connectionUrl || !authToken) {
    console.error("Missing remote configuration in .env");
    process.exit(1);
  }

  console.log(`Connecting to: ${connectionUrl}`);
  const client = createClient({ url: connectionUrl, authToken: authToken });

  try {
    console.log("Applying migrations to remote database...");

    // 1. Update DuAn table
    const duAnInfo = await client.execute("PRAGMA table_info(DuAn)");
    const duAnColNames = duAnInfo.rows.map((r: any) => r.name);
    if (!duAnColNames.includes("hienTaiBuoc")) {
      await client.execute("ALTER TABLE DuAn ADD COLUMN hienTaiBuoc TEXT");
      console.log("Added hienTaiBuoc to DuAn");
    }

    // 2. Update NhatKyCongViec table
    const logInfo = await client.execute("PRAGMA table_info(NhatKyCongViec)");
    const logColNames = logInfo.rows.map((r: any) => r.name);
    if (!logColNames.includes("buoc")) {
      await client.execute("ALTER TABLE NhatKyCongViec ADD COLUMN buoc TEXT");
      console.log("Added buoc to NhatKyCongViec");
    }
    if (!logColNames.includes("status")) {
      await client.execute("ALTER TABLE NhatKyCongViec ADD COLUMN status TEXT DEFAULT 'APPROVED'");
      console.log("Added status to NhatKyCongViec");
    }

    // 3. Create Notification table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "isRead" BOOLEAN NOT NULL DEFAULT 0,
        "type" TEXT NOT NULL,
        "relatedId" TEXT,
        "projectId" INTEGER,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE,
        FOREIGN KEY ("projectId") REFERENCES "DuAn" ("id") ON DELETE CASCADE
      )
    `);
    console.log("Verified/Created Notification table");

    console.log("✅ Remote database migrations applied successfully!");
  } catch (error: any) {
    console.error("❌ Error migrating remote database:", error.message);
  } finally {
    client.close();
  }
}

main();
