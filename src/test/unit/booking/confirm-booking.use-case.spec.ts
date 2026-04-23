import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { ConfirmBookingUseCase } from 'src/modules/booking/use-cases/confirm-booking.use-case';
import { BOOKING_REPOSITORY } from 'src/modules/booking/interfaces/booking-repository.interface';
import { BARBER_PROFILE_REPOSITORY } from 'src/modules/barber-profile/interfaces/barber-profile-repository.interface';
import { TenantUserService } from 'src/modules/tenant-user/tenant-user.service';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { BookingEntity } from 'src/modules/booking/entities/booking.entity';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
describe('ConfirmBookingUseCase', () => {
    let useCase: ConfirmBookingUseCase;
    let bookingRepository: {
        findByIdForBarber: jest.Mock;
        updateStatus: jest.Mock;
    };
    let barberProfileRepository: {
        findById: jest.Mock;
    };
    let tenantUserService: {
        getByIdAndTenant: jest.Mock;
    };
    const tenantId = 'tenant-uuid';
    const barberProfileId = 'bp-uuid';
    const userId = 'user-uuid';
    const bookingId = 'booking-uuid';
    const futureStart = new Date(Date.now() + 86400000);
    const draftBooking: BookingEntity = {
        id: bookingId,
        tenantId,
        barberProfileId,
        serviceId: 'svc',
        startsAt: futureStart,
        endsAt: new Date(futureStart.getTime() + 30 * 60000),
        status: BookingStatus.DRAFT,
        createdByTenantUserId: 'tu',
        createdAt: new Date(),
        updatedAt: new Date(),
    } as BookingEntity;
    beforeEach(async () => {
        bookingRepository = {
            findByIdForBarber: jest.fn().mockResolvedValue(draftBooking),
            updateStatus: jest.fn().mockResolvedValue({
                ...draftBooking,
                status: BookingStatus.CONFIRMED,
            }),
        };
        barberProfileRepository = {
            findById: jest.fn().mockResolvedValue({ id: barberProfileId }),
        };
        tenantUserService = {
            getByIdAndTenant: jest.fn(),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ConfirmBookingUseCase,
                { provide: BOOKING_REPOSITORY, useValue: bookingRepository },
                {
                    provide: BARBER_PROFILE_REPOSITORY,
                    useValue: barberProfileRepository,
                },
                { provide: TenantUserService, useValue: tenantUserService },
            ],
        }).compile();
        useCase = module.get(ConfirmBookingUseCase);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('confirma rascunho válido', async () => {
        const result = await useCase.run(tenantId, barberProfileId, bookingId, userId, TenantUserRole.ADMIN);
        expect(bookingRepository.updateStatus).toHaveBeenCalledWith(bookingId, tenantId, barberProfileId, BookingStatus.DRAFT, BookingStatus.CONFIRMED);
        expect(result.status).toBe(BookingStatus.CONFIRMED);
    });
    it('lança quando o booking não existe', async () => {
        bookingRepository.findByIdForBarber.mockResolvedValue(null);
        await expect(useCase.run(tenantId, barberProfileId, bookingId, userId, TenantUserRole.ADMIN)).rejects.toThrow(NotFoundException);
    });
    it('lança quando não é rascunho', async () => {
        bookingRepository.findByIdForBarber.mockResolvedValue({
            ...draftBooking,
            status: BookingStatus.CONFIRMED,
        });
        await expect(useCase.run(tenantId, barberProfileId, bookingId, userId, TenantUserRole.ADMIN)).rejects.toThrow(BusinessRuleException);
    });
    it('lança BOOKING_IN_THE_PAST quando o início já passou', async () => {
        const pastStart = new Date(Date.now() - 3600000);
        bookingRepository.findByIdForBarber.mockResolvedValue({
            ...draftBooking,
            startsAt: pastStart,
            endsAt: new Date(pastStart.getTime() + 30 * 60000),
        });
        jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.utc() as any);
        await expect(useCase.run(tenantId, barberProfileId, bookingId, userId, TenantUserRole.ADMIN)).rejects.toThrow(BusinessRuleException);
    });
    it('propaga SLOT_NOT_AVAILABLE quando updateStatus sinaliza conflito', async () => {
        bookingRepository.updateStatus.mockRejectedValue(new Error('BOOKING_SLOT_CONFLICT'));
        await expect(useCase.run(tenantId, barberProfileId, bookingId, userId, TenantUserRole.ADMIN)).rejects.toThrow(BusinessRuleException);
    });
});
