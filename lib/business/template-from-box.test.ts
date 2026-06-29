import { describe, expect, it } from "vitest";

import type { BoxTemplateData } from "@/lib/legacy/rbx-types";

import { buildTemplateFromBox } from "./template-from-box";
import { TEMPLATE_SARRAFOS_CUT_NAME } from "./template-subtask-dependencies";

function baseData(overrides: Partial<BoxTemplateData> = {}): BoxTemplateData {
  return {
    prodId: 123,
    empresaNome: "Max Brasil",
    boxName: "Caixa Econômica: Caixotona",
    info: { qPes: 3, empresa: 5, modelo: "caixa_economica" },
    base: { pe: { qFix: 10 }, toco: { qFix: 17 }, tabua: { qFix: 78 } },
    lateral: { fragil: { qtde: 2 }, adExtra: { qtde: 2 } },
    cabeceira: { fragil: { qtde: 2 } },
    tampa: {},
    // [1]=9 pegs/pe, [2]=78 base, [3]=38 lat quadros, [4]=112 lat chapa,
    // [7]=49 cab quadros, [8]=28 cab chapa, [10]=69 tampa quadros, [11]=195 tampa chapa
    montagem: [null, 9, 78, 38, 112, 1, 1, 49, 28, 1, 69, 195, 1, 10, 0, 0, 2],
    ...overrides,
  };
}

