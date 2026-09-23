"use server";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canAdjustColaboratorBalance } from "@/lib/auth/permissions";
import {
  applyColaboratorBalanceAdjustment,
  type BalanceAdjustmentResult,
} from "@/lib/dashboard/apply-balance-adjustment";
import { auditBug, auditSuccess } from "@/lib/logs/record-log";
import {
  balanceAdjustmentSchema,
  type BalanceAdjustmentInput,
} from "@/lib/schemas/balance-adjustment";

async function assertCanAdjust(): Promise<void> {
  const session = await auth();
  if (!canAdjustColaboratorBalance(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

export async function adjustColaboratorBalance(
  raw: BalanceAdjustmentInput,
): Promise<BalanceAdjustmentResult> {
  try {
    await assertCanAdjust();
    const result = await applyColaboratorBalanceAdjustment(raw);
    if (result.ok) {
      const parsed = balanceAdjustmentSchema.safeParse(raw);
      await auditSuccess({
        route: "/",
        verb: "balance",
        entity: "balance",
        code: parsed.success ? parsed.data.colaboratorDocumentId : null,
        amount: parsed.success ? parsed.data.amount : null,
      });
    }
    return result;
  } catch (error) {
    if (!(error instanceof Error && error.message === "forbidden")) {
      await auditBug({
        route: "/",
        operation: "adjustColaboratorBalance",
        error,
      });
    }
    if (error instanceof Error && error.message === "forbidden") {
      return { ok: false, error: "forbidden" };
    }
    return { ok: false, error: "invalid" };
  }
}
