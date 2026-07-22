import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import {
  ELITE_REPORT_DEFAULT_MONTHS,
  PRO_REPORT_DEFAULT_MONTHS,
  monthsCountToMonthsBack,
  parseEliteReportMonths,
  parseProReportMonths,
} from 'src/modules/report/utils/report-months.utils';

describe('report-months.utils', () => {
  describe('PRO', () => {
    it('default é 3', () => {
      expect(parseProReportMonths(undefined)).toBe(PRO_REPORT_DEFAULT_MONTHS);
    });

    it('aceita 1–3', () => {
      expect(parseProReportMonths(1)).toBe(1);
      expect(parseProReportMonths('3')).toBe(3);
    });

    it('rejeita acima do teto do plano', () => {
      expect(() => parseProReportMonths(6)).toThrow(BusinessRuleException);
      expect(() => parseProReportMonths(0)).toThrow(BusinessRuleException);
    });
  });

  describe('ELITE', () => {
    it('default é 6', () => {
      expect(parseEliteReportMonths(undefined)).toBe(
        ELITE_REPORT_DEFAULT_MONTHS,
      );
    });

    it('aceita 1–12', () => {
      expect(parseEliteReportMonths(1)).toBe(1);
      expect(parseEliteReportMonths('3')).toBe(3);
      expect(parseEliteReportMonths(12)).toBe(12);
    });

    it('rejeita fora do intervalo', () => {
      expect(() => parseEliteReportMonths(0)).toThrow(BusinessRuleException);
      expect(() => parseEliteReportMonths(13)).toThrow(BusinessRuleException);
    });
  });

  it('converte quantidade em monthsBack', () => {
    expect(monthsCountToMonthsBack(1)).toBe(0);
    expect(monthsCountToMonthsBack(3)).toBe(2);
    expect(monthsCountToMonthsBack(6)).toBe(5);
  });
});
