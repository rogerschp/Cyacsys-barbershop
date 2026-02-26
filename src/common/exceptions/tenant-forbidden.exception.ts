import { ForbiddenException } from '@nestjs/common';

export interface TenantForbiddenContext {
  tenantId?: string;
  path?: string;
}

/**
 * 403 estruturado para erros de autorização por tenant.
 * Padrão para auditoria, monitoramento e LGPD.
 */
export class TenantForbiddenException extends ForbiddenException {
  constructor(code: string, message: string, context?: TenantForbiddenContext) {
    super({
      statusCode: 403,
      error: 'FORBIDDEN',
      code,
      message,
      ...(context?.tenantId && { tenantId: context.tenantId }),
      ...(context?.path && { path: context.path }),
    });
  }
}
