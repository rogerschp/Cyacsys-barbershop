const HM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
export function isValidHm(value: string): boolean {
    return HM_REGEX.test(value);
}
export function hmToMinutes(hm: string): number {
    const m = hm.match(HM_REGEX);
    if (!m)
        return NaN;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}
export function minutesToHm(total: number): string {
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
export function rangesOverlapHalfOpen(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
    return aStart < bEnd && bStart < aEnd;
}
export function assertValidPeriodRange(startHm: string, endHm: string): void {
    const s = hmToMinutes(startHm);
    const e = hmToMinutes(endHm);
    if (Number.isNaN(s) || Number.isNaN(e) || s >= e) {
        throw new Error('INVALID_PERIOD_RANGE');
    }
}
export function normalizeDateColumn(value: string | Date): string {
    if (typeof value === 'string') {
        return value.slice(0, 10);
    }
    return value.toISOString().slice(0, 10);
}
