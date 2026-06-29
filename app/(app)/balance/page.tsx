import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { StarBalance, type StarBalanceProps } from "@/components/balance/star-balance";
import { canViewBalance } from "@/lib/auth/permissions";
import type { Role } from "@/lib/auth/nav";
import { balanceTag, strapiFetch } from "@/lib/strapi";

interface BalanceResponse {
  data: Partial<StarBalanceProps> | null;
}

const EMPTY: StarBalanceProps = {
  balance: 0,
  previousBalance: 0,
  totalIncome: 0,
  totalOutcome: 0,
};

async function loadBalance(userId: string | undefined): Promise<StarBalanceProps> {
  if (!userId) return EMPTY;
  try {
    const res = await strapiFetch<BalanceResponse>("/balances/me/current", {
      strapiCache: { tags: [balanceTag(userId)], revalidate: 30 },
    });
    return { ...EMPTY, ...(res.data ?? {}) };
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
      <StarBalance {...balance} />
    </section>
  );
}
