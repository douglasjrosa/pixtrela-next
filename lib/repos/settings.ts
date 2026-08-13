import { eq, getTableColumns } from "drizzle-orm";

import {
  currencies,
  currencyForSubtasks,
  kioskSettings,
  mediaAssets,
  routeThemes,
  taskAutomationSettings,
} from "@/drizzle/schema";
import {
  DEFAULT_ASSIGN_WARN_MAX,
  normalizeAssignWarnMax,
} from "@/lib/business/assign-warn-max";
import { getDb, type Db } from "@/lib/db/client";
import type { TaskAutomationFormInput } from "@/lib/schemas/task-automation";
import {
  DEFAULT_PAGE_MARGIN_DESKTOP,
  DEFAULT_PAGE_MARGIN_MOBILE,
  ROUTE_THEME_KEYS,
  asPageMargin,
  pageMarginToStoredIndex,
  type RouteThemeKey,
} from "@/lib/themes/match-route-theme";

export async function getKioskSettings(db: Db = getDb()) {
  const [row] = await db.select().from(kioskSettings).limit(1);
  return row ?? null;
}

export async function upsertKioskSettings(
  sessionIdleSeconds: number,
  db: Db = getDb(),
) {
  const existing = await getKioskSettings(db);
  if (!existing) {
    const [created] = await db
      .insert(kioskSettings)
      .values({ sessionIdleSeconds })
      .returning();
    return created;
  }
  const [updated] = await db
    .update(kioskSettings)
    .set({ sessionIdleSeconds, updatedAt: new Date() })
    .where(eq(kioskSettings.id, existing.id))
    .returning();
  return updated;
}

export async function getTaskAutomationSettings(db: Db = getDb()) {
  const [row] = await db.select().from(taskAutomationSettings).limit(1);
  return row ?? null;
}

function toStepId(value: string): string | null {
  return value && value.length > 0 ? value : null;
}

export async function loadTaskAutomationFormValues(
  db: Db = getDb(),
): Promise<TaskAutomationFormInput> {
  const row = await getTaskAutomationSettings(db);
  if (!row) {
    return {
      waitingStepDocumentId: "",
      producingStepDocumentId: "",
      pausedStepDocumentId: "",
      finishedStepDocumentId: "",
      reviewedStepDocumentId: "",
      deliveredStepDocumentId: "",
      assignWarnMax: DEFAULT_ASSIGN_WARN_MAX,
    };
  }
  return {
    waitingStepDocumentId: row.waitingStepId ?? "",
    producingStepDocumentId: row.producingStepId ?? "",
    pausedStepDocumentId: row.pausedStepId ?? "",
    finishedStepDocumentId: row.finishedStepId ?? "",
    reviewedStepDocumentId: row.reviewedStepId ?? "",
    deliveredStepDocumentId: row.deliveredStepId ?? "",
    assignWarnMax: normalizeAssignWarnMax(row.assignWarnMax),
  };
}

export async function upsertTaskAutomationSettings(
  values: TaskAutomationFormInput,
  db: Db = getDb(),
) {
  const patch = {
    waitingStepId: toStepId(values.waitingStepDocumentId),
    producingStepId: toStepId(values.producingStepDocumentId),
    pausedStepId: toStepId(values.pausedStepDocumentId),
    finishedStepId: toStepId(values.finishedStepDocumentId),
    reviewedStepId: toStepId(values.reviewedStepDocumentId),
    deliveredStepId: toStepId(values.deliveredStepDocumentId),
    assignWarnMax: normalizeAssignWarnMax(values.assignWarnMax),
  };

  const existing = await getTaskAutomationSettings(db);
  if (!existing) {
    const [created] = await db
      .insert(taskAutomationSettings)
      .values(patch)
      .returning();
    return created;
  }
  const [updated] = await db
    .update(taskAutomationSettings)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(taskAutomationSettings.id, existing.id))
    .returning();
  return updated;
}

export async function listRouteThemes(db: Db = getDb()) {
  return db
    .select({
      ...getTableColumns(routeThemes),
      backgroundImageUrl: mediaAssets.url,
    })
    .from(routeThemes)
    .leftJoin(
      mediaAssets,
      eq(routeThemes.backgroundImageMediaId, mediaAssets.id),
    )
    .orderBy(routeThemes.label);
}

/**
 * Ensures one row per known app route so the themes settings page always shows
 * the full configuration suite. Idempotent: only inserts missing route keys.
 */
