"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canAdjustColaboratorBalance } from "@/lib/auth/permissions";
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

export type BalanceAdjustmentResult =
  | { ok: true }
  | { ok: false; error: "forbidden" | "invalid" | "notFound" | "failed" };

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
      now: new Date(`${data.date}T12:00:00.000Z`),
    });

    await adjustBalanceIncome({
      balanceId: balance.id,
      delta: data.amount,
    });

    revalidatePath("/");
    revalidatePath(`/${data.colaboratorDocumentId}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return { ok: false, error: "forbidden" };
    }
    return { ok: false, error: "invalid" };
  }
}
