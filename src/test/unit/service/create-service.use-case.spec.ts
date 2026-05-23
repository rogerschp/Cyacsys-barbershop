import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CreateServiceUseCase } from 'src/modules/service/use-cases/create-service.use-case';
import { SERVICE_REPOSITORY } from 'src/modules/service/interfaces/service-repository.interface';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { ServiceEntity } from 'src/modules/service/entities/service.entity';
import { CreateServiceDto } from 'src/modules/service/dto/create-service.dto';
describe('CreateServiceUseCase', () => {
  let useCase: CreateServiceUseCase;
  let serviceRepository: {
    create: jest.Mock;
    findNonDeletedByName: jest.Mock;
  };
  let findTenantByIdUseCase: {
    run: jest.Mock;
  };
  const tenantId = 'tenant-uuid';
  const createdBy = 'user-uuid';
  const mockService: ServiceEntity = {
    id: 'service-uuid',
    tenantId,
    name: 'Corte masculino',
    description: 'Corte moderno',
    price: '45.00',
    durationInMinutes: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  } as ServiceEntity;
  const validDto: CreateServiceDto = {
    name: 'Corte masculino',
    description: 'Corte moderno',
    price: 45,
    durationInMinutes: 30,
  };
  beforeEach(async () => {
    serviceRepository = {
      create: jest.fn().mockResolvedValue(mockService),
      findNonDeletedByName: jest.fn().mockResolvedValue(null),
    };
    findTenantByIdUseCase = {
      run: jest.fn().mockResolvedValue({ id: tenantId }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateServiceUseCase,
        { provide: SERVICE_REPOSITORY, useValue: serviceRepository },
        { provide: FindTenantByIdUseCase, useValue: findTenantByIdUseCase },
      ],
    }).compile();
    useCase = module.get<CreateServiceUseCase>(CreateServiceUseCase);
  });
  it('deve estar definido', () => {
    expect(useCase).toBeDefined();
  });
  describe('run', () => {
    it('deve criar serviço quando tenant existe e nome é único', async () => {
      const result = await useCase.run(tenantId, validDto, createdBy);
      expect(findTenantByIdUseCase.run).toHaveBeenCalledWith(tenantId);
      expect(serviceRepository.findNonDeletedByName).toHaveBeenCalledWith(
        tenantId,
        'Corte masculino',
      );
      expect(serviceRepository.create).toHaveBeenCalledWith({
        tenantId,
        name: 'Corte masculino',
        description: 'Corte moderno',
        price: '45.00',
        durationInMinutes: 30,
      });
      expect(result).toEqual(mockService);
    });
    it('deve lançar NotFoundException quando tenant não existe', async () => {
      findTenantByIdUseCase.run.mockRejectedValue(
        new NotFoundException('Tenant not found!'),
      );
      await expect(useCase.run(tenantId, validDto, createdBy)).rejects.toThrow(
        NotFoundException,
      );
      expect(serviceRepository.create).not.toHaveBeenCalled();
    });
    it('deve lançar BusinessRuleException quando nome já existe no tenant', async () => {
      serviceRepository.findNonDeletedByName.mockResolvedValue(mockService);
      await expect(useCase.run(tenantId, validDto, createdBy)).rejects.toThrow(
        BusinessRuleException,
      );
      expect(serviceRepository.create).not.toHaveBeenCalled();
    });
    it('deve lançar BusinessRuleException quando preço é negativo', async () => {
      await expect(
        useCase.run(tenantId, { ...validDto, price: -1 }, createdBy),
      ).rejects.toThrow(BusinessRuleException);
      expect(serviceRepository.create).not.toHaveBeenCalled();
    });
    it('deve lançar BusinessRuleException quando duração é menor que 5 min', async () => {
      await expect(
        useCase.run(tenantId, { ...validDto, durationInMinutes: 3 }, createdBy),
      ).rejects.toThrow(BusinessRuleException);
      expect(serviceRepository.create).not.toHaveBeenCalled();
    });
    it('deve normalizar nome com trim ao criar', async () => {
      await useCase.run(
        tenantId,
        { ...validDto, name: '  Corte masculino  ' },
        createdBy,
      );
      expect(serviceRepository.findNonDeletedByName).toHaveBeenCalledWith(
        tenantId,
        'Corte masculino',
      );
      expect(serviceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Corte masculino' }),
      );
    });
    it('deve passar description null quando não informada', async () => {
      const dtoSemDesc = { ...validDto };
      delete (dtoSemDesc as Partial<CreateServiceDto>).description;
      await useCase.run(tenantId, dtoSemDesc, createdBy);
      expect(serviceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ description: null }),
      );
    });
  });
});
