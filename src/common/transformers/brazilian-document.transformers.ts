import { Transform } from 'class-transformer';
import { normalizeCnpj } from '../utils/cnpj';
import { normalizeCep } from '../utils/cep';
import { tryNormalizePhone } from '../utils/normalize-phone';

/** Empty string → undefined (campos opcionais). */
export function EmptyToUndefined() {
  return Transform(({ value }) =>
    value === '' || value === null ? undefined : value,
  );
}

/** Normaliza CNPJ para 14 dígitos; se inválido no formato, mantém valor original para o validator rejeitar. */
export function NormalizeCnpj() {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return normalizeCnpj(value) ?? value;
  });
}

/** Normaliza CEP para #####-###; se inválido, mantém valor original. */
export function NormalizeCep() {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return value;
    return normalizeCep(value) ?? value;
  });
}

/** Normaliza telefone para dígitos com DDI; se inválido, mantém valor original. */
export function NormalizePhone() {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return value;
    return tryNormalizePhone(value) ?? value;
  });
}
