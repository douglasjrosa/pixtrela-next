import { and, eq } from "drizzle-orm";

import { panelShiftSnapshots } from "@/drizzle/schema";
import { isUniqueViolation } from "@/lib/db/pg-error";
import { getDb, type Db } from "@/lib/db/client";

export type PanelShiftSnapshotRecord = {
  id: string;
  panelId: string;
  businessDate: string;
  packedAt: Date;
  todayTaskIds: string[];
  tomorrowTaskIds: string[];
  overrunTaskId: string | null;
  nextBusinessDate: string | null;
  usableTodayBySubTask: Record<string, number>;
};

export type InsertPanelShiftSnapshotInput = {
  panelId: string;
  businessDate: string;
  todayTaskIds: string[];
  tomorrowTaskIds: string[];
  overrunTaskId: string | null;
  nextBusinessDate: string | null;
  usableTodayBySubTask: Record<string, number>;
};

const ISO_DATE_LENGTH = 10;

function asIsoDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, ISO_DATE_LENGTH);
  }
  const text = String(value).slice(0, ISO_DATE_LENGTH);
  return text.length === ISO_DATE_LENGTH ? text : null;
}

function mapSnapshot(row: {
  id: string;
  panelId: string;
  businessDate: string | Date;
  packedAt: Date;
  todayTaskIds: string[] | null;
  tomorrowTaskIds: string[] | null;
  overrunTaskId: string | null;
  nextBusinessDate: string | Date | null;
  usableTodayBySubTask: Record<string, number> | null;
}): PanelShiftSnapshotRecord {
  return {
    id: row.id,
    panelId: row.panelId,
    businessDate: asIsoDate(row.businessDate) ?? "",
    packedAt: row.packedAt,
    todayTaskIds: row.todayTaskIds ?? [],
    tomorrowTaskIds: row.tomorrowTaskIds ?? [],
    overrunTaskId: row.overrunTaskId,
    nextBusinessDate: asIsoDate(row.nextBusinessDate),
    usableTodayBySubTask: row.usableTodayBySubTask ?? {},
  };
}

export async function findPanelShiftSnapshot(
  panelId: string,
  businessDate: string,
  db: Db = getDb(),
): Promise<PanelShiftSnapshotRecord | null> {
  const [row] = await db
    .select()
    .from(panelShiftSnapshots)
    .where(
      and(
        eq(panelShiftSnapshots.panelId, panelId),
        eq(panelShiftSnapshots.businessDate, businessDate),
      ),
    )
    .limit(1);
  return row ? mapSnapshot(row) : null;
}

export async function insertPanelShiftSnapshot(
  input: InsertPanelShiftSnapshotInput,
  db: Db = getDb(),
): Promise<PanelShiftSnapshotRecord> {
  const [row] = await db
    .insert(panelShiftSnapshots)
    .values({
      panelId: input.panelId,
      businessDate: input.businessDate,
      todayTaskIds: input.todayTaskIds,
      tomorrowTaskIds: input.tomorrowTaskIds,
      overrunTaskId: input.overrunTaskId,
      nextBusinessDate: input.nextBusinessDate,
      usableTodayBySubTask: input.usableTodayBySubTask,
    })
    .returning();
  return mapSnapshot(row);
}

export async function getOrCreatePanelShiftSnapshot(
  panelId: string,
  businessDate: string,
  build: () => Promise<InsertPanelShiftSnapshotInput>,
  db: Db = getDb(),
): Promise<PanelShiftSnapshotRecord> {
  const existing = await findPanelShiftSnapshot(panelId, businessDate, db);
  if (existing) return existing;

  const packed = await build();
  try {
    return await insertPanelShiftSnapshot(packed, db);
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const raced = await findPanelShiftSnapshot(
      packed.panelId,
      packed.businessDate,
      db,
    );
    if (raced) return raced;
    throw error;
  }
}
