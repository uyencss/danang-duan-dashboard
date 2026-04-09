import { logger } from '../logger';

export const withActionLogging = <T extends (...args: any[]) => Promise<any>>(
  actionName: string,
  actionFn: T
): T => {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const childLogger = logger.child({ actionName, module: 'server-action' });
    const startTime = Date.now();
    
    try {
      const result = await actionFn(...args);
      const executionTime = Date.now() - startTime;
      
      childLogger.info({
        msg: `Action executed: ${actionName}`,
        executionTime,
        params: args,
      });
      
      return result;
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      childLogger.error({
        msg: `Action failed: ${actionName}`,
        executionTime,
        params: args,
        err: error?.message || error
      });
      
      throw error;
    }
  }) as T;
};
