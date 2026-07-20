import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { TeamManager } from "./team-manager";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const leaders = [{ documentId: "l1", name: "João" }];
const colaborators = [{ documentId: "c1", name: "Ana" }];
const teams = [
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

describe("TeamManager", () => {
  beforeEach(() => {
    refresh.mockReset();
  });

  it("renders team list with lifecycle and status columns", () => {
    renderWithIntl(
      <TeamManager
        teams={teams}
        leaders={leaders}
        colaborators={colaborators}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getAllByText("Linha A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Linha B").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ativa").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inativa").length).toBeGreaterThan(0);
  });

  it("hides team form by default", () => {
    renderWithIntl(
      <TeamManager
        teams={teams}
        leaders={leaders}
        colaborators={colaborators}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();
  });

  it("opens create modal with default exchange days", () => {
    renderWithIntl(
      <TeamManager
        teams={[]}
        leaders={leaders}
        colaborators={colaborators}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
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
    renderWithIntl(
      <TeamManager
        teams={teams}
        leaders={leaders}
        colaborators={colaborators}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getAllByRole("link", { name: "Linha A" })[0]!);
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
