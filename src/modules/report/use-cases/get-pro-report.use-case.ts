import { Injectable } from '@nestjs/common';
import { ProReportDto } from '../dto/pro-report.dto';
import { ReportService } from '../services/report.service';
import {
  PRO_REPORT_DEFAULT_MONTHS,
  parseProReportMonths,
} from '../utils/report-months.utils';

@Injectable()
export class GetProReportUseCase {
  constructor(private readonly reportService: ReportService) {}

  /**
   * @param months Quantidade de meses (1–3). Default 3.
   * Ex.: 1 = mês atual; 3 = últimos 3 meses.
   */
  run(
    tenantId: string,
    months: string | number | undefined = PRO_REPORT_DEFAULT_MONTHS,
  ): Promise<ProReportDto> {
    const monthsCount = parseProReportMonths(months);
    return this.reportService.buildPro(tenantId, monthsCount);
  }
}
