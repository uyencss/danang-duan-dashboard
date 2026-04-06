import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log("Users:", users.map(u => u.name));
  
  // Find project 1
  const duAn = await prisma.duAn.findFirst();
  if (!duAn) return console.log("No duan");
  
  // Find a user named Admin or similar
  const admin = users.find(u => u.role === "ADMIN");
  if (!admin) return console.log("No admin");

  await prisma.tinNhan.create({
    data: {
      projectId: duAn.id,
      userId: admin.id,
      content: "Đây là tin nhắn test từ Admin (gửi bằng lệnh) để kiểm tra UI",
    }
  });
  console.log("Created fake admin msg in project", duAn.id);
}
main();
