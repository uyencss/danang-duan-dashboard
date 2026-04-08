import "dotenv/config";
import prisma from '../../src/lib/prisma';

async function main() {
  const projects = await (prisma as any).duAn.findMany({
    select: { id: true, tenDuAn: true, linhVuc: true }
  });
  console.log("Projects in DB:", JSON.stringify(projects, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
