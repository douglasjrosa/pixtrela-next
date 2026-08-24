import { describe, expect, it } from "vitest";

import {
  TEMPLATE_SARRAFOS_CUT_NAME,
  applyTemplateSubTaskDependencies,
} from "./template-subtask-dependencies";

describe("applyTemplateSubTaskDependencies", () => {
  const subtasks = [
    { name: "Corte dos pés da base", index: 0 },
    { name: "Corte das tábuas da base", index: 1 },
    { name: TEMPLATE_SARRAFOS_CUT_NAME, index: 2 },
    { name: "Corte das chapas das laterais", index: 3 },
    { name: "Corte das chapas das cabeceiras", index: 4 },
    { name: "Corte da chapa da tampa", index: 5 },
    { name: "Montagem dos pés", index: 6 },
    { name: "Montagem da base", index: 7 },
    { name: "Montagem dos quadros das laterais", index: 8 },
    { name: "Fixação das chapas das laterais", index: 9 },
    { name: "Fixação dos adesivos das laterais", index: 10 },
    { name: "Montagem dos quadros das cabeceiras", index: 11 },
    { name: "Fixação das chapas das cabeceiras", index: 12 },
    { name: "Fixação dos adesivos das cabeceiras", index: 13 },
    { name: "Montagem dos quadros da tampa", index: 14 },
    { name: "Fixação das chapas da tampa", index: 15 },
  ];

  it("assigns dependency indexes for assembly and fixation subtasks", () => {
    const withDeps = applyTemplateSubTaskDependencies(subtasks);
    const byName = Object.fromEntries(withDeps.map((row) => [row.name, row]));

    expect(byName["Corte dos pés da base"]?.dependencies).toBeNull();
    expect(byName["Montagem dos pés"]?.dependencies).toEqual([0]);
    expect(byName["Montagem da base"]?.dependencies).toEqual([1, 6]);
    expect(byName["Montagem dos quadros das laterais"]?.dependencies).toEqual([2]);
    expect(byName["Fixação das chapas das laterais"]?.dependencies).toEqual([
      8, 3,
    ]);
    expect(byName["Fixação dos adesivos das laterais"]?.dependencies).toEqual([
      9,
    ]);
    expect(byName["Fixação das chapas da tampa"]?.dependencies).toEqual([
      14, 5,
    ]);
  });

  it("skips missing dependency targets when a subtask was omitted", () => {
    const partial = subtasks.filter(
      (row) => row.name !== "Montagem dos pés",
    );
    const withDeps = applyTemplateSubTaskDependencies(partial);
    const montagemBase = withDeps.find((row) => row.name === "Montagem da base");

    expect(montagemBase?.dependencies).toEqual([1]);
  });
});
