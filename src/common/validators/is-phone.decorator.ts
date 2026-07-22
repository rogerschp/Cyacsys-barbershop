import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { tryNormalizePhone } from '../utils/normalize-phone';

@ValidatorConstraint({ name: 'isPhone', async: false })
export class IsPhoneConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === undefined || value === null || value === '') return true;
    return tryNormalizePhone(value) !== null;
  }

  defaultMessage(): string {
    return 'Telefone inválido. Use DDI + DDD + número (ex.: 5511999999999).';
  }
}

export function IsPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPhoneConstraint,
    });
  };
}
