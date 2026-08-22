import PDFDocument from "pdfkit";

import type {
  BatchDeliveryOrder,
  BatchShoppingLine,
} from "@/lib/repos/exchange-batches";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 28.35;
const CONTENT_WIDTH = A4_WIDTH - MARGIN * 2;
const BLACK = "#000000";
const CARD_HEIGHT = (A4_HEIGHT - MARGIN * 2) / 2;

type PdfDoc = InstanceType<typeof PDFDocument>;

export type ShoppingListPdfLabels = {
  title: string;
  itemColumn: string;
  qtyColumn: string;
};

export type DeliveryPdfLabels = {
  sectionTitle: string;
  itemColumn: string;
  qtyColumn: string;
  unitColumn: string;
  lineTotalColumn: string;
  signature: string;
  dateLine: string;
  formatItemCount: (count: number) => string;
};

function collectPdfBuffer(doc: PdfDoc): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

function strokeHorizontalRule(doc: PdfDoc, y: number, dashed = false): void {
  if (dashed) {
    doc.dash(3, { space: 3 });
  }
  doc
    .strokeColor(BLACK)
    .moveTo(MARGIN, y)
    .lineTo(A4_WIDTH - MARGIN, y)
    .stroke();
  if (dashed) {
    doc.undash();
  }
}

function drawTableHeader(
  doc: PdfDoc,
  columns: Array<{ label: string; width: number; align?: "left" | "right" }>,
  y: number,
  x = MARGIN,
): number {
  doc.fillColor(BLACK).font("Helvetica-Bold").fontSize(10);
  let columnX = x;
  for (const column of columns) {
    doc.text(column.label, columnX, y, {
      width: column.width,
      align: column.align ?? "left",
    });
    columnX += column.width;
  }
  const ruleY = y + 14;
  const ruleWidth = columns.reduce((sum, column) => sum + column.width, 0);
  doc
    .strokeColor(BLACK)
    .moveTo(x, ruleY)
    .lineTo(x + ruleWidth, ruleY)
    .stroke();
  return ruleY + 8;
}

export function generateShoppingListPdf(
  lines: BatchShoppingLine[],
  labels: ShoppingListPdfLabels,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
  });

  doc.fillColor(BLACK).font("Helvetica-Bold").fontSize(16).text(labels.title, {
    align: "center",
  });
  doc.moveDown(1.5);

  const itemWidth = CONTENT_WIDTH * 0.78;
  const qtyWidth = CONTENT_WIDTH * 0.22;
  let y = drawTableHeader(
    doc,
    [
      { label: labels.itemColumn, width: itemWidth },
      { label: labels.qtyColumn, width: qtyWidth, align: "right" },
    ],
    doc.y,
  );

  doc.font("Helvetica").fontSize(10);
  for (const line of lines) {
    if (y > A4_HEIGHT - MARGIN - 24) {
      doc.addPage();
      y = drawTableHeader(
        doc,
        [
          { label: labels.itemColumn, width: itemWidth },
          { label: labels.qtyColumn, width: qtyWidth, align: "right" },
        ],
        MARGIN,
      );
      doc.font("Helvetica").fontSize(10);
    }

    const rowTop = y;
    doc.text(line.awardTitle, MARGIN, rowTop, { width: itemWidth });
    doc.text(String(line.qty), MARGIN + itemWidth, rowTop, {
      width: qtyWidth,
      align: "right",
    });
    y = Math.max(doc.y, rowTop + 14) + 4;
    strokeHorizontalRule(doc, y - 2);
  }

  return collectPdfBuffer(doc);
}

