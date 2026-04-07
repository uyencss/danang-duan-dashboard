import { createClient } from "@libsql/client";

async function main() {
  console.log("Checking Turso Embedded Replica Health...");
  
  const useEmbeddedReplica = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN;
  
  if (!useEmbeddedReplica) {
    console.error("Environment variables for Turso Embedded Replica are not set.");
    process.exit(1);
  }

  const client = createClient({
    url: process.env.LOCAL_REPLICA_PATH || "file:./data/local-replica.db",
    syncUrl: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  try {
    const startTime = performance.now();
    
    // Read from local
    const localRes = await client.execute("SELECT COUNT(*) AS count FROM User");
    const localDuration = performance.now() - startTime;
    console.log(`Local read successful: ${localRes.rows[0].count} users (Latency: ${localDuration.toFixed(2)}ms)`);
    
    // Test manual sync
    console.log("Attempting manual sync with remote primary...");
    const syncStart = performance.now();
    await client.sync();
    const syncDuration = performance.now() - syncStart;
    console.log(`Sync successful (Duration: ${syncDuration.toFixed(2)}ms)`);
    
    console.log("✅ Replica is healthy.");
  } catch (error) {
    console.error("❌ Replica health check failed:", error);
    process.exit(1);
  } finally {
    client.close();
  }
}

main();
