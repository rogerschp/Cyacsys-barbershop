import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../interfaces/user-repository.interface';
import {
  IPasswordHasher,
  PASSWORD_HASHER,
} from 'src/common/interfaces/password-hasher.interface';
import { UserSyncService } from '../infrastructure/user-sync.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { FindUserByIdUseCase } from './find-user-by-id.use-case';
import { AddressRepository } from 'src/repository/address/address.repository';
import { CheckUserExistsByEmailUseCase } from './check-user-exists-by-email.use-case';
import { UserResponseDto } from '../dto/user-response.dto';
import { DeleteUserUseCase } from './delete-user.use-case';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repo: IUserRepository,
    private readonly findUserById: FindUserByIdUseCase,
    private readonly checkUserExistsByEmailUseCase: CheckUserExistsByEmailUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    @Inject(PASSWORD_HASHER)
    private readonly passwordService: IPasswordHasher,
    private readonly userSyncService: UserSyncService,
    private readonly addressRepository: AddressRepository,
  ) {}
  async run(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.checkUserExistsByEmailUseCase.run(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    let addressId: string | null = null;
    let user = null;
    try {
      if (dto.address) {
        const address = await this.addressRepository.create(dto.address);
        addressId = address.id;
      }

      const passwordHash = await this.passwordService.hash(dto.password);
      user = await this.repo.create({
        email: dto.email,
        name: dto.name,
        telephone: dto.telephone,
        addressId,
        passwordHash,
        role: dto.role,
      });

      const { uid } = await this.userSyncService.createInFirebase({
        email: dto.email,
        password: dto.password,
        displayName: dto.name,
      });
      await this.repo.setFirebaseUid(user.id, uid);
      return this.findUserById.run(user.id);
    } catch (err) {
      if (user) await this.deleteUserUseCase.run(user.id);
      if (addressId) await this.addressRepository.softDelete(addressId);
      throw err;
    }
  }
}
