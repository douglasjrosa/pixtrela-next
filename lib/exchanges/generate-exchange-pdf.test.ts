import { describe, expect, it } from "vitest";

import {
  generateDeliverySheetsPdf,
  generateShoppingListPdf,
} from "./generate-exchange-pdf";

describe("generateShoppingListPdf", () => {
  it("returns a valid PDF buffer", async () => {
    const buffer = await generateShoppingListPdf(
      [{ awardId: "a1", awardTitle: "Award A", qty: 2 }],
      {
        title: "Shopping list",
        itemColumn: "Item",
        qtyColumn: "Qty",
      },
    );

    expect(buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(500);
  });
});

describe("generateDeliverySheetsPdf", () => {
  it("returns a valid PDF buffer", async () => {
    const buffer = await generateDeliverySheetsPdf(
      [
        {
          orderId: "o1",
          userId: "u1",
          userName: "Cart Colab",
          currencyPluralTitle: "Stars",
          totalNumberOf: 10,
          itemCount: 1,
          items: [
            {
              awardTitle: "Award A",
              qty: 1,
              unitNumberOf: 10,
              lineNumberOf: 10,
            },
          ],
        },
      ],
      {
        sectionTitle: "Deliveries",
        itemColumn: "Exchange list",
        qtyColumn: "Qty",
        unitColumn: "Unit",
        lineTotalColumn: "Subtotal",
        signature: "Signature",
        dateLine: "Date",
        formatItemCount: (count) => `${count} items`,
      },
    );

    expect(buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(500);
  });
});
