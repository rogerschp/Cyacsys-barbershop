import {
  formatCurrencyBrl,
  formatMonthLabel,
  formatNumberBr,
  formatPercentBr,
} from '../../report-export.formatters';
import {
  PdfExportSection,
  ReportExportContext,
} from '../../report-export.types';
import {
  dashboardKpiCards,
  drawPdfKpiCards,
  drawPdfSectionTitle,
  drawPdfTable,
  PdfDoc,
} from '../pdf-layout';

export class DashboardSectionBuilder implements PdfExportSection {
  readonly id = 'dashboard';

  append(doc: PdfDoc, ctx: ReportExportContext): void {
    drawPdfSectionTitle(doc, 'Indicadores do período');
    drawPdfKpiCards(doc, dashboardKpiCards(ctx));
  }
}

export class ServiceSectionBuilder implements PdfExportSection {
  readonly id = 'top-services';

  append(doc: PdfDoc, ctx: ReportExportContext): void {
    drawPdfSectionTitle(doc, 'Top serviços');
    const rows = [...ctx.report.topServices]
      .sort((a, b) => b.quantity - a.quantity)
      .map((service) => ({
        service: service.serviceName,
        quantity: formatNumberBr(service.quantity),
        revenue: formatCurrencyBrl(service.revenue),
      }));

    drawPdfTable(
      doc,
      [
        { key: 'service', header: 'Serviço', width: 275 },
        { key: 'quantity', header: 'Quantidade', width: 100, align: 'right' },
        { key: 'revenue', header: 'Receita', width: 140.28, align: 'right' },
      ],
      rows.length
        ? rows
        : [{ service: 'Sem dados no período', quantity: '—', revenue: '—' }],
    );
  }
}

export class MonthlyRevenueSectionBuilder implements PdfExportSection {
  readonly id = 'monthly-revenue';

  append(doc: PdfDoc, ctx: ReportExportContext): void {
    drawPdfSectionTitle(doc, 'Receita mensal');
    const rows = ctx.report.monthlyBreakdown.map((month) => ({
      month: formatMonthLabel(month.year, month.month),
      revenue: formatCurrencyBrl(month.revenue),
      confirmed: formatNumberBr(month.confirmedBookings),
      cancelled: formatNumberBr(month.cancelledBookings),
      variation: formatPercentBr(month.revenueChangePercent),
    }));

    drawPdfTable(
      doc,
      [
        { key: 'month', header: 'Mês', width: 130 },
        { key: 'revenue', header: 'Receita', width: 105, align: 'right' },
        { key: 'confirmed', header: 'Confirmados', width: 90, align: 'right' },
        { key: 'cancelled', header: 'Cancelados', width: 90, align: 'right' },
        {
          key: 'variation',
          header: 'Variação %',
          width: 100.28,
          align: 'right',
        },
      ],
      rows.length
        ? rows
        : [
            {
              month: 'Sem dados no período',
              revenue: '—',
              confirmed: '—',
              cancelled: '—',
              variation: '—',
            },
          ],
    );
  }
}

export class ProfessionalSectionBuilder implements PdfExportSection {
  readonly id = 'professionals';

  append(doc: PdfDoc, ctx: ReportExportContext): void {
    drawPdfSectionTitle(doc, 'Receita por profissional');
    const rows = [...ctx.report.professionalBreakdown]
      .sort((a, b) => b.revenue - a.revenue)
      .map((professional) => ({
        name: professional.professionalName,
        revenue: formatCurrencyBrl(professional.revenue),
        appointments: formatNumberBr(professional.confirmedBookings),
        ticket: formatCurrencyBrl(professional.averageTicket),
        cancelled: formatNumberBr(professional.cancelledBookings),
      }));

    drawPdfTable(
      doc,
      [
        { key: 'name', header: 'Profissional', width: 155 },
        { key: 'revenue', header: 'Receita', width: 95, align: 'right' },
        {
          key: 'appointments',
          header: 'Atendimentos',
          width: 90,
          align: 'right',
        },
        { key: 'ticket', header: 'Ticket médio', width: 95, align: 'right' },
        {
          key: 'cancelled',
          header: 'Cancelamentos',
          width: 80.28,
          align: 'right',
        },
      ],
      rows.length
        ? rows
        : [
            {
              name: 'Sem dados no período',
              revenue: '—',
              appointments: '—',
              ticket: '—',
              cancelled: '—',
            },
          ],
    );
  }
}
