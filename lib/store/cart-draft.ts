import { cartLineCost } from "@/lib/domain/cart";

export type CartDraftPrice = {
  currencyId: string;
  label: string;
  iconUrl: string | null;
  unitCost: number;
  qty: number;
};

export type CartDraftAward = {
  awardId: string;
  title: string;
  stock: number;
  imageSrc: string | null;
  prices: CartDraftPrice[];
};

export type StoreCurrencyBalance = {
  currencyId: string;
  title: string;
  pluralTitle: string;
  iconUrl: string | null;
  balance: number;
};

export function awardQtyTotal(award: CartDraftAward): number {
  return award.prices.reduce((sum, price) => sum + Math.max(0, price.qty), 0);
}

export function remainingAwardStock(award: CartDraftAward): number {
  return Math.max(0, award.stock - awardQtyTotal(award));
}

export function currencySpend(
  awards: ReadonlyArray<CartDraftAward>,
  currencyId: string,
): number {
  return awards.reduce((sum, award) => {
    const price = award.prices.find((entry) => entry.currencyId === currencyId);
    if (!price) return sum;
    return sum + cartLineCost(price.unitCost, price.qty);
  }, 0);
}

export function remainingCurrencyBalance(
  awards: ReadonlyArray<CartDraftAward>,
  currencyId: string,
  balance: number,
): number {
  return Math.max(0, balance - currencySpend(awards, currencyId));
}

export function maxQtyForCurrency(
  awards: ReadonlyArray<CartDraftAward>,
  awardId: string,
  currencyId: string,
  balance: number,
): number {
  const award = awards.find((entry) => entry.awardId === awardId);
  const price = award?.prices.find((entry) => entry.currencyId === currencyId);
  if (!award || !price || price.unitCost <= 0) return 0;

  const spendWithoutThis =
    currencySpend(awards, currencyId) - cartLineCost(price.unitCost, price.qty);
  const remainingBalance = Math.max(0, balance - spendWithoutThis);
  const byBalance = Math.floor(remainingBalance / price.unitCost);
  const stockWithoutThis = award.stock - (awardQtyTotal(award) - price.qty);
  return Math.max(0, Math.min(byBalance, stockWithoutThis));
}

export function clampAwardCurrencyQty(
  awards: ReadonlyArray<CartDraftAward>,
  awardId: string,
  currencyId: string,
  qty: number,
  balance: number,
): number {
  const maxQty = maxQtyForCurrency(awards, awardId, currencyId, balance);
  return Math.max(0, Math.min(Math.floor(qty), maxQty));
}

export function isCartDraftDirty(
  baseline: ReadonlyArray<CartDraftAward>,
  draft: ReadonlyArray<CartDraftAward>,
): boolean {
  const baselineQty = new Map<string, number>();
  for (const award of baseline) {
    for (const price of award.prices) {
      baselineQty.set(`${award.awardId}:${price.currencyId}`, price.qty);
    }
  }

  const draftQty = new Map<string, number>();
  for (const award of draft) {
    for (const price of award.prices) {
      draftQty.set(`${award.awardId}:${price.currencyId}`, price.qty);
    }
  }

  if (baselineQty.size !== draftQty.size) return true;
  for (const [key, qty] of baselineQty) {
    if (draftQty.get(key) !== qty) return true;
  }
  return false;
}

export function serializeCartDraftPayload(
  draft: ReadonlyArray<CartDraftAward>,
): string {
  return JSON.stringify({
    items: draft.flatMap((award) =>
      award.prices.map((price) => ({
        awardId: award.awardId,
        currencyId: price.currencyId,
        qty: price.qty,
      })),
    ),
  });
}

export function setAwardCurrencyQty(
  draft: ReadonlyArray<CartDraftAward>,
  awardId: string,
  currencyId: string,
  qty: number,
  balance: number,
): CartDraftAward[] {
  return draft.map((award) => {
    if (award.awardId !== awardId) return award;
    return {
      ...award,
      prices: award.prices.map((price) =>
        price.currencyId === currencyId
          ? {
              ...price,
              qty: clampAwardCurrencyQty(
                draft,
                awardId,
                currencyId,
                qty,
                balance,
              ),
            }
          : price,
      ),
    };
  });
}
