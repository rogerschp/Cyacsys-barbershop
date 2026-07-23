import { Test, TestingModule } from '@nestjs/testing';
import { ConfirmClientBookingUseCase } from 'src/modules/booking/use-cases/confirm-client-booking.use-case';
import { BOOKING_REPOSITORY } from 'src/modules/booking/interfaces/booking-repository.interface';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';
import { TenantForbiddenException } from 'src/common/exceptions/tenant-forbidden.exception';

describe('ConfirmClientBookingUseCase', () => {
  let useCase: ConfirmClientBookingUseCase;
  const repo = {
    findByIdForTenantProfessional: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfirmClientBookingUseCase,
        { provide: BOOKING_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(ConfirmClientBookingUseCase);
    jest.clearAllMocks();
  });

  it('confirma quando clientUserId é o dono', async () => {
    const draft = {
      id: 'b1',
      tenantId: 't1',
      tenantProfessionalId: 'tp1',
      status: BookingStatus.DRAFT,
      clientUserId: 'user-1',
      startsAt: new Date('2099-01-01T15:00:00.000Z'),
    };
    repo.findByIdForTenantProfessional.mockResolvedValue(draft);
    repo.updateStatus.mockResolvedValue({
      ...draft,
      status: BookingStatus.CONFIRMED,
    });

    const result = await useCase.run('t1', 'tp1', 'b1', 'user-1');
    expect(result.status).toBe(BookingStatus.CONFIRMED);
    expect(repo.updateStatus).toHaveBeenCalled();
  });

  it('lança BOOKING_NOT_OWNED para outro usuário', async () => {
    repo.findByIdForTenantProfessional.mockResolvedValue({
      id: 'b1',
      tenantId: 't1',
      status: BookingStatus.DRAFT,
      clientUserId: 'user-1',
      startsAt: new Date('2099-01-01T15:00:00.000Z'),
    });

    await expect(
      useCase.run('t1', 'tp1', 'b1', 'user-2'),
    ).rejects.toBeInstanceOf(TenantForbiddenException);
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });
});
