import { BookingStatus } from '../../booking/entities/booking-status.enum';

/**
 * Política central de status usados em relatórios.
 * Hoje receita/atendimento válido = CONFIRMED.
 * Futuro: trocar REVENUE_BOOKING_STATUS para COMPLETED sem espalhar ifs.
 */
export const REVENUE_BOOKING_STATUS = BookingStatus.CONFIRMED;

/** Status que conta como cancelamento no painel. */
export const CANCELLED_BOOKING_STATUS = BookingStatus.CANCELLED;
