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
  currencyColumn: "Conquered units",
  redemptionsColumn: "Redemptions",
  signature: "Signature",
  dateLine: "Date",
  formatOrderSummary: (itemCount: number, totalPrizes: number) =>
    `${itemCount} items, ${totalPrizes} prizes in total`,
};

function countPdfPages(buffer: Buffer): number {
  const text = buffer.toString("latin1");
  return (text.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
}

function buildDeliveryOrder(
  id: string,
  itemCount: number,
): Parameters<typeof generateDeliverySheetsPdf>[0][number] {
  const items = Array.from({ length: itemCount }, (_, index) => ({
    awardTitle: `Award ${index + 1}`,
    qty: 1,
    unitNumberOf: 10,
    lineNumberOf: 10,
    currencyPluralTitle: "Stars",
  }));
  return {
    orderId: id,
    userId: `u-${id}`,
    userName: `Collaborator ${id}`,
    currencyPluralTitle: "Stars",
    totalNumberOf: itemCount * 10,
    itemCount,
    currencyRedemptions: [
      {
        currencyPluralTitle: "Stars",
        amount: itemCount * 10,
      },
    ],
    items,
  };
}

describe("generateShoppingListPdf", () => {
  it("returns a valid PDF buffer", async () => {
    const buffer = await generateShoppingListPdf(
      [{ awardId: "a1", awardTitle: "Award A", qty: 2, actualPrice: 12.5 }],
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
      [
        buildDeliveryOrder("o1", 1),
        buildDeliveryOrder("o2", 1),
        buildDeliveryOrder("o3", 1),
      ],
      deliveryLabels,
    );

    expect(countPdfPages(buffer)).toBe(1);
  });

  it("summarizes item rows and prize qty sum", async () => {
    let summary: [number, number] | null = null;
    const labels = {
      ...deliveryLabels,
      formatOrderSummary: (itemCount: number, totalPrizes: number) => {
        summary = [itemCount, totalPrizes];
        return `${itemCount} items, ${totalPrizes} prizes in total`;
      },
    };

    await generateDeliverySheetsPdf(
      [
        {
          orderId: "o1",
          userId: "u1",
          userName: "Cart Colab",
          currencyPluralTitle: "Stars",
          totalNumberOf: 14,
          itemCount: 2,
          currencyRedemptions: [
            { currencyPluralTitle: "Stars", amount: 8 },
            { currencyPluralTitle: "Hearts", amount: 6 },
          ],
          items: [
            {
              awardTitle: "Award A",
              qty: 2,
              unitNumberOf: 4,
              lineNumberOf: 8,
              currencyPluralTitle: "Stars",
            },
            {
              awardTitle: "Award B",
              qty: 1,
              unitNumberOf: 6,
              lineNumberOf: 6,
              currencyPluralTitle: "Hearts",
            },
          ],
        },
      ],
      labels,
    );

    expect(summary).toEqual([2, 3]);
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
