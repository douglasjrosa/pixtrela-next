import type { TaskAutomationFormInput } from "@/lib/schemas/task-automation";
import {
  loadTaskAutomationFormValues,
  upsertTaskAutomationSettings,
} from "@/lib/repos/settings";

export async function loadTaskAutomationSetting(): Promise<TaskAutomationFormInput> {
  return loadTaskAutomationFormValues();
}

export function toTaskAutomationSettingPayload(
  values: TaskAutomationFormInput,
): TaskAutomationFormInput {
  return values;
}

export async function saveTaskAutomationSetting(
  values: TaskAutomationFormInput,
): Promise<void> {
  await upsertTaskAutomationSettings(values);
}
