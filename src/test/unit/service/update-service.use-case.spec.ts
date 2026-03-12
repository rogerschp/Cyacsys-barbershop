import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateServiceUseCase } from 'src/modules/service/use-cases/update-service.use-case';
import { SERVICE_REPOSITORY } from 'src/modules/service/interfaces/service-repository.interface';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { ServiceEntity } from 'src/modules/service/entities/service.entity';
import { UpdateServiceDto } from 'src/modules/service/dto/update-service.dto';

describe('UpdateServiceUseCase', () => {
  let useCase: UpdateServiceUseCase;
  let serviceRepository: {
    findById: jest.Mock;
    findActiveByName: jest.Mock;
    update: jest.Mock;
  };

  const tenantId = 'tenant-uuid';
  const serviceId = 'service-uuid';
  const mockService: ServiceEntity = {
    id: serviceId,
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

  beforeEach(async () => {
    serviceRepository = {
      findById: jest.fn().mockResolvedValue(mockService),
      findActiveByName: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({ ...mockService, name: 'Corte novo' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateServiceUseCase,
        { provide: SERVICE_REPOSITORY, useValue: serviceRepository },
      ],
    }).compile();

    useCase = module.get<UpdateServiceUseCase>(UpdateServiceUseCase);
  });

  it('deve estar definido', () => {
    expect(useCase).toBeDefined();
  });

  describe('run', () => {
    it('deve atualizar nome quando único no tenant', async () => {
      const dto: UpdateServiceDto = { name: 'Corte novo' };
      const updated = { ...mockService, name: 'Corte novo' };
      serviceRepository.update.mockResolvedValue(updated);

      const result = await useCase.run(tenantId, serviceId, dto);

      expect(serviceRepository.findById).toHaveBeenCalledWith(
        serviceId,
        tenantId,
      );
      expect(serviceRepository.findActiveByName).toHaveBeenCalledWith(
        tenantId,
        'Corte novo',
        serviceId,
      );
      expect(serviceRepository.update).toHaveBeenCalledWith(
        serviceId,
        tenantId,
        { name: 'Corte novo' },
      );
      expect(result).toEqual(updated);
    });

    it('deve lançar NotFoundException quando serviço não existe', async () => {
      serviceRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.run(tenantId, serviceId, { name: 'Corte' }),
      ).rejects.toThrow(NotFoundException);

      expect(serviceRepository.update).not.toHaveBeenCalled();
    });

    it('deve lançar BusinessRuleException quando novo nome já existe', async () => {
      serviceRepository.findActiveByName.mockResolvedValue({
        ...mockService,
        id: 'outro-id',
      });

      await expect(
        useCase.run(tenantId, serviceId, { name: 'Corte duplicado' }),
      ).rejects.toThrow(BusinessRuleException);

      expect(serviceRepository.update).not.toHaveBeenCalled();
    });

    it('deve lançar BusinessRuleException quando preço é negativo', async () => {
      await expect(
        useCase.run(tenantId, serviceId, { price: -1 }),
      ).rejects.toThrow(BusinessRuleException);

      expect(serviceRepository.update).not.toHaveBeenCalled();
    });

    it('deve lançar BusinessRuleException quando duração menor que 5 min', async () => {
      await expect(
        useCase.run(tenantId, serviceId, { durationInMinutes: 2 }),
      ).rejects.toThrow(BusinessRuleException);

      expect(serviceRepository.update).not.toHaveBeenCalled();
    });

    it('deve retornar serviço existente quando dto vazio', async () => {
      const result = await useCase.run(tenantId, serviceId, {});

      expect(serviceRepository.update).not.toHaveBeenCalled();
      expect(result).toEqual(mockService);
    });

    it('deve atualizar vários campos de uma vez', async () => {
      const dto: UpdateServiceDto = {
        name: 'Corte premium',
        price: 60,
        durationInMinutes: 45,
      };
      const updated = { ...mockService, ...dto, price: '60.00' };
      serviceRepository.update.mockResolvedValue(updated);

      await useCase.run(tenantId, serviceId, dto);

      expect(serviceRepository.update).toHaveBeenCalledWith(
        serviceId,
        tenantId,
        expect.objectContaining({
          name: 'Corte premium',
          price: '60.00',
          durationInMinutes: 45,
        }),
      );
    });
  });
});
