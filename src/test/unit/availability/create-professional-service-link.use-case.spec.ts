import { Test, TestingModule } from '@nestjs/testing';
import { CreateProfessionalServiceLinkUseCase } from 'src/modules/availability/use-cases/create-professional-service-link.use-case';
import { AVAILABILITY_REPOSITORY } from 'src/modules/availability/interfaces/availability-repository.interface';
import { SERVICE_REPOSITORY } from 'src/modules/service/interfaces/service-repository.interface';
import { TENANT_PROFESSIONAL_REPOSITORY } from 'src/modules/tenant-professional/interfaces/tenant-professional-repository.interface';
import { FindTenantUserByIdAndTenantUseCase } from 'src/modules/tenant-user/use-cases/find-tenant-user-by-id-and-tenant.use-case';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { ProfessionalServiceLinkEntity } from 'src/modules/availability/entities/professional-service-link.entity';
import { ServiceEntity } from 'src/modules/service/entities/service.entity';
describe('CreateProfessionalServiceLinkUseCase', () => {
  let useCase: CreateProfessionalServiceLinkUseCase;
  let availabilityRepository: {
    findProfessionalServiceLinkByProfessionalAndService: jest.Mock;
    createProfessionalServiceLink: jest.Mock;
  };
  let serviceRepository: {
    findById: jest.Mock;
  };
  let tenantProfessionalRepository: {
    findById: jest.Mock;
  };
  let findTenantUserByIdAndTenantUseCase: Record<string, jest.Mock>;
  const tenantId = 'tenant-uuid';
  const tenantProfessionalId = 'bp-uuid';
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
  const mockLink: ProfessionalServiceLinkEntity = {
    id: 'link-uuid',
    tenantId,
    tenantProfessionalId,
    serviceId,
    isActive: true,
    createdAt: new Date(),
    deletedAt: undefined,
  } as ProfessionalServiceLinkEntity;
  beforeEach(async () => {
    availabilityRepository = {
      findProfessionalServiceLinkByProfessionalAndService: jest
        .fn()
        .mockResolvedValue(null),
      createProfessionalServiceLink: jest.fn().mockResolvedValue(mockLink),
    };
    serviceRepository = {
      findById: jest.fn().mockResolvedValue(mockService),
    };
    tenantProfessionalRepository = {
      findById: jest.fn().mockResolvedValue({ id: tenantProfessionalId }),
    };
    findTenantUserByIdAndTenantUseCase = { run: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProfessionalServiceLinkUseCase,
        { provide: AVAILABILITY_REPOSITORY, useValue: availabilityRepository },
        { provide: SERVICE_REPOSITORY, useValue: serviceRepository },
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
    useCase = module.get(CreateProfessionalServiceLinkUseCase);
  });
  it('cria vínculo quando serviço ativo e não duplicado', async () => {
    const result = await useCase.run(
      tenantId,
      tenantProfessionalId,
      { serviceId },
      userId,
      TenantUserRole.ADMIN,
    );
    expect(serviceRepository.findById).toHaveBeenCalledWith(
      serviceId,
      tenantId,
    );
    expect(
      availabilityRepository.createProfessionalServiceLink,
    ).toHaveBeenCalledWith({
      tenantId,
      tenantProfessionalId,
      serviceId,
    });
    expect(result).toEqual(mockLink);
  });
  it('lança quando serviço não existe', async () => {
    serviceRepository.findById.mockResolvedValue(null);
    await expect(
      useCase.run(
        tenantId,
        tenantProfessionalId,
        { serviceId },
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(BusinessRuleException);
  });
  it('lança SERVICE_INACTIVE quando serviço inativo', async () => {
    serviceRepository.findById.mockResolvedValue({
      ...mockService,
      isActive: false,
    });
    await expect(
      useCase.run(
        tenantId,
        tenantProfessionalId,
        { serviceId },
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(BusinessRuleException);
  });
  it('lança PROFESSIONAL_SERVICE_ALREADY_EXISTS quando já existe vínculo', async () => {
    availabilityRepository.findProfessionalServiceLinkByProfessionalAndService.mockResolvedValue(
      mockLink,
    );
    await expect(
      useCase.run(
        tenantId,
        tenantProfessionalId,
        { serviceId },
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(BusinessRuleException);
  });
});
