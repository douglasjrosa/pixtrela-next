import { PanelManager, type PanelRow } from "@/components/settings/panel-manager";
import { loadCachedSettingsPanels } from "@/lib/panels/load-settings-panels";
import { loadCachedSettingsSteps } from "@/lib/steps/load-settings-steps";
import { listTeams } from "@/lib/repos/teams";

import {
  bulkArchivePanels,
  bulkDeletePanels,
  bulkReactivatePanels,
  createPanel,
  updatePanel,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPanelPage() {
  const [rows, steps, teams] = await Promise.all([
    loadCachedSettingsPanels(),
    loadCachedSettingsSteps(),
    listTeams(),
  ]);

  const panels: PanelRow[] = rows.map((row) => ({
    documentId: row.id,
    name: row.name,
    slug: row.slug,
    stepId: row.stepId,
    stepName: row.stepName,
    teamIds: row.teamIds,
    teamNames: row.teamNames,
    active: row.active,
  }));
  const assignedTeamIds = new Set(rows.flatMap((row) => row.teamIds));
  const teamOptions = teams
    .filter((team) => team.active || assignedTeamIds.has(team.id))
    .map((team) => ({ documentId: team.id, name: team.name }));

  return (
    <PanelManager
      panels={panels}
      steps={steps.map((step) => ({ id: step.id, name: step.name }))}
      teams={teamOptions}
      onCreate={createPanel}
      onUpdate={updatePanel}
      onBulkArchive={bulkArchivePanels}
      onBulkReactivate={bulkReactivatePanels}
      onBulkDelete={bulkDeletePanels}
    />
  );
}
