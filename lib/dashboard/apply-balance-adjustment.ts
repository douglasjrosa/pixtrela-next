import { revalidatePath } from "next/cache";

import { resolveCurrencyPluralTitle } from "@/lib/domain/currency-display";
import {
  adjustBalanceIncome,
  getOrCreateMonthlyBalance,
} from "@/lib/repos/balances";
import { findCurrencyById } from "@/lib/repos/awards";
import { findUserById } from "@/lib/repos/users";
import {
  balanceAdjustmentSchema,
  type BalanceAdjustmentInput,
} from "@/lib/schemas/balance-adjustment";

const NOON_UTC_SUFFIX = "T12:00:00.000Z";

export type BalanceAdjustmentResult =
  | { ok: true }
  | { ok: false; error: "forbidden" | "invalid" | "notFound" | "failed" };

/**
 * Shared balance-adjustment core used by both the app dashboard action and the
 * kiosk staff action. Callers MUST authorize (session or kiosk staff actor)
 * before invoking this helper.
 */
export async function applyColaboratorBalanceAdjustment(
  raw: BalanceAdjustmentInput,
): Promise<BalanceAdjustmentResult> {
  const data = balanceAdjustmentSchema.parse(raw);

  const user = await findUserById(data.colaboratorDocumentId);
  if (!user || user.role !== "colaborator" || !user.active || user.blocked) {
    return { ok: false, error: "notFound" };
  }

  const currency = await findCurrencyById(data.currencyId);
  if (!currency) {
    return { ok: false, error: "notFound" };
  }

  const balance = await getOrCreateMonthlyBalance({
    userId: data.colaboratorDocumentId,
    currencyPluralTitle: resolveCurrencyPluralTitle(currency),
    now: new Date(`${data.date}${NOON_UTC_SUFFIX}`),
  });

  await adjustBalanceIncome({
    balanceId: balance.id,
    delta: data.amount,
  });

  revalidatePath("/");
  revalidatePath(`/${data.colaboratorDocumentId}`);
  return { ok: true };
}
