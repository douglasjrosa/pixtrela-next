import { existsSync } from "node:fs";
import { createRequire } from "node:module";

import type {
  BatchDeliveryOrder,
  BatchShoppingLine,
} from "@/lib/repos/exchange-batches";

const require = createRequire(import.meta.url);
const PDFDocument = require("pdfkit") as typeof import("pdfkit");

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 28.35;
const CONTENT_WIDTH = A4_WIDTH - MARGIN * 2;
const BLACK = "#000000";
const CARD_INNER_PADDING = 12;
const CARD_PADDING_TOP = 14;
const CARD_PADDING_BOTTOM = 14;
const CARD_GAP = 10;
const HEADER_LINE_HEIGHT = 18;
const SUMMARY_LINE_HEIGHT = 18;
const TABLE_HEADER_HEIGHT = 22;
const ROW_MIN_HEIGHT = 14;
const DELIVERY_ROW_VERTICAL_PADDING = 4;
const DELIVERY_FOOTER_TOP_GAP = 18;
const DELIVERY_FOOTER_BLOCK_HEIGHT = 16;
const DELIVERY_CARD_PADDING_BOTTOM = 8;
const PAGE_BOTTOM = A4_HEIGHT - MARGIN;
const SHOPPING_LOGO_SIZE = 28;
const SHOPPING_HEADER_SIDE_WIDTH = 120;
const SHOPPING_HEADER_HEIGHT = 36;
const SHOPPING_HEADER_GAP = 16;
const SHOPPING_ROW_VERTICAL_PADDING = 4;
const BRL_PREFIX = "R$";
const DELIVERY_DATE_PLACEHOLDER = "      /      /            ";

type PdfDoc = InstanceType<typeof PDFDocument>;

export type ShoppingListPdfLabels = {
  title: string;
  monthYearLabel: string;
  logoPath: string;
  itemColumn: string;
  qtyColumn: string;
  unitValueColumn: string;
};

