import fs from "fs";
import path from "path";
import { createClient } from "@libsql/client";

async function main() {
  const syncUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const replicaPath = process.env.LOCAL_REPLICA_PATH || "file:./data/local-replica.db";

  if (!syncUrl || !authToken) {
    console.log("No Turso remote config found. Skipping replica initialization.");
    return;
  }

  console.log(`Initializing Turso Embedded Replica...`);
  console.log(`URL: ${replicaPath}`);
  console.log(`Sync URL: ${syncUrl}`);

  // Create data directory if it doesn't exist
  const filePath = replicaPath.replace("file:", "");
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const client = createClient({
    url: replicaPath,
    syncUrl,
    authToken,
  });

  console.log("Starting initial sync...");
  try {
    await client.sync();
    console.log("Initial sync completed successfully!");
    
    // Quick test query
    const res = await client.execute("SELECT 1 AS ok");
    if (res.rows[0]?.ok === 1) {
        console.log("Replica connection tested OK.");
    }
  } catch (error) {
    console.error("Failed to initialize or sync replica:", error);
    process.exit(1);
  } finally {
    client.close();
  }
}

main();
