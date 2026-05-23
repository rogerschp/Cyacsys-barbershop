import { BadRequestException } from '@nestjs/common';
export interface BusinessRuleContext {
  code: string;
  [key: string]: unknown;
}
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
