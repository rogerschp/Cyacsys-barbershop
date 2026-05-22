import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRepository } from 'src/repository/service/service.repository';
import { ServiceEntity } from 'src/modules/service/entities/service.entity';
describe('ServiceRepository', () => {
    let repository: ServiceRepository;
    let typeOrmRepo: jest.Mocked<Repository<ServiceEntity>>;
    const tenantId = 'tenant-uuid';
    const serviceId = 'service-uuid';
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
    const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
    };
    beforeEach(async () => {
        const mockTypeOrmRepo = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            update: jest.fn().mockResolvedValue({ affected: 1 }),
            softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ServiceRepository,
                {
                    provide: getRepositoryToken(ServiceEntity),
                    useValue: mockTypeOrmRepo,
                },
            ],
        }).compile();
        repository = module.get<ServiceRepository>(ServiceRepository);
        typeOrmRepo = module.get(getRepositoryToken(ServiceEntity)) as jest.Mocked<Repository<ServiceEntity>>;
    });
    it('deve estar definido', () => {
        expect(repository).toBeDefined();
    });
    describe('create', () => {
        it('deve criar e salvar serviço com isActive true', async () => {
            const data = {
                tenantId,
                name: 'Corte masculino',
                description: null,
                price: '45.00',
                durationInMinutes: 30,
            };
            typeOrmRepo.create.mockReturnValue(mockService as any);
            typeOrmRepo.save.mockResolvedValue(mockService);
            const result = await repository.create(data);
            expect(typeOrmRepo.create).toHaveBeenCalledWith({
                ...data,
                isActive: true,
            });
            expect(typeOrmRepo.save).toHaveBeenCalled();
            expect(result).toEqual(mockService);
        });

        it('usa description null quando omitida', async () => {
            const data = {
                tenantId,
                name: 'Barba',
                price: '10',
                durationInMinutes: 15,
            } as any;
            typeOrmRepo.create.mockReturnValue(mockService as any);
            typeOrmRepo.save.mockResolvedValue(mockService);
            await repository.create(data);
            expect(typeOrmRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ description: null, isActive: true }),
            );
        });
    });
    describe('findById', () => {
        it('deve retornar serviço quando existe', async () => {
            typeOrmRepo.findOne.mockResolvedValue(mockService);
            const result = await repository.findById(serviceId, tenantId);
            expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
                where: { id: serviceId, tenantId },
                withDeleted: false,
            });
            expect(result).toEqual(mockService);
        });
        it('deve retornar null quando não existe', async () => {
            typeOrmRepo.findOne.mockResolvedValue(null);
            const result = await repository.findById(serviceId, tenantId);
            expect(result).toBeNull();
        });
    });
    describe('findActiveByName', () => {
        it('deve retornar serviço quando nome existe no tenant', async () => {
            mockQueryBuilder.getOne.mockResolvedValueOnce(mockService);
            const result = await repository.findNonDeletedByName(tenantId, 'Corte masculino');
            expect(typeOrmRepo.createQueryBuilder).toHaveBeenCalledWith('s');
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('s.tenant_id = :tenantId', { tenantId });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('LOWER(TRIM(s.name)) = LOWER(TRIM(:name))', { name: 'Corte masculino' });
            expect(result).toEqual(mockService);
        });
        it('deve excluir id do filtro quando excludeId informado', async () => {
            mockQueryBuilder.getOne.mockResolvedValueOnce(null);
            await repository.findNonDeletedByName(tenantId, 'Corte', serviceId);
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('s.id != :excludeId', { excludeId: serviceId });
        });
    });
    describe('listByTenant', () => {
        it('deve retornar lista ordenada por nome', async () => {
            typeOrmRepo.find.mockResolvedValue([mockService]);
            const result = await repository.listByTenant(tenantId);
            expect(typeOrmRepo.find).toHaveBeenCalledWith({
                where: { tenantId },
                order: { name: 'ASC' },
                withDeleted: false,
            });
            expect(result).toEqual([mockService]);
        });
    });
    describe('update', () => {
        it('deve atualizar e retornar entidade', async () => {
            typeOrmRepo.findOne.mockResolvedValue({
                ...mockService,
                name: 'Corte novo',
            });
            const result = await repository.update(serviceId, tenantId, {
                name: 'Corte novo',
            });
            expect(typeOrmRepo.update).toHaveBeenCalledWith({ id: serviceId, tenantId }, { name: 'Corte novo' });
            expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
                where: { id: serviceId, tenantId },
                withDeleted: false,
            });
            expect(result).toHaveProperty('name', 'Corte novo');
        });

        it('monta payload com todos os campos opcionais', async () => {
            typeOrmRepo.findOne.mockResolvedValue(mockService);
            await repository.update(serviceId, tenantId, {
                name: 'N',
                description: 'd',
                price: '99',
                durationInMinutes: 60,
                isActive: false,
            });
            expect(typeOrmRepo.update).toHaveBeenCalledWith(
                { id: serviceId, tenantId },
                {
                    name: 'N',
                    description: 'd',
                    price: '99',
                    durationInMinutes: 60,
                    isActive: false,
                },
            );
        });

        it('lança quando serviço não existe após update', async () => {
            typeOrmRepo.findOne.mockResolvedValue(null);
            await expect(repository.update(serviceId, tenantId, { name: 'X' })).rejects.toThrow(
                'Service not found after update',
            );
        });
    });
    describe('softDelete', () => {
        it('deve buscar entidade, chamar softDelete e retornar entidade', async () => {
            typeOrmRepo.findOne.mockResolvedValue(mockService);
            const result = await repository.softDelete(serviceId, tenantId);
            expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
                where: { id: serviceId, tenantId },
                withDeleted: false,
            });
            expect(typeOrmRepo.softDelete).toHaveBeenCalledWith({
                id: serviceId,
                tenantId,
            });
            expect(result).toEqual(mockService);
        });
        it('deve lançar quando serviço não existe', async () => {
            typeOrmRepo.findOne.mockResolvedValue(null);
            await expect(repository.softDelete(serviceId, tenantId)).rejects.toThrow('Service not found');
        });
    });
});
