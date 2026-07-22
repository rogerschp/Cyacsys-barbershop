import { Test, TestingModule } from '@nestjs/testing';
import { CreateBookingDraftForCustomerUseCase } from 'src/modules/booking/use-cases/create-booking-draft-for-customer.use-case';
import { BOOKING_REPOSITORY } from 'src/modules/booking/interfaces/booking-repository.interface';
import { TENANT_PROFESSIONAL_REPOSITORY } from 'src/modules/tenant-professional/interfaces/tenant-professional-repository.interface';
import { SERVICE_REPOSITORY } from 'src/modules/service/interfaces/service-repository.interface';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';
import { AssertCustomerBookingPolicies } from 'src/modules/booking/domain/assert-customer-booking-policies';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';
import { TenantProfessionalStatus } from 'src/modules/tenant-professional/entities/tenant-professional-status.enum';
import { BookingMode } from 'src/modules/professional-profile/entities/booking-mode.enum';
import { guestIdentityKey, userIdentityKey } from 'src/modules/booking/domain/customer-identity';
import { AvailableSlotsResponseDto } from 'src/modules/availability/dto/available-slots-response.dto';

describe('CreateBookingDraftForCustomerUseCase', () => {
  let useCase: CreateBookingDraftForCustomerUseCase;
  let bookingRepository: { createDraft: jest.Mock };
  let assertPolicies: { assertCanCreate: jest.Mock };

  const tenantId = 'tenant-uuid';
  const tenantProfessionalId = 'tp-uuid';
  const serviceId = 'svc-uuid';
  const date = '2099-06-15';

  beforeEach(async () => {
    bookingRepository = {
      createDraft: jest.fn().mockResolvedValue({
        id: 'booking-uuid',
        status: BookingStatus.DRAFT,
      }),
    };
    assertPolicies = { assertCanCreate: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBookingDraftForCustomerUseCase,
        { provide: BOOKING_REPOSITORY, useValue: bookingRepository },
        {
          provide: TENANT_PROFESSIONAL_REPOSITORY,
          useValue: {
            findById: jest.fn().mockResolvedValue({
              id: tenantProfessionalId,
              status: TenantProfessionalStatus.ACTIVE,
              professionalProfile: {
                isActive: true,
                bookingMode: BookingMode.DIRECT_BOOKING,
              },
            }),
          },
        },
        {
          provide: SERVICE_REPOSITORY,
          useValue: {
            findById: jest.fn().mockResolvedValue({
              id: serviceId,
              isActive: true,
              durationInMinutes: 30,
            }),
          },
        },
        {
          provide: FindTenantByIdUseCase,
          useValue: {
            run: jest.fn().mockResolvedValue({
              timezone: 'America/Sao_Paulo',
            }),
          },
        },
        {
          provide: AssertCustomerBookingPolicies,
          useValue: assertPolicies,
        },
      ],
    }).compile();

    useCase = module.get(CreateBookingDraftForCustomerUseCase);
  });

  it('cria draft autenticado com clientUserId', async () => {
    const identity = {
      kind: 'USER' as const,
      key: userIdentityKey('user-1'),
      userId: 'user-1',
    };

    await useCase.run({
      tenantId,
      tenantProfessionalId,
      dto: { serviceId, date, startTime: '10:00' },
      identity,
      createdByTenantUserId: null,
      loadAvailableSlots: async () => ({
        date,
        timezone: 'America/Sao_Paulo',
        slots: ['10:00'],
      }),
    });

    expect(assertPolicies.assertCanCreate).toHaveBeenCalled();
    expect(bookingRepository.createDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        clientUserId: 'user-1',
        guestName: null,
        guestPhone: null,
        guestEmail: null,
        createdByTenantUserId: null,
      }),
    );
  });

  it('cria draft guest com telefone normalizado na identity', async () => {
    const phone = '5511999999999';
    const identity = {
      kind: 'GUEST' as const,
      key: guestIdentityKey(phone),
      displayName: 'João',
      phone,
      email: null,
      userId: null,
    };

    await useCase.run({
      tenantId,
      tenantProfessionalId,
      dto: { serviceId, date, startTime: '10:00' },
      identity,
      createdByTenantUserId: null,
      loadAvailableSlots: async () => ({
        date,
        timezone: 'America/Sao_Paulo',
        slots: ['10:00'],
      }),
    });

    expect(bookingRepository.createDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        clientUserId: null,
        guestName: 'João',
        guestPhone: phone,
      }),
    );
  });

  it('propaga CUSTOMER_TIME_CONFLICT das policies', async () => {
    assertPolicies.assertCanCreate.mockRejectedValue(
      new BusinessRuleException(
        'CUSTOMER_TIME_CONFLICT',
        'conflito',
      ),
    );

    await expect(
      useCase.run({
        tenantId,
        tenantProfessionalId,
        dto: { serviceId, date, startTime: '10:00' },
        identity: {
          kind: 'USER',
          key: userIdentityKey('u'),
          userId: 'u',
        },
        createdByTenantUserId: null,
        loadAvailableSlots: async () => ({
          date,
          timezone: 'America/Sao_Paulo',
          slots: ['10:00'],
        }),
      }),
    ).rejects.toBeInstanceOf(BusinessRuleException);
  });
});
