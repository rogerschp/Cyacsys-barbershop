import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { UserEntity } from '../../modules/user/entities/user.entity';
import { UserStatus } from '../../modules/user/entities/user-status.enum';
import { CreateUserDto } from '../../modules/user/dto/create-user.dto';
import { UpdateUserDto } from '../../modules/user/dto/update-user.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  create(dto: CreateUserDto & { status?: UserStatus; role?: Role }) {
    const entity = this.repo.create({
      ...dto,
      firebaseUid: dto.firebaseUid ?? null,
      status: dto.status ?? UserStatus.ACTIVE,
      role: dto.role ?? Role.CLIENT,
    });
    return this.repo.save(entity);
  }

  /** Busca usuário por Firebase UID (apenas não deletados). Fonte da verdade no banco. */
  findByFirebaseUid(firebaseUid: string) {
    return this.repo.findOne({ where: { firebaseUid } });
  }

  /** Busca usuário por e-mail (apenas não deletados). */
  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  update(id: string, dto: UpdateUserDto) {
    return this.repo.save({ id, ...dto } as Partial<UserEntity>);
  }

  /** Atualiza firebaseUid de um usuário (vincular conta ao primeiro login). */
  setFirebaseUid(id: string, firebaseUid: string) {
    return this.repo.update(id, { firebaseUid } as Partial<UserEntity>);
  }

  softDelete(id: string) {
    return this.repo.softDelete(id);
  }
}
