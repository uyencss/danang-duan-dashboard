import fs from "fs/promises";
import path from "path";

async function main() {
    const pubUploads = path.join(process.cwd(), "public", "uploads");
    const targetDir = path.join(process.cwd(), "uploads", "2026", "04");
    
    try {
        await fs.mkdir(targetDir, { recursive: true });
        const files = await fs.readdir(pubUploads);
        
        for (const file of files) {
           const oldPath = path.join(pubUploads, file);
           const newPath = path.join(targetDir, file);
           const stat = await fs.stat(oldPath);
           if (stat.isFile()) {
              await fs.copyFile(oldPath, newPath);
              console.log(`Migrated ${file}`);
           }
        }
        
        console.log("Migration complete!");
    } catch (err) {
        console.log("public/uploads not found or empty", err);
    }
}
main();
