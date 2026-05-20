import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { BookingMode } from '../../professional-profile/entities/booking-mode.enum';

export function assertBookingModeAllowsDraft(bookingMode: BookingMode): void {
  if (bookingMode === BookingMode.QUOTE_REQUIRED) {
    throw new BusinessRuleException(
      'BOOKING_REQUIRES_QUOTE',
      'Este profissional exige orçamento antes do agendamento.',
    );
  }
  if (bookingMode === BookingMode.WHATSAPP_ONLY) {
    throw new BusinessRuleException(
      'BOOKING_WHATSAPP_ONLY',
      'Este profissional não aceita agendamento direto pelo sistema.',
    );
  }
}
