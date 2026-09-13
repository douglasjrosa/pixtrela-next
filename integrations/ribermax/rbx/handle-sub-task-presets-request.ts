import type { RbxApiAuthResult } from "./rbx-api-auth";
import { verifyRbxApiToken } from "./rbx-api-auth";
import { listSubTaskPresetsForRbx } from "./list-sub-task-presets-for-rbx";
import type { RbxSubTaskPresetsResponse } from "./rbx-sub-task-preset-contract";

export type SubTaskPresetsRequestResult =
  | { status: 200; body: RbxSubTaskPresetsResponse }
  | { status: 401 | 500; body: { error: string } };

export async function processSubTaskPresetsRequest(
  request: Request,
  auth?: RbxApiAuthResult,
): Promise<SubTaskPresetsRequestResult> {
  const authResult = auth ?? (await verifyRbxApiToken(request));
  if (!authResult.ok) {
    return { status: authResult.status, body: { error: authResult.error } };
  }

  const body = await listSubTaskPresetsForRbx();
  return { status: 200, body };
}
