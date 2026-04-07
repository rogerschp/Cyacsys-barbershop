import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { hmToMinutes, isValidHm, rangesOverlapHalfOpen, } from './time-range.utils';
export interface PeriodHm {
    startTime: string;
    endTime: string;
}
export function validatePeriodsNoOverlap(periods: PeriodHm[]): void {
    const ranges: {
        s: number;
        e: number;
    }[] = [];
    for (const p of periods) {
        if (!isValidHm(p.startTime) || !isValidHm(p.endTime)) {
            throw new BusinessRuleException('INVALID_PERIOD_RANGE', 'Formato de horário inválido. Use HH:mm.');
        }
        const s = hmToMinutes(p.startTime);
        const e = hmToMinutes(p.endTime);
        if (s >= e) {
            throw new BusinessRuleException('INVALID_PERIOD_RANGE', 'startTime deve ser menor que endTime.');
        }
        ranges.push({ s, e });
    }
    const sorted = [...ranges].sort((a, b) => a.s - b.s);
    for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
            if (rangesOverlapHalfOpen(sorted[i].s, sorted[i].e, sorted[j].s, sorted[j].e)) {
                throw new BusinessRuleException('PERIOD_OVERLAP', 'Períodos de trabalho não podem se sobrepor.');
            }
        }
    }
}
