import PDFDocument = require('pdfkit');
import {
  formatCurrencyBrl,
  formatDateTimeBr,
  formatNumberBr,
  formatPercentBr,
  formatPeriodRange,
} from '../report-export.formatters';
import { ReportExportContext } from '../report-export.types';

export type PdfDoc = InstanceType<typeof PDFDocument>;

export const PDF_PAGE = {
  margin: 40,
  /** A4 width 595.28 − margens 40+40 */
  contentWidth: 515.28,
} as const;

export type PdfKpiCard = {
  label: string;
  value: string;
};

export function createPdfDocument(): PdfDoc {
  return new PDFDocument({
    size: 'A4',
    margins: {
      top: PDF_PAGE.margin,
      bottom: PDF_PAGE.margin + 28,
      left: PDF_PAGE.margin,
      right: PDF_PAGE.margin,
    },
    bufferPages: true,
    info: {
      Title: 'Relatório Gerencial',
      Author: 'Cyacsys',
      Creator: 'Cyacsys',
    },
  });
}

export async function pdfDocumentToBuffer(doc: PdfDoc): Promise<Buffer> {
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const endPromise = new Promise<void>((resolve) => {
    doc.on('end', () => resolve());
  });
  doc.end();
  await endPromise;
  return Buffer.concat(chunks);
}

export function drawPdfHeader(doc: PdfDoc, ctx: ReportExportContext): void {
  const left = doc.page.margins.left;
  const width = PDF_PAGE.contentWidth;
  let y = doc.page.margins.top;

  doc
    .fillColor('#111111')
    .font('Helvetica-Bold')
    .fontSize(18)
    .text(ctx.productName, left, y, { width: width * 0.55, continued: false });

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#555555')
    .text(`Plano ${ctx.planLabel}`, left + width * 0.55, y + 4, {
      width: width * 0.45,
      align: 'right',
    });

  y += 26;
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#111111')
    .text(ctx.reportTitle, left, y, { width });

  y = doc.y + 10;
  doc
    .moveTo(left, y)
    .lineTo(left + width, y)
    .lineWidth(1)
    .strokeColor('#222222')
    .stroke();

  y += 12;
  const meta = [
    ['Estabelecimento', ctx.tenantName],
    [
      'Período',
      formatPeriodRange(
        ctx.report.period.start,
        ctx.report.period.end,
        ctx.timezone,
      ),
    ],
    ['Gerado em', formatDateTimeBr(ctx.generatedAt, ctx.timezone)],
  ] as const;

  doc.font('Helvetica').fontSize(9).fillColor('#333333');
  for (const [label, value] of meta) {
    doc
      .font('Helvetica-Bold')
      .text(`${label}: `, left, y, { continued: true, width });
    doc.font('Helvetica').text(value);
    y = doc.y + 2;
  }

  y = doc.y + 8;
  doc
    .moveTo(left, y)
    .lineTo(left + width, y)
    .lineWidth(0.5)
    .strokeColor('#999999')
    .stroke();

  doc.y = y + 14;
  doc.fillColor('#111111');
}

export function drawPdfSectionTitle(doc: PdfDoc, title: string): void {
  ensurePdfSpace(doc, 36);
  const left = doc.page.margins.left;
  const y = doc.y;
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#111111')
    .text(title.toUpperCase(), left, y, { width: PDF_PAGE.contentWidth });
  const lineY = doc.y + 3;
  doc
    .moveTo(left, lineY)
    .lineTo(left + PDF_PAGE.contentWidth, lineY)
    .lineWidth(0.6)
    .strokeColor('#888888')
    .stroke();
  doc.y = lineY + 10;
}

export function ensurePdfSpace(doc: PdfDoc, needed: number): void {
  const bottomLimit = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottomLimit) {
    doc.addPage();
  }
}

