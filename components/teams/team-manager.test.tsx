import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { TeamListRowPresentational } from "./team-list-row-presentational";
import { TeamManager } from "./team-manager";
import type { TeamRow } from "./types";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const leaders = [{ documentId: "l1", name: "João" }];
const colaborators = [{ documentId: "c1", name: "Ana" }];
const teams: TeamRow[] = [
  {
    documentId: "t1",
    name: "Linha A",
    exchangesFirstDay: 3,
    exchangesLastDay: 15,
    since: "2026-01-10",
    untill: null,
    leader: leaders[0],
    colaborators,
  },
  {
    documentId: "t2",
    name: "Linha B",
    exchangesFirstDay: 3,
    exchangesLastDay: 15,
    since: "2025-06-01",
    untill: "2026-05-31",
    leader: leaders[0],
    colaborators,
  },
];

const labelsA = {
  since: "10/01/2026",
  untill: "",
  status: "Ativa",
  leader: "João",
  exchangesFirstDay: "Início das trocas",
  exchangesLastDay: "Fim das trocas",
};

const labelsB = {
  ...labelsA,
  since: "01/06/2025",
  untill: "31/05/2026",
  status: "Inativa",
};

function renderManager() {
  return renderWithIntl(
    <TeamManager
      leaders={leaders}
      colaborators={colaborators}
      onCreate={vi.fn()}
      onUpdate={vi.fn()}
      onDelete={vi.fn()}
    >
      <table>
        <tbody>
          <TeamListRowPresentational
            team={teams[0]!}
            variant="table"
            labels={labelsA}
          />
          <TeamListRowPresentational
            team={teams[1]!}
            variant="table"
            labels={labelsB}
          />
        </tbody>
      </table>
    </TeamManager>,
  );
}

describe("TeamManager", () => {
  beforeEach(() => {
    refresh.mockReset();
  });

  it("renders team list with lifecycle and status columns", () => {
    renderManager();
    expect(screen.getAllByText("Linha A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Linha B").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ativa").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inativa").length).toBeGreaterThan(0);
  });

  it("hides team form by default", () => {
    renderManager();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();
  });

  it("opens create modal with default exchange days", () => {
    renderWithIntl(
      <TeamManager
        leaders={leaders}
        colaborators={colaborators}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      >
        {null}
      </TeamManager>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Nova equipe" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Nova equipe" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Líder")).toBeInTheDocument();
    expect(screen.getByLabelText("Colaboradores")).toBeInTheDocument();
    expect(screen.getByLabelText("Início das trocas")).toHaveValue(3);
    expect(screen.getByLabelText("Fim das trocas")).toHaveValue(15);
    expect(screen.queryByRole("button", { name: "Excluir" })).toBeNull();
  });

  it("shows since, untill and delete in edit modal", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getAllByRole("button", { name: "Linha A" })[0]!);
    expect(
      screen.getByRole("heading", { name: "Editar equipe" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Até")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Deixe vazio para manter a equipe ativa. Preencha para arquivar.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
  });
});
