import * as ExcelJS from 'exceljs';
import {
  ExcelExportSection,
  ReportExportContext,
  ReportExportResult,
} from '../report-export.types';
import {
  DashboardSectionBuilder,
  MonthlyRevenueSectionBuilder,
  ProfessionalSectionBuilder,
  ServiceSectionBuilder,
} from './sections/excel-section.builders';

/**
 * Orquestra o Excel. Novas abas/seções entram no array `sections`
 * sem alterar builders existentes.
 */
export class ExcelReportBuilder {
  constructor(
    private readonly sections: ExcelExportSection[] = [
      new DashboardSectionBuilder(),
      new MonthlyRevenueSectionBuilder(),
      new ProfessionalSectionBuilder(),
      new ServiceSectionBuilder(),
    ],
  ) {}

  async build(ctx: ReportExportContext): Promise<ReportExportResult> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = ctx.productName;
    workbook.created = ctx.generatedAt;
    workbook.modified = ctx.generatedAt;
    workbook.lastModifiedBy = ctx.productName;

    for (const section of this.sections) {
      section.append(workbook, ctx);
    }

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    return {
      buffer,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: ctx.filename,
    };
  }
}
