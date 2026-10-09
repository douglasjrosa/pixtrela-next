import { SUB_TASK_NAME_REQUIRED_KEY } from "@/lib/schemas/sub-task";

type TranslateNameRequired = (key: typeof SUB_TASK_NAME_REQUIRED_KEY) => string;

export function translateSubTaskNameError(
  message: string | undefined,
  translate: TranslateNameRequired,
): string | undefined {
  if (!message) return undefined;
  return translate(SUB_TASK_NAME_REQUIRED_KEY);
}
