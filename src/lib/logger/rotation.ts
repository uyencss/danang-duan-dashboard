import { createStream } from 'rotating-file-stream';
import fs from 'fs';
import path from 'path';

// Define log directory relative to project root
const logDir = path.join(process.cwd(), process.env.LOG_DIR || 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export const getRotationStream = () => {
    return createStream((time: Date | number | null, index: number | undefined) => {
        if (!time) return 'app.log';
        if (time) {
            const dateObj = time instanceof Date ? time : new Date(time);
            const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const year = dateObj.getFullYear();
            // Handle multiple files in the same rotation period if size limit is reached
            const idx = index ? `.${index}` : '';
            return `app.${year}-${month}${idx}.log.gz`;
        }
        return 'app.log';
    }, {
        interval: process.env.LOG_ROTATION_INTERVAL || '1M',
        size: process.env.LOG_MAX_SIZE || '100M',
        maxFiles: Number(process.env.LOG_MAX_FILES) || 12,
        path: logDir,
        compress: 'gzip',
    });
};
