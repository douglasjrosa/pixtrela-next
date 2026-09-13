import { and, arrayContains, desc, eq } from "drizzle-orm";

import { reasonForDeactivation } from "@/drizzle/schema";
import type { DeactivationTableName } from "@/lib/domain/deactivation-tables";
import { getDb, type Db } from "@/lib/db/client";

export type InsertDeactivationReasonInput = {
  tableName: DeactivationTableName;
  recordIds: string[];
  text: string;
};

export type DeactivationReasonRecord = {
  id: string;
  tableName: string;
  recordIds: string[];
  text: string;
  createdAt: Date;
  updatedAt: Date;
};

const REASON_COLUMNS = {
  id: reasonForDeactivation.id,
  tableName: reasonForDeactivation.tableName,
  recordIds: reasonForDeactivation.recordIds,
  text: reasonForDeactivation.text,
  createdAt: reasonForDeactivation.createdAt,
  updatedAt: reasonForDeactivation.updatedAt,
} as const;

function assertNonEmptyRecordIds(recordIds: readonly string[]): void {
  if (recordIds.length === 0) {
    throw new Error("emptyRecordIds");
  }
}

export async function insertDeactivationReason(
  input: InsertDeactivationReasonInput,
  db: Db = getDb(),
): Promise<DeactivationReasonRecord> {
  assertNonEmptyRecordIds(input.recordIds);
  const trimmed = input.text.trim();
  if (!trimmed) {
    throw new Error("emptyReasonText");
  }

  const [row] = await db
    .insert(reasonForDeactivation)
    .values({
      tableName: input.tableName,
      recordIds: [...input.recordIds],
      text: trimmed,
    })
    .returning(REASON_COLUMNS);

  return row;
}

/**
 * Returns the most recent deactivation reason that includes `recordId`
 * for the given physical table name.
 */
export async function findLatestDeactivationReason(
  tableName: DeactivationTableName,
  recordId: string,
  db: Db = getDb(),
): Promise<DeactivationReasonRecord | null> {
  const [row] = await db
    .select(REASON_COLUMNS)
    .from(reasonForDeactivation)
    .where(
      and(
        eq(reasonForDeactivation.tableName, tableName),
        arrayContains(reasonForDeactivation.recordIds, [recordId]),
      ),
    )
    .orderBy(desc(reasonForDeactivation.createdAt))
    .limit(1);

  return row ?? null;
}

export type ArchiveRecordsInput = {
  tableName: DeactivationTableName;
  recordIds: string[];
  text: string;
  setInactive: (ids: string[], tx: Db) => Promise<void>;
};

/**
 * Soft-archives records and inserts one shared deactivation reason row
 * in the same transaction.
 */
export async function archiveRecords(
  input: ArchiveRecordsInput,
  db: Db = getDb(),
): Promise<DeactivationReasonRecord> {
  assertNonEmptyRecordIds(input.recordIds);

  return db.transaction(async (tx) => {
    const txDb = tx as unknown as Db;
    await input.setInactive([...input.recordIds], txDb);
    return insertDeactivationReason(
      {
        tableName: input.tableName,
        recordIds: input.recordIds,
        text: input.text,
      },
      txDb,
    );
  });
}
