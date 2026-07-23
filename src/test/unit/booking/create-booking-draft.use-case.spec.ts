import { Test, TestingModule } from '@nestjs/testing';
import { CreateBookingDraftUseCase } from 'src/modules/booking/use-cases/create-booking-draft.use-case';
import { TENANT_PROFESSIONAL_REPOSITORY } from 'src/modules/tenant-professional/interfaces/tenant-professional-repository.interface';
import { ValidateMembershipByUserIdAndTenantIdUseCase } from 'src/modules/tenant-user/use-cases/validate-membership-by-userId-and-tenantId.use-case';
import { GetAvailableSlotsUseCase } from 'src/modules/availability/use-cases/get-available-slots.use-case';
import { CustomerResolverService } from 'src/modules/booking/domain/customer-resolver.service';
import { CreateBookingDraftForCustomerUseCase } from 'src/modules/booking/use-cases/create-booking-draft-for-customer.use-case';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { TenantProfessionalStatus } from 'src/modules/tenant-professional/entities/tenant-professional-status.enum';

describe('CreateBookingDraftUseCase (ops adapter)', () => {
  let useCase: CreateBookingDraftUseCase;
  let createForCustomer: { run: jest.Mock };
  let customerResolver: { resolve: jest.Mock };
  let tenantProfessionalRepository: { findById: jest.Mock };

  const tenantId = 'tenant-uuid';
  const tenantProfessionalId = 'tp-uuid';
  const userId = 'user-uuid';

  beforeEach(async () => {
    createForCustomer = {
      run: jest.fn().mockResolvedValue({ status: BookingStatus.DRAFT }),
    };
    customerResolver = {
      resolve: jest.fn().mockReturnValue({
        kind: 'USER',
        key: `user:${userId}`,
        userId,
      }),
    };
    tenantProfessionalRepository = {
      findById: jest.fn().mockResolvedValue({
        id: tenantProfessionalId,
        status: TenantProfessionalStatus.ACTIVE,
        professionalProfile: { userId, isActive: true },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBookingDraftUseCase,
        {
          provide: TENANT_PROFESSIONAL_REPOSITORY,
          useValue: tenantProfessionalRepository,
        },
        {
          provide: ValidateMembershipByUserIdAndTenantIdUseCase,
          useValue: { run: jest.fn().mockResolvedValue({ id: 'tu-uuid' }) },
        },
        {
          provide: GetAvailableSlotsUseCase,
          useValue: { run: jest.fn() },
        },
        { provide: CustomerResolverService, useValue: customerResolver },
        {
          provide: CreateBookingDraftForCustomerUseCase,
          useValue: createForCustomer,
        },
      ],
    }).compile();

    useCase = module.get(CreateBookingDraftUseCase);
  });

  it('resolve identidade ops e delega criação', async () => {
    await useCase.run(
      tenantId,
      tenantProfessionalId,
      {
        serviceId: 'svc',
        date: '2099-06-15',
        startTime: '10:00',
        guestName: 'Maria',
        guestPhone: '11999999999',
      },
      userId,
      TenantUserRole.ADMIN,
    );

    expect(customerResolver.resolve).toHaveBeenCalledWith({
      mode: 'ops',
      authenticatedUserId: userId,
      clientUserId: undefined,
      guestName: 'Maria',
      guestPhone: '11999999999',
      guestEmail: undefined,
    });
    expect(createForCustomer.run).toHaveBeenCalled();
    expect(createForCustomer.run.mock.calls[0][0].createdByTenantUserId).toBe(
      'tu-uuid',
    );
  });
});
