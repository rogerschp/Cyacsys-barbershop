import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeactivateServiceUseCase } from 'src/modules/service/use-cases/deactivate-service.use-case';
import { SERVICE_REPOSITORY } from 'src/modules/service/interfaces/service-repository.interface';
import { ServiceEntity } from 'src/modules/service/entities/service.entity';
describe('DeactivateServiceUseCase', () => {
    let useCase: DeactivateServiceUseCase;
    let serviceRepository: {
        findById: jest.Mock;
        update: jest.Mock;
    };
    const tenantId = 'tenant-uuid';
    const serviceId = 'service-uuid';
    const performedBy = 'user-uuid';
    const mockService: ServiceEntity = {
        id: serviceId,
        tenantId,
        name: 'Corte masculino',
        description: null,
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
            update: jest.fn().mockResolvedValue({ ...mockService, isActive: false }),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DeactivateServiceUseCase,
                { provide: SERVICE_REPOSITORY, useValue: serviceRepository },
            ],
        }).compile();
        useCase = module.get<DeactivateServiceUseCase>(DeactivateServiceUseCase);
    });
    it('deve estar definido', () => {
        expect(useCase).toBeDefined();
    });
    describe('run', () => {
        it('deve desativar serviço e retornar entidade atualizada', async () => {
            const result = await useCase.run(tenantId, serviceId, performedBy);
            expect(serviceRepository.findById).toHaveBeenCalledWith(serviceId, tenantId);
            expect(serviceRepository.update).toHaveBeenCalledWith(serviceId, tenantId, { isActive: false });
            expect(result.isActive).toBe(false);
        });
        it('deve lançar NotFoundException quando serviço não existe', async () => {
            serviceRepository.findById.mockResolvedValue(null);
            await expect(useCase.run(tenantId, serviceId, performedBy)).rejects.toThrow(NotFoundException);
            expect(serviceRepository.update).not.toHaveBeenCalled();
        });
    });
});
