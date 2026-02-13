import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/common/enums/role.enum';
import { RoleNotAuthorizedException } from 'src/common/utils/auth-exceptions';
import { ROLES_KEY } from '../decorators/roles.decorators';
import { IDecodedToken } from '../ports/decoded-token.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.getRequiredRoles(context);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user = this.getAuthenticatedUser(context, requiredRoles);
    const userRole = await this.resolveUserRole(context, user);
    this.validateUserRole(userRole, requiredRoles);
    return true;
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
  ): IDecodedToken {
    const request = context
      .switchToHttp()
      .getRequest<{ user: IDecodedToken }>();

    if (!request.user) {
      throw new RoleNotAuthorizedException(
        requiredRoles,
        'User not authenticated',
      );
    }

    return request.user;
  }

  private async resolveUserRole(
    context: ExecutionContext,
    user: IDecodedToken,
  ): Promise<Role> {
    const roleFromToken = (user as IDecodedToken & { role?: Role }).role;
    if (roleFromToken && Object.values(Role).includes(roleFromToken)) {
      return roleFromToken;
    }
    throw new RoleNotAuthorizedException(
      this.getRequiredRoles(context) ?? [],
      'User has no role (token or DB)',
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
