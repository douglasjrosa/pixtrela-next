import { adjustBalanceIncome, getOrCreateMonthlyBalance } from "@/lib/repos/balances";
import type { Db } from "@/lib/db/client";

export async function applyActivityIncomeDelta(
  input: {
    colaboratorId: string;
    timestamp: Date;
    delta: number;
    currencyPluralTitle: string | null;
  },
  db: Db,
): Promise<void> {
  if (input.delta === 0) return;
  const currencyPluralTitle = input.currencyPluralTitle?.trim() ?? "";
  if (!currencyPluralTitle) throw new Error("currencyNotConfigured");

  const balance = await getOrCreateMonthlyBalance(
    {
      userId: input.colaboratorId,
      currencyPluralTitle,
      now: input.timestamp,
    },
    db,
  );
  await adjustBalanceIncome(
    { balanceId: balance.id, delta: input.delta },
    db,
  );
}
