import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingMode } from '../../modules/professional-profile/entities/booking-mode.enum';
import { ProfessionalProfileEntity } from '../../modules/professional-profile/entities/professional-profile.entity';
import {
  CreateProfessionalProfileData,
  IProfessionalProfileRepository,
  UpdateProfessionalProfileData,
} from '../../modules/professional-profile/interfaces/professional-profile-repository.interface';

@Injectable()
export class ProfessionalProfileRepository
  implements IProfessionalProfileRepository
{
  constructor(
    @InjectRepository(ProfessionalProfileEntity)
    private readonly repo: Repository<ProfessionalProfileEntity>,
  ) {}

  async create(
    data: CreateProfessionalProfileData,
  ): Promise<ProfessionalProfileEntity> {
    const entity = this.repo.create({
      userId: data.userId,
      displayName: data.displayName,
      bio: data.bio ?? null,
      avatarUrl: data.avatarUrl,
      professionalType: data.professionalType,
      bookingMode: data.bookingMode ?? BookingMode.DIRECT_BOOKING,
      whatsappNumber: data.whatsappNumber ?? null,
      instagramUsername: data.instagramUsername ?? null,
      experienceYears: data.experienceYears,
      isActive: true,
    });
    return this.repo.save(entity);
  }

  async findById(id: string): Promise<ProfessionalProfileEntity | null> {
    return this.repo.findOne({
      where: { id },
      withDeleted: false,
    });
  }

  async findByUserIdNonDeleted(
    userId: string,
  ): Promise<ProfessionalProfileEntity | null> {
    return this.repo
      .createQueryBuilder('pp')
      .where('pp.user_id = :userId', { userId })
      .andWhere('pp.deletedAt IS NULL')
      .getOne();
  }

  async update(
    id: string,
    userId: string,
    data: UpdateProfessionalProfileData,
  ): Promise<ProfessionalProfileEntity> {
    const payload: Partial<ProfessionalProfileEntity> = {};
    if (data.displayName !== undefined) {
      payload.displayName = data.displayName;
    }
    if (data.bio !== undefined) {
      payload.bio = data.bio;
    }
    if (data.avatarUrl !== undefined) {
      payload.avatarUrl = data.avatarUrl;
    }
    if (data.professionalType !== undefined) {
      payload.professionalType = data.professionalType;
    }
    if (data.bookingMode !== undefined) {
      payload.bookingMode = data.bookingMode;
    }
    if (data.whatsappNumber !== undefined) {
      payload.whatsappNumber = data.whatsappNumber;
    }
    if (data.instagramUsername !== undefined) {
      payload.instagramUsername = data.instagramUsername;
    }
    if (data.experienceYears !== undefined) {
      payload.experienceYears = data.experienceYears;
    }
    if (data.isActive !== undefined) {
      payload.isActive = data.isActive;
    }
    await this.repo.update({ id, userId }, payload);
    const entity = await this.repo.findOne({
      where: { id, userId },
      withDeleted: false,
    });
    if (!entity) {
      throw new Error('Professional profile not found after update');
    }
    return entity;
  }
}
