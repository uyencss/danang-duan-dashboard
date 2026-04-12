import { createClient } from "@libsql/client";
import { PrismaClient, Prisma } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { logger } from "../src/lib/logger";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const tursoUrl = process.env.TURSO_DATABASE_URL || "";
const tursoToken = process.env.TURSO_AUTH_TOKEN || "";
const turso = createClient({
  url: tursoUrl.replace("libsql://", "https://"),
  authToken: tursoToken,
});

async function main() {
  try {
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`); 

    for (const dmmfModel of Prisma.dmmf.datamodel.models) {
      const dbName = dmmfModel.dbName || dmmfModel.name;
      
      let rows;
      try {
          const res = await turso.execute(`SELECT * FROM ${dbName}`);
          rows = res.rows;
      } catch (e: any) {
          logger.error({ msg: `Failed reading ${dbName} from Turso`, msge: e.message || String(e) });
          // Fallback parsing
          try {
             const fallback = await turso.execute(`SELECT * FROM "${dbName}"`);
             rows = fallback.rows;
             logger.info({ msg: `Fallback succeeded for ${dbName}` });
          } catch(e2: any) {
             logger.error({ msg: `Fallback reading ${dbName} failed`, msge: e2.message || String(e2) });
             continue;
          }
      }

      if (rows.length === 0) {
        continue;
      }

      const model = dmmfModel.name;
      const prismaDelegate = (prisma as any)[model.charAt(0).toLowerCase() + model.slice(1)];
      const mappedRows = rows.map((row: any) => {
        const obj: any = {};
        for (const field of dmmfModel.fields) {
          const rawVal = row[field.name];
          if (rawVal === null || rawVal === undefined) {
             // Let prisma handle null or default
          } else if (field.type === "Boolean") {
             obj[field.name] = Boolean(rawVal);
          } else if (field.type === "DateTime") {
             obj[field.name] = new Date(rawVal as number | string);
          } else if (field.type === "Int" || field.type === "Float" || field.type === "Decimal") {
             obj[field.name] = Number(rawVal);
          } else if (field.type === "Json") {
             try {
                obj[field.name] = typeof rawVal === 'string' ? JSON.parse(rawVal) : rawVal;
             } catch(e) {
                obj[field.name] = rawVal;
             }
          } else {
             obj[field.name] = rawVal;
          }
        }
        return obj;
      });

      const batchSize = 100;
      for (let i = 0; i < mappedRows.length; i += batchSize) {
         try {
             await prismaDelegate.createMany({ data: mappedRows.slice(i, i + batchSize) });
         } catch(e) {
             logger.error({ msg: `Batch insert failed on ${dbName}`, batchIndex: i, error: e });
         }
      }

      logger.info({ msg: `Migrated ${rows.length} rows for ${model}` });
    }
  } finally {
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`);
    await prisma.$disconnect();
    console.log("Migration complete.");
  }
}
main();
