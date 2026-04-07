import { createClient } from "@libsql/client";
import * as fs from "fs";
import "dotenv/config";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url || !url.startsWith("libsql://")) {
    console.error("Missing or invalid DATABASE_URL in .env");
    process.exit(1);
  }

  const client = createClient({
    url,
  });

  console.log("Connecting to Remote Turso Database...");

  const sqlDump = fs.readFileSync("dev_dump.sql", "utf-8");

  console.log("Executing SQL Dump to remote database... this may take a few seconds.");

  try {
    await client.executeMultiple(sqlDump);
    console.log("✅ Successfully uploaded local data to Turso remote!");
  } catch (error) {
    console.error("❌ Error uploading to Turso:", error);
  }
}

main();