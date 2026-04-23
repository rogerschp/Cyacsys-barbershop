import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { CreateTenantWithOwnerUseCase } from 'src/modules/tenant/use-cases/create-tenant-with-owner.use-case';
import { TenantRepository } from 'src/repository/tenant/tenant.repository';
import { TenantEntity } from 'src/modules/tenant/entities/tenant.entity';
import { TenantStatus } from 'src/modules/tenant/entities/tenant-status.enum';
import { getDataSourceToken } from '@nestjs/typeorm';
describe('CreateTenantWithOwnerUseCase', () => {
    let useCase: CreateTenantWithOwnerUseCase;
    let tenantRepository: jest.Mocked<TenantRepository>;
    let dataSource: {
        transaction: jest.Mock;
    };
    const mockTenant: TenantEntity = {
        id: 'tenant-uuid',
        slug: 'barbearia-nova',
        name: 'Barbearia Nova',
        status: TenantStatus.ACTIVE,
        timezone: 'America/Sao_Paulo',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
    };
    const mockManager = {
        getRepository: jest.fn(),
    };
    beforeEach(async () => {
        const mockTenantRepo = {
            create: jest.fn().mockReturnValue(mockTenant),
            save: jest.fn().mockResolvedValue(mockTenant),
        };
        const mockTenantUserRepo = {
            create: jest.fn().mockReturnValue({}),
            save: jest.fn().mockResolvedValue(undefined),
        };
        mockManager.getRepository.mockImplementation((entity: any) => {
            if (entity.name === 'TenantEntity')
                return mockTenantRepo;
            return mockTenantUserRepo;
        });
        dataSource = {
            transaction: jest.fn((cb) => cb(mockManager)),
        };
        const mockRepo = {
            existsBySlug: jest.fn().mockResolvedValue(false),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateTenantWithOwnerUseCase,
                { provide: getDataSourceToken(), useValue: dataSource },
                { provide: TenantRepository, useValue: mockRepo },
            ],
        }).compile();
        useCase = module.get<CreateTenantWithOwnerUseCase>(CreateTenantWithOwnerUseCase);
        tenantRepository = module.get(TenantRepository) as jest.Mocked<TenantRepository>;
    });
    it('deve estar definido', () => {
        expect(useCase).toBeDefined();
    });
    describe('run', () => {
        it('deve criar tenant e vinculo OWNER em transacao', async () => {
            const result = await useCase.run('user-uuid', {
                name: 'Barbearia Nova',
                slug: 'barbearia-nova',
            });
            expect(tenantRepository.existsBySlug).toHaveBeenCalledWith('barbearia-nova');
            expect(dataSource.transaction).toHaveBeenCalled();
            expect(result).toEqual(mockTenant);
        });
        it('deve lancar ConflictException quando slug ja existe', async () => {
            tenantRepository.existsBySlug.mockResolvedValue(true);
            await expect(useCase.run('user-uuid', {
                name: 'Barbearia Nova',
                slug: 'barbearia-nova',
            })).rejects.toThrow(ConflictException);
            expect(dataSource.transaction).not.toHaveBeenCalled();
        });
        it('deve lancar BadRequestException quando slug invalido', async () => {
            await expect(useCase.run('user-uuid', { name: 'ab' })).rejects.toThrow(BadRequestException);
            expect(dataSource.transaction).not.toHaveBeenCalled();
        });
    });
});
