import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import {
  CurrencyBalance,
  type CurrencyBalanceProps,
} from "@/components/balance/currency-balance";
import { canViewBalance } from "@/lib/auth/permissions";
import type { Role } from "@/lib/auth/nav";
import { loadCurrencyForSubtasks } from "@/lib/strapi/currency-for-subtasks";
import { balanceTag, strapiFetch } from "@/lib/strapi";

interface BalanceResponse {
  data: Partial<CurrencyBalanceProps> | null;
}

const EMPTY: CurrencyBalanceProps = {
  balance: 0,
  previousBalance: 0,
  totalIncome: 0,
  totalOutcome: 0,
};

async function loadBalance(
  userId: string | undefined,
): Promise<CurrencyBalanceProps> {
  if (!userId) return EMPTY;
  try {
    const [res, paymentCurrency] = await Promise.all([
      strapiFetch<BalanceResponse>("/balances/me/current", {
        strapiCache: { tags: [balanceTag(userId)], revalidate: 30 },
      }),
      loadCurrencyForSubtasks(),
    ]);
    return {
      ...EMPTY,
      ...(res.data ?? {}),
      currencyLabel:
        paymentCurrency.currencyPluralTitle ||
        paymentCurrency.currencyTitle ||
        undefined,
    };
  } catch (error) {
    rethrowIfNavigationError(error);
    return EMPTY;
  }
}

export default async function BalancePage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canViewBalance(role)) {
    return <ForbiddenMessage />;
  }

  const balance = await loadBalance(session?.user?.id);
  return (
    <section className="max-w-md p-6">
      <CurrencyBalance {...balance} />
    </section>
  );
}
