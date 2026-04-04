
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log('Users:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));
  } catch (e) {
    console.error('PRISMA ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
