import { describe, expect, it } from "vitest";

import { buildTemplateVersionSupersededReason } from "./template-version-superseded-reason";

describe("buildTemplateVersionSupersededReason", () => {
  it("includes the new template code in the archive reason", () => {
    expect(buildTemplateVersionSupersededReason("16378")).toBe(
      "Modelo arquivado devido a atualização de versão. " +
        "Substituído pelo Modelo de código 16378.",
    );
  });
});
