import { and, eq, sql } from "drizzle-orm";

import {
  awards,
  cartItems,
  carts,
  mediaAssets,
} from "@/drizzle/schema";
import { clampCartQty } from "@/lib/domain/cart";
import { getDb, type Db } from "@/lib/db/client";
import { getCurrencyForSubtasks } from "@/lib/repos/settings";

export type CartRecord = {
  id: string;
  userId: string;
  status: "open" | "checked_out" | "abandoned";
};

export type CartItemView = {
  id: string;
  awardId: string;
  title: string;
  qty: number;
  stock: number;
  imageUrl: string | null;
  unitCost: number;
  lineCost: number;
  currencyId: string;
  currencyLabel: string;
};

export type CartView = {
  cartId: string | null;
  items: CartItemView[];
  itemCount: number;
};

export async function getOrCreateOpenCart(
  userId: string,
  db: Db = getDb(),
): Promise<CartRecord> {
  const [existing] = await db
    .select({
      id: carts.id,
      userId: carts.userId,
      status: carts.status,
    })
    .from(carts)
    .where(and(eq(carts.userId, userId), eq(carts.status, "open")))
    .limit(1);

  if (existing) {
    return {
      id: existing.id,
      userId: existing.userId,
      status: existing.status,
    };
  }

  const [created] = await db
    .insert(carts)
    .values({ userId, status: "open" })
    .returning({
      id: carts.id,
      userId: carts.userId,
      status: carts.status,
    });

  return {
    id: created.id,
    userId: created.userId,
    status: created.status,
  };
}

export async function addCartItem(input: {
  userId: string;
  awardId: string;
  qty?: number;
  currencyId?: string;
}): Promise<{ cartId: string; itemId: string; qty: number }> {
  const db = getDb();
  const qtyToAdd = Math.max(1, Math.floor(input.qty ?? 1));

  return db.transaction(async (tx) => {
    const cart = await getOrCreateOpenCart(input.userId, tx as unknown as Db);
    const payment = input.currencyId
      ? { currencyId: input.currencyId }
      : await getCurrencyForSubtasks(tx as unknown as Db);
    const currencyId = payment?.currencyId;
    if (!currencyId) throw new Error("awardUnavailable");

    const [award] = await tx
      .select({
        id: awards.id,
        active: awards.active,
        showInStore: awards.showInStore,
        stock: awards.stock,
      })
      .from(awards)
      .where(eq(awards.id, input.awardId))
      .limit(1);

    if (!award?.active || !award.showInStore) {
      throw new Error("awardUnavailable");
    }
    if (award.stock <= 0) throw new Error("awardOutOfStock");

    const [existing] = await tx
      .select({ id: cartItems.id, qty: cartItems.qty })
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cart.id),
          eq(cartItems.awardId, input.awardId),
          eq(cartItems.currencyId, currencyId),
        ),
      )
      .limit(1);

    const nextQty = clampCartQty(
      (existing?.qty ?? 0) + qtyToAdd,
      award.stock,
    );
    if (nextQty <= 0) throw new Error("awardOutOfStock");

    if (existing) {
      const [updated] = await tx
        .update(cartItems)
        .set({ qty: nextQty, updatedAt: new Date() })
        .where(eq(cartItems.id, existing.id))
        .returning({ id: cartItems.id, qty: cartItems.qty });
      await tx
        .update(carts)
        .set({ updatedAt: new Date() })
        .where(eq(carts.id, cart.id));
      return { cartId: cart.id, itemId: updated.id, qty: updated.qty };
    }

    const [created] = await tx
      .insert(cartItems)
      .values({
        cartId: cart.id,
        awardId: input.awardId,
        currencyId,
        qty: nextQty,
      })
      .returning({ id: cartItems.id, qty: cartItems.qty });

    await tx
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cart.id));

    return { cartId: cart.id, itemId: created.id, qty: created.qty };
  });
}

export async function setCartItemQty(input: {
  userId: string;
  itemId: string;
  qty: number;
}): Promise<void> {
  const db = getDb();
  const desired = Math.floor(input.qty);

  await db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: cartItems.id,
        cartId: cartItems.cartId,
        awardId: cartItems.awardId,
        cartUserId: carts.userId,
        cartStatus: carts.status,
        stock: awards.stock,
      })
      .from(cartItems)
      .innerJoin(carts, eq(cartItems.cartId, carts.id))
      .innerJoin(awards, eq(cartItems.awardId, awards.id))
      .where(eq(cartItems.id, input.itemId))
      .limit(1);

    if (!row || row.cartUserId !== input.userId || row.cartStatus !== "open") {
      throw new Error("cartItemNotFound");
    }

    if (desired <= 0) {
      await tx.delete(cartItems).where(eq(cartItems.id, row.id));
    } else {
      const nextQty = clampCartQty(desired, row.stock);
      if (nextQty <= 0) throw new Error("awardOutOfStock");
      await tx
        .update(cartItems)
        .set({ qty: nextQty, updatedAt: new Date() })
        .where(eq(cartItems.id, row.id));
    }

    await tx
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, row.cartId));
  });
}