export type DeliveryPdfLabels = {
  monthYearLabel: string;
  itemColumn: string;
  qtyColumn: string;
  unitColumn: string;
  lineTotalColumn: string;
  signature: string;
  dateLine: string;
  formatOrderSummary: (itemCount: number, totalUnits: number) => string;
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

type CellTextAlign = "left" | "right" | "center";

function measureRowHeight(
  doc: PdfDoc,
  cells: Array<{ text: string; width: number }>,
): number {
  let height = ROW_MIN_HEIGHT;
  for (const cell of cells) {
    if (!cell.text) continue;
    height = Math.max(
      height,
      doc.heightOfString(cell.text, { width: cell.width }),
    );
  }
  return height;
}

function drawCellText(
  doc: PdfDoc,
  text: string,
  x: number,
  rowTop: number,
  width: number,
  rowHeight: number,
  align: CellTextAlign = "left",
): void {
  if (!text) return;
  const textHeight = doc.heightOfString(text, { width });
  const y = rowTop + (rowHeight - textHeight) / 2;
  doc.text(text, x, y, { width, align });
}

function drawTableHeader(
  doc: PdfDoc,
  columns: Array<{ label: string; width: number; align?: CellTextAlign }>,
  y: number,
  x = MARGIN,
): number {
  doc.fillColor(BLACK).font("Helvetica-Bold").fontSize(10);
  const headerRowHeight = 14;
  let columnX = x;
  for (const column of columns) {
    drawCellText(
      doc,
      column.label,
      columnX,
      y,
      column.width,
      headerRowHeight,
      column.align ?? "left",
    );
    columnX += column.width;
  }
  const ruleY = y + headerRowHeight;
  const ruleWidth = columns.reduce((sum, column) => sum + column.width, 0);
  doc
    .strokeColor(BLACK)
    .moveTo(x, ruleY)
    .lineTo(x + ruleWidth, ruleY)
    .stroke();
  return ruleY + 8;
}

function drawShoppingListHeader(
  doc: PdfDoc,
  labels: ShoppingListPdfLabels,
  y: number,
): number {
  if (existsSync(labels.logoPath)) {
    doc.image(labels.logoPath, MARGIN, y, {
      fit: [SHOPPING_LOGO_SIZE, SHOPPING_LOGO_SIZE],
    });
  }

  const textY = y + 6;
  doc
    .fillColor(BLACK)
    .font("Helvetica-Bold")
    .fontSize(16)
    .text(labels.title, MARGIN + SHOPPING_HEADER_SIDE_WIDTH, textY, {
      width: CONTENT_WIDTH - SHOPPING_HEADER_SIDE_WIDTH * 2,
      align: "center",
    });
  doc
    .font("Helvetica")
    .fontSize(11)
    .text(labels.monthYearLabel, MARGIN, textY + 2, {
      width: CONTENT_WIDTH,
      align: "right",
    });

  return y + SHOPPING_HEADER_HEIGHT + SHOPPING_HEADER_GAP;
}

function shoppingColumnWidths(): {
  item: number;
  qty: number;
  unitValue: number;
} {
  return {
    item: CONTENT_WIDTH * 0.58,
    qty: CONTENT_WIDTH * 0.14,
    unitValue: CONTENT_WIDTH * 0.28,
  };
}

function formatShoppingPriceAmount(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function drawShoppingUnitValueCell(
  doc: PdfDoc,
  value: number,
  x: number,
  rowTop: number,
  width: number,
  rowHeight: number,
): void {
  const prefixWidth = doc.widthOfString(BRL_PREFIX) + 4;
  drawCellText(doc, BRL_PREFIX, x, rowTop, prefixWidth, rowHeight, "left");
  drawCellText(
    doc,
    formatShoppingPriceAmount(value),
    x,
    rowTop,
    width,
    rowHeight,
    "center",
  );
}

function shoppingTableColumns(labels: ShoppingListPdfLabels) {
  const widths = shoppingColumnWidths();
  return [
    { label: labels.itemColumn, width: widths.item },
    { label: labels.qtyColumn, width: widths.qty, align: "center" as const },
    {
      label: labels.unitValueColumn,
      width: widths.unitValue,
      align: "center" as const,
    },
  ];
}

export function generateShoppingListPdf(
  lines: BatchShoppingLine[],
  labels: ShoppingListPdfLabels,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
  });

  doc.fillColor(BLACK);
  let y = drawShoppingListHeader(doc, labels, MARGIN);

  const widths = shoppingColumnWidths();
  y = drawTableHeader(doc, shoppingTableColumns(labels), y);

  doc.font("Helvetica").fontSize(10);
  for (const line of lines) {
    if (y > A4_HEIGHT - MARGIN - 24) {
      doc.addPage();
      y = drawTableHeader(doc, shoppingTableColumns(labels), MARGIN);
      doc.font("Helvetica").fontSize(10);
    }

    const rowTop = y;
    const rowCells = [
      { text: line.awardTitle, width: widths.item },
      { text: String(line.qty), width: widths.qty },
      {
        text: formatShoppingPriceAmount(line.actualPrice),
        width: widths.unitValue,
      },
    ];
    const rowHeight =
      measureRowHeight(doc, rowCells) + SHOPPING_ROW_VERTICAL_PADDING * 2;
    drawCellText(doc, line.awardTitle, MARGIN, rowTop, widths.item, rowHeight);
    drawCellText(
      doc,
      String(line.qty),
      MARGIN + widths.item,
      rowTop,
      widths.qty,
      rowHeight,
      "center",
    );
    drawShoppingUnitValueCell(
      doc,
      line.actualPrice,
      MARGIN + widths.item + widths.qty,
      rowTop,
      widths.unitValue,
      rowHeight,
    );
    y = rowTop + rowHeight + 4;
    strokeHorizontalRule(doc, y - 2);
  }

  return collectPdfBuffer(doc);
}

function orderRowCount(order: BatchDeliveryOrder): number {
  return order.items.length;
}

function orderTotalUnits(order: BatchDeliveryOrder): number {
  return order.items.reduce((sum, item) => sum + item.lineNumberOf, 0);
}

function deliveryColumnWidths(innerWidth: number): number[] {
  return [
    innerWidth * 0.46,
    innerWidth * 0.14,
    innerWidth * 0.2,
    innerWidth * 0.2,
  ];
}

function measureDeliveryCardHeight(
  doc: PdfDoc,
  order: BatchDeliveryOrder,
): number {
  const innerWidth = CONTENT_WIDTH - CARD_INNER_PADDING * 2;
  const colWidths = deliveryColumnWidths(innerWidth);

  let height = CARD_PADDING_TOP + HEADER_LINE_HEIGHT + SUMMARY_LINE_HEIGHT;
  height += TABLE_HEADER_HEIGHT;

  doc.font("Helvetica").fontSize(9);
  for (const item of order.items) {
    height +=
      measureRowHeight(doc, [
        { text: item.awardTitle, width: colWidths[0]! },
        { text: String(item.qty), width: colWidths[1]! },
        { text: String(item.unitNumberOf), width: colWidths[2]! },
        { text: String(item.lineNumberOf), width: colWidths[3]! },
      ]) +
      DELIVERY_ROW_VERTICAL_PADDING * 2 +
      2;
  }

  height +=
    DELIVERY_FOOTER_TOP_GAP +
    DELIVERY_FOOTER_BLOCK_HEIGHT +
    DELIVERY_CARD_PADDING_BOTTOM;
  return height;
}

