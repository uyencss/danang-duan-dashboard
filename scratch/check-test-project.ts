import { PrismaClient } from '@prisma/client';

const DATABASE_URL = "postgresql://postgres:Pg_Secure_2026DbPwV2@100.68.79.40:5432/mobi_prod";

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  });

  try {
    const testProject = await prisma.duAn.findFirst({
      where: {
        tenDuAn: {
          contains: "test"
        }
      },
      include: {
        khachHang: true
      }
    });

    if (testProject) {
      console.log("PROJECT_FOUND");
      console.log(JSON.stringify(testProject, null, 2));
    } else {
      console.log("PROJECT_NOT_FOUND");
    }
  } catch (error) {
    console.error("ERROR", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
