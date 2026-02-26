import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/common/enums/role.enum';
import {
  AuthenticationError,
  RoleNotAuthorizedException,
} from 'src/common/utils/auth-exceptions';
import { ROLES_KEY } from '../decorators/roles.decorators';
import { RequestUser } from '../strategies/bearer-token.strategy';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.getRequiredRoles(context);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const requestUser = this.getAuthenticatedUser(context);
    const userRole = this.resolveUserRole(context, requestUser);
    this.validateUserRole(userRole, requiredRoles);
    return true;
  }

  private getRequiredRoles(context: ExecutionContext): Role[] | undefined {
    return this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  private getAuthenticatedUser(context: ExecutionContext): RequestUser {
    const request = context.switchToHttp().getRequest<{ user: RequestUser }>();

    if (!request.user) {
      throw new AuthenticationError('User not authenticated');
    }

    return request.user;
  }

  /** Papel vem sempre do banco (fonte da verdade), não do token. */
  private resolveUserRole(
    context: ExecutionContext,
    requestUser: RequestUser,
  ): Role {
    const roleFromDb = requestUser.dbUser?.role;
    if (roleFromDb && Object.values(Role).includes(roleFromDb)) {
      return roleFromDb;
    }
    throw new RoleNotAuthorizedException(
      this.getRequiredRoles(context) ?? [],
      'User has no role in database',
    );
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
