import { Injectable } from '@nestjs/common';
import { EliteReportDto } from '../dto/elite-report.dto';
import { ReportService } from '../services/report.service';
import {
  ELITE_REPORT_DEFAULT_MONTHS,
  parseEliteReportMonths,
} from '../utils/report-months.utils';

@Injectable()
export class GetEliteReportUseCase {
  constructor(private readonly reportService: ReportService) {}

  /**
   * @param months Quantidade de meses no período (1–12). Default 6.
   * Ex.: 1 = mês atual; 3 = últimos 3 meses; 6 = últimos 6 meses.
   */
  run(
    tenantId: string,
    months: string | number | undefined = ELITE_REPORT_DEFAULT_MONTHS,
  ): Promise<EliteReportDto> {
    const monthsCount = parseEliteReportMonths(months);
    return this.reportService.buildElite(tenantId, monthsCount);
  }
}
