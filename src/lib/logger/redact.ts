import { type LoggerOptions } from 'pino';

export const redactOptions: LoggerOptions['redact'] = {
  paths: [
    'password',
    'token',
    'secret',
    'authorization',
    'cookie',
    'req.headers.cookie',
    'req.headers.authorization',
    'headers.cookie',
    'headers.authorization',
    'body.password',
    'body.token',
    'body.email',
    'to', 
    'email',
    'body.to'
  ],
  censor: (value: any, path: string[]) => {
    const key = path[path.length - 1]?.toLowerCase();
    if ((key === 'email' || key === 'to') && typeof value === 'string') {
      const parts = value.split('@');
      if (parts.length === 2 && parts[1].includes('.')) {
        const domainParts = parts[1].split('.');
        const tld = domainParts[domainParts.length - 1];
        return `***@***.${tld}`;
      }
    }
    return '[REDACTED]';
  }
};
