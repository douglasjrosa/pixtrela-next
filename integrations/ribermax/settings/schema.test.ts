import { describe, expect, it } from "vitest";

import {
  DEFAULT_BOX_TEMPLATE_RATES,
  ribermaxBoxTemplateRatesSchema,
} from "./schema";

describe("ribermaxBoxTemplateRatesSchema", () => {
  it("accepts the historic defaults", () => {
    expect(ribermaxBoxTemplateRatesSchema.parse(DEFAULT_BOX_TEMPLATE_RATES)).toEqual(
      {
        cutSeconds: 60,
        adhesiveSeconds: 30,
        fastenerSeconds: 1,
      },
    );
  });

  it("rejects zero and oversized rates", () => {
    expect(() =>
      ribermaxBoxTemplateRatesSchema.parse({
        ...DEFAULT_BOX_TEMPLATE_RATES,
        cutSeconds: 0,
      }),
    ).toThrow();
    expect(() =>
      ribermaxBoxTemplateRatesSchema.parse({
        ...DEFAULT_BOX_TEMPLATE_RATES,
        adhesiveSeconds: 3601,
      }),
    ).toThrow();
  });
});