export function drawPdfKpiCards(doc: PdfDoc, cards: PdfKpiCard[]): void {
  const left = doc.page.margins.left;
  const gap = 8;
  const cols = 4;
  const cardWidth = (PDF_PAGE.contentWidth - gap * (cols - 1)) / cols;
  const cardHeight = 48;
  let index = 0;

  while (index < cards.length) {
    ensurePdfSpace(doc, cardHeight + 12);
    const rowY = doc.y;
    const rowCount = Math.min(cols, cards.length - index);

    for (let col = 0; col < rowCount; col++) {
      const card = cards[index + col];
      const x = left + col * (cardWidth + gap);
      doc
        .roundedRect(x, rowY, cardWidth, cardHeight, 3)
        .lineWidth(0.8)
        .strokeColor('#CCCCCC')
        .stroke();

      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#666666')
        .text(card.label.toUpperCase(), x + 8, rowY + 8, {
          width: cardWidth - 16,
        });

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#111111')
        .text(card.value, x + 8, rowY + 24, {
          width: cardWidth - 16,
        });
    }

    index += rowCount;
    doc.y = rowY + cardHeight + 10;
  }
}

export type PdfTableColumn = {
  key: string;
  header: string;
  width: number;
  align?: 'left' | 'right' | 'center';
};

export function drawPdfTable(
  doc: PdfDoc,
  columns: PdfTableColumn[],
  rows: Record<string, string>[],
): void {
  const left = doc.page.margins.left;
  const rowHeight = 18;
  const headerHeight = 20;

  const drawHeader = (y: number) => {
    doc.rect(left, y, PDF_PAGE.contentWidth, headerHeight).fill('#F0F0F0');
    let x = left;
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#222222');
    for (const col of columns) {
      doc.text(col.header, x + 4, y + 6, {
        width: col.width - 8,
        align: col.align ?? 'left',
      });
      x += col.width;
    }
    doc
      .moveTo(left, y + headerHeight)
      .lineTo(left + PDF_PAGE.contentWidth, y + headerHeight)
      .lineWidth(0.6)
      .strokeColor('#888888')
      .stroke();
  };

  ensurePdfSpace(doc, headerHeight + rowHeight);
  let y = doc.y;
  drawHeader(y);
  y += headerHeight;

  doc.font('Helvetica').fontSize(8).fillColor('#222222');
  for (const row of rows) {
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeader(y);
      y += headerHeight;
      doc.font('Helvetica').fontSize(8).fillColor('#222222');
    }

    let x = left;
    for (const col of columns) {
      doc.text(row[col.key] ?? '', x + 4, y + 5, {
        width: col.width - 8,
        align: col.align ?? 'left',
      });
      x += col.width;
    }
    y += rowHeight;
    doc
      .moveTo(left, y)
      .lineTo(left + PDF_PAGE.contentWidth, y)
      .lineWidth(0.3)
      .strokeColor('#DDDDDD')
      .stroke();
  }

  doc.y = y + 12;
}

export function applyPdfFooters(doc: PdfDoc, ctx: ReportExportContext): void {
  const range = doc.bufferedPageRange();
  const generated = formatDateTimeBr(ctx.generatedAt, ctx.timezone);

  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const bottom = doc.page.height - 28;
    const left = doc.page.margins.left;
    const width = PDF_PAGE.contentWidth;

    doc
      .moveTo(left, bottom - 8)
      .lineTo(left + width, bottom - 8)
      .lineWidth(0.5)
      .strokeColor('#AAAAAA')
      .stroke();

    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor('#666666')
      .text(
        `Gerado por ${ctx.productName}  ·  ${generated}  ·  Versão ${ctx.reportVersion}`,
        left,
        bottom - 2,
        { width: width * 0.72, align: 'left', lineBreak: false },
      );

    doc.text(
      `Página ${i - range.start + 1} de ${range.count}`,
      left,
      bottom - 2,
      {
        width,
        align: 'right',
        lineBreak: false,
      },
    );
  }
}

export function dashboardKpiCards(ctx: ReportExportContext): PdfKpiCard[] {
  const d = ctx.report.dashboard;
  return [
    { label: 'Receita total', value: formatCurrencyBrl(d.revenue) },
    {
      label: 'Atendimentos concluídos',
      value: formatNumberBr(d.completedBookings),
    },
    { label: 'Cancelamentos', value: formatNumberBr(d.cancelledBookings) },
    { label: 'Ticket médio', value: formatCurrencyBrl(d.averageTicket) },
    {
      label: 'Taxa de cancelamento',
      value: formatPercentBr(d.cancellationRate),
    },
    { label: 'Clientes novos', value: formatNumberBr(d.newCustomers) },
    {
      label: 'Clientes recorrentes',
      value: formatNumberBr(d.returningCustomers),
    },
  ];
}
