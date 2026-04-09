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
        translateTime: 'SYS:standard',
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
  base: {
    pid: process.pid,
    hostname: process.env.HOSTNAME || 'danang-dashboard-web',
  },
}, pino.multistream(streams));
