import { describe, expect, it } from "vitest";

import {
  areAllSelectedTemplatesArchived,
  areAllTemplatesSelected,
  selectedTemplatesFromList,
  toggleIdInSet,
  toggleSelectAllTemplates,
} from "./template-list-selection";
import type { TemplateListRow } from "@/components/templates/types";

const templates: TemplateListRow[] = [
  {
    documentId: "a",
    name: "A",
    code: "1",
    subTaskCount: 0,
    active: true,
  },
  {
    documentId: "b",
    name: "B",
    code: "2",
    subTaskCount: 0,
    active: false,
  },
];

describe("template-list-selection", () => {
  it("toggles ids in the selection set", () => {
    expect(toggleIdInSet(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleIdInSet(["a", "b"], "a")).toEqual(["b"]);
  });

  it("selects and clears all visible templates", () => {
    expect(areAllTemplatesSelected(templates, ["a", "b"])).toBe(true);
    expect(toggleSelectAllTemplates(templates, [])).toEqual(["a", "b"]);
    expect(toggleSelectAllTemplates(templates, ["a", "b"])).toEqual([]);
  });

  it("detects when every selected template is archived", () => {
    expect(
      areAllSelectedTemplatesArchived(
        selectedTemplatesFromList(templates, ["b"]),
      ),
    ).toBe(true);
    expect(
      areAllSelectedTemplatesArchived(
        selectedTemplatesFromList(templates, ["a", "b"]),
      ),
    ).toBe(false);
  });
});
