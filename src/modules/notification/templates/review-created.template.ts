import { NotificationTemplateFn } from './notification-template.types';

export const reviewCreatedTemplate: NotificationTemplateFn = () => ({
  subject: 'Nova avaliação',
  body: 'Uma nova avaliação foi publicada.',
});
