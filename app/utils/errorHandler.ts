import { NextResponse } from 'next/server';
import { logger } from './logger';

export function withErrorHandling<T extends (...args: any[]) => Promise<Response | any>>(handler: T) {
  return async (request: Request, context: any): Promise<Response> => {
    try {
      const result = await handler(request, context);
      return result instanceof Response ? result : NextResponse.json(result);
    } catch (error) {
      logger.log('error', 'Unhandled API error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}
