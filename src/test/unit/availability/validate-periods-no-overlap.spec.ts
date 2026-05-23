import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { validatePeriodsNoOverlap } from 'src/modules/availability/utils/validate-periods-no-overlap';
describe('validatePeriodsNoOverlap', () => {
  it('aceita dois períodos sem sobreposição', () => {
    expect(() =>
      validatePeriodsNoOverlap([
        { startTime: '09:00', endTime: '12:00' },
        { startTime: '14:00', endTime: '19:00' },
      ]),
    ).not.toThrow();
  });
  it('lança PERIOD_OVERLAP quando períodos se sobrepõem', () => {
    expect(() =>
      validatePeriodsNoOverlap([
        { startTime: '09:00', endTime: '12:00' },
        { startTime: '11:00', endTime: '14:00' },
      ]),
    ).toThrow(BusinessRuleException);
    try {
      validatePeriodsNoOverlap([
        { startTime: '09:00', endTime: '12:00' },
        { startTime: '11:00', endTime: '14:00' },
      ]);
    } catch (e) {
      expect(e).toBeInstanceOf(BusinessRuleException);
      expect((e as BusinessRuleException).getResponse()).toMatchObject({
        code: 'PERIOD_OVERLAP',
      });
    }
  });
  it('lança INVALID_PERIOD_RANGE quando start >= end', () => {
    expect(() =>
      validatePeriodsNoOverlap([{ startTime: '12:00', endTime: '09:00' }]),
    ).toThrow(BusinessRuleException);
  });
});
