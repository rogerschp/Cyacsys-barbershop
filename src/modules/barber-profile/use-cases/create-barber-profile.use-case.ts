import { Inject, Injectable, Logger } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import { TenantUserService } from '../../tenant-user/tenant-user.service';
import { CreateBarberProfileDto } from '../dto/create-barber-profile.dto';
import { BarberProfileEntity } from '../entities/barber-profile.entity';
import {
  BARBER_PROFILE_REPOSITORY,
  IBarberProfileRepository,
} from '../interfaces/barber-profile-repository.interface';

@Injectable()
export class CreateBarberProfileUseCase {
  private readonly logger = new Logger(CreateBarberProfileUseCase.name);

  constructor(
    @Inject(BARBER_PROFILE_REPOSITORY)
    private readonly barberProfileRepository: IBarberProfileRepository,
    private readonly tenantUserService: TenantUserService,
  ) {}

  async run(
    tenantId: string,
    dto: CreateBarberProfileDto,
    createdBy: string,
  ): Promise<BarberProfileEntity> {
    const tenantUser = await this.tenantUserService.getByIdAndTenant(
      dto.tenantUserId,
      tenantId,
    );

    if (tenantUser.role !== TenantUserRole.BARBER) {
      throw new BusinessRuleException(
        'INVALID_BARBER_ROLE',
        'O usuário vinculado deve ter role BARBER.',
        { tenantUserId: dto.tenantUserId },
      );
    }

    const existing =
      await this.barberProfileRepository.findByTenantUserIdNonDeleted(
        tenantId,
        dto.tenantUserId,
      );
    if (existing) {
      throw new BusinessRuleException(
        'BARBER_PROFILE_ALREADY_EXISTS',
        'Já existe um perfil de barbeiro para este usuário neste tenant.',
        { tenantUserId: dto.tenantUserId },
      );
    }

    if (dto.experienceYears < 0) {
      throw new BusinessRuleException(
        'INVALID_EXPERIENCE_YEARS',
        'experienceYears não pode ser negativo.',
      );
    }

    const displayName = dto.displayName.trim();
    const profile = await this.barberProfileRepository.create({
      tenantId,
      tenantUserId: dto.tenantUserId,
      displayName,
      bio: dto.bio ?? null,
      avatarUrl: dto.avatarUrl,
      experienceYears: dto.experienceYears,
    });

    this.logger.log({
      event: 'barber_profile_created',
      tenantId,
      barberProfileId: profile.id,
      tenantUserId: dto.tenantUserId,
      createdBy,
      timestamp: new Date().toISOString(),
    });

    return profile;
  }
}
