import { prisma } from "../src/lib/prisma";

async function normalize() {
    console.log("Normalizing all project dates to UTC Midnight...");
    
    const projects = await prisma.duAn.findMany();
    let updatedCount = 0;

    for (const p of projects) {
        let changed = false;
        
        const normalizeDate = (d: Date) => {
            // If the time is around 17:00 UTC, it means it was likely 00:00 VN.
            // We should shift it to 00:00 UTC of the NEXT day.
            // If it's already 00:00 UTC, leave it.
            const hours = d.getUTCHours();
            if (hours >= 16 && hours <= 18) {
               const newDate = new Date(d);
               newDate.setUTCHours(0, 0, 0, 0);
               newDate.setUTCDate(newDate.getUTCDate() + 1);
               return newDate;
            }
            // Also ensure any date is set to midnight UTC
            if (hours !== 0 || d.getUTCMinutes() !== 0) {
               const newDate = new Date(d);
               newDate.setUTCHours(0, 0, 0, 0);
               return newDate;
            }
            return d;
        };

        const newStart = normalizeDate(p.ngayBatDau);
        const newEnd = p.ngayKetThuc ? normalizeDate(p.ngayKetThuc) : null;

        if (newStart.getTime() !== p.ngayBatDau.getTime() || (newEnd && p.ngayKetThuc && newEnd.getTime() !== p.ngayKetThuc.getTime())) {
            await prisma.duAn.update({
                where: { id: p.id },
                data: {
                    ngayBatDau: newStart,
                    ngayKetThuc: newEnd
                }
            });
            updatedCount++;
        }
    }

    console.log(`Updated ${updatedCount} projects.`);
}

normalize().finally(() => prisma.$disconnect());
