import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { QueryFailedError } from 'typeorm';
import { CreateBookingDraftUseCase } from 'src/modules/booking/use-cases/create-booking-draft.use-case';
import { BOOKING_REPOSITORY } from 'src/modules/booking/interfaces/booking-repository.interface';
import { BARBER_PROFILE_REPOSITORY } from 'src/modules/barber-profile/interfaces/barber-profile-repository.interface';
import { SERVICE_REPOSITORY } from 'src/modules/service/interfaces/service-repository.interface';
import { FindTenantUserByIdAndTenantUseCase } from 'src/modules/tenant-user/use-cases/find-tenant-user-by-id-and-tenant.use-case';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';
import { ValidateMembershipByUserIdAndTenantIdUseCase } from 'src/modules/tenant-user/use-cases/validate-membership-by-userId-and-tenantId.use-case';
import { GetAvailableSlotsUseCase } from 'src/modules/availability/use-cases/get-available-slots.use-case';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { BookingEntity } from 'src/modules/booking/entities/booking.entity';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
describe('CreateBookingDraftUseCase', () => {
    let useCase: CreateBookingDraftUseCase;
    let bookingRepository: {
        createDraft: jest.Mock;
    };
    let barberProfileRepository: {
        findById: jest.Mock;
    };
    let serviceRepository: {
        findById: jest.Mock;
    };
    let findTenantUserByIdAndTenantUseCase: {
        run: jest.Mock;
    };
    let validateMembershipByUserIdAndTenantIdUseCase: {
        run: jest.Mock;
    };
    let findTenantByIdUseCase: {
        run: jest.Mock;
    };
    let getAvailableSlotsUseCase: {
        run: jest.Mock;
    };
    const tenantId = 'tenant-uuid';
    const barberProfileId = 'bp-uuid';
    const userId = 'user-uuid';
    const serviceId = 'svc-uuid';
    const date = '2099-06-15';
    const mockBooking: BookingEntity = {
        id: 'booking-uuid',
        tenantId,
        barberProfileId,
        serviceId,
        startsAt: new Date(),
        endsAt: new Date(),
        status: BookingStatus.DRAFT,
        createdByTenantUserId: 'tu-uuid',
        createdAt: new Date(),
        updatedAt: new Date(),
    } as BookingEntity;
    beforeEach(async () => {
        bookingRepository = {
            createDraft: jest.fn().mockResolvedValue(mockBooking),
        };
        barberProfileRepository = {
            findById: jest.fn().mockResolvedValue({
                id: barberProfileId,
                isActive: true,
            }),
        };
        serviceRepository = {
            findById: jest.fn().mockResolvedValue({
                id: serviceId,
                isActive: true,
                durationInMinutes: 30,
            }),
        };
        findTenantUserByIdAndTenantUseCase = {
            run: jest.fn(),
        };
        validateMembershipByUserIdAndTenantIdUseCase = {
            run: jest.fn().mockResolvedValue({ id: 'tu-uuid' }),
        };
        findTenantByIdUseCase = {
            run: jest.fn().mockResolvedValue({
                id: tenantId,
                timezone: 'America/Sao_Paulo',
            }),
        };
        getAvailableSlotsUseCase = {
            run: jest.fn().mockResolvedValue({
                date,
                timezone: 'America/Sao_Paulo',
                slots: ['10:00', '10:30'],
            }),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateBookingDraftUseCase,
                { provide: BOOKING_REPOSITORY, useValue: bookingRepository },
                {
                    provide: BARBER_PROFILE_REPOSITORY,
                    useValue: barberProfileRepository,
                },
                { provide: SERVICE_REPOSITORY, useValue: serviceRepository },
                {
                    provide: FindTenantUserByIdAndTenantUseCase,
                    useValue: findTenantUserByIdAndTenantUseCase,
                },
                {
                    provide: ValidateMembershipByUserIdAndTenantIdUseCase,
                    useValue: validateMembershipByUserIdAndTenantIdUseCase,
                },
                { provide: FindTenantByIdUseCase, useValue: findTenantByIdUseCase },
                { provide: GetAvailableSlotsUseCase, useValue: getAvailableSlotsUseCase },
            ],
        }).compile();
        useCase = module.get(CreateBookingDraftUseCase);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('cria rascunho quando o slot está disponível', async () => {
        const result = await useCase.run(tenantId, barberProfileId, { serviceId, date, startTime: '10:00' }, userId, TenantUserRole.ADMIN);
        expect(getAvailableSlotsUseCase.run).toHaveBeenCalledWith(tenantId, barberProfileId, serviceId, date, userId, TenantUserRole.ADMIN);
        expect(bookingRepository.createDraft).toHaveBeenCalled();
        expect(result.status).toBe(BookingStatus.DRAFT);
    });
    it('lança SLOT_NOT_AVAILABLE quando o horário não está na lista', async () => {
        await expect(useCase.run(tenantId, barberProfileId, { serviceId, date, startTime: '14:00' }, userId, TenantUserRole.ADMIN)).rejects.toThrow(BusinessRuleException);
        expect(bookingRepository.createDraft).not.toHaveBeenCalled();
    });
    it('lança NotFound quando o barbeiro não existe', async () => {
        barberProfileRepository.findById.mockResolvedValue(null);
        await expect(useCase.run(tenantId, barberProfileId, { serviceId, date, startTime: '10:00' }, userId, TenantUserRole.ADMIN)).rejects.toThrow(NotFoundException);
    });
    it('lança NotFound quando o serviço não existe', async () => {
        serviceRepository.findById.mockResolvedValue(null);
        await expect(useCase.run(tenantId, barberProfileId, { serviceId, date, startTime: '10:00' }, userId, TenantUserRole.ADMIN)).rejects.toThrow(NotFoundException);
    });
    it('lança BARBER_INACTIVE quando barbeiro inativo', async () => {
        barberProfileRepository.findById.mockResolvedValue({
            id: barberProfileId,
            isActive: false,
        });
        await expect(useCase.run(tenantId, barberProfileId, { serviceId, date, startTime: '10:00' }, userId, TenantUserRole.ADMIN)).rejects.toThrow(BusinessRuleException);
    });
    it('lança SERVICE_INACTIVE quando serviço inativo', async () => {
        serviceRepository.findById.mockResolvedValue({
            id: serviceId,
            isActive: false,
            durationInMinutes: 30,
        });
        await expect(useCase.run(tenantId, barberProfileId, { serviceId, date, startTime: '10:00' }, userId, TenantUserRole.ADMIN)).rejects.toThrow(BusinessRuleException);
    });
    it('lança BOOKING_IN_THE_PAST quando o slot já passou', async () => {
        jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromObject({ year: 2099, month: 6, day: 15, hour: 11, minute: 0, second: 0 }, { zone: 'America/Sao_Paulo' }) as any);
        try {
            await useCase.run(tenantId, barberProfileId, { serviceId, date, startTime: '10:00' }, userId, TenantUserRole.ADMIN);
            expect(true).toBe(false);
        }
        catch (e) {
            expect(e).toBeInstanceOf(BusinessRuleException);
            expect((e as BusinessRuleException).getResponse()).toMatchObject({ code: 'BOOKING_IN_THE_PAST' });
        }
    });
    it('lança BOOKING_MIN_LEAD_NOT_MET quando falta antecedência de 15 minutos', async () => {
        jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromObject({ year: 2099, month: 6, day: 15, hour: 9, minute: 50, second: 0 }, { zone: 'America/Sao_Paulo' }) as any);
        try {
            await useCase.run(tenantId, barberProfileId, { serviceId, date, startTime: '10:00' }, userId, TenantUserRole.ADMIN);
            expect(true).toBe(false);
        }
        catch (e) {
            expect(e).toBeInstanceOf(BusinessRuleException);
            expect((e as BusinessRuleException).getResponse()).toMatchObject({ code: 'BOOKING_MIN_LEAD_NOT_MET' });
        }
    });
    it('lança SLOT_NOT_AVAILABLE quando o repositório sinaliza conflito', async () => {
        bookingRepository.createDraft.mockRejectedValue(new Error('BOOKING_SLOT_CONFLICT'));
        await expect(useCase.run(tenantId, barberProfileId, { serviceId, date, startTime: '10:00' }, userId, TenantUserRole.ADMIN)).rejects.toThrow(BusinessRuleException);
    });
    it('lança SLOT_NOT_AVAILABLE quando violação única 23505', async () => {
        const err = new QueryFailedError('', [], new Error('dup'));
        (err as any).driverError = { code: '23505' };
        bookingRepository.createDraft.mockRejectedValue(err);
        await expect(useCase.run(tenantId, barberProfileId, { serviceId, date, startTime: '10:00' }, userId, TenantUserRole.ADMIN)).rejects.toThrow(BusinessRuleException);
    });
});
