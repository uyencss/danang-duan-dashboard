import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function syncInteractionDates() {
  console.log("Starting interaction date sync...");
  try {
    const projects = await prisma.duAn.findMany({
      include: {
        nhatKy: {
          select: { ngayGio: true },
          orderBy: { ngayGio: 'desc' }
        }
      } as any
    });

    console.log(`Processing ${projects.length} projects...`);

    for (const project of projects) {
      let latestDate = new Date(project.createdAt);
      
      const p = project as any;
      if (p.nhatKy && p.nhatKy.length > 0) {
        const logDate = new Date(p.nhatKy[0].ngayGio);
        if (logDate > latestDate) {
          latestDate = logDate;
        }
      }

      if (!project.ngayChamsocCuoiCung || 
          new Date(project.ngayChamsocCuoiCung).getTime() !== latestDate.getTime()) {
        await prisma.duAn.update({
          where: { id: project.id },
          data: { ngayChamsocCuoiCung: latestDate }
        });
        console.log(`Updated ID ${project.id}: Last Interaction = ${latestDate.toISOString()}`);
      }
    }

    console.log("Sync complete!");
  } catch (error) {
    console.error("Sync failed:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

syncInteractionDates();
