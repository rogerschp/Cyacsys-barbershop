import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { hmToMinutes, isValidHm } from './time-range.utils';
export function assertValidBlockRange(
  startTime: string,
  endTime: string,
): void {
  if (!isValidHm(startTime) || !isValidHm(endTime)) {
    throw new BusinessRuleException(
      'INVALID_BLOCK_RANGE',
      'Formato de horário inválido. Use HH:mm.',
    );
  }
  const s = hmToMinutes(startTime);
  const e = hmToMinutes(endTime);
  if (s >= e) {
    throw new BusinessRuleException(
      'INVALID_BLOCK_RANGE',
      'startTime deve ser menor que endTime.',
    );
  }
}
