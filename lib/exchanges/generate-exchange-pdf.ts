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
const DELIVERY_COLUMN_GAP = 24;
const DELIVERY_HALF_ITEM_RATIO = 0.78;
const DELIVERY_HALF_QTY_RATIO = 0.22;
const DELIVERY_FOOTER_LABEL_GAP = 4;
const DELIVERY_DATE_SLASH_SLOT_WIDTH = 18;
const DELIVERY_DATE_SLASH_FONT_SIZE = 14;
const DELIVERY_DATE_DAY_RATIO = 0.2;
const DELIVERY_DATE_MONTH_RATIO = 0.2;

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
  currencyColumn: string;
  redemptionsColumn: string;
  signature: string;
  dateLine: string;
  formatOrderSummary: (itemCount: number, totalPrizes: number) => string;
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
    item: CONTENT_WIDTH * 0.37,
    qty: CONTENT_WIDTH * 0.42,
    unitValue: CONTENT_WIDTH * 0.21,
  };
}

function drawShoppingUnitValueCell(
  doc: PdfDoc,
  x: number,
  rowTop: number,
  width: number,
  rowHeight: number,
): void {
  drawCellText(doc, BRL_PREFIX, x, rowTop, width, rowHeight, "left");
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
      { text: BRL_PREFIX, width: widths.unitValue },
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

function orderTotalPrizes(order: BatchDeliveryOrder): number {
  return order.items.reduce((sum, item) => sum + item.qty, 0);
}

function deliveryHalfWidths(innerWidth: number): {
  halfWidth: number;
  itemWidth: number;
  qtyWidth: number;
} {
  const halfWidth = (innerWidth - DELIVERY_COLUMN_GAP) / 2;
  return {
    halfWidth,
    itemWidth: halfWidth * DELIVERY_HALF_ITEM_RATIO,
    qtyWidth: halfWidth * DELIVERY_HALF_QTY_RATIO,
  };
}

function deliveryTableRowCount(order: BatchDeliveryOrder): number {
  return Math.max(order.items.length, order.currencyRedemptions.length);
}

function measureDeliveryTableHeight(
  doc: PdfDoc,
  order: BatchDeliveryOrder,
  innerWidth: number,
): number {
  const { itemWidth, qtyWidth } = deliveryHalfWidths(innerWidth);
  const rowCount = deliveryTableRowCount(order);
  let height = TABLE_HEADER_HEIGHT;

  doc.font("Helvetica").fontSize(9);
  for (let index = 0; index < rowCount; index++) {
    const item = order.items[index];
    const redemption = order.currencyRedemptions[index];
    const cells = [
      { text: item?.awardTitle ?? "", width: itemWidth },
      { text: item ? String(item.qty) : "", width: qtyWidth },
      {
        text: redemption?.currencyPluralTitle ?? "",
        width: itemWidth,
      },
      {
        text: redemption ? String(redemption.amount) : "",
        width: qtyWidth,
      },
    ];
    height +=
      measureRowHeight(doc, cells) + DELIVERY_ROW_VERTICAL_PADDING * 2 + 2;
  }

  return height;
}

function measureDeliveryCardHeight(
  doc: PdfDoc,
  order: BatchDeliveryOrder,
): number {
  const innerWidth = CONTENT_WIDTH - CARD_INNER_PADDING * 2;

  let height = CARD_PADDING_TOP + HEADER_LINE_HEIGHT + SUMMARY_LINE_HEIGHT;
  height += measureDeliveryTableHeight(doc, order, innerWidth);
  height +=
    DELIVERY_FOOTER_TOP_GAP +
    DELIVERY_FOOTER_BLOCK_HEIGHT +
    DELIVERY_CARD_PADDING_BOTTOM;
  return height;
}

function drawDeliveryTableRow(
  doc: PdfDoc,
  cells: Array<{
    text: string;
    x: number;
    width: number;
    align: CellTextAlign;
  }>,
  rowTop: number,
  rowHeight: number,
): void {
  for (const cell of cells) {
    drawCellText(
      doc,
      cell.text,
      cell.x,
      rowTop,
      cell.width,
      rowHeight,
      cell.align,
    );
  }
}

function deliveryFooterLineStartX(
  doc: PdfDoc,
  columnX: number,
  label: string,
): number {
  doc.font("Helvetica").fontSize(9);
  return columnX + doc.widthOfString(`${label}:`) + DELIVERY_FOOTER_LABEL_GAP;
}

function drawDeliveryFooterField(
  doc: PdfDoc,
  label: string,
  value: string | null,
  columnX: number,
  columnWidth: number,
  footerY: number,
  lineY: number,
): void {
  doc.font("Helvetica").fontSize(9);
  doc.text(`${label}:`, columnX, footerY, { lineBreak: false });
  const lineStartX = deliveryFooterLineStartX(doc, columnX, label);
  if (value) {
    doc.text(value, lineStartX, footerY, {
      width: columnX + columnWidth - lineStartX,
      lineBreak: false,
    });
  }
  doc
    .strokeColor(BLACK)
    .moveTo(lineStartX, lineY)
    .lineTo(columnX + columnWidth, lineY)
    .stroke();
}

function drawDeliveryDateFooterField(
  doc: PdfDoc,
  label: string,
  columnX: number,
  columnWidth: number,
  footerY: number,
  lineY: number,
): void {
  doc.font("Helvetica").fontSize(9);
  doc.text(`${label}:`, columnX, footerY, { lineBreak: false });

  const valueStartX = deliveryFooterLineStartX(doc, columnX, label);
  const valueEndX = columnX + columnWidth;
  const valueWidth = valueEndX - valueStartX;
  const segmentAreaWidth =
    valueWidth - DELIVERY_DATE_SLASH_SLOT_WIDTH * 2;
  const dayWidth = segmentAreaWidth * DELIVERY_DATE_DAY_RATIO;
  const monthWidth = segmentAreaWidth * DELIVERY_DATE_MONTH_RATIO;

  const dayLineEnd = valueStartX + dayWidth;
  const monthLineStart = dayLineEnd + DELIVERY_DATE_SLASH_SLOT_WIDTH;
  const monthLineEnd = monthLineStart + monthWidth;
  const yearLineStart = monthLineEnd + DELIVERY_DATE_SLASH_SLOT_WIDTH;

  doc
    .strokeColor(BLACK)
    .moveTo(valueStartX, lineY)
    .lineTo(dayLineEnd, lineY)
    .stroke()
    .moveTo(monthLineStart, lineY)
    .lineTo(monthLineEnd, lineY)
    .stroke()
    .moveTo(yearLineStart, lineY)
    .lineTo(valueEndX, lineY)
    .stroke();

  doc.font("Helvetica-Bold").fontSize(DELIVERY_DATE_SLASH_FONT_SIZE);
  const slashY = footerY - 1;
  const slash1X =
    dayLineEnd +
    (DELIVERY_DATE_SLASH_SLOT_WIDTH - doc.widthOfString("/")) / 2;
  const slash2X =
    monthLineEnd +
    (DELIVERY_DATE_SLASH_SLOT_WIDTH - doc.widthOfString("/")) / 2;
  doc.text("/", slash1X, slashY, { lineBreak: false });
  doc.text("/", slash2X, slashY, { lineBreak: false });
}

function drawDeliveryCard(
  doc: PdfDoc,
  order: BatchDeliveryOrder,
  labels: DeliveryPdfLabels,
  yTop: number,
): number {
  const innerX = MARGIN + CARD_INNER_PADDING;
  const innerWidth = CONTENT_WIDTH - CARD_INNER_PADDING * 2;
  const { halfWidth, itemWidth, qtyWidth } = deliveryHalfWidths(innerWidth);
  const leftX = innerX;
  const rightX = innerX + halfWidth + DELIVERY_COLUMN_GAP;
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
        orderTotalPrizes(order),
      ),
      innerX,
      y,
      { width: innerWidth },
    );
  y += SUMMARY_LINE_HEIGHT;

  const tableTop = y;
  const leftHeaderBottom = drawTableHeader(
    doc,
    [
      { label: labels.itemColumn, width: itemWidth },
      { label: labels.qtyColumn, width: qtyWidth, align: "center" },
    ],
    tableTop,
    leftX,
  );
  const rightHeaderBottom = drawTableHeader(
    doc,
    [
      { label: labels.currencyColumn, width: itemWidth },
      { label: labels.redemptionsColumn, width: qtyWidth, align: "center" },
    ],
    tableTop,
    rightX,
  );
  y = Math.max(leftHeaderBottom, rightHeaderBottom);
  doc.font("Helvetica").fontSize(9);

  const rowCount = deliveryTableRowCount(order);
  for (let index = 0; index < rowCount; index++) {
    const item = order.items[index];
    const redemption = order.currencyRedemptions[index];
    const rowTop = y;
    const cells = [
      { text: item?.awardTitle ?? "", width: itemWidth },
      { text: item ? String(item.qty) : "", width: qtyWidth },
      {
        text: redemption?.currencyPluralTitle ?? "",
        width: itemWidth,
      },
      {
        text: redemption ? String(redemption.amount) : "",
        width: qtyWidth,
      },
    ];
    const rowHeight =
      measureRowHeight(doc, cells) + DELIVERY_ROW_VERTICAL_PADDING * 2;

    drawDeliveryTableRow(
      doc,
      [
        {
          text: item?.awardTitle ?? "",
          x: leftX,
          width: itemWidth,
          align: "left",
        },
        {
          text: item ? String(item.qty) : "",
          x: leftX + itemWidth,
          width: qtyWidth,
          align: "center",
        },
        {
          text: redemption?.currencyPluralTitle ?? "",
          x: rightX,
          width: itemWidth,
          align: "left",
        },
        {
          text: redemption ? String(redemption.amount) : "",
          x: rightX + itemWidth,
          width: qtyWidth,
          align: "center",
        },
      ],
      rowTop,
      rowHeight,
    );

    y = rowTop + rowHeight;
    doc
      .strokeColor(BLACK)
      .moveTo(leftX, y)
      .lineTo(leftX + halfWidth, y)
      .stroke();
    if (redemption) {
      doc
        .moveTo(rightX, y)
        .lineTo(rightX + halfWidth, y)
        .stroke();
    }
    y += 2;
  }

  y += DELIVERY_FOOTER_TOP_GAP;
  const footerY = y;
  const lineY = footerY + 12;

  drawDeliveryDateFooterField(
    doc,
    labels.dateLine,
    leftX,
    halfWidth,
    footerY,
    lineY,
  );
  drawDeliveryFooterField(
    doc,
    labels.signature,
    null,
    rightX,
    halfWidth,
    footerY,
    lineY,
  );

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
