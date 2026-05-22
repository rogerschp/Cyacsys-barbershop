import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import {
  assertValidInstagramUsername,
  assertValidWhatsappNumber,
  normalizeInstagramUsername,
  normalizeWhatsappNumber,
} from 'src/modules/professional-profile/utils/professional-contact.utils';

describe('professional-contact.utils', () => {
  describe('normalizeWhatsappNumber', () => {
    it('remove caracteres não numéricos', () => {
      expect(normalizeWhatsappNumber('+55 (11) 99999-9999')).toBe(
        '5511999999999',
      );
    });

    it('retorna null para string vazia', () => {
      expect(normalizeWhatsappNumber('   ')).toBeNull();
    });
  });

  describe('normalizeInstagramUsername', () => {
    it('remove @ inicial', () => {
      expect(normalizeInstagramUsername('@joao.pro')).toBe('joao.pro');
    });

    it('retorna null para string vazia', () => {
      expect(normalizeInstagramUsername('@')).toBeNull();
    });
  });

  describe('assertValidWhatsappNumber', () => {
    it('aceita 10 a 15 dígitos', () => {
      expect(() => assertValidWhatsappNumber('5511999999999')).not.toThrow();
    });

    it('lança para quantidade inválida de dígitos', () => {
      expect(() => assertValidWhatsappNumber('123')).toThrow(
        BusinessRuleException,
      );
    });
  });

  describe('assertValidInstagramUsername', () => {
    it('aceita username válido', () => {
      expect(() => assertValidInstagramUsername('joao_pro')).not.toThrow();
    });

    it('lança para caracteres inválidos', () => {
      expect(() => assertValidInstagramUsername('joão!')).toThrow(
        BusinessRuleException,
      );
    });
  });
});
