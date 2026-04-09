import { logger } from '../logger';

export const withLogging = (handler: Function) => {
  return async (req: Request, ...args: any[]) => {
    const reqId = req.headers.get('x-request-id') || crypto.randomUUID();
    const childLogger = logger.child({ reqId, module: 'api' });
    
    const startTime = Date.now();
    const url = new URL(req.url);
    
    // Attempt to clone request to read body without consuming it
    let bodyObj = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      try {
        const clonedReq = req.clone();
        bodyObj = await clonedReq.json();
      } catch (e) {
        // Body is not JSON or cannot be read
      }
    }

    try {
      const response: Response = await handler(req, ...args);
      
      const responseTime = Date.now() - startTime;
      
      childLogger.info({
        msg: `${req.method} ${url.pathname}`,
        method: req.method,
        url: url.pathname,
        statusCode: response.status,
        responseTime,
        body: bodyObj,
      });
      
      return response;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      childLogger.error({
        msg: `Unhandled error in ${req.method} ${url.pathname}`,
        method: req.method,
        url: url.pathname,
        responseTime,
        body: bodyObj,
        err: error?.message || error
      });
      
      throw error;
    }
  };
};
