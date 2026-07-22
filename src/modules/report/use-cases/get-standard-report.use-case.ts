import { Injectable } from '@nestjs/common';
import { StandardReportDto } from '../dto/standard-report.dto';
import { ReportService } from '../services/report.service';

@Injectable()
export class GetStandardReportUseCase {
  constructor(private readonly reportService: ReportService) {}

  run(tenantId: string): Promise<StandardReportDto> {
    return this.reportService.buildStandard(tenantId);
  }
}
