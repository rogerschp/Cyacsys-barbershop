import { Inject, Injectable } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../interfaces/user-repository.interface';

@Injectable()
export class CheckUserExistsByEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repo: IUserRepository,
  ) {}

  async run(email: string): Promise<boolean> {
    const user = await this.repo.findByEmail(email);
    return !!user;
  }
}
