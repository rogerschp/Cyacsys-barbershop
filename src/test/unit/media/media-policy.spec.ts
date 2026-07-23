import { beforeEach, describe, expect, it } from '@jest/globals';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { MediaPolicy } from 'src/modules/media/domain/media-policy';
import { MediaAccessLevel } from 'src/modules/media/enums/media-access-level.enum';
import { MediaType } from 'src/modules/media/enums/media-type.enum';
import { MediaVisibility } from 'src/modules/media/enums/media-visibility.enum';

describe('MediaPolicy', () => {
  let policy: MediaPolicy;

  beforeEach(() => {
    policy = new MediaPolicy();
  });

  it('aceita jpeg dentro do limite de imagem', () => {
    expect(() =>
      policy.assertFileAllowed(MediaType.LOGO, 'image/jpeg', 1024),
    ).not.toThrow();
  });

  it('rejeita mime inválido', () => {
    expect(() =>
      policy.assertFileAllowed(MediaType.AVATAR, 'application/zip', 100),
    ).toThrow(BusinessRuleException);
  });

  it('rejeita arquivo grande demais', () => {
    expect(() =>
      policy.assertFileAllowed(
        MediaType.BANNER,
        'image/png',
        policy.MAX_IMAGE_SIZE + 1,
      ),
    ).toThrow(BusinessRuleException);
  });

  it('defaults DOCUMENT = PRIVATE + OWNER_ONLY', () => {
    expect(policy.resolveDefaults(MediaType.DOCUMENT)).toEqual({
      visibility: MediaVisibility.PRIVATE,
      accessLevel: MediaAccessLevel.OWNER_ONLY,
    });
  });
});
