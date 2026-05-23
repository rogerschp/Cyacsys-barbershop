import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const requestId =
      this.readHeaderAsString(request, 'x-request-id') ?? randomUUID();
    const statusCode = this.resolveStatusCode(exception);
    const payload = this.resolveResponsePayload(exception, statusCode);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error({
        message: 'Unhandled exception',
        requestId,
        method: request.method,
        path: request.url,
        exception,
      });
    }

    response.status(statusCode).json({
      statusCode,
      requestId,
      timestamp: new Date().toISOString(),
      ...payload,
    });
  }

  private resolveStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveResponsePayload(
    exception: unknown,
    statusCode: number,
  ): Record<string, unknown> {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return { message: response };
      }
      if (response && typeof response === 'object') {
        return response as Record<string, unknown>;
      }
    }

    return statusCode >= HttpStatus.INTERNAL_SERVER_ERROR
      ? { message: 'Internal server error' }
      : { message: 'Unexpected error' };
  }

  private readHeaderAsString(
    request: Request,
    headerName: string,
  ): string | undefined {
    const value = request.headers[headerName];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    if (Array.isArray(value) && value.length > 0) {
      return value[0]?.trim() || undefined;
    }
    return undefined;
  }
}
