import { describe, expect, it } from "vitest";

import { SUB_TASK_NAME_REQUIRED_KEY } from "@/lib/schemas/sub-task";

import { translateSubTaskNameError } from "./subtask-name-error";

describe("translateSubTaskNameError", () => {
  it("returns undefined when there is no error", () => {
    expect(translateSubTaskNameError(undefined, () => "Informe o nome.")).toBe(
      undefined,
    );
  });

  it("maps the schema key to the translated label", () => {
    expect(
      translateSubTaskNameError(SUB_TASK_NAME_REQUIRED_KEY, (key) => key),
    ).toBe(SUB_TASK_NAME_REQUIRED_KEY);
  });

  it("maps leftover English Zod too_small text to the i18n key", () => {
    expect(
      translateSubTaskNameError(
        "Too small: expected string to have >=1 characters",
        (key) => key,
      ),
    ).toBe(SUB_TASK_NAME_REQUIRED_KEY);
  });
});
