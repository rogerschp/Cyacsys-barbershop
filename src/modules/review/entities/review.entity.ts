import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { ReviewTargetType } from './review-target-type.enum';

@Entity('reviews')
@Index('IDX_reviews_target', ['targetType', 'targetId'])
@Index(
  'UQ_reviews_reviewer_target_active',
  ['reviewerUserId', 'targetType', 'targetId'],
  {
    unique: true,
    where: '"deletedAt" IS NULL',
  },
)
export class ReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @Column({ name: 'reviewer_user_id' })
  reviewerUserId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewer_user_id' })
  reviewer: UserEntity;

  @Column({ type: 'enum', enum: ReviewTargetType, name: 'target_type' })
  targetType: ReviewTargetType;

  @Column({ name: 'target_id' })
  targetId: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  comment: string | null;

  @Column({ name: 'is_edited', default: false })
  isEdited: boolean;

  @Column({ name: 'edited_at', type: 'timestamp', nullable: true })
  editedAt: Date | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  reply: string | null;

  @Column({ name: 'replied_at', type: 'timestamp', nullable: true })
  repliedAt: Date | null;

  @Column({ name: 'replied_by_user_id', nullable: true })
  repliedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'replied_by_user_id' })
  repliedBy: UserEntity | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
