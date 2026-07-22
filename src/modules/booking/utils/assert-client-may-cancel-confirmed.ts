import { DateTime } from 'luxon';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';

export function assertClientMayCancelConfirmed(params: {
  clientCanCancelConfirmed: boolean;
  clientCancelConfirmedMinLeadMinutes: number;
  startsAt: Date;
  now?: DateTime;
}): void {
  const {
    clientCanCancelConfirmed,
    clientCancelConfirmedMinLeadMinutes,
    startsAt,
    now = DateTime.utc(),
  } = params;

  if (!clientCanCancelConfirmed) {
    throw new BusinessRuleException(
      'CLIENT_CANCEL_DISABLED',
      'Este estabelecimento não permite cancelar agendamentos confirmados.',
    );
  }

  const startUtc = DateTime.fromJSDate(startsAt).toUTC();
  const latestCancelAt = startUtc.minus({
    minutes: clientCancelConfirmedMinLeadMinutes,
  });

  if (now >= latestCancelAt) {
    throw new BusinessRuleException(
      'CLIENT_CANCEL_TOO_LATE',
      `Cancelamento de confirmado só é permitido até ${clientCancelConfirmedMinLeadMinutes} minuto(s) antes do horário.`,
    );
  }
}
