import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { APP_PDF_LOGO_PNG } from "@/lib/assets/branding";
import {
  generateDeliverySheetsPdf,
  generateShoppingListPdf,
} from "./generate-exchange-pdf";

const shoppingLabels = {
  title: "Shopping list",
  monthYearLabel: "August 2026",
  logoPath: join(process.cwd(), "public", APP_PDF_LOGO_PNG.replace(/^\//, "")),
  itemColumn: "Item",
  qtyColumn: "Qty",
  unitValueColumn: "Unit value",
};

const deliveryLabels = {
  monthYearLabel: "August 2026",
  itemColumn: "Exchange list",
  qtyColumn: "Qty",
  unitColumn: "Unit",
  lineTotalColumn: "Subtotal",
  signature: "Signature",
  dateLine: "Date",
  formatOrderSummary: (itemCount: number, totalQty: number) =>
    `${itemCount} items, ${totalQty} units in total`,
};

function countPdfPages(buffer: Buffer): number {
  const text = buffer.toString("latin1");
  return (text.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
}

function buildDeliveryOrder(
  id: string,
  itemCount: number,
): Parameters<typeof generateDeliverySheetsPdf>[0][number] {
  return {
    orderId: id,
    userId: `u-${id}`,
    userName: `Collaborator ${id}`,
    currencyPluralTitle: "Stars",
    totalNumberOf: itemCount * 10,
    itemCount,
    items: Array.from({ length: itemCount }, (_, index) => ({
      awardTitle: `Award ${index + 1}`,
      qty: 1,
      unitNumberOf: 10,
      lineNumberOf: 10,
    })),
  };
}

describe("generateShoppingListPdf", () => {
  it("returns a valid PDF buffer", async () => {
    const buffer = await generateShoppingListPdf(
      [{ awardId: "a1", awardTitle: "Award A", qty: 2 }],
      shoppingLabels,
    );

    expect(buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(500);
  });
});

describe("generateDeliverySheetsPdf", () => {
  it("returns a valid PDF buffer", async () => {
    const buffer = await generateDeliverySheetsPdf(
      [buildDeliveryOrder("o1", 1)],
      deliveryLabels,
    );

    expect(buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(500);
  });

  it("packs multiple compact lists on one page", async () => {
    const buffer = await generateDeliverySheetsPdf(
      [buildDeliveryOrder("o1", 1), buildDeliveryOrder("o2", 1), buildDeliveryOrder("o3", 1)],
      deliveryLabels,
    );

    expect(countPdfPages(buffer)).toBe(1);
  });

  it("starts a list on the next page when it would break across pages", async () => {
    const buffer = await generateDeliverySheetsPdf(
      [
        buildDeliveryOrder("o1", 40),
        buildDeliveryOrder("o2", 1),
        buildDeliveryOrder("o3", 1),
      ],
      deliveryLabels,
    );

    expect(countPdfPages(buffer)).toBeGreaterThan(1);
  });
});
