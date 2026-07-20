import { auth } from "@/auth";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { APP_LIST_PAGE_STACK_CLASS } from "@/components/layout/app-page-layout";
import { SubTaskPresetManager } from "@/components/subtask-presets/subtask-preset-manager";
import type { Role } from "@/lib/auth/nav";
import { canManageTemplates } from "@/lib/auth/permissions";
import { listSubTaskPresets } from "@/app/(app)/sub-task-presets/actions";
import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";

export default async function TemplateSubtasksPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canManageTemplates(role)) {
    return <ForbiddenMessage />;
  }

  let presets: SubTaskPreset[] = [];
  try {
    presets = await listSubTaskPresets();
  } catch (error) {
    rethrowIfNavigationError(error);
    presets = [];
  }

  return (
    <div className={APP_LIST_PAGE_STACK_CLASS}>
      <SubTaskPresetManager presets={presets} />
    </div>
  );
}
