import {
  PdfExportSection,
  ReportExportContext,
  ReportExportResult,
} from '../report-export.types';
import {
  applyPdfFooters,
  createPdfDocument,
  drawPdfHeader,
  pdfDocumentToBuffer,
} from './pdf-layout';
import {
  DashboardSectionBuilder,
  MonthlyRevenueSectionBuilder,
  ProfessionalSectionBuilder,
  ServiceSectionBuilder,
} from './sections/pdf-section.builders';

/**
 * Orquestra o PDF. Novas seções (insights, gráficos, forecast) entram
 * no array `sections` sem alterar builders existentes.
 */
export class PdfReportBuilder {
  constructor(
    private readonly sections: PdfExportSection[] = [
      new DashboardSectionBuilder(),
      new ServiceSectionBuilder(),
      new MonthlyRevenueSectionBuilder(),
      new ProfessionalSectionBuilder(),
    ],
  ) {}

  async build(ctx: ReportExportContext): Promise<ReportExportResult> {
    const doc = createPdfDocument();
    drawPdfHeader(doc, ctx);

    for (const section of this.sections) {
      section.append(doc, ctx);
    }

    applyPdfFooters(doc, ctx);
    const buffer = await pdfDocumentToBuffer(doc);

    return {
      buffer,
      contentType: 'application/pdf',
      filename: ctx.filename,
    };
  }
}
