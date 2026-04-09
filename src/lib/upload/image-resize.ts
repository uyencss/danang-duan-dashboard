import sharp from 'sharp';
import { UPLOAD_CONFIG } from './config';

export async function resizeImageIfNeeded(
  buffer: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; mimeType: string; wasResized: boolean }> {
  // Nếu không phải ảnh (hoặc là GIF), không resize/compress phức tạp
  if (!mimeType.startsWith('image/') || mimeType === 'image/gif') {
    return { buffer, mimeType, wasResized: false };
  }

  const sizeKb = buffer.length / 1024;
  if (sizeKb <= UPLOAD_CONFIG.IMAGE_MIN_SIZE_KB) {
    return { buffer, mimeType, wasResized: false };
  }

  let finalBuffer = buffer;
  let finalMime = mimeType;
  let wasResized = false;

  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // 1. Resize dimension
    if (metadata.width && metadata.height) {
      const maxDim = UPLOAD_CONFIG.IMAGE_MAX_DIMENSION;
      if (metadata.width > maxDim || metadata.height > maxDim) {
        image.resize({
          width: maxDim,
          height: maxDim,
          fit: 'inside', // Giữ aspect ratio
          withoutEnlargement: true,
        });
        wasResized = true;
      }
    }

    // 2. Format / Compression
    let quality = 85;
    
    // Convert all static images to WebP for better compression
    // unless it's already a highly compressed JPEG
    if (mimeType !== 'image/webp') {
       image.webp({ quality });
       finalMime = 'image/webp';
       wasResized = true;
    } else {
       image.webp({ quality });
       wasResized = true; // compressing anyway
    }

    finalBuffer = await image.toBuffer();
    
    // Nếu vẫn lớn hơn MAX_SIZE_KB, nén thêm
    while (finalBuffer.length / 1024 > UPLOAD_CONFIG.IMAGE_MAX_SIZE_KB && quality > 50) {
      quality -= 10;
      finalBuffer = await sharp(buffer)
        // re-apply resize if needed
        .resize({ width: UPLOAD_CONFIG.IMAGE_MAX_DIMENSION, height: UPLOAD_CONFIG.IMAGE_MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();
    }

    return { buffer: finalBuffer, mimeType: finalMime, wasResized };
  } catch (err) {
    console.error('Image resize error:', err);
    // Fallback original buffer on error
    return { buffer, mimeType, wasResized: false };
  }
}
