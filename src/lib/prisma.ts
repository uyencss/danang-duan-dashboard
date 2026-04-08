import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient, type Config, type Client } from "@libsql/client";

function getLibSqlConfig(): Config {
  // Use embedded replica only in standard production runtime.
  // Next.js dev server (HMR) and Next.js build workers will lock the DB if they start sync threads.
  const isProd = process.env.NODE_ENV === "production";
  const isBuild = process.env.npm_lifecycle_event === "build" || process.argv.join(' ').includes('/next build');
  
  const useEmbeddedReplica = isProd && !isBuild && process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN;
  
  if (useEmbeddedReplica) {
    return {
      url: process.env.LOCAL_REPLICA_PATH || "file:./data/local-replica.db",
      syncUrl: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
      syncInterval: Number(process.env.TURSO_SYNC_PERIOD) || 60,
    };
  }
  
  return {
    url: process.env.DATABASE_URL!,
  };
}

const config = getLibSqlConfig();

const prismaClientSingleton = () => {
  const adapter = new PrismaLibSql(config);
  return new PrismaClient({ adapter });
};

// Expose a dedicated libSQL client just for manual syncs (since Prisma hides its internal client)
let libsqlSyncClient: Client | undefined;
if (config.syncUrl) {
  libsqlSyncClient = createClient(config);
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
  var libsqlSync: undefined | Client;
}

// Force delete cached instances in dev to pick up schema changes
if (process.env.NODE_ENV !== "production") {
  delete (globalThis as any).prisma;
  delete (globalThis as any).libsqlSync;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (!globalThis.libsqlSync && libsqlSyncClient) {
  globalThis.libsqlSync = libsqlSyncClient;
} else if (globalThis.libsqlSync) {
  libsqlSyncClient = globalThis.libsqlSync;
}

export default prisma;
export { libsqlSyncClient };

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
  if (libsqlSyncClient) globalThis.libsqlSync = libsqlSyncClient;
}
