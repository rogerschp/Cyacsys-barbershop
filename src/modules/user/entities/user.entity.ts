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

  @Column({ name: 'password_hash', nullable: true })
  @Exclude()
  passwordHash: string | null;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  @ApiProperty({
    enum: UserStatus,
    description: 'ACTIVE = ativo; INACTIVE = desativado; SUSPENDED = bloqueado',
  })
  status: UserStatus;

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
