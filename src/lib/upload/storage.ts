import fs from 'fs/promises';
import path from 'path';
import { UPLOAD_CONFIG } from './config';

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<{ filePath: string; size: number }> {
  const date = new Date();
  const yearStr = date.getFullYear().toString();
  const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');

  // Create absolute dir if it doesn't exist /uploads/YYYY/MM
  const absoluteUploadDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), UPLOAD_CONFIG.BASE_DIR, yearStr, monthStr);
  await fs.mkdir(absoluteUploadDir, { recursive: true });

  // Create unique filename
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
  
  // Extension logic (handle WebP conversion)
  let extension = path.extname(sanitizedName) || '';
  if (mimeType === 'image/webp') {
     extension = '.webp';
  }

  const baseName = path.basename(sanitizedName, path.extname(sanitizedName));
  const uniqueName = Date.now().toString() + '-' + Math.round(Math.random() * 1e9).toString(36) + '-' + baseName + extension;
  
  const relativeFilePath = path.join(yearStr, monthStr, uniqueName).replace(/\\/g, '/'); // ensure forward slashes
  const absoluteFilePath = path.join(absoluteUploadDir, uniqueName);

  await fs.writeFile(absoluteFilePath, buffer);

  return { filePath: relativeFilePath, size: buffer.length };
}

export async function resolveFilePath(relativeFilePath: string): Promise<string | null> {
    const absolutePath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), UPLOAD_CONFIG.BASE_DIR, relativeFilePath);
    
    try {
        await fs.access(absolutePath);
        return absolutePath;
    } catch {
        return null;
    }
}
