import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const USER_ROLES_KEY = 'user_roles';

/**
 * Define os papéis globais do usuário (UserEntity.role) necessários para acessar o handler.
 * Deve ser usado após BearerAuthGuard (request.user.dbUser já preenchido).
 */
export const UserRoles = (...roles: Role[]) =>
  SetMetadata(USER_ROLES_KEY, roles);
