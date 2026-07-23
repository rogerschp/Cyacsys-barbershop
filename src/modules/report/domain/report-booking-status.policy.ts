import { BookingStatus } from '../../booking/entities/booking-status.enum';

/**
 * Política central de status usados em relatórios.
 * Receita/atendimento válido = COMPLETED (serviço concluído).
 */
export const REVENUE_BOOKING_STATUS = BookingStatus.COMPLETED;

/** Status que conta como cancelamento no painel. */
export const CANCELLED_BOOKING_STATUS = BookingStatus.CANCELLED;
