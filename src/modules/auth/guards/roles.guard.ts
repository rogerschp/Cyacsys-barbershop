import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/common/enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorators';
import { DecodedIdToken } from 'firebase-admin/auth';
import { RoleNotAuthorizedException } from 'src/common/utils/auth-exceptions';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.getRequiredRoles(context);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
  }

  private getRequiredRoles(context: ExecutionContext): Role[] | undefined {
    return this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }
  private getAuthenticatedUser(
    context: ExecutionContext,
    requiredRoles: Role[],
  ): DecodedIdToken {
    const request = context.switchToHttp().getRequest<{
      user: DecodedIdToken;
    }>();

    if (!request.user) {
      throw new RoleNotAuthorizedException(
        requiredRoles,
        'User not authenticated',
      );
    }

    return request.user;
  }

  private validateUserRole(userRole: Role, requiredRoles: Role[]): void {
    const hasRequiredRole = requiredRoles.includes(userRole);

    if (!hasRequiredRole) {
      this.logger.warn(
        `Access denied: User role '${userRole}' not in required roles [${requiredRoles.join(', ')}]`,
      );
      throw new RoleNotAuthorizedException(requiredRoles, userRole);
    }
  }
}
