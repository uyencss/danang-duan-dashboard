export const UPLOAD_CONFIG = {
  BASE_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE: 20 * 1024 * 1024,         // 20MB raw upload limit
  IMAGE_MAX_SIZE_KB: 500,                   // Target: 200-500KB sau resize
  IMAGE_MIN_SIZE_KB: 200,                   // Không resize nếu dưới 200KB  
  IMAGE_MAX_DIMENSION: 1920,                // Max width/height px
  ALLOWED_MIME_TYPES: [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/csv',
  ],
};
