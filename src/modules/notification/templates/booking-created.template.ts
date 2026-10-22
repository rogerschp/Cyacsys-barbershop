import { NotificationTemplateFn } from './notification-template.types';

const fmt = (payload: Record<string, unknown>) => ({
  tenant: String(payload.tenantName ?? 'sua barbearia'),
  date: String(payload.startsAt ?? payload.date ?? ''),
  service: String(payload.serviceName ?? ''),
});

export const bookingCreatedTemplate: NotificationTemplateFn = (payload) => {
  const f = fmt(payload);
  const client = String(payload.clientName ?? '');
  const dateLabel = String(payload.dateLabel ?? '');
  const timeLabel = String(payload.timeLabel ?? '');
  const location = String(payload.location ?? '');
  const when =
    dateLabel && timeLabel
      ? `${dateLabel} às ${timeLabel}`
      : dateLabel || f.date;

  const lines = [
    `Novo agendamento em ${f.tenant}`,
    f.service ? `Serviço: ${f.service}` : '',
    client ? `Cliente: ${client}` : '',
    when ? `Data: ${when}` : '',
    location ? `Local: ${location}` : '',
  ].filter(Boolean);

  return {
    subject: 'Novo agendamento',
    body: lines.join('\n'),
  };
};

export const bookingConfirmedTemplate: NotificationTemplateFn = (payload) => {
  const f = fmt(payload);
  return {
    subject: 'Agendamento confirmado',
    body: `Seu agendamento em ${f.tenant} foi confirmado${f.service ? ` — ${f.service}` : ''}${f.date ? ` para ${f.date}` : ''}.`,
  };
};

export const bookingCancelledTemplate: NotificationTemplateFn = (payload) => {
  const f = fmt(payload);
  return {
    subject: 'Agendamento cancelado',
    body: `Seu agendamento em ${f.tenant} foi cancelado${f.date ? ` (${f.date})` : ''}.`,
  };
};
