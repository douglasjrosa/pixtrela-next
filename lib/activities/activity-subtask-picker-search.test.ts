import { describe, expect, it } from "vitest";

import {
  ACTIVITY_SUBTASK_PICKER_MIN_QUERY_LENGTH,
  isActivitySubtaskPickerSearchReady,
} from "./activity-subtask-picker-search";

describe("isActivitySubtaskPickerSearchReady", () => {
  it("requires at least min query length after trim", () => {
    expect(ACTIVITY_SUBTASK_PICKER_MIN_QUERY_LENGTH).toBe(3);
    expect(isActivitySubtaskPickerSearchReady("")).toBe(false);
    expect(isActivitySubtaskPickerSearchReady("  ab")).toBe(false);
    expect(isActivitySubtaskPickerSearchReady("abc")).toBe(true);
    expect(isActivitySubtaskPickerSearchReady("  alf ")).toBe(true);
  });
});
