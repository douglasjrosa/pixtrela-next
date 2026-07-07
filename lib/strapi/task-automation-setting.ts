import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { TaskAutomationFormInput } from "@/lib/schemas/task-automation";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

/** Strapi 5 single-type REST path (singular API id, no documentId). */
export const TASK_AUTOMATION_SETTING_API_PATH = "/task-automation-setting";

interface StepEntity {
  documentId: string;
}

interface TaskAutomationSettingEntity {
  waitingStep?: StepEntity | null;
  producingStep?: StepEntity | null;
  pausedStep?: StepEntity | null;
  finishedStep?: StepEntity | null;
}

interface StrapiSingle<T> {
  data: T | null;
}

const EMPTY_AUTOMATION: TaskAutomationFormInput = {
  waitingStepDocumentId: "",
  producingStepDocumentId: "",
  pausedStepDocumentId: "",
  finishedStepDocumentId: "",
};

function readStepDocumentId(step: StepEntity | null | undefined): string {
  return step?.documentId ?? "";
}

export async function loadTaskAutomationSetting(): Promise<TaskAutomationFormInput> {
  try {
    const res = await strapiFetch<StrapiSingle<TaskAutomationSettingEntity>>(
      TASK_AUTOMATION_SETTING_API_PATH,
      {
        strapiCache: {
          tags: [STRAPI_TAGS.taskAutomationSetting],
          revalidate: 60,
        },
      },
      {
        populate: {
          waitingStep: { fields: ["documentId"] },
          producingStep: { fields: ["documentId"] },
          pausedStep: { fields: ["documentId"] },
          finishedStep: { fields: ["documentId"] },
        },
      },
    );

    const setting = res.data;
    if (!setting) return EMPTY_AUTOMATION;

    return {
      waitingStepDocumentId: readStepDocumentId(setting.waitingStep),
      producingStepDocumentId: readStepDocumentId(setting.producingStep),
      pausedStepDocumentId: readStepDocumentId(setting.pausedStep),
      finishedStepDocumentId: readStepDocumentId(setting.finishedStep),
    };
  } catch (error) {
    rethrowIfNavigationError(error);
    return EMPTY_AUTOMATION;
  }
}

export function toTaskAutomationSettingPayload(
  values: TaskAutomationFormInput,
): Record<string, string | null> {
  return {
    waitingStep: values.waitingStepDocumentId || null,
    producingStep: values.producingStepDocumentId || null,
    pausedStep: values.pausedStepDocumentId || null,
    finishedStep: values.finishedStepDocumentId || null,
  };
}
