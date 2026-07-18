import { auth } from "@/auth";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { SubTaskPresetManager } from "@/components/subtask-presets/subtask-preset-manager";
import type { Role } from "@/lib/auth/nav";
import { canManageTemplates } from "@/lib/auth/permissions";
import { listSubTaskPresets } from "@/app/(app)/sub-task-presets/actions";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";

export default async function TemplateSubtasksPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canManageTemplates(role)) {
    return <ForbiddenMessage />;
  }

  let presets = [];
  try {
    presets = await listSubTaskPresets();
  } catch (error) {
    rethrowIfNavigationError(error);
    presets = [];
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <SubTaskPresetManager presets={presets} />
    </div>
  );
}
