import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ErrorDetails } from 'src/common/utils/base-exceptions';

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super({
      message: 'Invalid email or password',
      error: 'InvalidCredentialsException',
      timestamp: new Date().toISOString(),
    });
  }
}

export class AuthenticationError extends UnauthorizedException {
  constructor(message = 'Authentication failed', details?: ErrorDetails) {
    super({
      message,
      error: 'AuthenticationError',
      details,
      timestamp: new Date().toISOString(),
    });
  }
}

export class RoleNotAuthorizedException extends ForbiddenException {
  constructor(requiredRoles: string[], userRole: string) {
    super({
      message: `Access denied: Required roles [${requiredRoles.join(', ')}]. User role: ${userRole}`,
      error: 'RoleNotAuthorizedException',
      details: { requiredRoles, userRole },
      timestamp: new Date().toISOString(),
    });
  }
}
