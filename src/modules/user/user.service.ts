import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from '../../repository/user/user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly repo: UserRepository) {}

  /** Usado pelo auth: resolve usuário após login Firebase (banco = fonte da verdade). */
  async findByFirebaseUid(firebaseUid: string) {
    return this.repo.findByFirebaseUid(firebaseUid);
  }

  async findByEmail(email: string) {
    return this.repo.findByEmail(email);
  }

  async findById(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    return this.repo.create(dto);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.repo.update(id, dto);
  }

  async delete(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    await this.repo.softDelete(id);
  }

  /**
   * Sincroniza usuário com o Firebase no login: busca por firebaseUid ou email;
   * se existir por email sem firebaseUid, vincula; se não existir, cria no banco.
   * O banco permanece a fonte da verdade (dados e status).
   */
  async findOrCreateFromFirebase(
    firebaseUid: string,
    email: string,
    name?: string,
  ) {
    let user = await this.repo.findByFirebaseUid(firebaseUid);
    if (user) return user;

    user = await this.repo.findByEmail(email);
    if (user) {
      await this.repo.setFirebaseUid(user.id, firebaseUid);
      return this.repo.findById(user.id) as Promise<typeof user>;
    }

    return this.repo.create({
      email,
      name: name ?? email.split('@')[0] ?? 'User',
      firebaseUid,
    });
  }
}
