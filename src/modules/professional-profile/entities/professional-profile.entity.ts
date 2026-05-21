import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { ProfessionalType } from './professional-type.enum';
import { BookingMode } from './booking-mode.enum';

@Entity('professional_profiles')
@Index('IDX_professional_profiles_user_id', ['userId'])
export class ProfessionalProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @Column({ name: 'user_id' })
  @ApiProperty({ description: 'FK para User; identidade profissional global' })
  userId: string;

  @OneToOne(() => UserEntity, (user) => user.professionalProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'display_name', length: 255 })
  @ApiProperty({ example: 'João Silva', description: 'Nome de exibição' })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    nullable: true,
    example: 'Especialista em cortes modernos',
    description: 'Bio opcional',
  })
  bio: string | null;

  @Column({ name: 'avatar_url' })
  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'URL do avatar',
  })
  avatarUrl: string;

  @Column({
    name: 'professional_type',
    type: 'enum',
    enum: ProfessionalType,
    enumName: 'professional_profiles_professional_type_enum',
  })
  @ApiProperty({ enum: ProfessionalType })
  professionalType: ProfessionalType;

  @Column({
    name: 'booking_mode',
    type: 'enum',
    enum: BookingMode,
    enumName: 'professional_profiles_booking_mode_enum',
    default: BookingMode.DIRECT_BOOKING,
  })
  @ApiProperty({ enum: BookingMode, default: BookingMode.DIRECT_BOOKING })
  bookingMode: BookingMode;

  @Column({ name: 'whatsapp_number', type: 'varchar', length: 20, nullable: true })
  @ApiProperty({
    nullable: true,
    example: '5511999999999',
    description: 'Apenas dígitos',
  })
  whatsappNumber: string | null;

  @Column({
    name: 'instagram_username',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  @ApiProperty({
    nullable: true,
    example: 'joao.profissional',
    description: 'Sem @',
  })
  instagramUsername: string | null;

  @Column({ name: 'experience_years', type: 'int' })
  @ApiProperty({
    example: 5,
    description: 'Anos de experiência (>= 0)',
  })
  experienceYears: number;

  @Column({ name: 'is_active', default: true })
  @ApiProperty({
    example: true,
    description: 'Profissionais inativos não aparecem para clientes',
  })
  isActive: boolean;

  @CreateDateColumn()
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @DeleteDateColumn()
  @ApiProperty({
    nullable: true,
    description: 'Soft delete; deletados não aparecem em listagens',
  })
  deletedAt?: Date;
}
