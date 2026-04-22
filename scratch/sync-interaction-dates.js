const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncInteractionDates() {
  console.log("Starting interaction date sync...");
  try {
    const projects = await prisma.duAn.findMany({
      include: {
        nhatKy: {
          select: { ngayGio: true },
          orderBy: { ngayGio: 'desc' }
        }
      }
    });

    console.log(`Processing ${projects.length} projects...`);

    for (const project of projects) {
      // Find the absolute latest date among logs and project creation
      let latestDate = new Date(project.createdAt);
      
      if (project.nhatKy && project.nhatKy.length > 0) {
        const logDate = new Date(project.nhatKy[0].ngayGio);
        if (logDate > latestDate) {
          latestDate = logDate;
        }
      }

      // Update if different
      if (!project.ngayChamsocCuoiCung || 
          new Date(project.ngayChamsocCuoiCung).getTime() !== latestDate.getTime()) {
        await prisma.duAn.update({
          where: { id: project.id },
          data: { ngayChamsocCuoiCung: latestDate }
        });
        console.log(`Updated Project ID ${project.id} ("${project.tenDuAn}"): New Last Interaction = ${latestDate.toISOString()}`);
      }
    }

    console.log("Sync complete!");
  } catch (error) {
    console.error("Sync failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

syncInteractionDates();
