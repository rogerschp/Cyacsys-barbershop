import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateBlockUseCase } from 'src/modules/availability/use-cases/update-block.use-case';
import { AVAILABILITY_REPOSITORY } from 'src/modules/availability/interfaces/availability-repository.interface';
import { TENANT_PROFESSIONAL_REPOSITORY } from 'src/modules/tenant-professional/interfaces/tenant-professional-repository.interface';
import { FindTenantUserByIdAndTenantUseCase } from 'src/modules/tenant-user/use-cases/find-tenant-user-by-id-and-tenant.use-case';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { BlockReason } from 'src/modules/availability/entities/block-reason.enum';
import { ProfessionalAvailabilityBlockEntity } from 'src/modules/availability/entities/professional-availability-block.entity';
describe('UpdateBlockUseCase', () => {
    let useCase: UpdateBlockUseCase;
    let availabilityRepository: {
        findBlockById: jest.Mock;
        updateBlock: jest.Mock;
    };
    let tenantProfessionalRepository: {
        findById: jest.Mock;
    };
    let findTenantUserByIdAndTenantUseCase: Record<string, jest.Mock>;
    const tenantId = 'tenant-uuid';
    const tenantProfessionalId = 'bp-uuid';
    const blockId = 'block-uuid';
    const userId = 'user-uuid';
    const baseBlock: ProfessionalAvailabilityBlockEntity = {
        id: blockId,
        tenantId,
        tenantProfessionalId,
        date: '2030-01-07',
        startTime: '12:00',
        endTime: '13:00',
        reason: BlockReason.LUNCH,
        bookingId: null,
        createdAt: new Date(),
        deletedAt: undefined,
    } as ProfessionalAvailabilityBlockEntity;
    beforeEach(async () => {
        availabilityRepository = {
            findBlockById: jest.fn().mockResolvedValue(baseBlock),
            updateBlock: jest.fn().mockResolvedValue({
                ...baseBlock,
                startTime: '12:30',
                endTime: '13:30',
            }),
        };
        tenantProfessionalRepository = {
            findById: jest.fn().mockResolvedValue({ id: tenantProfessionalId }),
        };
        findTenantUserByIdAndTenantUseCase = { run: jest.fn() };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UpdateBlockUseCase,
                { provide: AVAILABILITY_REPOSITORY, useValue: availabilityRepository },
                {
                    provide: TENANT_PROFESSIONAL_REPOSITORY,
                    useValue: tenantProfessionalRepository,
                },
                {
                    provide: FindTenantUserByIdAndTenantUseCase,
                    useValue: findTenantUserByIdAndTenantUseCase,
                },
            ],
        }).compile();
        useCase = module.get(UpdateBlockUseCase);
    });
    it('lança NotFound quando bloco não existe', async () => {
        availabilityRepository.findBlockById.mockResolvedValue(null);
        await expect(useCase.run(tenantId, tenantProfessionalId, blockId, { startTime: '12:00', endTime: '13:00' }, userId, TenantUserRole.ADMIN)).rejects.toThrow(NotFoundException);
    });
    it('lança BLOCK_REASON_RESERVED quando motivo é BOOKING', async () => {
        availabilityRepository.findBlockById.mockResolvedValue({
            ...baseBlock,
            reason: BlockReason.BOOKING,
            bookingId: 'booking-uuid',
        });
        await expect(useCase.run(tenantId, tenantProfessionalId, blockId, { startTime: '12:00', endTime: '13:00' }, userId, TenantUserRole.ADMIN)).rejects.toThrow(BusinessRuleException);
    });
    it('atualiza bloco comum', async () => {
        const updated = await useCase.run(tenantId, tenantProfessionalId, blockId, { startTime: '12:30', endTime: '13:30' }, userId, TenantUserRole.ADMIN);
        expect(availabilityRepository.updateBlock).toHaveBeenCalled();
        expect(updated.startTime).toBe('12:30');
    });
});
