
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.duAn.count();
    console.log('Project count:', count);
    const projects = await prisma.duAn.findMany({ take: 1 });
    console.log('Sample project:', projects);
  } catch (e) {
    console.error('PRISMA ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
