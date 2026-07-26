import { NotificationTemplateFn } from './notification-template.types';

export const bookingCreatedTemplate: NotificationTemplateFn = () => ({
  subject: 'Novo agendamento',
  body: 'Um novo agendamento foi criado.',
});
