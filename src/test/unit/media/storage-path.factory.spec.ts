import { describe, expect, it } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { StoragePathFactory } from 'src/modules/media/domain/storage-path/storage-path.factory';
import { MediaType } from 'src/modules/media/enums/media-type.enum';

describe('StoragePathFactory', () => {
  const tenantId = '550e8400-e29b-41d4-a716-446655440000';
  const professionalId = '550e8400-e29b-41d4-a716-446655440001';

  function createFactory(env: 'dev' | 'prod'): StoragePathFactory {
    const config = {
      get: (key: string) => {
        if (key === 'media') return { env, storageProvider: 'cloudinary' };
        if (key === 'MEDIA_ENV') return env;
        return undefined;
      },
    } as unknown as ConfigService;
    return new StoragePathFactory(config);
  }

  it('prefixa MEDIA_ENV=dev no path de LOGO', () => {
    const factory = createFactory('dev');
    expect(
      factory.build({
        mediaType: MediaType.LOGO,
        tenantId,
      }),
    ).toBe(`dev/tenants/${tenantId}/logo`);
  });

  it('prefixa MEDIA_ENV=prod no path de AVATAR', () => {
    const factory = createFactory('prod');
    expect(
      factory.build({
        mediaType: MediaType.AVATAR,
        professionalId,
      }),
    ).toBe(`prod/professionals/${professionalId}/avatar`);
  });

  it('exige tenantId para LOGO', () => {
    const factory = createFactory('dev');
    expect(() => factory.build({ mediaType: MediaType.LOGO })).toThrow(
      BusinessRuleException,
    );
  });

  it('monta COVER e DOCUMENT sob o env', () => {
    const factory = createFactory('dev');
    expect(factory.build({ mediaType: MediaType.COVER, tenantId })).toBe(
      `dev/tenants/${tenantId}/cover`,
    );
    expect(factory.build({ mediaType: MediaType.DOCUMENT, tenantId })).toBe(
      `dev/tenants/${tenantId}/documents`,
    );
  });
});
