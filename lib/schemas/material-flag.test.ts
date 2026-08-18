import { describe, expect, it } from "vitest";

import {
  MAX_MATERIAL_FLAGS_PER_BATCH,
  materialFlagBulkCreateSchema,
} from "./material-flag";

describe("materialFlagBulkCreateSchema", () => {
  const categoryId = "11111111-1111-4111-8111-111111111111";

  it("accepts a single-index range", () => {
    expect(
      materialFlagBulkCreateSchema.parse({
        subTaskCategoryId: categoryId,
        indexFrom: 3,
        indexTo: 3,
      }),
    ).toEqual({
      subTaskCategoryId: categoryId,
      indexFrom: 3,
      indexTo: 3,
    });
  });

  it("accepts an inclusive multi-index range", () => {
    expect(
      materialFlagBulkCreateSchema.parse({
        subTaskCategoryId: categoryId,
        indexFrom: 3,
        indexTo: 10,
      }),
    ).toEqual({
      subTaskCategoryId: categoryId,
      indexFrom: 3,
      indexTo: 10,
    });
  });

  it("rejects when indexTo is lower than indexFrom", () => {
    expect(() =>
      materialFlagBulkCreateSchema.parse({
        subTaskCategoryId: categoryId,
        indexFrom: 10,
        indexTo: 3,
      }),
    ).toThrow();
  });

  it("rejects batches larger than the configured limit", () => {
    expect(() =>
      materialFlagBulkCreateSchema.parse({
        subTaskCategoryId: categoryId,
        indexFrom: 1,
        indexTo: MAX_MATERIAL_FLAGS_PER_BATCH + 1,
      }),
    ).toThrow();
  });
});
