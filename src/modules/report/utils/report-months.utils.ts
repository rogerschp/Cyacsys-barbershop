import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';

export const PRO_REPORT_DEFAULT_MONTHS = 3;
export const PRO_REPORT_MIN_MONTHS = 1;
export const PRO_REPORT_MAX_MONTHS = 3;

export const ELITE_REPORT_DEFAULT_MONTHS = 6;
export const ELITE_REPORT_MIN_MONTHS = 1;
export const ELITE_REPORT_MAX_MONTHS = 12;

type ParseMonthsOptions = {
  months: string | number | undefined;
  defaultMonths: number;
  min: number;
  max: number;
  examples: string;
};

function parseReportMonths(options: ParseMonthsOptions): number {
  const { months, defaultMonths, min, max, examples } = options;

  if (months === undefined || months === null || months === '') {
    return defaultMonths;
  }

  const parsed =
    typeof months === 'number' ? months : Number.parseInt(String(months), 10);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new BusinessRuleException(
      'INVALID_REPORT_MONTHS',
      `Informe months entre ${min} e ${max} (ex.: ${examples}).`,
      { months },
    );
  }

  return parsed;
}

export function parseProReportMonths(
  months: string | number | undefined,
): number {
  return parseReportMonths({
    months,
    defaultMonths: PRO_REPORT_DEFAULT_MONTHS,
    min: PRO_REPORT_MIN_MONTHS,
    max: PRO_REPORT_MAX_MONTHS,
    examples: '1 ou 3',
  });
}

/**
 * Converte query `months` (quantidade de meses no período) em valor válido.
 * Ex.: 1 = mês atual; 3 = últimos 3 meses; 6 = últimos 6 meses.
 */
export function parseEliteReportMonths(
  months: string | number | undefined,
): number {
  return parseReportMonths({
    months,
    defaultMonths: ELITE_REPORT_DEFAULT_MONTHS,
    min: ELITE_REPORT_MIN_MONTHS,
    max: ELITE_REPORT_MAX_MONTHS,
    examples: '1, 3 ou 6',
  });
}

/** `getReportPeriod` usa monthsBack = quantidade − 1 (0 = só o mês atual). */
export function monthsCountToMonthsBack(monthsCount: number): number {
  return monthsCount - 1;
}
