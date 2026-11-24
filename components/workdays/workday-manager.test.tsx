import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { WorkdayListRowPresentational } from "./workday-list-row-presentational";
import { WorkdayManager } from "./workday-manager";
import type { WorkdayRow } from "./types";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: vi.fn(),
  showSuccessToast: vi.fn(),
}));

const TEAM_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";

const teams = [{ documentId: TEAM_ID, name: "Montagem" }];
const users = [{ documentId: USER_ID, name: "Ana" }];

const existingWorkday: WorkdayRow = {
  documentId: "wd-1",
  description: "Horário comercial",
  action: "work",
  scope: "global",
  timezone: "America/Sao_Paulo",
  validFrom: null,
  validUntil: null,
  active: true,
  teams: [],
  users: [],
  slots: [
    {
      id: "slot-1",
      isRecurrent: true,
      dayOfWeek: 1,
      date: null,
      startMinute: 480,
      endMinute: 720,
    },
  ],
  editable: true,
  archivable: true,
};

const rowLabels = {
  actionLabel: "Expediente",
  scopeLabel: "Global (todos)",
  validityLabel: "Contínua",
  slotGroups: [{ weekday: 1, weekdayLabel: "Seg", times: ["08:00–12:00"] }],
  slotsCountLabel: "1 horário",
  inactiveLabel: "Inativo",
  selectRowLabel: "Selecionar Expediente",
};

describe("WorkdayManager", () => {
  beforeEach(() => {
    refresh.mockReset();
  });

  it("opens create modal, adds recurrent slots, and submits", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn(async () => undefined);

    renderWithIntl(
      <WorkdayManager
        teams={teams}
        users={users}
        actorRole="manager"
        onCreate={onCreate}
        onUpdate={vi.fn()}
      >
        <table>
          <tbody>
            <WorkdayListRowPresentational
              workday={existingWorkday}
              variant="table"
              labels={rowLabels}
            />
          </tbody>
        </table>
      </WorkdayManager>,
    );

    await user.click(screen.getByRole("button", { name: "Novo expediente" }));
    await user.click(screen.getByRole("button", { name: "Adicionar horário" }));
    await user.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1));
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "work",
        scope: "global",
        slots: expect.arrayContaining([
          expect.objectContaining({
            isRecurrent: true,
            dayOfWeek: 1,
            startMinute: 480,
            endMinute: 720,
          }),
        ]),
      }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("shows team picker when scope is team and opens edit modal on row click", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn(async () => undefined);

    renderWithIntl(
      <WorkdayManager
        teams={teams}
        users={users}
        actorRole="manager"
        onCreate={vi.fn()}
        onUpdate={onUpdate}
      >
        <table>
          <tbody>
            <WorkdayListRowPresentational
              workday={existingWorkday}
              variant="table"
              labels={rowLabels}
            />
          </tbody>
        </table>
      </WorkdayManager>,
    );

    await user.click(screen.getByRole("button", { name: "Expediente" }));
    expect(screen.getByText("Editar expediente")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Abrangência"), "team");
    await user.click(screen.getByRole("button", { name: "Incluir Montagem" }));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    expect(onUpdate).toHaveBeenCalledWith(
      "wd-1",
      expect.objectContaining({
        scope: "team",
        teamIds: [TEAM_ID],
      }),
    );
  });
});
