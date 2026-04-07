import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  try {
    await prisma.duAn.create({
      data: {
        tenDuAn: "Test", customerId: 1, productId: 1,
        ngayBatDau: new Date(), tuan: 1, thang: 1, quy: 1, nam: 2026,
        ngayKetThuc: null
      } as any
    })
    console.log("Success")
  } catch (e) {
    console.error("PRISMA_ERROR_CAUGHT:", e.message)
  }
  await prisma.$disconnect()
}
main()
