import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient, type Config, type Client } from "@libsql/client";
import { logger } from "./logger";
// Cache Busted: 2026-04-12 04:15


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
  var __prismaRebuildCount: undefined | number;
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

function buildPrismaClient(): PrismaClient {
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
}

// Detects Turso Hrana "stream not found" errors that occur when the HTTP stream
// expires after extended uptime (~24h). When detected, we rebuild the libSQL
// client and Prisma adapter, then retry the failed operation once.
function isStaleStreamError(err: unknown): boolean {
  if (!err) return false;
  const msg = String((err as any)?.message || (err as any)?.cause?.message || err);
  return msg.includes("stream not found") || msg.includes("STREAM_EXPIRED");
}

function rebuildClients(): PrismaClient {
  const count = (globalThis.__prismaRebuildCount ?? 0) + 1;
  globalThis.__prismaRebuildCount = count;
  logger.info({ msg: `Rebuilding libSQL + Prisma client (rebuild #${count}) due to stale Hrana stream` });

  // Rebuild the shared libSQL client
  if (config.syncUrl) {
    libsqlSyncClient = createClient(config);
    if (process.env.NODE_ENV !== "production") {
      globalThis.libsqlSync = libsqlSyncClient;
    }
  }

  const fresh = buildPrismaClient();
  currentPrisma = fresh;
  if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = fresh;
  }
  return fresh;
}

let currentPrisma: PrismaClient = globalThis.prisma ?? buildPrismaClient();

// Wrap the Prisma client in a Proxy that automatically catches stale stream
// errors on any method call, rebuilds the connection, and retries once.
const prisma: PrismaClient = new Proxy(currentPrisma, {
  get(target, prop, receiver) {
    const value = Reflect.get(currentPrisma, prop, receiver);
    
    // Only wrap Prisma model accessors (they return objects with findMany, create, etc.)
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return new Proxy(value, {
        get(modelTarget, modelProp, modelReceiver) {
          const modelMethod = Reflect.get(modelTarget, modelProp, modelReceiver);
          if (typeof modelMethod !== "function") return modelMethod;
          
          return async function (...args: any[]) {
            try {
              return await modelMethod.apply(modelTarget, args);
            } catch (err) {
              if (isStaleStreamError(err)) {
                const freshClient = rebuildClients();
                const freshModel = (freshClient as any)[prop];
                return await freshModel[modelProp](...args);
              }
              throw err;
            }
          };
        },
      });
    }
    
    // For direct methods like $queryRaw, $executeRaw, $transaction, etc.
    if (typeof value === "function") {
      return async function (...args: any[]) {
        try {
          return await value.apply(currentPrisma, args);
        } catch (err) {
          if (isStaleStreamError(err)) {
            const freshClient = rebuildClients();
            const freshMethod = (freshClient as any)[prop];
            return await freshMethod.apply(freshClient, args);
          }
          throw err;
        }
      };
    }
    
    return value;
  },
});

export default prisma;
export { libsqlSyncClient };

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = currentPrisma;
}
