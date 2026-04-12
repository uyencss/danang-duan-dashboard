import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { logger } from "./logger";

declare global {
  var prisma: undefined | PrismaClient;
}

if (process.env.NODE_ENV !== "production") {
  delete (globalThis as any).prisma;
}

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    adapter,
    log: [
      { emit: "event", level: "query" },
      { emit: "stdout", level: "error" },
    ],
  });

export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
