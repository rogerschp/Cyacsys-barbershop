import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateBlockUseCase } from 'src/modules/availability/use-cases/update-block.use-case';
import { AVAILABILITY_REPOSITORY } from 'src/modules/availability/interfaces/availability-repository.interface';
import { BARBER_PROFILE_REPOSITORY } from 'src/modules/barber-profile/interfaces/barber-profile-repository.interface';
import { TenantUserService } from 'src/modules/tenant-user/tenant-user.service';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { BlockReason } from 'src/modules/availability/entities/block-reason.enum';
import { BarberAvailabilityBlockEntity } from 'src/modules/availability/entities/barber-availability-block.entity';

describe('UpdateBlockUseCase', () => {
  let useCase: UpdateBlockUseCase;
  let availabilityRepository: {
    findBlockById: jest.Mock;
    updateBlock: jest.Mock;
  };
  let barberProfileRepository: { findById: jest.Mock };
  let tenantUserService: Record<string, jest.Mock>;

  const tenantId = 'tenant-uuid';
  const barberProfileId = 'bp-uuid';
  const blockId = 'block-uuid';
  const userId = 'user-uuid';

  const baseBlock: BarberAvailabilityBlockEntity = {
    id: blockId,
    tenantId,
    barberProfileId,
    date: '2030-01-07',
    startTime: '12:00',
    endTime: '13:00',
    reason: BlockReason.LUNCH,
    bookingId: null,
    createdAt: new Date(),
    deletedAt: undefined,
  } as BarberAvailabilityBlockEntity;

  beforeEach(async () => {
    availabilityRepository = {
      findBlockById: jest.fn().mockResolvedValue(baseBlock),
      updateBlock: jest.fn().mockResolvedValue({
        ...baseBlock,
        startTime: '12:30',
        endTime: '13:30',
      }),
    };
    barberProfileRepository = {
      findById: jest.fn().mockResolvedValue({ id: barberProfileId }),
    };
    tenantUserService = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateBlockUseCase,
        { provide: AVAILABILITY_REPOSITORY, useValue: availabilityRepository },
        {
          provide: BARBER_PROFILE_REPOSITORY,
          useValue: barberProfileRepository,
        },
        { provide: TenantUserService, useValue: tenantUserService },
      ],
    }).compile();

    useCase = module.get(UpdateBlockUseCase);
  });

  it('lança NotFound quando bloco não existe', async () => {
    availabilityRepository.findBlockById.mockResolvedValue(null);

    await expect(
      useCase.run(
        tenantId,
        barberProfileId,
        blockId,
        { startTime: '12:00', endTime: '13:00' },
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('lança BLOCK_REASON_RESERVED quando motivo é BOOKING', async () => {
    availabilityRepository.findBlockById.mockResolvedValue({
      ...baseBlock,
      reason: BlockReason.BOOKING,
      bookingId: 'booking-uuid',
    });

    await expect(
      useCase.run(
        tenantId,
        barberProfileId,
        blockId,
        { startTime: '12:00', endTime: '13:00' },
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(BusinessRuleException);
  });

  it('atualiza bloco comum', async () => {
    const updated = await useCase.run(
      tenantId,
      barberProfileId,
      blockId,
      { startTime: '12:30', endTime: '13:30' },
      userId,
      TenantUserRole.ADMIN,
    );

    expect(availabilityRepository.updateBlock).toHaveBeenCalled();
    expect(updated.startTime).toBe('12:30');
  });
});
