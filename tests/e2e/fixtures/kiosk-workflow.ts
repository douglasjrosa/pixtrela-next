import { createStep } from "@/lib/repos/steps";
import { assignColaboratorsToSubTask, createTask, listSubTasksForTask } from "@/lib/repos/tasks";
import { createTeam } from "@/lib/repos/teams";
import { createTemplateTask } from "@/lib/repos/templates";
import { createUser } from "@/lib/repos/users";

export type KioskWorkflowFixture = {
  colaboratorId: string;
  colaboratorCode: number;
  colaboratorPassword: string;
  subTaskName: string;
};

/** Seeds a colaborator with one assigned duration sub-task for kiosk E2E. */
export async function seedKioskWorkflowFixture(
  label: string,
): Promise<KioskWorkflowFixture> {
  const suffix = `${label}-${Date.now()}`;
  const colaboratorCode = Number(String(Date.now()).slice(-5));
  const colaboratorPassword = "Secret123!";

  const colaborator = await createUser({
    username: `kiosk-e2e-${suffix}`,
    password: colaboratorPassword,
    name: `Kiosk E2E ${label}`,
    role: "colaborator",
    code: colaboratorCode,
  });

  const templateCode = `KE${String(Date.now()).slice(-7)}`;
  await createTemplateTask({
    code: templateCode,
    name: `Kiosk E2E ${label}`,
    subTasks: [{ name: `Step ${label}`, expectedTime: 10, index: 0 }],
  });

  const step = await createStep({ name: `Kiosk E2E ${label}`, index: 0 });
  const task = await createTask({
    name: `Kiosk E2E task ${label}`,
    qty: 1,
    stepId: step.id,
    templateTaskCode: templateCode,
  });

  const [subTask] = await listSubTasksForTask(task.id);
  if (!subTask) {
    throw new Error("kiosk E2E fixture: missing sub-task");
  }

  await assignColaboratorsToSubTask(subTask.id, [colaborator.id]);

  return {
    colaboratorId: colaborator.id,
    colaboratorCode,
    colaboratorPassword,
    subTaskName: subTask.name,
  };
}

export type KioskChainFixture = KioskWorkflowFixture & {
  memberNames: string[];
};

/** Seeds a 3-member duration chain assigned to one colaborator. */
export async function seedKioskChainFixture(
  label: string,
): Promise<KioskChainFixture> {
  const suffix = `${label}-${Date.now()}`;
  const colaboratorCode = Number(String(Date.now()).slice(-5));
  const colaboratorPassword = "Secret123!";

  const colaborator = await createUser({
    username: `kiosk-chain-${suffix}`,
    password: colaboratorPassword,
    name: `Kiosk Chain ${label}`,
    role: "colaborator",
    code: colaboratorCode,
  });

  const templateCode = `KC${String(Date.now()).slice(-7)}`;
  const memberNames = [
    `Chain A ${label}`,
    `Chain B ${label}`,
    `Chain C ${label}`,
  ];
  await createTemplateTask({
    code: templateCode,
    name: `Kiosk Chain ${label}`,
    subTasks: [
      { name: memberNames[0], expectedTime: 3600, index: 0 },
      {
        name: memberNames[1],
        expectedTime: 3600,
        index: 1,
        linkedToPrevious: true,
      },
      {
        name: memberNames[2],
        expectedTime: 3600,
        index: 2,
        linkedToPrevious: true,
      },
    ],
  });

  const step = await createStep({ name: `Kiosk Chain ${label}`, index: 0 });
  const task = await createTask({
    name: `Kiosk Chain task ${label}`,
    qty: 1,
    stepId: step.id,
    templateTaskCode: templateCode,
  });

  const subs = await listSubTasksForTask(task.id);
  if (subs.length < 3) {
    throw new Error("kiosk E2E chain fixture: missing sub-tasks");
  }
  for (const sub of subs) {
    await assignColaboratorsToSubTask(sub.id, [colaborator.id]);
  }

  return {
    colaboratorId: colaborator.id,
    colaboratorCode,
    colaboratorPassword,
    subTaskName: memberNames[0]!,
    memberNames,
  };
}

export type KioskStaffFixture = {
  leaderId: string;
  leaderCode: number;
  leaderPassword: string;
  leaderName: string;
  colaboratorId: string;
  colaboratorName: string;
  teamName: string;
  subTaskName: string;
};

/** Seeds a leader with one team member and an assigned sub-task for staff E2E. */
export async function seedKioskStaffFixture(
  label: string,
): Promise<KioskStaffFixture> {
  const suffix = `${label}-${Date.now()}`;
  const leaderCode = Number(String(Date.now()).slice(-5));
  const colaboratorCode = Number(String(Date.now()).slice(-4) + "1");
  const password = "Secret123!";
  const teamName = `Staff Team ${label}`;
  const leaderName = `Staff Leader ${label}`;
  const colaboratorName = `Staff Colab ${label}`;

  const leader = await createUser({
    username: `kiosk-staff-lead-${suffix}`,
    password,
    name: leaderName,
    role: "leader",
    code: leaderCode,
  });
  const colaborator = await createUser({
    username: `kiosk-staff-colab-${suffix}`,
    password,
    name: colaboratorName,
    role: "colaborator",
    code: colaboratorCode,
  });

  await createTeam({
    name: teamName,
    leaderId: leader.id,
    memberIds: [colaborator.id],
    exchangesFirstDay: 1,
    exchangesLastDay: 28,
  });

  const templateCode = `KS${String(Date.now()).slice(-7)}`;
  await createTemplateTask({
    code: templateCode,
    name: `Kiosk Staff ${label}`,
    subTasks: [{ name: `Staff Step ${label}`, expectedTime: 10, index: 0 }],
  });

  const step = await createStep({ name: `Kiosk Staff ${label}`, index: 0 });
  const task = await createTask({
    name: `Kiosk Staff task ${label}`,
    qty: 1,
    stepId: step.id,
    templateTaskCode: templateCode,
  });

  const [subTask] = await listSubTasksForTask(task.id);
  if (!subTask) {
    throw new Error("kiosk staff E2E fixture: missing sub-task");
  }
  await assignColaboratorsToSubTask(subTask.id, [colaborator.id]);

  return {
    leaderId: leader.id,
    leaderCode,
    leaderPassword: password,
    leaderName,
    colaboratorId: colaborator.id,
    colaboratorName,
    teamName,
    subTaskName: subTask.name,
  };
}
