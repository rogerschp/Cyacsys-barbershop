import { isValidCnpj, normalizeCnpj } from 'src/common/utils/cnpj';
import { isValidCep, normalizeCep } from 'src/common/utils/cep';
import {
  normalizePhone,
  tryNormalizePhone,
} from 'src/common/utils/normalize-phone';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';

describe('brazilian document utils', () => {
  describe('cnpj', () => {
    it('normaliza máscara para 14 dígitos', () => {
      expect(normalizeCnpj('11.222.333/0001-81')).toBe('11222333000181');
    });

    it('valida dígitos verificadores', () => {
      expect(isValidCnpj('11222333000181')).toBe(true);
      expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
      expect(isValidCnpj('12345678000199')).toBe(false);
      expect(isValidCnpj('11111111111111')).toBe(false);
      expect(isValidCnpj('123')).toBe(false);
    });
  });

  describe('cep', () => {
    it('normaliza para #####-###', () => {
      expect(normalizeCep('01001000')).toBe('01001-000');
      expect(normalizeCep('01001-000')).toBe('01001-000');
      expect(normalizeCep('01001')).toBeNull();
    });

    it('rejeita CEP zero', () => {
      expect(isValidCep('00000000')).toBe(false);
      expect(isValidCep('01001000')).toBe(true);
    });
  });

  describe('phone', () => {
    it('normaliza variantes BR', () => {
      expect(tryNormalizePhone('+55 11 99999-9999')).toBe('5511999999999');
      expect(tryNormalizePhone('11999999999')).toBe('5511999999999');
      expect(tryNormalizePhone('(11)99999-9999')).toBe('5511999999999');
    });

    it('normalizePhone lança em inválido', () => {
      expect(() => normalizePhone('123')).toThrow(BusinessRuleException);
      expect(() => normalizePhone('')).toThrow(BusinessRuleException);
    });
  });
});
