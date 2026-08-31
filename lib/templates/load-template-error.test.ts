import { describe, expect, it } from "vitest";

import { parseLoadTemplateError } from "./load-template-error";

describe("parseLoadTemplateError", () => {
  it("detects missing Ribermax connection", () => {
    expect(parseLoadTemplateError(new Error("ribermaxMisconfigured"))).toEqual({
      code: "misconfigured",
    });
  });

  it("detects invalid box code", () => {
    expect(parseLoadTemplateError(new Error("invalidCode"))).toEqual({
      code: "invalidCode",
    });
  });

  it("detects missing preset names", () => {
    expect(
      parseLoadTemplateError(new Error("presetNotFound:Corte dos pés da base")),
    ).toEqual({
      code: "presetNotFound",
      presetName: "Corte dos pés da base",
    });
  });

  it("falls back to generic errors", () => {
    expect(parseLoadTemplateError(new Error("boom"))).toEqual({
      code: "generic",
    });
  });
});
