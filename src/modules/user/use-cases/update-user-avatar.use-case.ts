import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { MediaType } from '../../media/enums/media-type.enum';
import { AssertLinkableMediaUseCase } from '../../media/use-cases/assert-linkable-media.use-case';
import { UserResponseDto } from '../dto/user-response.dto';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../interfaces/user-repository.interface';
import { FindUserByIdUseCase } from './find-user-by-id.use-case';

@Injectable()
export class UpdateUserAvatarUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly assertLinkableMedia: AssertLinkableMediaUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
  ) {}

  async run(userId: string, mediaId: string): Promise<UserResponseDto> {
    await this.assertLinkableMedia.assertOwnedByUser({
      mediaId,
      currentUserId: userId,
      expectedType: MediaType.USER_AVATAR,
    });

    const existing = await this.userRepository.findById(userId);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.update(userId, { avatarMediaId: mediaId });
    return this.findUserByIdUseCase.run(userId);
  }
}
