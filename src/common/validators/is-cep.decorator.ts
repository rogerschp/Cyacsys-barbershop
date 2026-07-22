import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValidCep } from '../utils/cep';

@ValidatorConstraint({ name: 'isCep', async: false })
export class IsCepConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === undefined || value === null || value === '') return true;
    return isValidCep(value);
  }

  defaultMessage(): string {
    return 'CEP inválido. Use 8 dígitos (ex.: 01001-000).';
  }
}

export function IsCep(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCepConstraint,
    });
  };
}
