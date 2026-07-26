import { NotificationTemplateFn } from './notification-template.types';

export const teamInvitationTemplate: NotificationTemplateFn = (payload) => {
  const tenantName = String(payload.tenantName ?? '');
  const role = String(payload.role ?? '');
  const token = String(payload.token ?? '');
  const expiresAt = String(payload.expiresAt ?? '');

  return {
    subject: `Convite para a equipe — ${tenantName}`,
    body: [
      `Você foi convidado(a) para fazer parte de ${tenantName}.`,
      `Papel: ${role}`,
      `Token: ${token}`,
      `Expira em: ${expiresAt}`,
    ].join('\n'),
  };
};
