const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

export function formatCurrencyBrl(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatNumberBr(value: number, fractionDigits = 0): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatPercentBr(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return '—';
  }
  return `${formatNumberBr(value, 2)}%`;
}

export function formatMonthLabel(year: number, month: number): string {
  const name = MONTH_NAMES_PT[month - 1] ?? String(month);
  return `${name}/${year}`;
}

export function formatDateTimeBr(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatPeriodRange(
  start: Date | string,
  end: Date | string,
  timezone: string,
): string {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  const startLabel = new Intl.DateTimeFormat('pt-BR', opts).format(
    new Date(start),
  );
  const endLabel = new Intl.DateTimeFormat('pt-BR', opts).format(new Date(end));
  return `${startLabel} — ${endLabel}`;
}
