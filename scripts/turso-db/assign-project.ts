import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import "dotenv/config";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "an.nv@mobifone.vn" }
  });

  if (!user) {
    console.log("User not found.");
    return;
  }

  const project = await prisma.duAn.findFirst({
    where: { 
      tenDuAn: "Trục dữ liệu cho Sở Y tế" 
    }
  });
  
  const project2 = await prisma.duAn.findFirst({
    where: { 
      tenDuAn: "Làng Đại học Đà Nẵng" 
    }
  });

  if (project) {
    await prisma.duAn.update({
      where: { id: project.id },
      data: { amId: user.id }
    });
    console.log(`Assigned project ${project.id} to user ${user.email} as AM`);
  }
  
  if (project2) {
    await prisma.duAn.update({
      where: { id: project2.id },
      data: { chuyenVienId: user.id }
    });
    console.log(`Assigned project ${project2.id} to user ${user.email} as Chuyen Vien`);
  }
  
}

main().catch(console.error).finally(() => prisma.$disconnect());
