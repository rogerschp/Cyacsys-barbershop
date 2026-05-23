import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { hmToMinutes, isValidHm } from './time-range.utils';
export interface NormalizedTimeOffTimes {
  wholeDay: boolean;
  startTime: string | null;
  endTime: string | null;
}
export function normalizeTimeOffTimes(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
): NormalizedTimeOffTimes {
  const s =
    startTime === undefined || startTime === null || startTime === ''
      ? null
      : startTime;
  const e =
    endTime === undefined || endTime === null || endTime === ''
      ? null
      : endTime;
  if (s === null && e === null) {
    return { wholeDay: true, startTime: null, endTime: null };
  }
  if (s === null || e === null) {
    throw new BusinessRuleException(
      'INVALID_TIMEOFF_RANGE',
      'Para folga parcial informe startTime e endTime; para dia inteiro omita ambos.',
    );
  }
  if (!isValidHm(s) || !isValidHm(e)) {
    throw new BusinessRuleException(
      'INVALID_TIMEOFF_RANGE',
      'Formato de horário inválido. Use HH:mm.',
    );
  }
  const sm = hmToMinutes(s);
  const em = hmToMinutes(e);
  if (sm >= em) {
    throw new BusinessRuleException(
      'INVALID_TIMEOFF_RANGE',
      'startTime deve ser menor que endTime.',
    );
  }
  return { wholeDay: false, startTime: s, endTime: e };
}
