import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { BookingMode } from 'src/modules/professional-profile/entities/booking-mode.enum';
import { assertBookingModeAllowsDraft } from 'src/modules/booking/utils/assert-booking-mode-allows-draft';

describe('assertBookingModeAllowsDraft', () => {
  it('permite DIRECT_BOOKING', () => {
    expect(() =>
      assertBookingModeAllowsDraft(BookingMode.DIRECT_BOOKING),
    ).not.toThrow();
  });

  it('bloqueia QUOTE_REQUIRED', () => {
    expect(() =>
      assertBookingModeAllowsDraft(BookingMode.QUOTE_REQUIRED),
    ).toThrow(BusinessRuleException);
    try {
      assertBookingModeAllowsDraft(BookingMode.QUOTE_REQUIRED);
    } catch (e) {
      expect((e as BusinessRuleException).getResponse()).toMatchObject({
        code: 'BOOKING_REQUIRES_QUOTE',
      });
    }
  });

  it('bloqueia WHATSAPP_ONLY', () => {
    expect(() =>
      assertBookingModeAllowsDraft(BookingMode.WHATSAPP_ONLY),
    ).toThrow(BusinessRuleException);
    try {
      assertBookingModeAllowsDraft(BookingMode.WHATSAPP_ONLY);
    } catch (e) {
      expect((e as BusinessRuleException).getResponse()).toMatchObject({
        code: 'BOOKING_WHATSAPP_ONLY',
      });
    }
  });
});
