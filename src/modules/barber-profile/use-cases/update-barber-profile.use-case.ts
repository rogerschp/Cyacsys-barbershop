import { ForbiddenException, Inject, Injectable, Logger, NotFoundException, } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import { TenantUserService } from '../../tenant-user/tenant-user.service';
import { UpdateBarberProfileDto } from '../dto/update-barber-profile.dto';
import { BarberProfileEntity } from '../entities/barber-profile.entity';
import { BARBER_PROFILE_REPOSITORY, IBarberProfileRepository, UpdateBarberProfileData, } from '../interfaces/barber-profile-repository.interface';
@Injectable()
export class UpdateBarberProfileUseCase {
    private readonly logger = new Logger(UpdateBarberProfileUseCase.name);
    constructor(
    @Inject(BARBER_PROFILE_REPOSITORY)
    private readonly barberProfileRepository: IBarberProfileRepository, private readonly tenantUserService: TenantUserService) { }
    async run(tenantId: string, barberProfileId: string, dto: UpdateBarberProfileDto, performedBy?: string, callerRole?: string): Promise<BarberProfileEntity> {
        const existing = await this.barberProfileRepository.findById(barberProfileId, tenantId);
        if (!existing) {
            throw new NotFoundException('Barber profile not found');
        }
        if (callerRole === TenantUserRole.BARBER) {
            const tenantUser = await this.tenantUserService.getByIdAndTenant(existing.tenantUserId, tenantId);
            if (tenantUser.userId !== performedBy) {
                throw new ForbiddenException('Só é possível alterar o próprio perfil de barbeiro.');
            }
        }
        const updates: UpdateBarberProfileData = {};
        if (callerRole === TenantUserRole.BARBER) {
            if (dto.avatarUrl !== undefined) {
                updates.avatarUrl = dto.avatarUrl;
            }
            if (dto.bio !== undefined) {
                updates.bio = dto.bio ?? null;
            }
        }
        else {
            if (dto.displayName !== undefined) {
                updates.displayName = dto.displayName.trim();
            }
            if (dto.bio !== undefined) {
                updates.bio = dto.bio ?? null;
            }
            if (dto.avatarUrl !== undefined) {
                updates.avatarUrl = dto.avatarUrl;
            }
            if (dto.experienceYears !== undefined) {
                if (dto.experienceYears < 0) {
                    throw new BusinessRuleException('INVALID_EXPERIENCE_YEARS', 'experienceYears não pode ser negativo.');
                }
                updates.experienceYears = dto.experienceYears;
            }
        }
        if (Object.keys(updates).length === 0) {
            return existing;
        }
        const updated = await this.barberProfileRepository.update(barberProfileId, tenantId, updates);
        this.logger.log({
            event: 'barber_profile_updated',
            tenantId,
            barberProfileId,
            updatedFields: Object.keys(updates),
            performedBy: performedBy ?? undefined,
            timestamp: new Date().toISOString(),
        });
        return updated;
    }
}
