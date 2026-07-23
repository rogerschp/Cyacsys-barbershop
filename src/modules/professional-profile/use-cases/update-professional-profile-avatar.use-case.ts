import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MediaType } from '../../media/enums/media-type.enum';
import { AssertLinkableMediaUseCase } from '../../media/use-cases/assert-linkable-media.use-case';
import { ProfessionalProfileResponseDto } from '../dto/professional-profile-response.dto';
import {
  IProfessionalProfileRepository,
  PROFESSIONAL_PROFILE_REPOSITORY,
} from '../interfaces/professional-profile-repository.interface';
import { ProfessionalProfileMapper } from '../mappers/professional-profile.mapper';

@Injectable()
export class UpdateProfessionalProfileAvatarUseCase {
  private readonly logger = new Logger(
    UpdateProfessionalProfileAvatarUseCase.name,
  );

  constructor(
    @Inject(PROFESSIONAL_PROFILE_REPOSITORY)
    private readonly professionalProfileRepository: IProfessionalProfileRepository,
    private readonly assertLinkableMedia: AssertLinkableMediaUseCase,
  ) {}

  async run(
    userId: string,
    mediaId: string,
  ): Promise<ProfessionalProfileResponseDto> {
    const existing =
      await this.professionalProfileRepository.findByUserIdNonDeleted(userId);
    if (!existing) {
      throw new NotFoundException('Professional profile not found');
    }

    await this.assertLinkableMedia.assertOwnedByUser({
      mediaId,
      currentUserId: userId,
      expectedType: MediaType.AVATAR,
    });

    const updated = await this.professionalProfileRepository.update(
      existing.id,
      userId,
      { avatarMediaId: mediaId },
    );

    this.logger.log({
      event: 'professional_avatar_linked',
      userId,
      professionalProfileId: existing.id,
      mediaId,
      timestamp: new Date().toISOString(),
    });

    return ProfessionalProfileMapper.toResponse(updated);
  }
}
