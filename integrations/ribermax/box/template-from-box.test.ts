import { describe, expect, it } from "vitest";

import { sampleSubTaskPreset } from "@/test/sample-subtask-preset";
import type { BoxTemplateData } from "@/integrations/ribermax/rbx/rbx-types";
import type { SubTaskPreset } from "@/lib/business/subtask-preset";

import {
  buildTemplateFromBox,
  PRESET_NOT_FOUND_PREFIX,
} from "./template-from-box";
import { TEMPLATE_SARRAFOS_CUT_NAME } from "./template-subtask-dependencies";

const assembleLaterals = sampleSubTaskPreset({
  documentId: "p-lat",
  name: "Montagem dos quadros das laterais",
  sharingType: "qty",
  maxSameTimeWorkers: 2,
  actionUnitTime: 1.04,
  actionQtyQuestion: "Quantos grampos?",
});

const cutSarrafos = sampleSubTaskPreset({
  documentId: "p-cut",
  name: TEMPLATE_SARRAFOS_CUT_NAME,
  sharingType: "duration",
  maxSameTimeWorkers: 1,
  actionUnitTime: 1.66,
});

const presetsByName = new Map<string, SubTaskPreset>([
  [assembleLaterals.name, assembleLaterals],
  [cutSarrafos.name, cutSarrafos],
]);

function baseData(overrides: Partial<BoxTemplateData> = {}): BoxTemplateData {
  return {
    prodId: 123,
    empresaNome: "Max Brasil",
    boxName: "Caixotona",
    subtasks: [
      {
        presetName: TEMPLATE_SARRAFOS_CUT_NAME,
        qty: 1,
        actionUnits: 10,
      },
      {
        presetName: "Montagem dos quadros das laterais",
        qty: 2,
        actionUnits: 30,
      },
    ],
    ...overrides,
  };
}

describe("buildTemplateFromBox", () => {
  it("builds the template name from company and box name, code from prodId", () => {
    const template = buildTemplateFromBox(baseData(), presetsByName);
    expect(template.name).toBe("Max Brasil - Caixotona");
    expect(template.code).toBe("123");
  });

  it("falls back to the box name when the company is empty", () => {
    const template = buildTemplateFromBox(
      baseData({ empresaNome: "" }),
      presetsByName,
    );
    expect(template.name).toBe("Caixotona");
  });

  it("copies preset fields and rounds unit_time * actionUnits per piece", () => {
    const template = buildTemplateFromBox(baseData(), presetsByName);
    const byName = Object.fromEntries(
      (template.subTask ?? []).map((row) => [row.name, row]),
    );

    expect(byName[TEMPLATE_SARRAFOS_CUT_NAME]).toMatchObject({
      qty: 1,
      sharingType: "duration",
      maxSameTimeWorkers: 1,
      expectedTime: 17,
    });
    expect(byName["Montagem dos quadros das laterais"]).toMatchObject({
      qty: 2,
      sharingType: "qty",
      maxSameTimeWorkers: 2,
      expectedTime: 31,
    });
  });

  it("applies named dependency rules when the preset name is known", () => {
    const template = buildTemplateFromBox(baseData(), presetsByName);
    const laterals = (template.subTask ?? []).find(
      (row) => row.name === "Montagem dos quadros das laterais",
    );
    expect(laterals?.dependencies).toEqual([0]);
  });

  it("fails when a preset name is missing", () => {
    expect(() =>
      buildTemplateFromBox(
        baseData({
          subtasks: [
            { presetName: "Unknown preset", qty: 1, actionUnits: 1 },
          ],
        }),
        presetsByName,
      ),
    ).toThrow(`${PRESET_NOT_FOUND_PREFIX}Unknown preset`);
  });
});
