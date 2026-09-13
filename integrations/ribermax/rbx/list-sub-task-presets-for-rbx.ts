import { listSubTaskPresetsRepo } from "@/lib/repos/sub-task-presets";
import type { Db } from "@/lib/db/client";

import type { RbxSubTaskPresetsResponse } from "./rbx-sub-task-preset-contract";

/**
 * Read-only catalog for RBX productivity configuration UI.
 */
export async function listSubTaskPresetsForRbx(
  db?: Db,
): Promise<RbxSubTaskPresetsResponse> {
  const presets = await listSubTaskPresetsRepo(db);
  return {
    presets: presets.map((preset) => ({
      id: preset.documentId,
      name: preset.name,
      sharingType: preset.sharingType,
      actionName: preset.actionName,
      actionUnitTime: preset.actionUnitTime,
      maxSameTimeWorkers: preset.maxSameTimeWorkers,
    })),
  };
}
