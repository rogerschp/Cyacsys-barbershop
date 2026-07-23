import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UserStatus } from '../entities/user-status.enum';
import { UserResponseDto } from '../dto/user-response.dto';
import { UpdateUserUseCase } from './update-user.use-case';

/**
 * Self-service: sets status INACTIVE and disables the Firebase account.
 * Does not soft-delete (admin DELETE remains for that).
 */
@Injectable()
export class DeactivateMyUserUseCase {
  private readonly logger = new Logger(DeactivateMyUserUseCase.name);

  constructor(private readonly updateUserUseCase: UpdateUserUseCase) {}

  async run(userId: string): Promise<UserResponseDto> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.updateUserUseCase.run(userId, {
      status: UserStatus.INACTIVE,
    });

    this.logger.log({
      event: 'user_self_deactivated',
      userId,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }
}
