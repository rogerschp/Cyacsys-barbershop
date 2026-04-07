import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException, } from '@nestjs/common';
import { TenantUserService } from 'src/modules/tenant-user/tenant-user.service';
import { TenantService } from 'src/modules/tenant/tenant.service';
import { UserService } from 'src/modules/user/user.service';
import { TENANT_USER_REPOSITORY } from 'src/modules/tenant-user/interfaces/tenant-user-repository.interface';
import { TenantUserEntity } from 'src/modules/tenant-user/entities/tenant-user.entity';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { TenantUserStatus } from 'src/modules/tenant-user/entities/tenant-user-status.enum';
describe('TenantUserService', () => {
    let service: TenantUserService;
    let repo: {
        create: jest.Mock;
        findByTenantAndUser: jest.Mock;
        deleteByTenantAndUser: jest.Mock;
    };
    let tenantService: jest.Mocked<TenantService>;
    let userService: jest.Mocked<UserService>;
    const mockMembership: TenantUserEntity = {
        id: 'link-uuid',
        tenantId: 'tenant-uuid',
        userId: 'user-uuid',
        role: TenantUserRole.OWNER,
        status: TenantUserStatus.ACTIVE,
        createdAt: new Date(),
    } as TenantUserEntity;
    beforeEach(async () => {
        repo = {
            create: jest.fn(),
            findByTenantAndUser: jest.fn(),
            deleteByTenantAndUser: jest.fn(),
        };
        const mockTenantService = {
            findById: jest.fn().mockResolvedValue({ id: 'tenant-uuid' }),
        };
        const mockUserService = {
            findById: jest.fn().mockResolvedValue({ id: 'user-uuid' }),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TenantUserService,
                { provide: TENANT_USER_REPOSITORY, useValue: repo },
                { provide: TenantService, useValue: mockTenantService },
                { provide: UserService, useValue: mockUserService },
            ],
        }).compile();
        service = module.get<TenantUserService>(TenantUserService);
        tenantService = module.get(TenantService) as jest.Mocked<TenantService>;
        userService = module.get(UserService) as jest.Mocked<UserService>;
    });
    it('deve estar definido', () => {
        expect(service).toBeDefined();
    });
    describe('addUserToTenant', () => {
        it('deve criar vínculo quando tenant e user existem e não há vínculo', async () => {
            repo.findByTenantAndUser.mockResolvedValue(null);
            repo.create.mockResolvedValue(mockMembership);
            const result = await service.addUserToTenant('user-uuid', 'tenant-uuid', TenantUserRole.BARBER);
            expect(tenantService.findById).toHaveBeenCalledWith('tenant-uuid');
            expect(userService.findById).toHaveBeenCalledWith('user-uuid');
            expect(repo.findByTenantAndUser).toHaveBeenCalledWith('tenant-uuid', 'user-uuid');
            expect(repo.create).toHaveBeenCalledWith({
                tenantId: 'tenant-uuid',
                userId: 'user-uuid',
                role: TenantUserRole.BARBER,
            });
            expect(result).toEqual(mockMembership);
        });
        it('deve lançar ConflictException quando já existe vínculo', async () => {
            repo.findByTenantAndUser.mockResolvedValue(mockMembership);
            await expect(service.addUserToTenant('user-uuid', 'tenant-uuid', TenantUserRole.ADMIN)).rejects.toThrow(ConflictException);
            expect(repo.create).not.toHaveBeenCalled();
        });
    });
    describe('getMembership', () => {
        it('deve retornar o vínculo quando existe', async () => {
            repo.findByTenantAndUser.mockResolvedValue(mockMembership);
            const result = await service.getMembership('tenant-uuid', 'user-uuid');
            expect(repo.findByTenantAndUser).toHaveBeenCalledWith('tenant-uuid', 'user-uuid');
            expect(result).toEqual(mockMembership);
        });
        it('deve lançar NotFoundException quando não existe', async () => {
            repo.findByTenantAndUser.mockResolvedValue(null);
            await expect(service.getMembership('tenant-uuid', 'user-uuid')).rejects.toThrow(NotFoundException);
        });
    });
    describe('getUserRole', () => {
        it('deve retornar o role quando existe vínculo', async () => {
            repo.findByTenantAndUser.mockResolvedValue(mockMembership);
            const result = await service.getUserRole('user-uuid', 'tenant-uuid');
            expect(result).toBe(TenantUserRole.OWNER);
        });
        it('deve retornar null quando não existe vínculo', async () => {
            repo.findByTenantAndUser.mockResolvedValue(null);
            const result = await service.getUserRole('user-uuid', 'tenant-uuid');
            expect(result).toBeNull();
        });
    });
    describe('validateMembership', () => {
        it('deve retornar o vínculo quando existe e está ACTIVE', async () => {
            repo.findByTenantAndUser.mockResolvedValue(mockMembership);
            const result = await service.validateMembership('user-uuid', 'tenant-uuid');
            expect(result).toEqual(mockMembership);
        });
        it('deve lançar ForbiddenException quando não existe vínculo', async () => {
            repo.findByTenantAndUser.mockResolvedValue(null);
            await expect(service.validateMembership('user-uuid', 'tenant-uuid')).rejects.toThrow(ForbiddenException);
        });
        it('deve lançar ForbiddenException quando vínculo está INACTIVE', async () => {
            repo.findByTenantAndUser.mockResolvedValue({
                ...mockMembership,
                status: TenantUserStatus.INACTIVE,
            });
            await expect(service.validateMembership('user-uuid', 'tenant-uuid')).rejects.toThrow(ForbiddenException);
        });
    });
    describe('removeUserFromTenant', () => {
        it('deve remover o vínculo quando existe', async () => {
            repo.findByTenantAndUser.mockResolvedValue(mockMembership);
            repo.deleteByTenantAndUser.mockResolvedValue(undefined);
            await service.removeUserFromTenant('user-uuid', 'tenant-uuid');
            expect(repo.deleteByTenantAndUser).toHaveBeenCalledWith('tenant-uuid', 'user-uuid');
        });
        it('deve lançar NotFoundException quando não existe vínculo', async () => {
            repo.findByTenantAndUser.mockResolvedValue(null);
            await expect(service.removeUserFromTenant('user-uuid', 'tenant-uuid')).rejects.toThrow(NotFoundException);
            expect(repo.deleteByTenantAndUser).not.toHaveBeenCalled();
        });
    });
});
