import { Test, TestingModule } from '@nestjs/testing';
import { CreateBarberServiceLinkUseCase } from 'src/modules/availability/use-cases/create-barber-service-link.use-case';
import { AVAILABILITY_REPOSITORY } from 'src/modules/availability/interfaces/availability-repository.interface';
import { SERVICE_REPOSITORY } from 'src/modules/service/interfaces/service-repository.interface';
import { BARBER_PROFILE_REPOSITORY } from 'src/modules/barber-profile/interfaces/barber-profile-repository.interface';
import { FindTenantUserByIdAndTenantUseCase } from 'src/modules/tenant-user/use-cases/find-tenant-user-by-id-and-tenant.use-case';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { BarberServiceLinkEntity } from 'src/modules/availability/entities/barber-service-link.entity';
import { ServiceEntity } from 'src/modules/service/entities/service.entity';
describe('CreateBarberServiceLinkUseCase', () => {
    let useCase: CreateBarberServiceLinkUseCase;
    let availabilityRepository: {
        findBarberServiceLinkByBarberAndService: jest.Mock;
        createBarberServiceLink: jest.Mock;
    };
    let serviceRepository: {
        findById: jest.Mock;
    };
    let barberProfileRepository: {
        findById: jest.Mock;
    };
    let findTenantUserByIdAndTenantUseCase: Record<string, jest.Mock>;
    const tenantId = 'tenant-uuid';
    const barberProfileId = 'bp-uuid';
    const serviceId = 'service-uuid';
    const userId = 'user-uuid';
    const mockService: ServiceEntity = {
        id: serviceId,
        tenantId,
        name: 'Corte',
        description: null,
        price: '40.00',
        durationInMinutes: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
    } as ServiceEntity;
    const mockLink: BarberServiceLinkEntity = {
        id: 'link-uuid',
        tenantId,
        barberProfileId,
        serviceId,
        isActive: true,
        createdAt: new Date(),
        deletedAt: undefined,
    } as BarberServiceLinkEntity;
    beforeEach(async () => {
        availabilityRepository = {
            findBarberServiceLinkByBarberAndService: jest.fn().mockResolvedValue(null),
            createBarberServiceLink: jest.fn().mockResolvedValue(mockLink),
        };
        serviceRepository = {
            findById: jest.fn().mockResolvedValue(mockService),
        };
        barberProfileRepository = {
            findById: jest.fn().mockResolvedValue({ id: barberProfileId }),
        };
        findTenantUserByIdAndTenantUseCase = { run: jest.fn() };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateBarberServiceLinkUseCase,
                { provide: AVAILABILITY_REPOSITORY, useValue: availabilityRepository },
                { provide: SERVICE_REPOSITORY, useValue: serviceRepository },
                { provide: BARBER_PROFILE_REPOSITORY, useValue: barberProfileRepository },
                {
                    provide: FindTenantUserByIdAndTenantUseCase,
                    useValue: findTenantUserByIdAndTenantUseCase,
                },
            ],
        }).compile();
        useCase = module.get(CreateBarberServiceLinkUseCase);
    });
    it('cria vínculo quando serviço ativo e não duplicado', async () => {
        const result = await useCase.run(tenantId, barberProfileId, { serviceId }, userId, TenantUserRole.ADMIN);
        expect(serviceRepository.findById).toHaveBeenCalledWith(serviceId, tenantId);
        expect(availabilityRepository.createBarberServiceLink).toHaveBeenCalledWith({
            tenantId,
            barberProfileId,
            serviceId,
        });
        expect(result).toEqual(mockLink);
    });
    it('lança quando serviço não existe', async () => {
        serviceRepository.findById.mockResolvedValue(null);
        await expect(useCase.run(tenantId, barberProfileId, { serviceId }, userId, TenantUserRole.ADMIN)).rejects.toThrow(BusinessRuleException);
    });
    it('lança SERVICE_INACTIVE quando serviço inativo', async () => {
        serviceRepository.findById.mockResolvedValue({ ...mockService, isActive: false });
        await expect(useCase.run(tenantId, barberProfileId, { serviceId }, userId, TenantUserRole.ADMIN)).rejects.toThrow(BusinessRuleException);
    });
    it('lança BARBER_SERVICE_ALREADY_EXISTS quando já existe vínculo', async () => {
        availabilityRepository.findBarberServiceLinkByBarberAndService.mockResolvedValue(mockLink);
        await expect(useCase.run(tenantId, barberProfileId, { serviceId }, userId, TenantUserRole.ADMIN)).rejects.toThrow(BusinessRuleException);
    });
});
