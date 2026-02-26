import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../../common/enums/role.enum';
import { UserStatus } from './user-status.enum';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  /** Firebase Auth UID. Liga a identidade Firebase ao usuário no banco (fonte da verdade). */
  @Index({ unique: true })
  @Column({ name: 'firebase_uid', nullable: true })
  @ApiProperty({
    nullable: true,
    description: 'UID do Firebase Auth; usado para resolver usuário após login',
  })
  firebaseUid: string | null;

  @Index({ unique: true })
  @Column()
  @ApiProperty({
    example: 'usuario@email.com',
    description: 'E-mail único do usuário',
  })
  email: string;

  @Column()
  @ApiProperty({ example: 'João Silva', description: 'Nome do usuário' })
  name: string;

  /**
   * Hash bcrypt da senha (nunca armazenamos senha em texto claro).
   * Por que persistir o hash no banco (arquitetura hexagonal + fonte da verdade):
   * - O banco é a fonte da verdade: o usuário foi criado pelo sistema com senha obrigatória;
   *   guardar o hash garante que a “credencial” existe no nosso domínio e permite
   *   re-sincronizar ou trocar senha no Firebase sem depender só de estado externo.
   * - Segurança: em caso de vazamento do DB, apenas hashes são expostos (bcrypt é
   *   one-way); o login continua sendo feito via Firebase (que usa a senha em texto só no fluxo).
   * - Uso futuro: confirmação de ações sensíveis ou “verificar senha” sem chamar Firebase
   *   (ex.: trocar email) pode usar compare(plain, passwordHash) no caso de negócio.
   * Nullable para compatibilidade com migrações; novos usuários sempre têm hash.
   */
  @Column({ name: 'password_hash', nullable: true })
  @Exclude()
  passwordHash: string | null;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  @ApiProperty({
    enum: UserStatus,
    description: 'ACTIVE = ativo; INACTIVE = desativado; SUSPENDED = bloqueado',
  })
  status: UserStatus;

  /** Papel do usuário (fonte da verdade no banco; não no token). */
  @Column({ type: 'enum', enum: Role, default: Role.CLIENT })
  @ApiProperty({
    enum: Role,
    description: 'Papel do usuário; autorização sempre consulta o banco',
  })
  role: Role;

  @CreateDateColumn()
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @DeleteDateColumn()
  @ApiProperty({
    nullable: true,
    description: 'Soft delete; preenchido quando o usuário é removido',
  })
  deletedAt?: Date;
}
