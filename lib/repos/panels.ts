import { and, asc, eq, inArray } from "drizzle-orm";

import { panels, panelTeams, steps, teamMembers, teams } from "@/drizzle/schema";
import { DEACTIVATION_TABLE } from "@/lib/domain/deactivation-tables";
import { getDb, type Db } from "@/lib/db/client";
import { archiveRecords } from "@/lib/repos/deactivation-reasons";

export type PanelRecord = {
  id: string;
  name: string;
  slug: string;
  stepId: string;
  active: boolean;
};

export type PanelListRow = PanelRecord & {
  stepName: string;
  teamIds: string[];
  teamNames: string[];
};

const PANEL_COLUMNS = {
  id: panels.id,
  name: panels.name,
  slug: panels.slug,
  stepId: panels.stepId,
  active: panels.active,
} as const;

async function loadTeamsByPanelIds(
  panelIds: readonly string[],
  db: Db,
): Promise<Map<string, { id: string; name: string }[]>> {
  const byPanel = new Map<string, { id: string; name: string }[]>();
  if (panelIds.length === 0) return byPanel;

  const rows = await db
    .select({
      panelId: panelTeams.panelId,
      teamId: teams.id,
      name: teams.name,
    })
    .from(panelTeams)
    .innerJoin(teams, eq(panelTeams.teamId, teams.id))
    .where(inArray(panelTeams.panelId, [...panelIds]))
    .orderBy(asc(teams.name));

  for (const row of rows) {
    const list = byPanel.get(row.panelId) ?? [];
    list.push({ id: row.teamId, name: row.name });
    byPanel.set(row.panelId, list);
  }
  return byPanel;
}

function withTeams(
  row: PanelRecord & { stepName: string },
  teamsByPanel: Map<string, { id: string; name: string }[]>,
): PanelListRow {
  const panelTeamsList = teamsByPanel.get(row.id) ?? [];
  return {
    ...row,
    teamIds: panelTeamsList.map((team) => team.id),
    teamNames: panelTeamsList.map((team) => team.name),
  };
}

export async function listPanels(db: Db = getDb()): Promise<PanelListRow[]> {
  const rows = await db
    .select({
      ...PANEL_COLUMNS,
      stepName: steps.name,
    })
    .from(panels)
    .innerJoin(steps, eq(panels.stepId, steps.id))
    .orderBy(asc(panels.name));
  const teamsByPanel = await loadTeamsByPanelIds(
    rows.map((row) => row.id),
    db,
  );
  return rows.map((row) => withTeams(row, teamsByPanel));
}

export async function listActivePanels(db: Db = getDb()): Promise<PanelListRow[]> {
  const rows = await db
    .select({
      ...PANEL_COLUMNS,
      stepName: steps.name,
    })
    .from(panels)
    .innerJoin(steps, eq(panels.stepId, steps.id))
    .where(eq(panels.active, true))
    .orderBy(asc(panels.name));
  const teamsByPanel = await loadTeamsByPanelIds(
    rows.map((row) => row.id),
    db,
  );
  return rows.map((row) => withTeams(row, teamsByPanel));
}

export async function listPanelSlugs(db: Db = getDb()): Promise<string[]> {
  const rows = await db.select({ slug: panels.slug }).from(panels);
  return rows.map((row) => row.slug);
}

export async function findPanelById(
  id: string,
  db: Db = getDb(),
): Promise<PanelListRow | null> {
  const [row] = await db
    .select({
      ...PANEL_COLUMNS,
      stepName: steps.name,
    })
    .from(panels)
    .innerJoin(steps, eq(panels.stepId, steps.id))
    .where(eq(panels.id, id))
    .limit(1);
  if (!row) return null;
  const teamsByPanel = await loadTeamsByPanelIds([row.id], db);
  return withTeams(row, teamsByPanel);
}

export async function findActivePanelBySlug(
  slug: string,
  db: Db = getDb(),
): Promise<PanelListRow | null> {
  const [row] = await db
    .select({
      ...PANEL_COLUMNS,
      stepName: steps.name,
    })
    .from(panels)
    .innerJoin(steps, eq(panels.stepId, steps.id))
    .where(and(eq(panels.slug, slug), eq(panels.active, true)))
    .limit(1);
  if (!row) return null;
  const teamsByPanel = await loadTeamsByPanelIds([row.id], db);
  return withTeams(row, teamsByPanel);
}

async function replacePanelTeams(
  panelId: string,
  teamIds: readonly string[],
  db: Db,
): Promise<void> {
  await db.delete(panelTeams).where(eq(panelTeams.panelId, panelId));
  if (teamIds.length === 0) return;
  await db.insert(panelTeams).values(
    teamIds.map((teamId) => ({ panelId, teamId })),
  );
}

export async function createPanel(
  input: {
    name: string;
    slug: string;
    stepId: string;
    teamIds: readonly string[];
  },
  db: Db = getDb(),
): Promise<PanelRecord> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(panels)
      .values({
        name: input.name,
        slug: input.slug,
        stepId: input.stepId,
      })
      .returning(PANEL_COLUMNS);
    await replacePanelTeams(row.id, input.teamIds, tx as unknown as Db);
    return row;
  });
}

export async function updatePanel(
  input: {
    id: string;
    name: string;
    stepId: string;
    teamIds: readonly string[];
  },
  db: Db = getDb(),
): Promise<PanelRecord> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(panels)
      .set({
        name: input.name,
        stepId: input.stepId,
        updatedAt: new Date(),
      })
      .where(eq(panels.id, input.id))
      .returning(PANEL_COLUMNS);
    await replacePanelTeams(row.id, input.teamIds, tx as unknown as Db);
    return row;
  });
}

export async function archivePanels(
  ids: string[],
  reason: string,
  db: Db = getDb(),
): Promise<void> {
  await archiveRecords(
    {
      tableName: DEACTIVATION_TABLE.panels,
      recordIds: ids,
      text: reason,
      setInactive: async (recordIds, tx) => {
        await tx
          .update(panels)
          .set({ active: false, updatedAt: new Date() })
          .where(inArray(panels.id, recordIds));
      },
    },
    db,
  );
}

export async function reactivatePanels(
  ids: string[],
  db: Db = getDb(),
): Promise<void> {
  if (ids.length === 0) return;
  await db
    .update(panels)
    .set({ active: true, updatedAt: new Date() })
    .where(inArray(panels.id, ids));
}

export async function deletePanels(
  ids: string[],
  db: Db = getDb(),
): Promise<void> {
  if (ids.length === 0) return;
  await db.delete(panels).where(inArray(panels.id, ids));
}

export async function listUserIdsForTeams(
  teamIds: readonly string[],
  db: Db = getDb(),
): Promise<string[]> {
  if (teamIds.length === 0) return [];
  const rows = await db
    .select({ userId: teamMembers.userId })
    .from(teamMembers)
    .where(inArray(teamMembers.teamId, [...teamIds]));
  return [...new Set(rows.map((row) => row.userId))];
}
