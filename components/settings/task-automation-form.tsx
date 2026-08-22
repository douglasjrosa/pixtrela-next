import { getTranslations } from "next-intl/server";

import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MAX_ASSIGN_WARN_MAX,
  MIN_ASSIGN_WARN_MAX,
} from "@/lib/business/assign-warn-max";
import {
  TASK_AUTOMATION_STATUS_FIELDS,
  type TaskAutomationFormInput,
} from "@/lib/schemas/task-automation";
import { NATIVE_SELECT_CLASS_NAME } from "@/lib/ui/native-select";

export interface StepOption {
  documentId: string;
  name: string;
}

export interface TaskAutomationFormProps {
  steps: StepOption[];
  defaultValues: TaskAutomationFormInput;
  action: (formData: FormData) => void | Promise<void>;
}

export async function TaskAutomationForm({
  steps,
  defaultValues,
  action,
}: TaskAutomationFormProps) {
  const tCommon = await getTranslations("common");
  const tSettings = await getTranslations("settings");
  const tStatus = await getTranslations("tasks.status");

  const formKey = [
    ...TASK_AUTOMATION_STATUS_FIELDS.map(({ field }) => defaultValues[field]),
    defaultValues.assignWarnMax,
  ].join(":");

  return (
    <form key={formKey} action={action} className="max-w-sm space-y-6">
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            {tSettings("automationsHeading")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {tSettings("automationsDescription")}
          </p>
        </div>

        {TASK_AUTOMATION_STATUS_FIELDS.map(({ status, field }) => (
          <div className="flex items-center gap-3" key={status}>
            <Label htmlFor={`automation-${status}`} className="shrink-0">
              {tSettings.rich("statusGoesTo", {
                status: tStatus(status),
                bold: (chunks) => <b>{chunks}</b>,
              })}
            </Label>
            <select
              id={`automation-${status}`}
              name={field}
              key={`${field}-${defaultValues[field]}`}
              defaultValue={defaultValues[field]}
              className={`${NATIVE_SELECT_CLASS_NAME} flex-1`}
            >
              <option value="">{tSettings("automationNoStep")}</option>
              {steps.map((step) => (
                <option key={step.documentId} value={step.documentId}>
                  {step.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            {tSettings("assignWarnHeading")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {tSettings("assignWarnDescription")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Label htmlFor="assignWarnMax" className="shrink-0">
            {tSettings("assignWarnMax")}
          </Label>
          <Input
            id="assignWarnMax"
            name="assignWarnMax"
            type="number"
            className="flex-1"
            min={MIN_ASSIGN_WARN_MAX}
            max={MAX_ASSIGN_WARN_MAX}
            step={1}
            key={`assignWarnMax-${defaultValues.assignWarnMax}`}
            defaultValue={defaultValues.assignWarnMax}
            required
          />
        </div>
      </div>

      <FormSubmitButton label={tCommon("save")} />
    </form>
  );
}
