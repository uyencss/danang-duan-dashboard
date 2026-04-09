import pino from 'pino';
import { redactOptions } from './logger/redact';
import { getRotationStream } from './logger/rotation';

const isDev = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info');

const streams: pino.StreamEntry[] = [];

// File transport (rotating file stream)
streams.push({ stream: getRotationStream() });

// Console transport
if (isDev) {
  // We use pino-pretty for the console stream in dev mode if it's available
  try {
    const pinoPretty = require('pino-pretty');
    streams.push({
      stream: pinoPretty({
        colorize: true,
        translateTime: 'dd/mm/yyyy HH:MM:ss',
        ignore: 'pid,hostname',
      })
    });
  } catch (e) {
    streams.push({ stream: process.stdout });
  }
} else {
  // Raw JSON console logs for production
  streams.push({ stream: process.stdout });
}

export const logger = pino({
  level: logLevel,
  redact: redactOptions,
  timestamp: () => {
    const d = new Date();
    const date = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');
    return `,"time":"${date}/${month}/${year} ${hours}:${minutes}:${seconds}"`;
  },
  base: {
    pid: process.pid,
    hostname: process.env.HOSTNAME || 'danang-dashboard-web',
  },
}, pino.multistream(streams));