function drawDeliveryCard(
  doc: PdfDoc,
  order: BatchDeliveryOrder,
  labels: DeliveryPdfLabels,
  yTop: number,
  cardHeight: number,
): void {
  doc
    .strokeColor(BLACK)
    .rect(MARGIN, yTop, CONTENT_WIDTH, cardHeight)
    .stroke();

  const innerX = MARGIN + 12;
  const innerWidth = CONTENT_WIDTH - 24;
  let y = yTop + 14;

  doc
    .fillColor(BLACK)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(order.userName, innerX, y, { width: innerWidth });
  y += 18;

  doc
    .font("Helvetica")
    .fontSize(9)
    .text(
      `${labels.formatItemCount(order.itemCount)} · ${order.totalNumberOf} ${order.currencyPluralTitle}`,
      innerX,
      y,
      { width: innerWidth },
    );
  y += 18;

  const colWidths = [
    innerWidth * 0.46,
    innerWidth * 0.14,
    innerWidth * 0.2,
    innerWidth * 0.2,
  ];
  y = drawTableHeader(
    doc,
    [
      { label: labels.itemColumn, width: colWidths[0]! },
      { label: labels.qtyColumn, width: colWidths[1]!, align: "right" },
      { label: labels.unitColumn, width: colWidths[2]!, align: "right" },
      { label: labels.lineTotalColumn, width: colWidths[3]!, align: "right" },
    ],
    y,
    innerX,
  );
  doc.font("Helvetica").fontSize(9);

  for (const item of order.items) {
    if (y > yTop + cardHeight - 72) break;
    const rowTop = y;
    let columnX = innerX;
    const cells = [
      { text: item.awardTitle, width: colWidths[0]!, align: "left" as const },
      { text: String(item.qty), width: colWidths[1]!, align: "right" as const },
      {
        text: String(item.unitNumberOf),
        width: colWidths[2]!,
        align: "right" as const,
      },
      {
        text: String(item.lineNumberOf),
        width: colWidths[3]!,
        align: "right" as const,
      },
    ];
    for (const cell of cells) {
      doc.text(cell.text, columnX, rowTop, {
        width: cell.width,
        align: cell.align,
      });
      columnX += cell.width;
    }
    y = rowTop + 14;
    doc
      .strokeColor(BLACK)
      .moveTo(innerX, y - 2)
      .lineTo(innerX + innerWidth, y - 2)
      .stroke();
  }

  const footerY = yTop + cardHeight - 30;
  const signatureWidth = innerWidth * 0.55;
  const dateWidth = innerWidth * 0.4;
  const dateX = innerX + signatureWidth + innerWidth * 0.05;
  const lineY = footerY + 12;

  doc.fontSize(9).text(`${labels.signature}:`, innerX, footerY, {
    width: signatureWidth,
  });
  doc.text(`${labels.dateLine}:`, dateX, footerY, { width: dateWidth });
  doc
    .moveTo(innerX + 42, lineY)
    .lineTo(innerX + signatureWidth, lineY)
    .stroke();
  doc
    .moveTo(dateX + 28, lineY)
    .lineTo(dateX + dateWidth, lineY)
    .stroke();
}

export function generateDeliverySheetsPdf(
  deliveries: BatchDeliveryOrder[],
  labels: DeliveryPdfLabels,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  if (deliveries.length === 0) {
    doc
      .fillColor(BLACK)
      .font("Helvetica")
      .fontSize(11)
      .text(labels.sectionTitle, MARGIN, MARGIN + 40, {
        width: CONTENT_WIDTH,
        align: "center",
      });
    return collectPdfBuffer(doc);
  }

  deliveries.forEach((order, index) => {
    const slot = index % 2;
    if (index > 0 && slot === 0) {
      doc.addPage();
    }

    const firstPageTitleOffset = 28;
    const yTop =
      index === 0
        ? MARGIN + firstPageTitleOffset
        : slot === 0
          ? MARGIN
          : MARGIN + CARD_HEIGHT;
    const cardHeight =
      index === 0 ? CARD_HEIGHT - firstPageTitleOffset : CARD_HEIGHT;

    if (index === 0) {
      doc
        .fillColor(BLACK)
        .font("Helvetica-Bold")
        .fontSize(16)
        .text(labels.sectionTitle, MARGIN, MARGIN, {
          width: CONTENT_WIDTH,
          align: "center",
        });
    }

    if (slot === 1) {
      strokeHorizontalRule(doc, yTop, true);
    }

    drawDeliveryCard(doc, order, labels, yTop, cardHeight);

    if (slot === 0 && index + 1 < deliveries.length) {
      strokeHorizontalRule(doc, yTop + cardHeight, true);
    }
  });

  return collectPdfBuffer(doc);
}