export async function ensureRouteThemes(
  labels: Record<RouteThemeKey, string>,
  db: Db = getDb(),
): Promise<void> {
  const existing = await db
    .select({ routeKey: routeThemes.routeKey })
    .from(routeThemes);
  const existingKeys = new Set(existing.map((row) => row.routeKey));
  const missing = ROUTE_THEME_KEYS.filter((key) => !existingKeys.has(key));
  if (missing.length === 0) return;

  await db
    .insert(routeThemes)
    .values(missing.map((key) => ({ routeKey: key, label: labels[key] })))
    .onConflictDoNothing({ target: routeThemes.routeKey });
}

export async function createRouteTheme(
  input: { routeKey: string; label: string },
  db: Db = getDb(),
) {
  const [row] = await db
    .insert(routeThemes)
    .values({
      routeKey: input.routeKey.trim(),
      label: input.label.trim(),
    })
    .returning();
  return row;
}

export async function getCurrencyForSubtasks(db: Db = getDb()) {
  const [row] = await db
    .select({
      id: currencyForSubtasks.id,
      currencyId: currencyForSubtasks.currencyId,
      currencyName: currencies.name,
      currencyTitle: currencies.title,
      currencyPluralTitle: currencies.pluralTitle,
      currencyPerSecond: currencies.currencyPerSecond,
      iconMediaId: currencies.iconMediaId,
    })
    .from(currencyForSubtasks)
    .innerJoin(currencies, eq(currencyForSubtasks.currencyId, currencies.id))
    .limit(1);
  return row ?? null;
}

export async function upsertCurrencyForSubtasks(
  currencyId: string | null,
  db: Db = getDb(),
) {
  const [existing] = await db.select().from(currencyForSubtasks).limit(1);
  if (!currencyId) {
    if (existing) {
      await db
        .delete(currencyForSubtasks)
        .where(eq(currencyForSubtasks.id, existing.id));
    }
    return null;
  }
  if (!existing) {
    const [created] = await db
      .insert(currencyForSubtasks)
      .values({ currencyId })
      .returning();
    return created;
  }
  const [updated] = await db
    .update(currencyForSubtasks)
    .set({ currencyId, updatedAt: new Date() })
    .where(eq(currencyForSubtasks.id, existing.id))
    .returning();
  return updated;
}

export type UpdateRouteThemeInput = {
  id: string;
  backgroundColor: string | null;
  backgroundColorOpacity: number;
  backgroundSize: string;
  backgroundPosition: string;
  backgroundRepeat: string;
  backgroundMotion: string;
  parallaxIntensity: number;
  parallaxDirection: string;
  contentMarginMobile: string;
  contentMarginDesktop: string;
  foregroundColor: string;
  surfaceColor: string;
  surfaceColorOpacity: number;
  backgroundImageMediaId?: string | null;
  clearBackgroundImage?: boolean;
};

export async function updateRouteTheme(
  input: UpdateRouteThemeInput,
  db: Db = getDb(),
): Promise<void> {
  const patch: Partial<typeof routeThemes.$inferInsert> & {
    updatedAt: Date;
  } = {
    backgroundColor: input.backgroundColor,
    backgroundColorOpacity: input.backgroundColorOpacity,
    backgroundSize: input.backgroundSize,
    backgroundPosition: input.backgroundPosition,
    backgroundRepeat: input.backgroundRepeat,
    backgroundMotion: input.backgroundMotion,
    parallaxIntensity: input.parallaxIntensity,
    parallaxDirection: input.parallaxDirection,
    contentMarginMobile: pageMarginToStoredIndex(
      asPageMargin(input.contentMarginMobile, DEFAULT_PAGE_MARGIN_MOBILE),
    ),
    contentMarginDesktop: pageMarginToStoredIndex(
      asPageMargin(input.contentMarginDesktop, DEFAULT_PAGE_MARGIN_DESKTOP),
    ),
    foregroundColor: input.foregroundColor,
    surfaceColor: input.surfaceColor,
    surfaceColorOpacity: input.surfaceColorOpacity,
    updatedAt: new Date(),
  };
  if (input.clearBackgroundImage) {
    patch.backgroundImageMediaId = null;
  } else if (input.backgroundImageMediaId) {
    patch.backgroundImageMediaId = input.backgroundImageMediaId;
  }
  await db
    .update(routeThemes)
    .set(patch)
    .where(eq(routeThemes.id, input.id));
}
