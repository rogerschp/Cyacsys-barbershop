import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorDetails {
  [key: string]: unknown;
}

export class BaseException extends HttpException {
  constructor(message: string, status: HttpStatus, details?: ErrorDetails) {
    super(
      {
        message,
        error: 'BaseException',
        details,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}