describe("buildTemplateFromBox", () => {
  it("builds the template name from company and box name, code from prodId", () => {
    const template = buildTemplateFromBox(baseData());
    expect(template.name).toBe("Max Brasil - Caixa Econômica: Caixotona");
    expect(template.code).toBe("123");
  });

  it("falls back to the box name when the company is empty", () => {
    const template = buildTemplateFromBox(baseData({ empresaNome: "" }));
    expect(template.name).toBe("Caixa Econômica: Caixotona");
  });

  it("generates cut subtasks with duration sharing and fixed 60s", () => {
    const template = buildTemplateFromBox(baseData());
    const cuts = (template.subTask ?? []).filter(
      (s) => s.sharingType === "duration",
    );
    expect(cuts.map((s) => s.name)).toEqual([
      "Corte dos pés da base",
      "Corte das tábuas da base",
      "Corte dos sarrafos da embalagem",
    ]);
    for (const cut of cuts) {
      expect(cut.expectedTime).toBe(60);
      expect(cut.qty).toBe(1);
    }
  });

  it("generates chapa cut subtasks with qty sharing after sarrafos", () => {
    const template = buildTemplateFromBox(baseData());
    const byName = Object.fromEntries(
      (template.subTask ?? []).map((s) => [s.name, s]),
    );

    expect(byName["Corte das chapas das laterais"]).toMatchObject({
      qty: 2,
      sharingType: "qty",
      expectedTime: 60,
      maxSameTimeWorkers: 1,
    });
    expect(byName["Corte das chapas das cabeceiras"]).toMatchObject({
      qty: 2,
      sharingType: "qty",
      expectedTime: 60,
      maxSameTimeWorkers: 1,
    });
    expect(byName["Corte da chapa da tampa"]).toMatchObject({
      qty: 1,
      sharingType: "qty",
      expectedTime: 60,
      maxSameTimeWorkers: 1,
    });

    const names = (template.subTask ?? []).map((s) => s.name);
    const sarrafosIndex = names.indexOf(TEMPLATE_SARRAFOS_CUT_NAME);
    expect(names.slice(sarrafosIndex + 1, sarrafosIndex + 4)).toEqual([
      "Corte das chapas das laterais",
      "Corte das chapas das cabeceiras",
      "Corte da chapa da tampa",
    ]);
  });

  it("maps assembly counts to qty subtasks with 1s per nail/staple", () => {
    const template = buildTemplateFromBox(baseData());
    const byName = Object.fromEntries(
      (template.subTask ?? []).map((s) => [s.name, s]),
    );

    expect(byName["Montagem dos pés"]).toMatchObject({
      qty: 3,
      sharingType: "qty",
      expectedTime: 9,
    });
    expect(byName["Montagem da base"]).toMatchObject({ qty: 1, expectedTime: 78 });
    expect(byName["Montagem dos quadros das laterais"]).toMatchObject({
      qty: 2,
      expectedTime: 38,
    });
    expect(byName["Fixação das chapas das laterais"]).toMatchObject({
      qty: 2,
      expectedTime: 112,
    });
    expect(byName["Montagem dos quadros das cabeceiras"]).toMatchObject({
      qty: 2,
      expectedTime: 49,
    });
    expect(byName["Fixação das chapas das cabeceiras"]).toMatchObject({
      qty: 2,
      expectedTime: 28,
    });
    expect(byName["Montagem dos quadros da tampa"]).toMatchObject({
      qty: 1,
      expectedTime: 69,
    });
    expect(byName["Fixação das chapas da tampa"]).toMatchObject({
      qty: 1,
      expectedTime: 195,
    });
  });

  it("adds adhesive subtasks at 30s each only when present", () => {
    const template = buildTemplateFromBox(baseData());
    const byName = Object.fromEntries(
      (template.subTask ?? []).map((s) => [s.name, s]),
    );

    // lateral: fragil + adExtra => 2 adhesives => 60s, qty 2
    expect(byName["Fixação dos adesivos das laterais"]).toMatchObject({
      qty: 2,
      expectedTime: 60,
    });
    // cabeceira: fragil only => 1 adhesive => 30s, qty 2
    expect(byName["Fixação dos adesivos das cabeceiras"]).toMatchObject({
      qty: 2,
      expectedTime: 30,
    });
    // tampa: none => omitted
    expect(byName["Fixação dos adesivos da tampa"]).toBeUndefined();
  });

  it("assigns sequential indexes and dependency indexes for assembly chains", () => {
    const template = buildTemplateFromBox(baseData());
    const subtasks = template.subTask ?? [];
    const byName = Object.fromEntries(subtasks.map((row) => [row.name, row]));

    subtasks.forEach((subtask, position) => {
      expect(subtask.index).toBe(position);
    });

    expect(byName["Corte dos pés da base"]?.dependencies).toBeNull();
    expect(byName["Montagem dos pés"]?.dependencies).toEqual([
      byName["Corte dos pés da base"]?.index,
    ]);
    expect(byName["Montagem da base"]?.dependencies).toEqual([
      byName["Corte das tábuas da base"]?.index,
      byName["Montagem dos pés"]?.index,
    ]);
    expect(byName["Montagem dos quadros das laterais"]?.dependencies).toEqual([
      byName[TEMPLATE_SARRAFOS_CUT_NAME]?.index,
    ]);
    expect(byName["Fixação das chapas das laterais"]?.dependencies).toEqual([
      byName["Montagem dos quadros das laterais"]?.index,
      byName["Corte das chapas das laterais"]?.index,
    ]);
    expect(byName["Fixação dos adesivos das laterais"]?.dependencies).toEqual([
      byName["Fixação das chapas das laterais"]?.index,
    ]);
  });

  it("sets maxSameTimeWorkers by subtask type", () => {
    const byName = Object.fromEntries(
      (buildTemplateFromBox(baseData()).subTask ?? []).map((s) => [s.name, s]),
    );

    const singleWorker = [
      "Montagem dos pés",
      "Montagem dos quadros das laterais",
      "Montagem dos quadros das cabeceiras",
      "Montagem dos quadros da tampa",
      "Corte das chapas das laterais",
      "Corte das chapas das cabeceiras",
      "Corte da chapa da tampa",
      "Fixação dos adesivos das laterais",
      "Fixação dos adesivos das cabeceiras",
    ];
    for (const name of singleWorker) {
      expect(byName[name]?.maxSameTimeWorkers).toBe(1);
    }

    const dualWorker = [
      "Corte dos pés da base",
      "Corte das tábuas da base",
      "Corte dos sarrafos da embalagem",
      "Montagem da base",
      "Fixação das chapas das laterais",
      "Fixação das chapas das cabeceiras",
      "Fixação das chapas da tampa",
    ];
    for (const name of dualWorker) {
      expect(byName[name]?.maxSameTimeWorkers).toBe(2);
    }
  });

  it("omits assembly subtasks whose count is zero or part is missing", () => {
    const data = baseData({
      base: null,
      montagem: [null, 0, 0, 0, 0, 0, 0, 49, 28, 0, 0, 0, 0, 0, 0, 0, 0],
    });
    const names = (buildTemplateFromBox(data).subTask ?? []).map((s) => s.name);

    expect(names).not.toContain("Corte dos pés da base");
    expect(names).not.toContain("Corte das tábuas da base");
    expect(names).not.toContain("Montagem dos pés");
    expect(names).not.toContain("Montagem da base");
    expect(names).not.toContain("Montagem dos quadros das laterais");
    expect(names).toContain("Montagem dos quadros das cabeceiras");
  });

  it("omits chapa cut subtasks when the corresponding part is missing", () => {
    const template = buildTemplateFromBox(
      baseData({ lateral: null, cabeceira: null, tampa: null }),
    );
    const names = (template.subTask ?? []).map((s) => s.name);

    expect(names).not.toContain("Corte das chapas das laterais");
    expect(names).not.toContain("Corte das chapas das cabeceiras");
    expect(names).not.toContain("Corte da chapa da tampa");
  });

  it("coerces stringified numbers from the legacy payload", () => {
    const data = baseData({
      info: { qPes: "2", modelo: "caixa_economica" },
      montagem: [null, "5", "40", "20", "60", "1", "1", "30", "15", "1", "45", "90"],
    });
    const byName = Object.fromEntries(
      (buildTemplateFromBox(data).subTask ?? []).map((s) => [s.name, s]),
    );
    expect(byName["Montagem dos pés"]).toMatchObject({ qty: 2, expectedTime: 5 });
    expect(byName["Montagem da base"]).toMatchObject({ expectedTime: 40 });
  });
});
