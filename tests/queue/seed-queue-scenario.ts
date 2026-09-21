import { formatMaterialFlagCode } from "@/lib/business/material-flag-code";
import { createStep } from "@/lib/repos/steps";
import { createMaterialFlag } from "@/lib/repos/material-flags";
import { createSubTaskCategory } from "@/lib/repos/sub-task-categories";
import {
  assignColaboratorsToSubTask,
  createTask,
  listSubTasksForTask,
} from "@/lib/repos/tasks";
import { createTemplateTask } from "@/lib/repos/templates";
import { createUser } from "@/lib/repos/users";
import type { TemplateSubTaskInput } from "@/lib/repos/templates";

export type QueueSeedSubTaskSpec = TemplateSubTaskInput;

export type QueueSeedWorker = {
  id: string;
  name: string;
};

export type QueueSeedResult = {
  workers: QueueSeedWorker[];
  subTasks: Awaited<ReturnType<typeof listSubTasksForTask>>;
  taskId: string;
  label: string;
};

function uniqueStamp(label: string): string {
  return `${label}-${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

function uniqueRef(stamp: string): string {
  const entropy = `${stamp}${Date.now()}${Math.random()}${Math.random()}`;
  const letters = entropy.replace(/[^a-z0-9]/gi, "").toUpperCase();
  if (letters.length >= 6) {
    return letters.slice(-10);
  }
  return `Q${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

let codeCursor = Date.now() % 80_000_000;

function nextCode(): number {
  codeCursor += 1;
  return codeCursor;
}

export async function seedQueueCategoryWithFlags(
  label: string,
  flagCount: number,
): Promise<{ categoryId: string; flagIds: string[]; flagCodes: string[] }> {
  const stamp = uniqueStamp(label);
  const category = await createSubTaskCategory({
    name: `Queue cat ${stamp}`,
    ref: uniqueRef(stamp),
  });
  const flagIds: string[] = [];
  const flagCodes: string[] = [];
  for (let index = 1; index <= flagCount; index += 1) {
    const flag = await createMaterialFlag({
      subTaskCategoryId: category.id,
      index,
    });
    flagIds.push(flag.id);
    flagCodes.push(formatMaterialFlagCode(category.ref, index));
  }
  return { categoryId: category.id, flagIds, flagCodes };
}

export async function seedQueueScenario(input: {
  label: string;
  workerCount?: number;
  subTasks: QueueSeedSubTaskSpec[];
  taskQty?: number;
}): Promise<QueueSeedResult> {
  const stamp = uniqueStamp(input.label);
  const workerCount = Math.max(1, input.workerCount ?? 1);
  const workers: QueueSeedWorker[] = [];
  for (let index = 0; index < workerCount; index += 1) {
    const worker = await createUser({
      username: `qsuite-${stamp}-${index}`,
      password: "Secret123!",
      name: `Queue Worker ${stamp} ${index}`,
      role: "colaborator",
      code: nextCode(),
    });
    workers.push({ id: worker.id, name: worker.name });
  }

  const templateCode = `QS${stamp.replace(/[^a-z0-9]/gi, "").slice(-8)}`;
  await createTemplateTask({
    code: templateCode,
    name: `Queue suite ${stamp}`,
    subTasks: input.subTasks,
  });

  const step = await createStep({
    name: `Queue step ${stamp}`,
    index: 0,
  });
  const task = await createTask({
    name: `Queue task ${stamp}`,
    qty: input.taskQty ?? 1,
    stepId: step.id,
    templateTaskCode: templateCode,
  });

  const subTasks = await listSubTasksForTask(task.id);
  const workerIds = workers.map((worker) => worker.id);
  for (const sub of subTasks) {
    await assignColaboratorsToSubTask(sub.id, workerIds);
  }

  return { workers, subTasks, taskId: task.id, label: stamp };
}
