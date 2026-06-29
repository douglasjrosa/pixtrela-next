import type { TemplateSubTaskComponentInput } from "@/lib/schemas/template-task";

export const TEMPLATE_SARRAFOS_CUT_NAME = "Corte dos sarrafos da embalagem";

/** Subtask name -> names of subtasks that must finish first (by index). */
export const TEMPLATE_SUBTASK_DEPENDENCY_RULES: Readonly<
  Record<string, readonly string[]>
> = {
  "Montagem dos pés": ["Corte dos pés da base"],
  "Montagem da base": ["Corte das tábuas da base", "Montagem dos pés"],
  "Montagem dos quadros das laterais": [TEMPLATE_SARRAFOS_CUT_NAME],
  "Montagem dos quadros das cabeceiras": [TEMPLATE_SARRAFOS_CUT_NAME],
  "Montagem dos quadros da tampa": [TEMPLATE_SARRAFOS_CUT_NAME],
  "Fixação das chapas das laterais": [
    "Montagem dos quadros das laterais",
    "Corte das chapas das laterais",
  ],
  "Fixação das chapas das cabeceiras": [
    "Montagem dos quadros das cabeceiras",
    "Corte das chapas das cabeceiras",
  ],
  "Fixação das chapas da tampa": [
    "Montagem dos quadros da tampa",
    "Corte da chapa da tampa",
  ],
  "Fixação dos adesivos das laterais": ["Fixação das chapas das laterais"],
  "Fixação dos adesivos das cabeceiras": ["Fixação das chapas das cabeceiras"],
};

export function resolveTemplateSubTaskDependencyIndexes(
  subtaskName: string,
  indexByName: ReadonlyMap<string, number>,
): number[] {
  const dependencyNames = TEMPLATE_SUBTASK_DEPENDENCY_RULES[subtaskName];
  if (!dependencyNames) return [];

  return dependencyNames
    .map((name) => indexByName.get(name))
    .filter((index): index is number => index !== undefined);
}

export function applyTemplateSubTaskDependencies<
  T extends Pick<TemplateSubTaskComponentInput, "name" | "dependencies">,
>(subtasks: T[]): T[] {
  const indexByName = new Map(subtasks.map((subtask, index) => [subtask.name, index]));

  return subtasks.map((subtask) => {
    const dependencyIndexes = resolveTemplateSubTaskDependencyIndexes(
      subtask.name,
      indexByName,
    );

    return {
      ...subtask,
      dependencies: dependencyIndexes.length > 0 ? dependencyIndexes : null,
    };
  });
}
