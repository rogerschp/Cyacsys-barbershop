export interface NotificationTemplateContent {
  subject: string;
  body: string;
}

export type NotificationTemplateFn = (
  payload: Record<string, unknown>,
) => NotificationTemplateContent;
