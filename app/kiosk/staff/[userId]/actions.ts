"use server";

import { canAdjustColaboratorBalance } from "@/lib/auth/permissions";
import { assertKioskStaffActor } from "@/lib/business/kiosk-staff-access";
import {
  applyColaboratorBalanceAdjustment,
  type BalanceAdjustmentResult,
} from "@/lib/dashboard/apply-balance-adjustment";
import { auditBug } from "@/lib/logs/record-log";
import type { BalanceAdjustmentInput } from "@/lib/schemas/balance-adjustment";

/**
 * Kiosk-aware balance adjustment. The acting staff user id is bound in the
 * page via server-action binding. Requires a kiosk device session, an active
 * leader+ staff actor, and the permission to adjust balances.
 */
export async function adjustKioskColaboratorBalance(
  staffUserId: string,
  raw: BalanceAdjustmentInput,
): Promise<BalanceAdjustmentResult> {
  try {
    const actor = await assertKioskStaffActor(staffUserId);
    if (!canAdjustColaboratorBalance(actor.staffRole)) {
      return { ok: false, error: "forbidden" };
    }
    return await applyColaboratorBalanceAdjustment(raw);
  } catch (error) {
    if (!(error instanceof Error && error.message === "forbidden")) {
      await auditBug({
        route: "/kiosk/staff",
        operation: "adjustKioskColaboratorBalance",
        error,
        ids: { staffUserId },
      });
    }
    if (error instanceof Error && error.message === "forbidden") {
      return { ok: false, error: "forbidden" };
    }
    return { ok: false, error: "invalid" };
  }
}
