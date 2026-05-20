import { BookingMode } from '../entities/booking-mode.enum';
import { ProfessionalProfileEntity } from '../entities/professional-profile.entity';
import { ProfessionalType } from '../entities/professional-type.enum';

export interface CreateProfessionalProfileData {
  userId: string;
  displayName: string;
  bio?: string | null;
  avatarUrl: string;
  professionalType: ProfessionalType;
  bookingMode?: BookingMode;
  whatsappNumber?: string | null;
  instagramUsername?: string | null;
  experienceYears: number;
}

export interface UpdateProfessionalProfileData {
  displayName?: string;
  bio?: string | null;
  avatarUrl?: string;
  professionalType?: ProfessionalType;
  bookingMode?: BookingMode;
  whatsappNumber?: string | null;
  instagramUsername?: string | null;
  experienceYears?: number;
  isActive?: boolean;
}

export interface IProfessionalProfileRepository {
  create(
    data: CreateProfessionalProfileData,
  ): Promise<ProfessionalProfileEntity>;
  findById(id: string): Promise<ProfessionalProfileEntity | null>;
  findByUserIdNonDeleted(
    userId: string,
  ): Promise<ProfessionalProfileEntity | null>;
  update(
    id: string,
    userId: string,
    data: UpdateProfessionalProfileData,
  ): Promise<ProfessionalProfileEntity>;
}

export const PROFESSIONAL_PROFILE_REPOSITORY = Symbol(
  'PROFESSIONAL_PROFILE_REPOSITORY',
);
