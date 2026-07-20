"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export type KioskTeamOption = {
  documentId: string;
  name: string;
};

export interface KioskTeamPickerProps {
  teams: KioskTeamOption[];
  pending?: boolean;
  onSelect: (team: KioskTeamOption) => void;
}

export function KioskTeamPicker({
  teams,
  pending = false,
  onSelect,
}: KioskTeamPickerProps) {
  const t = useTranslations("kiosk");

  if (teams.length === 0) {
    return (
      <p role="status" className="text-center text-sm text-muted-foreground">
        {t("directoryTeamsEmpty")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-center text-lg font-semibold">{t("directoryPickTeam")}</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {teams.map((team) => (
          <li key={team.documentId}>
            <Button
              type="button"
              variant="outline"
              className="h-auto w-full justify-start px-4 py-3 text-left text-base"
              disabled={pending}
              onClick={() => onSelect(team)}
            >
              {team.name}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
