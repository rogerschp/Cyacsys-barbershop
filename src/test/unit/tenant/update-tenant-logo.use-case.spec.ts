import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaType } from 'src/modules/media/enums/media-type.enum';
import { AssertLinkableMediaUseCase } from 'src/modules/media/use-cases/assert-linkable-media.use-case';
import { TENANT_REPOSITORY } from 'src/modules/tenant/interfaces/tenant-repository.interface';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';
import { UpdateTenantLogoUseCase } from 'src/modules/tenant/use-cases/update-tenant-logo.use-case';

describe('UpdateTenantLogoUseCase', () => {
  let useCase: UpdateTenantLogoUseCase;
  let tenantRepository: { update: jest.Mock };
  let assertLinkableMedia: { assertOwnedByTenant: jest.Mock };
  let findTenantByIdUseCase: { run: jest.Mock };

  const tenantId = 'tenant-1';
  const mediaId = 'media-1';

  beforeEach(async () => {
    tenantRepository = {
      update: jest.fn<() => Promise<object>>().mockResolvedValue({}),
    };
    assertLinkableMedia = {
      assertOwnedByTenant: jest
        .fn<() => Promise<{ id: string }>>()
        .mockResolvedValue({ id: mediaId }),
    };
    findTenantByIdUseCase = {
      run: jest
        .fn<
          () => Promise<{
            id: string;
            logoMediaId: string;
            avatarUrl: string;
          }>
        >()
        .mockResolvedValue({
          id: tenantId,
          logoMediaId: mediaId,
          avatarUrl: 'https://cdn.example/logo.png',
        }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTenantLogoUseCase,
        { provide: TENANT_REPOSITORY, useValue: tenantRepository },
        { provide: AssertLinkableMediaUseCase, useValue: assertLinkableMedia },
        { provide: FindTenantByIdUseCase, useValue: findTenantByIdUseCase },
      ],
    }).compile();
    useCase = module.get(UpdateTenantLogoUseCase);
  });

  it('valida ownership LOGO por tenantId e persiste logoMediaId', async () => {
    const result = await useCase.run(tenantId, mediaId);
    expect(assertLinkableMedia.assertOwnedByTenant).toHaveBeenCalledWith({
      mediaId,
      tenantId,
      expectedType: MediaType.LOGO,
    });
    expect(tenantRepository.update).toHaveBeenCalledWith(tenantId, {
      logoMediaId: mediaId,
    });
    expect(result.logoMediaId).toBe(mediaId);
  });
});
