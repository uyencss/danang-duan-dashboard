import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient, type Config, type Client } from "@libsql/client";
import { logger } from "./logger";
// Cache Busted: 2026-04-08 17:00


function getLibSqlConfig(): Config {
  // Use embedded replica only in standard production runtime.
  // Next.js dev server (HMR) and Next.js build workers will lock the DB if they start sync threads.
  const isProd = process.env.NODE_ENV === "production";
  const isBuild = process.env.npm_lifecycle_event === "build" || process.argv.join(' ').includes('/next build');
  
  const useEmbeddedReplica = isProd && !isBuild && process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN;
  
  if (useEmbeddedReplica) {
    logger.info({ msg: 'Initializing Turso Embedded Replica' });
    return {
      url: process.env.LOCAL_REPLICA_PATH || "file:./data/local-replica.db",
      syncUrl: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
      syncInterval: Number(process.env.TURSO_SYNC_PERIOD) || 60,
    };
  }
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in your environment variables. Refusing to connect to prevent unwanted local database creation.");
  }

  return {
    url: process.env.DATABASE_URL,
  };
}

const config = getLibSqlConfig();

declare global {
  var prisma: undefined | PrismaClient;
  var libsqlSync: undefined | Client;
}

// Force delete cached instances in dev to pick up schema changes
if (process.env.NODE_ENV !== "production") {
  delete (globalThis as any).prisma;
  delete (globalThis as any).libsqlSync;
}

// Create ONE shared libSQL client for both Prisma and manual syncs
let libsqlSyncClient = globalThis.libsqlSync;
if (!libsqlSyncClient && config.syncUrl) {
  libsqlSyncClient = createClient(config);
  if (process.env.NODE_ENV !== "production") {
    globalThis.libsqlSync = libsqlSyncClient;
  }
}

const prismaClientSingleton = () => {
  const adapter = new PrismaLibSql(config);
  
  // Monkey-patch PrismaLibSql to use our shared client instead of creating another one
  // This prevents multiple client sync loops from causing WAL database lock conflicts
  adapter.createClient = (_cfg: Config) => {
    if (libsqlSyncClient) {
      return libsqlSyncClient;
    }
    return createClient(_cfg);
  };

  return new PrismaClient({ adapter });
};

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;
export { libsqlSyncClient };

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
