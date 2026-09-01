import { describe, expect, it } from "vitest";

import {
  STEP_TASKS_PER_LOAD_DEFAULT,
  STEP_TASKS_PER_LOAD_MAX,
  STEP_TASKS_PER_LOAD_MIN,
  stepFormSchema,
  stepNameFormSchema,
} from "./step";

describe("stepNameFormSchema", () => {
  it("accepts a valid name with default tasksPerLoad", () => {
    expect(stepNameFormSchema.parse({ name: "Fila" })).toEqual({
      name: "Fila",
      orderBy: "manual",
      tasksPerLoad: STEP_TASKS_PER_LOAD_DEFAULT,
    });
  });

  it("accepts orderBy options", () => {
    expect(
      stepNameFormSchema.parse({
        name: "Fila",
        orderBy: "delivery_date_asc",
        tasksPerLoad: 15,
      }),
    ).toEqual({
      name: "Fila",
      orderBy: "delivery_date_asc",
      tasksPerLoad: 15,
    });
  });

  it("rejects empty name", () => {
    expect(stepNameFormSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects tasksPerLoad below minimum", () => {
    expect(
      stepNameFormSchema.safeParse({
        name: "Fila",
        tasksPerLoad: STEP_TASKS_PER_LOAD_MIN - 1,
      }).success,
    ).toBe(false);
  });

  it("rejects tasksPerLoad above maximum", () => {
    expect(
      stepNameFormSchema.safeParse({
        name: "Fila",
        tasksPerLoad: STEP_TASKS_PER_LOAD_MAX + 1,
      }).success,
    ).toBe(false);
  });

  it("accepts tasksPerLoad at min and max bounds", () => {
    expect(
      stepNameFormSchema.parse({
        name: "Fila",
        tasksPerLoad: STEP_TASKS_PER_LOAD_MIN,
      }).tasksPerLoad,
    ).toBe(STEP_TASKS_PER_LOAD_MIN);
    expect(
      stepNameFormSchema.parse({
        name: "Fila",
        tasksPerLoad: STEP_TASKS_PER_LOAD_MAX,
      }).tasksPerLoad,
    ).toBe(STEP_TASKS_PER_LOAD_MAX);
  });
});

describe("stepFormSchema", () => {
  it("accepts valid step with index", () => {
    expect(stepFormSchema.parse({ name: "Fila", index: 0 })).toEqual({
      name: "Fila",
      index: 0,
      orderBy: "manual",
      tasksPerLoad: STEP_TASKS_PER_LOAD_DEFAULT,
    });
  });

  it("rejects empty name", () => {
    expect(stepFormSchema.safeParse({ name: "", index: 0 }).success).toBe(false);
  });
});