function drawDeliveryCard(
  doc: PdfDoc,
  order: BatchDeliveryOrder,
  labels: DeliveryPdfLabels,
  yTop: number,
): number {
  const innerX = MARGIN + CARD_INNER_PADDING;
  const innerWidth = CONTENT_WIDTH - CARD_INNER_PADDING * 2;
  const colWidths = deliveryColumnWidths(innerWidth);
  let y = yTop + CARD_PADDING_TOP;

  doc
    .fillColor(BLACK)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(order.userName, innerX, y, { width: innerWidth * 0.62 });
  doc.text(labels.monthYearLabel, innerX, y, {
    width: innerWidth,
    align: "right",
  });
  y += HEADER_LINE_HEIGHT;

  doc
    .font("Helvetica")
    .fontSize(9)
    .text(
      labels.formatOrderSummary(
        orderRowCount(order),
        orderTotalUnits(order),
      ),
      innerX,
      y,
      { width: innerWidth },
    );
  y += SUMMARY_LINE_HEIGHT;

  y = drawTableHeader(
    doc,
    [
      { label: labels.itemColumn, width: colWidths[0]! },
      { label: labels.qtyColumn, width: colWidths[1]!, align: "center" },
      { label: labels.unitColumn, width: colWidths[2]!, align: "center" },
      { label: labels.lineTotalColumn, width: colWidths[3]!, align: "center" },
    ],
    y,
    innerX,
  );
  doc.font("Helvetica").fontSize(9);

  for (const item of order.items) {
    const rowTop = y;
    const cells = [
      { text: item.awardTitle, width: colWidths[0]!, align: "left" as const },
      { text: String(item.qty), width: colWidths[1]!, align: "center" as const },
      {
        text: String(item.unitNumberOf),
        width: colWidths[2]!,
        align: "center" as const,
      },
      {
        text: String(item.lineNumberOf),
        width: colWidths[3]!,
        align: "center" as const,
      },
    ];
    const rowHeight =
      measureRowHeight(doc, cells) + DELIVERY_ROW_VERTICAL_PADDING * 2;
    let columnX = innerX;
    for (const cell of cells) {
      drawCellText(
        doc,
        cell.text,
        columnX,
        rowTop,
        cell.width,
        rowHeight,
        cell.align,
      );
      columnX += cell.width;
    }
    y = rowTop + rowHeight;
    doc
      .strokeColor(BLACK)
      .moveTo(innerX, y)
      .lineTo(innerX + innerWidth, y)
      .stroke();
    y += 2;
  }

  y += DELIVERY_FOOTER_TOP_GAP;
  const footerY = y;
  const signatureWidth = innerWidth * 0.55;
  const dateWidth = innerWidth * 0.4;
  const dateX = innerX + signatureWidth + innerWidth * 0.05;
  const lineY = footerY + 12;

  doc.fontSize(9).text(`${labels.signature}:`, innerX, footerY, {
    width: signatureWidth,
  });
  doc.text(
    `${labels.dateLine}: ${DELIVERY_DATE_PLACEHOLDER}`,
    dateX,
    footerY,
    {
      width: dateWidth,
    },
  );
  doc
    .moveTo(innerX + 42, lineY)
    .lineTo(innerX + signatureWidth, lineY)
    .stroke();
  doc
    .moveTo(dateX, lineY)
    .lineTo(dateX + dateWidth, lineY)
    .stroke();

  const yBottom =
    footerY + DELIVERY_FOOTER_BLOCK_HEIGHT + DELIVERY_CARD_PADDING_BOTTOM;
  doc
    .strokeColor(BLACK)
    .rect(MARGIN, yTop, CONTENT_WIDTH, yBottom - yTop)
    .stroke();

  return yBottom;
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
    return collectPdfBuffer(doc);
  }

  let y = MARGIN;

  for (let index = 0; index < deliveries.length; index++) {
    const order = deliveries[index]!;
    const cardHeight = measureDeliveryCardHeight(doc, order);
    const needsGap = index > 0 && y > MARGIN;
    const requiredHeight = (needsGap ? CARD_GAP : 0) + cardHeight;

    if (y + requiredHeight > PAGE_BOTTOM) {
      doc.addPage();
      y = MARGIN;
    } else if (needsGap) {
      strokeHorizontalRule(doc, y, true);
      y += CARD_GAP;
    }

    y = drawDeliveryCard(doc, order, labels, y);
  }

  return collectPdfBuffer(doc);
}
