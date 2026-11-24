import type { WorkdayRow } from "@/components/workdays/types";
import type { WorkdayWithRelations } from "@/lib/repos/workdays";

export function mapWorkdayToRow(
  item: WorkdayWithRelations,
  permissions: { editable: boolean; archivable: boolean } = {
    editable: true,
    archivable: true,
  },
): WorkdayRow {
  return {
    documentId: item.id,
    description: item.description,
    action: item.action,
    scope: item.scope,
    timezone: item.timezone,
    validFrom: item.validFrom,
    validUntil: item.validUntil,
    active: item.active,
    teams: item.teams,
    users: item.users,
    slots: item.slots.map((slot) => ({
      id: slot.id,
      isRecurrent: slot.isRecurrent,
      dayOfWeek: slot.dayOfWeek,
      date: slot.date,
      startMinute: slot.startMinute,
      endMinute: slot.endMinute,
    })),
    editable: permissions.editable,
    archivable: permissions.archivable,
  };
}