export async function removeCartItem(input: {
  userId: string;
  itemId: string;
}): Promise<void> {
  await setCartItemQty({
    userId: input.userId,
    itemId: input.itemId,
    qty: 0,
  });
}

function draftLineKey(awardId: string, currencyId: string): string {
  return `${awardId}:${currencyId}`;
}

export async function syncOpenCartDraft(input: {
  userId: string;
  items: Array<{ awardId: string; currencyId: string; qty: number }>;
}): Promise<void> {
  const db = getDb();
  const desired = new Map(
    input.items.map((item) => [
      draftLineKey(item.awardId, item.currencyId),
      {
        awardId: item.awardId,
        currencyId: item.currencyId,
        qty: Math.floor(item.qty),
      },
    ]),
  );

  await db.transaction(async (tx) => {
    const cart = await getOrCreateOpenCart(input.userId, tx as unknown as Db);

    const rows = await tx
      .select({
        id: cartItems.id,
        awardId: cartItems.awardId,
        currencyId: cartItems.currencyId,
        qty: cartItems.qty,
        stock: awards.stock,
      })
      .from(cartItems)
      .innerJoin(awards, eq(cartItems.awardId, awards.id))
      .where(eq(cartItems.cartId, cart.id));

    const existingByKey = new Map(
      rows.map((row) => [draftLineKey(row.awardId, row.currencyId), row]),
    );

    for (const [key, next] of desired) {
      const existing = existingByKey.get(key);

      if (next.qty <= 0) {
        if (existing) {
          await tx.delete(cartItems).where(eq(cartItems.id, existing.id));
        }
        existingByKey.delete(key);
        continue;
      }

      let award: {
        stock: number;
        active: boolean;
        showInStore: boolean;
      } | undefined;

      if (existing) {
        award = { stock: existing.stock, active: true, showInStore: true };
      } else {
        const [found] = await tx
          .select({
            stock: awards.stock,
            active: awards.active,
            showInStore: awards.showInStore,
          })
          .from(awards)
          .where(eq(awards.id, next.awardId))
          .limit(1);
        award = found;
      }

      if (!award || !award.active || !award.showInStore) {
        throw new Error("awardUnavailable");
      }

      const clamped = clampCartQty(next.qty, award.stock);
      if (clamped <= 0) throw new Error("awardOutOfStock");

      if (existing) {
        if (clamped !== existing.qty) {
          await tx
            .update(cartItems)
            .set({ qty: clamped, updatedAt: new Date() })
            .where(eq(cartItems.id, existing.id));
        }
        existingByKey.delete(key);
        continue;
      }

      await tx.insert(cartItems).values({
        cartId: cart.id,
        awardId: next.awardId,
        currencyId: next.currencyId,
        qty: clamped,
      });
    }

    for (const leftover of existingByKey.values()) {
      await tx.delete(cartItems).where(eq(cartItems.id, leftover.id));
    }

    await tx
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cart.id));
  });
}

export async function countOpenCartItems(
  userId: string,
  db: Db = getDb(),
): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${cartItems.qty}), 0)`.mapWith(Number),
    })
    .from(cartItems)
    .innerJoin(carts, eq(cartItems.cartId, carts.id))
    .where(and(eq(carts.userId, userId), eq(carts.status, "open")));

  return row?.total ?? 0;
}

/** Raw cart lines without pricing (pricing applied by loader). */
export async function listOpenCartItemRows(
  userId: string,
  db: Db = getDb(),
): Promise<
  Array<{
    id: string;
    cartId: string;
    awardId: string;
    currencyId: string;
    qty: number;
    title: string;
    stock: number;
    imageUrl: string | null;
    active: boolean;
    showInStore: boolean;
  }>
> {
  const [cart] = await db
    .select({ id: carts.id })
    .from(carts)
    .where(and(eq(carts.userId, userId), eq(carts.status, "open")))
    .limit(1);

  if (!cart) return [];

  return db
    .select({
      id: cartItems.id,
      cartId: cartItems.cartId,
      awardId: cartItems.awardId,
      currencyId: cartItems.currencyId,
      qty: cartItems.qty,
      title: sql<string>`coalesce(nullif(${awards.title}, ''), ${awards.name})`,
      stock: awards.stock,
      imageUrl: mediaAssets.url,
      active: awards.active,
      showInStore: awards.showInStore,
    })
    .from(cartItems)
    .innerJoin(awards, eq(cartItems.awardId, awards.id))
    .leftJoin(mediaAssets, eq(awards.imageMediaId, mediaAssets.id))
    .where(eq(cartItems.cartId, cart.id));
}
