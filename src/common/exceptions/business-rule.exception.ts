import { BadRequestException } from '@nestjs/common';

export interface BusinessRuleContext {
  code: string;
  [key: string]: unknown;
}

/**
 * 400 estruturado para violação de regra de negócio.
 * Usado para erros como nome duplicado, preço inválido, etc.
 */
export class BusinessRuleException extends BadRequestException {
  constructor(
    code: string,
    message: string,
    context?: Omit<BusinessRuleContext, 'code'>,
  ) {
    super({
      statusCode: 400,
      error: 'BUSINESS_RULE_VIOLATION',
      code,
      message,
      ...context,
    });
  }
}
