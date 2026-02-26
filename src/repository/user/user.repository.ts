import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { UserEntity } from '../../modules/user/entities/user.entity';
import { UserStatus } from '../../modules/user/entities/user-status.enum';
import {
  IUserRepository,
  CreateUserPortInput,
  UpdateUserPortInput,
} from '../../modules/user/interfaces/user-repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async create(dto: CreateUserPortInput): Promise<UserEntity> {
    const entity = this.repo.create({
      ...dto,
      firebaseUid: dto.firebaseUid ?? null,
      status: dto.status ?? UserStatus.ACTIVE,
      role: dto.role ?? Role.CLIENT,
    });
    return this.repo.save(entity);
  }

  async findByFirebaseUid(firebaseUid: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { firebaseUid } });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, data: UpdateUserPortInput): Promise<void> {
    await this.repo.save({ id, ...data } as Partial<UserEntity>);
  }

  async setFirebaseUid(id: string, firebaseUid: string): Promise<void> {
    await this.repo.update(id, { firebaseUid } as Partial<UserEntity>);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
