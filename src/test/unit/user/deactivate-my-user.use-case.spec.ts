import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeactivateMyUserUseCase } from 'src/modules/user/use-cases/deactivate-my-user.use-case';
import { UpdateUserUseCase } from 'src/modules/user/use-cases/update-user.use-case';
import { UserStatus } from 'src/modules/user/entities/user-status.enum';
import { Role } from 'src/common/enums/role.enum';
import { UserResponseDto } from 'src/modules/user/dto/user-response.dto';

describe('DeactivateMyUserUseCase', () => {
  let useCase: DeactivateMyUserUseCase;
  let updateUserUseCase: { run: jest.Mock };

  const userId = 'user-uuid';
  const inactiveUser = {
    id: userId,
    status: UserStatus.INACTIVE,
    role: Role.CLIENT,
  } as UserResponseDto;

  beforeEach(async () => {
    updateUserUseCase = {
      run: jest
        .fn<() => Promise<UserResponseDto>>()
        .mockResolvedValue(inactiveUser),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeactivateMyUserUseCase,
        { provide: UpdateUserUseCase, useValue: updateUserUseCase },
      ],
    }).compile();

    useCase = module.get(DeactivateMyUserUseCase);
  });

  it('define status INACTIVE via UpdateUserUseCase', async () => {
    const result = await useCase.run(userId);
    expect(updateUserUseCase.run).toHaveBeenCalledWith(userId, {
      status: UserStatus.INACTIVE,
    });
    expect(result.status).toBe(UserStatus.INACTIVE);
  });

  it('lança quando userId vazio', async () => {
    await expect(useCase.run('')).rejects.toThrow(NotFoundException);
    expect(updateUserUseCase.run).not.toHaveBeenCalled();
  });
});
