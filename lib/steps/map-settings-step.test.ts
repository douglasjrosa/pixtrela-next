import { describe, expect, it } from "vitest";

import { mapStepRecordToSettingsRow } from "./map-settings-step";

describe("mapStepRecordToSettingsRow", () => {
  it("maps repo fields onto the settings list row", () => {
    expect(
      mapStepRecordToSettingsRow({
        id: "s1",
        name: "Fila",
        index: 2,
        taskOrderBy: "created_at_desc",
      }),
    ).toEqual({
      documentId: "s1",
      name: "Fila",
      index: 2,
      orderBy: "created_at_desc",
    });
  });
});
