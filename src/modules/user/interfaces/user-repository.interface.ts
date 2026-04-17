import { UserEntity } from '../entities/user.entity';
import { Role } from '../../../common/enums/role.enum';
import { UserStatus } from '../entities/user-status.enum';
export interface CreateUserPortInput {
  email: string;
  name: string;
  passwordHash: string;
  firebaseUid?: string | null;
  status?: UserStatus;
  role?: Role;
}
export interface UpdateUserPortInput {
  email?: string;
  name?: string;
  status?: UserStatus;
  role?: Role;
  passwordHash?: string;
}
export interface IUserRepository {
  create(dto: CreateUserPortInput): Promise<UserEntity>;
  findByFirebaseUid(firebaseUid: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  update(id: string, data: UpdateUserPortInput): Promise<void>;
  setFirebaseUid(id: string, firebaseUid: string): Promise<void>;
  softDelete(id: string): Promise<void>;
}
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
