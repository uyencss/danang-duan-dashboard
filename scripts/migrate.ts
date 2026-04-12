import { createClient } from "@libsql/client";
import { PrismaClient, Prisma } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString = "postgresql://postgres:postgres@localhost:5432/mobi_prod";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const tursoUrl = "libsql://gps-danang-dashboard-hieu2906090.aws-ap-northeast-1.turso.io?authToken=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzU1MjUwOTAsImlkIjoiMDE5ZDY1OGEtYTQwMS03ZTI4LWJkY2ItMjhkZDU5Y2JlN2UzIiwicmlkIjoiMmRkYTQwMGEtM2U5Yi00ZDE4LWIzYTktMGY0YjgzNTU5YTMzIn0.6D_sMfre7ZRe7knH9Ng4-gjbCJ86bxXS2I_d1aKqpTNI3Wfk-2vsoGofu9UjKOrA66kmHcmZTGrIkMZJdYiwAg";

const turso = createClient({ url: tursoUrl });

async function main() {
  console.log("Connecting via direct Turso URL to fetch data...");
  try {
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`); 
    console.log("Replication role set to replica (bypassing foreign keys).");

    for (const dmmfModel of Prisma.dmmf.datamodel.models) {
      const dbName = dmmfModel.dbName || dmmfModel.name;
      const mapModelName = dmmfModel.name;
      
      let rows = [];
      try {
         const res = await turso.execute(`SELECT * FROM "${dbName}"`);
         rows = res.rows;
      } catch(e) {
         console.error(`Failed reading ${dbName}`, e);
         continue;
      }
      
      if (rows.length === 0) continue;
      
      // Clear target table
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${mapModelName}" CASCADE;`);

      const prismaDelegate = (prisma as any)[mapModelName.charAt(0).toLowerCase() + mapModelName.slice(1)];
      const mappedRows = rows.map((row: any) => {
        const obj: any = {};
        for (const field of dmmfModel.fields) {
           const rawVal = row[field.name];
           if (rawVal === null || rawVal === undefined) continue;
           
           if (field.type === "Boolean") {
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

      // Insert batches
      const batchSize = 100;
      for (let i = 0; i < mappedRows.length; i += batchSize) {
         await prismaDelegate.createMany({ data: mappedRows.slice(i, i + batchSize) });
      }
      console.log(`✅ Migrated ${rows.length} rows for ${mapModelName}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`);
    await prisma.$disconnect();
    console.log("Migration finished successfully.");
  }
}
main();
