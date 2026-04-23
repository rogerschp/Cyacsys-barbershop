import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import {
  AuthenticationError,
  RoleNotAuthorizedException,
} from '../utils/auth-exceptions';
import { USER_ROLES_KEY } from '../decorators/user-roles.decorator';
interface RequestWithUserRole {
  user?: {
    dbUser?: {
      role: Role;
    };
  };
}
@Injectable()
export class UserRolesGuard implements CanActivate {
  private readonly logger = new Logger(UserRolesGuard.name);
  constructor(private readonly reflector: Reflector) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.getRequiredRoles(context);
    if (!requiredRoles?.length) {
      return true;
    }
    const request = context.switchToHttp().getRequest<RequestWithUserRole>();
    const requestUser = request.user;
    if (!requestUser) {
      throw new AuthenticationError('User not authenticated');
    }
    const userRole = this.resolveUserRole(context, requestUser, requiredRoles);
    this.validateUserRole(userRole, requiredRoles);
    return true;
  }
  private getRequiredRoles(context: ExecutionContext): Role[] | undefined {
    return this.reflector.getAllAndOverride<Role[]>(USER_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }
  private resolveUserRole(
    context: ExecutionContext,
    requestUser: RequestWithUserRole['user'],
    requiredRoles: Role[],
  ): Role {
    const roleFromDb = requestUser?.dbUser?.role;
    if (roleFromDb && Object.values(Role).includes(roleFromDb)) {
      return roleFromDb;
    }
    throw new RoleNotAuthorizedException(
      requiredRoles,
      requestUser?.dbUser?.role ?? 'none',
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
