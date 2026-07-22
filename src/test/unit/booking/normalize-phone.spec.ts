import { normalizePhone } from 'src/modules/booking/utils/normalize-phone';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';

describe('normalizePhone', () => {
  it('normaliza formatos BR para o mesmo valor', () => {
    expect(normalizePhone('+55 11 99999-9999')).toBe('5511999999999');
    expect(normalizePhone('11999999999')).toBe('5511999999999');
    expect(normalizePhone('(11)99999-9999')).toBe('5511999999999');
  });

  it('rejeita telefone inválido', () => {
    expect(() => normalizePhone('123')).toThrow(BusinessRuleException);
    expect(() => normalizePhone('')).toThrow(BusinessRuleException);
  });
});
